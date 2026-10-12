// PartyObject: one party (คณะ), a Durable Object per party id
// (docs/design/social.md). It keeps the members, the leader and pending
// invites (party-doc.ts), and tells every member's hub (PlayerHub
// `/internal/push`) when anything changes or someone talks.
//
// Only hubs call it (`x-party-id` names the party):
//   POST /create { leader } · /invite { by, to } · /join { who } · /decline { who }
//   POST /leave { who } · /kick { by, who } · /lead { by, who }
//   POST /chat { who, text } · /member-status { who, name, online, location, body }
//   GET  /view · /bonus?who=&location=
import { DurableObject } from "cloudflare:workers";
import type { PlayerRef, SocialPush } from "@/lib/net/social-protocol";
import {
  bonusFor, createParty, decline, invite, join, kick, lead, leave, memberStatus, takePartyChat, viewOf, type PartyDoc,
} from "./party-doc";
import { hubObjectName, type Env } from "./env";
import { json, readJson } from "./http";

const DOC = "doc";

type Who = PlayerRef & { location?: string | null; body?: string | null };

export class PartyObject extends DurableObject<Env> {
  private doc: PartyDoc | null | undefined;

  private async load(): Promise<PartyDoc | null> {
    if (this.doc !== undefined) return this.doc;
    const stored = await this.ctx.storage.get<string>(DOC);
    this.doc = stored ? (JSON.parse(stored) as PartyDoc) : null;
    return this.doc;
  }

  private async save(): Promise<void> {
    if (this.doc) await this.ctx.storage.put(DOC, JSON.stringify(this.doc));
    else await this.ctx.storage.delete(DOC);
  }

  private async toHub(username: string, path: string, body: unknown): Promise<void> {
    const stub = this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(username)));
    await stub.fetch(`https://hub${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-user": username },
      body: JSON.stringify(body),
    }).catch(() => null);
  }

  /** Push a message to every member (through their hubs). */
  private async tell(doc: PartyDoc, message: SocialPush, except?: string): Promise<void> {
    await Promise.all(Object.keys(doc.members).filter((m) => m !== except).map((m) => this.toHub(m, "/internal/push", { message })));
  }

  private async broadcastView(doc: PartyDoc): Promise<void> {
    await this.tell(doc, { t: "party", party: viewOf(doc, Date.now()) });
  }

  /** Tell `usernames` they are out of the party. */
  private async released(doc: PartyDoc, usernames: string[]): Promise<void> {
    await Promise.all(usernames.map((u) => this.toHub(u, "/internal/party-left", { partyId: doc.id })));
  }

  /** After a member went: dissolve a party of one, else show the rest the new party. */
  private async afterLeave(doc: PartyDoc, gone: string[], dissolved: boolean): Promise<void> {
    if (dissolved) {
      const rest = Object.keys(doc.members);
      this.doc = null;
      await this.save();
      await this.released(doc, [...gone, ...rest]);
      return;
    }
    await this.save();
    await this.released(doc, gone);
    await this.broadcastView(doc);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const partyId = request.headers.get("x-party-id") ?? "";
    if (!/^[0-9a-f]{16}$/.test(partyId)) return json({ error: "bad_request" }, 400);
    const now = Date.now();
    const doc = await this.load();
    if (request.method === "GET") {
      if (url.pathname === "/view") return json(doc ? viewOf(doc, now) : null);
      if (url.pathname === "/bonus") {
        const who = url.searchParams.get("who") ?? "";
        return json({ bonus: !!doc && bonusFor(doc, who, url.searchParams.get("location") || null) });
      }
      return json({ error: "not_found" }, 404);
    }
    const body = await readJson<Record<string, unknown>>(request, 20_000);
    if (!body) return json({ error: "bad_request" }, 400);
    if (url.pathname === "/create") {
      const leader = body.leader as Who | undefined;
      if (!leader?.username) return json({ error: "bad_request" }, 400);
      if (doc) return json({ error: "exists" }, 409);
      this.doc = createParty(partyId, leader, now);
      await this.save();
      await this.broadcastView(this.doc);
      return json({ ok: true });
    }
    if (!doc) return json({ error: "gone" }, 404);
    const who = typeof body.who === "string" ? body.who : (body.who as Who | undefined)?.username ?? "";
    const by = typeof body.by === "string" ? body.by : "";
    switch (url.pathname) {
      case "/invite": {
        const outcome = invite(doc, by, String(body.to ?? ""), now);
        if (outcome !== "ok") return json({ error: outcome }, 409);
        await this.save();
        await this.broadcastView(doc);
        return json({ ok: true });
      }
      case "/join": {
        const outcome = join(doc, body.who as Who, now);
        await this.save();
        if (outcome !== "ok") return json({ error: outcome }, 409);
        await this.broadcastView(doc);
        return json({ ok: true });
      }
      case "/decline": {
        decline(doc, who);
        await this.save();
        await this.broadcastView(doc);
        return json({ ok: true });
      }
      case "/leave": {
        if (!doc.members[who]) return json({ ok: true });
        const { dissolved } = leave(doc, who);
        await this.afterLeave(doc, [who], dissolved);
        return json({ ok: true });
      }
      case "/kick": {
        const outcome = kick(doc, by, who);
        if (outcome !== "ok") return json({ error: outcome }, 409);
        await this.afterLeave(doc, [who], Object.keys(doc.members).length < 2);
        return json({ ok: true });
      }
      case "/lead": {
        const outcome = lead(doc, by, who);
        if (outcome !== "ok") return json({ error: outcome }, 409);
        await this.save();
        await this.broadcastView(doc);
        return json({ ok: true });
      }
      case "/chat": {
        const from = body.who as PlayerRef | undefined;
        const text = typeof body.text === "string" ? body.text : "";
        if (!from?.username || !doc.members[from.username] || !text) return json({ error: "not_member" }, 409);
        if (!takePartyChat(doc, from.username, now)) { await this.save(); return json({ error: "too_fast" }, 429); }
        await this.save();
        await this.tell(doc, { t: "party_chat", from, text, at: now });
        return json({ ok: true });
      }
      case "/member-status": {
        const changed = memberStatus(doc, who, {
          name: typeof body.name === "string" ? body.name : undefined,
          online: !!body.online,
          location: typeof body.location === "string" ? body.location : null,
          body: typeof body.body === "string" ? body.body : null,
        });
        if (changed) {
          await this.save();
          await this.broadcastView(doc);
        }
        return json({ ok: true });
      }
      default:
        return json({ error: "not_found" }, 404);
    }
  }
}
