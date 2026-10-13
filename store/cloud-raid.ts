"use client";

// World bosses fought by a party (docs/online.md "World bosses"). Each
// legendary beast is one for everyone, kept by the server (RaidObject). The
// party's leader, at the beast's lair, opens a fight (`open`); the server asks
// the party's members (a `raid_invite` on their social socket, store/social-store.ts)
// and those at the lair `join`; it begins when all are in, or when the leader
// starts it with two or more (`begin`). The server plays the fight: this
// screen shows it with the battle store in party mode (store/battle-store.ts
// `startParty`), sends this player's moves when their unit holds the turn and
// receives every command by polling. The verdict and spoils at the end come
// from the server, as for a checked battle.
//
// No world-store import (the world store reads this module); the world reads
// `verdict()`, and RaidBridge (components/world/raid-bridge.tsx) moves the
// world when a fight this player is in begins.
import { create } from "zustand";
import { ApiFailure, loadRaid, postRaid } from "@/lib/net/client";
import { cloudSave } from "@/lib/net/cloud-save";
import type { BattleVerdict } from "@/lib/net/play-protocol";
import type { BossStatus, RaidView } from "@/lib/net/raid-protocol";
import { RAID_RULES } from "@/lib/net/raid-protocol";
import { useBattleStore, type PartyIntent } from "./battle-store";

/** How often a fight is asked about while it gathers or runs, ms. */
const POLL_MS = 900;

export interface RaidInvite { bossId: string; raid: string; from: string; until: number | null }

interface RaidState {
  /** Every world boss as the shared world last said (the world reply's `bosses`). */
  bosses: Record<string, BossStatus>;
  /** A fight the party's leader opened, waiting for this player to join. */
  invite: RaidInvite | null;
  /** The fight this player is in, as the server last showed it. */
  view: RaidView | null;
  /** Something the server refused (a code), for the screen to say. */
  error: string | null;
}

export const useRaid = create<RaidState>(() => ({ bosses: {}, invite: null, view: null, error: null }));

/** Whether a world boss waits at its lair now (never felled, or back after three real hours). */
export function bossIsUp(status: BossStatus | undefined, now: number = Date.now()): boolean {
  return !status || status.fellAt === null || now - status.fellAt >= RAID_RULES.respawnMs;
}

class CloudRaid {
  private timer: ReturnType<typeof setInterval> | null = null;
  private polling = false;
  /** The fight whose battle has been staged on this screen. */
  private staged: string | null = null;

  /** Whether world bosses are the server's (a character played online). */
  enabled(): boolean {
    return cloudSave.session !== null;
  }

  /** The fight this player is in (gathering or running), if any. */
  fight(): RaidView["fight"] {
    return useRaid.getState().view?.fight ?? null;
  }

  /** The server's verdict for this player once their fight is over. */
  verdict(): BattleVerdict | null {
    return this.fight()?.verdict ?? null;
  }

  /** Whether the battle on screen is a party fight. */
  inBattle(): boolean {
    return this.staged !== null && useBattleStore.getState().control !== null;
  }

  /** The world reply's boss states (store/cloud-world.ts). */
  setBosses(bosses: Record<string, BossStatus> | undefined): void {
    if (bosses) useRaid.setState({ bosses });
  }

  /** A `raid_invite` push from the server (the party's leader opened a fight). */
  invited(invite: RaidInvite): void {
    useRaid.setState({ invite, error: null });
  }

  dismissInvite(): void {
    useRaid.setState({ invite: null });
  }

  private async call(bossId: string, action: "open" | "join" | "start" | "act", body: Record<string, unknown>): Promise<RaidView | null> {
    const session = cloudSave.session;
    if (!session) return null;
    try {
      const view = await postRaid(session.server, session.token, bossId, action, body);
      this.take(view);
      return view;
    } catch (error) {
      const code = error instanceof ApiFailure ? error.code : "offline";
      useRaid.setState({ error: code });
      return null;
    }
  }

  /** Open a fight with this boss (the party's leader, at its lair). The saved state is what the server reads. */
  async open(bossId: string): Promise<RaidView | null> {
    const session = cloudSave.session;
    if (!session) return null;
    useRaid.setState({ error: null });
    await cloudSave.settle();
    const view = await this.call(bossId, "open", { characterId: session.id });
    if (view?.fight) this.poll(bossId);
    return view;
  }

  /** Join the fight the leader opened (this player stands at the lair). */
  async join(invite: RaidInvite): Promise<RaidView | null> {
    const session = cloudSave.session;
    if (!session) return null;
    useRaid.setState({ error: null, invite: null });
    await cloudSave.settle();
    const view = await this.call(invite.bossId, "join", { raid: invite.raid, characterId: session.id });
    if (view?.fight) this.poll(invite.bossId);
    return view;
  }

  /** The leader begins the fight with whoever has joined. */
  async begin(): Promise<void> {
    const view = useRaid.getState().view;
    if (!view?.fight) return;
    await this.call(view.bossId, "start", { raid: view.fight.id });
  }

  /** This player's move (their unit holds the turn), or their unit's อัตโนมัติ. */
  private send(intent: PartyIntent): void {
    const view = useRaid.getState().view;
    if (!view?.fight) return;
    const from = useBattleStore.getState().commands().length + useBattleStore.getState().queued;
    void this.call(view.bossId, "act", { raid: view.fight.id, intent, from });
  }

  /** Ask the server how the fight stands (and take the commands this screen lacks). */
  private poll(bossId: string): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.pull(bossId), POLL_MS);
    void this.pull(bossId);
  }

  private async pull(bossId: string): Promise<void> {
    const session = cloudSave.session;
    if (!session || this.polling) return;
    this.polling = true;
    try {
      const have = this.staged ? useBattleStore.getState().commands().length + useBattleStore.getState().queued : 0;
      // A battle not yet staged here asks from the start (the reply carries the staging).
      this.take(await loadRaid(session.server, session.token, bossId, have));
    } catch {
      // Offline for a moment: the next poll asks again.
    } finally {
      this.polling = false;
    }
  }

  /** Take a view: stage the battle when it begins, hand on its commands, stop asking once it is over. */
  private take(view: RaidView): void {
    const fight = view.fight;
    useRaid.setState({ view });
    if (!fight) { this.stopPolling(); return; }
    if (fight.phase !== "gather" && fight.start && this.staged !== fight.id && fight.me) {
      this.staged = fight.id;
      const { a, b, opts, seed } = fight.start;
      useBattleStore.getState().startParty(a, b, { ...opts, seed }, fight.me, (intent) => this.send(intent));
    }
    if (this.staged === fight.id) useBattleStore.getState().receive(fight.from, fight.commands);
    if (fight.phase === "over" && (!this.staged || fight.total <= fight.from + fight.commands.length)) this.stopPolling();
  }

  private stopPolling(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Take up a fight again (a reload mid-fight): stage it from the server's log. */
  resume(bossId: string): void {
    this.staged = null;
    this.stopPolling();
    this.poll(bossId);
  }

  /** Forget the fight (the world took its result, or the player left). */
  stop(): void {
    this.stopPolling();
    this.staged = null;
    useRaid.setState({ view: null, error: null });
  }
}

export const cloudRaid = new CloudRaid();
