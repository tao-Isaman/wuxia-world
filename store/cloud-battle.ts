"use client";

// Battles the game server checks (docs/online.md "Battles on the server").
// With a character played on the server, going into a fight asks the server to
// stage it from the saved state: it answers with the exact fight and a seed.
// The battle plays here at full speed, rolling from that seed, while its
// command log streams to the server, which replays it on its own copy. When
// the fight ends the server gives its verdict — who won, HP / MP left, the
// items used — and rolls the spoils; the world takes the result from the
// verdict, so a client cannot make up a win or its loot.
//
// No world-store import (the world store reads this module): what the world
// needs it gets through `verdict()` / `spoils()`.
import { create } from "zustand";
import { ApiFailure, finishBattle, logBattle, startBattle } from "@/lib/net/client";
import { cloudSave } from "@/lib/net/cloud-save";
import type { BattleVerdict } from "@/lib/net/play-protocol";
import type { VictorySpoils } from "@/lib/world/spoils";
import { useBattleStore } from "./battle-store";

/** How often the command log goes to the server mid-fight, ms. */
const LOG_EVERY_MS = 2500;
const RETRY_MS = 3000;

export type CloudBattleStatus =
  /** No checked battle. */
  | "idle"
  /** Asking the server to stage the fight. */
  | "starting"
  /** The fight is on (the log streams). */
  | "playing"
  /** The fight is over; waiting for the server's verdict. */
  | "checking"
  /** The verdict is in. */
  | "done"
  /** The server could not be reached or refused; `error` says why (retrying when it can). */
  | "error";

interface CloudBattleState {
  status: CloudBattleStatus;
  battleId: string | null;
  verdict: BattleVerdict | null;
  /** The server's refusal code, or "offline". */
  error: string | null;
}

export const useCloudBattle = create<CloudBattleState>(() => ({ status: "idle", battleId: null, verdict: null, error: null }));

class CloudBattle {
  /** How many commands the server holds. */
  private sent = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private sending: Promise<void> | null = null;

  /** Whether fights go through the server: a character is being played there. */
  enabled(): boolean {
    return cloudSave.session !== null;
  }

  /** Whether the battle on screen is one the server checks. */
  checking(): boolean {
    const { status } = useCloudBattle.getState();
    return status !== "idle" && useBattleStore.getState().seed !== null;
  }

  /** The server's verdict on the battle on screen (null until it answers). */
  verdict(): BattleVerdict | null {
    return useCloudBattle.getState().verdict;
  }

  /** The spoils the server rolled (null until it answers, or for a loss). */
  spoils(): VictorySpoils | null {
    return useCloudBattle.getState().verdict?.spoils ?? null;
  }

  /** Stage the pending fight on the server and start it here with the server's seed. */
  async begin(): Promise<void> {
    const session = cloudSave.session;
    const { status } = useCloudBattle.getState();
    if (!session || status === "starting" || useBattleStore.getState().state) return;
    this.stop();
    useCloudBattle.setState({ status: "starting", battleId: null, verdict: null, error: null });
    try {
      // The server stages the battle from the saved state: save it first.
      await cloudSave.settle();
      const reply = await startBattle(session.server, session.token, session.id);
      if (cloudSave.session?.id !== session.id) return;
      useBattleStore.getState().start(reply.start.a, reply.start.b, { ...reply.start.opts, seed: reply.seed });
      this.sent = 0;
      useCloudBattle.setState({ status: "playing", battleId: reply.battleId, verdict: null, error: null });
      this.timer = setInterval(() => void this.push(false), LOG_EVERY_MS);
      this.unsubscribe = useBattleStore.subscribe((s, prev) => {
        if (s.state?.phase === "over" && prev.state?.phase !== "over") void this.push(true);
      });
    } catch (error) {
      useCloudBattle.setState({ status: "error", error: error instanceof ApiFailure ? error.code : "offline" });
    }
  }

  /** Send the commands the server does not have yet; `final` asks for the verdict. */
  private async push(final: boolean): Promise<void> {
    if (this.sending) await this.sending;
    const session = cloudSave.session;
    const { battleId, status } = useCloudBattle.getState();
    if (!session || !battleId || status === "done") return;
    const commands = useBattleStore.getState().commands().slice(this.sent);
    if (!final && commands.length === 0) return;
    const from = this.sent;
    if (final) useCloudBattle.setState({ status: "checking", error: null });
    this.sending = (async () => {
      try {
        if (final) {
          const verdict = await finishBattle(session.server, session.token, session.id, { battleId, from, commands: [...commands] });
          if (useCloudBattle.getState().battleId !== battleId) return;
          this.sent = from + commands.length;
          this.clearTimers();
          useCloudBattle.setState({ status: "done", verdict, error: null });
        } else {
          const { at } = await logBattle(session.server, session.token, session.id, { battleId, from, commands: [...commands] });
          if (useCloudBattle.getState().battleId === battleId) this.sent = at;
        }
      } catch (error) {
        if (useCloudBattle.getState().battleId !== battleId) return;
        const code = error instanceof ApiFailure ? error.code : "offline";
        // A refusal the server will not change its mind on: no verdict, no spoils.
        if (final && error instanceof ApiFailure && error.status < 500 && code !== "too_fast") {
          this.clearTimers();
          useCloudBattle.setState({ status: "done", verdict: null, error: code });
          return;
        }
        if (final) {
          useCloudBattle.setState({ status: "error", error: code });
          this.retry = setTimeout(() => { this.retry = null; void this.push(true); }, RETRY_MS);
        }
      }
    })();
    await this.sending;
    this.sending = null;
  }

  /** Ask again after an error (the briefing's retry, or a verdict that did not arrive). */
  async again(): Promise<void> {
    const { status, battleId } = useCloudBattle.getState();
    if (status !== "error") return;
    if (battleId && useBattleStore.getState().state) await this.push(true);
    else { useCloudBattle.setState({ status: "idle", error: null }); await this.begin(); }
  }

  private clearTimers(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.retry) clearTimeout(this.retry);
    this.timer = this.retry = null;
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Forget the battle (the world took its result, or the player left). */
  stop(): void {
    this.clearTimers();
    this.sent = 0;
    useCloudBattle.setState({ status: "idle", battleId: null, verdict: null, error: null });
  }
}

export const cloudBattle = new CloudBattle();
