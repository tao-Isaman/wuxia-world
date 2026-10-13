// WorldObject: the one shared world (a single Durable Object, docs/online.md
// "The shared world"). It keeps the world document (world-doc.ts) in storage
// and runs it: an alarm every real hour (one game day) moves it on even when
// nobody plays, and every request first brings it to the clock.
//
// Routes (the router in entry.ts checks the session first and passes the
// player's name; /kill and /boss come only from BattleObject):
//   GET  /world?player=…&rev=…&pins=a,b   → WorldReply (lib/net/play-protocol.ts)
//   POST /echo  { player, echo }           → { rev }
//   POST /kill  { player, npcId, locationId } → { applied }
//   POST /boss  { player, bossId }         → { applied }
//   POST /boss-state { bossId, status, fell } → { applied } (from RaidObject: a world boss's state)
import { DurableObject } from "cloudflare:workers";
import { MS_PER_DAY } from "@/lib/world/clock";
import type { WorldReply } from "@/lib/net/play-protocol";
import { acceptEcho, advanceWorld, bossFellInWorld, createWorld, killInWorld, setBossStatus, setPins, type WorldDoc } from "./world-doc";
import type { BossStatus } from "@/lib/net/raid-protocol";
import { json, readJson } from "./http";
import type { Env } from "./env";

/** Storage keys: the document in parts, so no one value grows past the storage limit. */
const PARTS = ["npcExt", "rumorPool", "rumorArchive", "worldEventLog"] as const;
const META = "meta";
/** The newest world events kept (the engines cap theirs at 500; the server keeps fewer). */
const EVENT_LOG_KEEP = 200;

export class WorldObject extends DurableObject<Env> {
  private doc: WorldDoc | null = null;
  /** The last reply body, by rev (most requests ask for the same world). */
  private cached: { rev: number; body: string } | null = null;

  private async load(): Promise<WorldDoc> {
    if (this.doc) return this.doc;
    const storage = this.ctx.storage;
    const meta = await storage.get<string>(META);
    if (!meta) {
      this.doc = createWorld(Date.now());
      await this.store(this.doc, true);
      await storage.setAlarm(Date.now() + MS_PER_DAY);
      return this.doc;
    }
    const parts = await storage.get<string>([...PARTS]);
    const head = JSON.parse(meta) as Omit<WorldDoc, "world"> & { world: Record<string, unknown> };
    const world = { ...head.world } as Record<string, unknown>;
    for (const key of PARTS) world[key] = JSON.parse(parts.get(key) ?? "null") ?? (key === "npcExt" ? {} : []);
    this.doc = { ...head, world: world as unknown as WorldDoc["world"] };
    return this.doc;
  }

  /** Write the document (`full`: the world's parts too, not only the head). */
  private async store(doc: WorldDoc, full: boolean): Promise<void> {
    const log = doc.world.worldEventLog ?? [];
    if (log.length > EVENT_LOG_KEEP) doc.world = { ...doc.world, worldEventLog: log.slice(-EVENT_LOG_KEEP) };
    const { npcExt, rumorPool, rumorArchive, worldEventLog, ...rest } = doc.world;
    const entries: Record<string, unknown> = { [META]: JSON.stringify({ ...doc, world: rest }) };
    if (full) {
      entries.npcExt = JSON.stringify(npcExt);
      entries.rumorPool = JSON.stringify(rumorPool);
      entries.rumorArchive = JSON.stringify(rumorArchive);
      entries.worldEventLog = JSON.stringify(worldEventLog);
    }
    await this.ctx.storage.put(entries);
  }

  /** Bring the world to now; store it when it moved. */
  private async current(): Promise<WorldDoc> {
    const doc = await this.load();
    if (advanceWorld(doc, Date.now())) await this.store(doc, true);
    return doc;
  }

  private reply(doc: WorldDoc, rev: number | null): Response {
    // Every answer carries the server's clock, which the browsers keep to.
    const now = Date.now();
    if (rev === doc.rev) return json({ rev: doc.rev, same: true, now, bosses: doc.bosses ?? {} } satisfies WorldReply);
    if (this.cached?.rev !== doc.rev) {
      this.cached = { rev: doc.rev, body: JSON.stringify({ rev: doc.rev, day: doc.day, time: doc.time, world: doc.world, bosses: doc.bosses ?? {} } satisfies WorldReply) };
    }
    return new Response(`{"now":${now},${this.cached.body.slice(1)}`, { headers: { "content-type": "application/json" } });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const doc = await this.current();
    if (request.method === "GET" && url.pathname === "/world") {
      const player = url.searchParams.get("player");
      const pins = url.searchParams.get("pins");
      if (player && pins !== null) {
        setPins(doc, player, pins.split(",").filter(Boolean), Date.now());
        await this.store(doc, false);
      }
      const rev = url.searchParams.get("rev");
      return this.reply(doc, rev === null ? null : Number(rev));
    }
    if (request.method !== "POST") return json({ error: "not_found" }, 404);
    const body = await readJson<Record<string, unknown>>(request);
    const player = typeof body?.player === "string" ? body.player : null;
    if (!body || !player) return json({ error: "bad_request" }, 400);
    switch (url.pathname) {
      case "/echo": {
        const error = acceptEcho(doc, player, (body.echo ?? {}) as Parameters<typeof acceptEcho>[2], Date.now());
        if (error) return json({ error }, error === "too_many" ? 429 : 422);
        await this.store(doc, true);
        return json({ rev: doc.rev });
      }
      case "/kill": {
        const applied = typeof body.npcId === "string" && killInWorld(doc, body.npcId, player, String(body.locationId ?? ""));
        if (applied) await this.store(doc, true);
        return json({ applied });
      }
      case "/boss-state": {
        const status = body.status as BossStatus | undefined;
        const applied = typeof body.bossId === "string" && !!status && setBossStatus(doc, body.bossId, status, body.fell === true);
        if (applied) await this.store(doc, body.fell === true);
        return json({ applied });
      }
      case "/boss": {
        const applied = typeof body.bossId === "string" && bossFellInWorld(doc, body.bossId, player);
        if (applied) await this.store(doc, true);
        return json({ applied });
      }
      default:
        return json({ error: "not_found" }, 404);
    }
  }

  /** Every real hour (a game day): the world moves on, played or not. */
  async alarm(): Promise<void> {
    await this.current();
    await this.ctx.storage.setAlarm(Date.now() + MS_PER_DAY);
  }
}
