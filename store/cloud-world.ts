"use client";

// The one shared world on the game server (docs/online.md "The shared
// world"). While a character is played there the server runs the jianghu —
// its people's lives, deaths and successions, and the talk — and every player
// sees the same one. This module keeps the store's copy current: it asks the
// server every minute (sending the people this hero has open business with,
// so the simulation keeps them home), lays a newer world over the state and
// settles the hero's quests whose people died meanwhile. The hero's deeds go
// to the server as echoes (setServerRunsWorld's sink); the server writes the
// rumors from them.
import { getQuest } from "@/lib/world";
import { seedLiveness } from "@/lib/world/npc-life";
import { loadWorld, postEcho } from "@/lib/net/client";
import type { WorldReply } from "@/lib/net/play-protocol";
import { SHARED_WORLD_KEYS, setServerRunsWorld, type PlayerEcho, type SharedWorld } from "@/lib/world/shared/world";
import type { WorldStateData } from "@/lib/world/types";
import { withChargesOfDead } from "./world/lifecycle";
import { useWorldStore } from "./world-store";

/** How often the world is asked for, ms. */
export const WORLD_POLL_MS = 60_000;

interface Link {
  server: string;
  token: string;
  rev: number;
  timer: ReturnType<typeof setInterval> | null;
}

let link: Link | null = null;

/** The people the hero's open quests are about: the simulation keeps them where they are. */
export function heroPins(state: WorldStateData): string[] {
  const held = new Set<string>();
  for (const q of Object.values(state.quests)) {
    if (q.status !== "active") continue;
    const def = getQuest(q.id);
    if (def?.giverNpcId) held.add(def.giverNpcId);
    if (def?.turnInNpcId) held.add(def.turnInNpcId);
  }
  return [...held].slice(0, 40);
}

/**
 * Lay the server's world over the state (in place): the shared fields as the
 * server has them, its generated people registered, and the hero's quests of
 * anyone newly dead passed on or ended (the player is told).
 */
export function applyServerWorld(state: WorldStateData, world: SharedWorld): void {
  withChargesOfDead(state, () => {
    const target = state as unknown as Record<string, unknown>;
    for (const key of SHARED_WORLD_KEYS) {
      const value = world[key];
      if (value !== undefined && value !== null) target[key] = value;
    }
    seedLiveness(state);
  });
}

function take(reply: WorldReply): void {
  if (!link) return;
  link.rev = reply.rev;
  if (reply.same) return;
  const draft = { ...useWorldStore.getState() } as WorldStateData;
  applyServerWorld(draft, reply.world);
  useWorldStore.setState(draft);
}

/** Ask the server for the world now (and tell it whom the hero's quests hold). */
export async function pullWorld(): Promise<void> {
  const current = link;
  if (!current) return;
  const pins = heroPins(useWorldStore.getState());
  try {
    const reply = await loadWorld(current.server, current.token, current.rev, pins);
    if (link === current) take(reply);
  } catch {
    // No answer: the next poll asks again.
  }
}

function sendEcho(echo: PlayerEcho): void {
  const current = link;
  if (!current) return;
  void postEcho(current.server, current.token, echo)
    .then(() => pullWorld())
    .catch(() => {});
}

/**
 * The world when entering a character: loaded once, before the save, so the
 * hero joins the world as it is.
 */
export async function fetchServerWorld(server: string, token: string): Promise<{ rev: number; world: SharedWorld | null }> {
  const reply = await loadWorld(server, token);
  return reply.same ? { rev: reply.rev, world: null } : { rev: reply.rev, world: reply.world };
}

/** Follow the server's world while a character is played (returns the stop). */
export function followServerWorld(server: string, token: string, rev: number): () => void {
  stopServerWorld();
  link = { server, token, rev, timer: null };
  setServerRunsWorld(true, sendEcho);
  link.timer = setInterval(() => void pullWorld(), WORLD_POLL_MS);
  return stopServerWorld;
}

export function stopServerWorld(): void {
  if (link?.timer) clearInterval(link.timer);
  link = null;
  setServerRunsWorld(false);
}
