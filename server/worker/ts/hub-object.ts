// PlayerHub: one account's social home (a Durable Object per username,
// docs/design/social.md). It keeps the account's friends, requests, blocks,
// player mail and whispers (social-doc.ts), holds the account's social socket
// (hibernating) and pushes to it what happens, and talks to other hubs,
// parties and the account's AccountObject on the player's behalf.
//
// Every request carries the hub's username (`x-hub-user`). Routes from the
// router in entry.ts (the session is checked there):
//   GET  /snapshot · GET /ws (socket)
//   POST /friends/request|accept|decline|remove · /block · /unblock · /whisper
//   POST /mail/send|read|claim|delete
//   POST /party/invite|accept|decline|leave|kick|lead|chat
// Internal, from other hubs and parties only (entry.ts never forwards them):
//   POST /internal/request|accepted|forget|whisper|mail|party-invite|party-left|push
//   GET  /internal/status · /internal/can-mail?from= · /internal/party-bonus?location= · /internal/party
import { DurableObject } from "cloudflare:workers";
import {
  SOCIAL_LIMITS as L, cleanText, normalUsername,
  type FriendView, type Mail, type Parcel, type PartyView, type PlayerRef, type SendMailRequest, type SocialClientMsg,
  type SocialPush, type SocialSnapshot, type Whisper,
} from "@/lib/net/social-protocol";
import {
  acceptRequest, block, claimMail, debitOf, deleteMail, expireMail, forget, keepWhisper, normalizeHub, parcelProblem,
  receiveMail, receiveRequest, recordAsked, refOf, returnedLetter, takeChat, takeMail, type HubDoc, type RequestOutcome,
} from "./social-doc";
import { accountObjectName, hubObjectName, partyObjectName, type Env } from "./env";
import { json, readJson } from "./http";

const DOC = "doc";
/** The name a returned letter shows as its sender. */
const POST_OFFICE: PlayerRef = { username: "_post", name: "ม้าเร็วส่งคืน" };

function randomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Body = Record<string, unknown>;

export class PlayerHub extends DurableObject<Env> {
  private doc: HubDoc | null = null;

  // ─── Storage ─────────────────────────────────────────────────────────
  private async load(username: string): Promise<HubDoc> {
    if (this.doc) return this.doc;
    const stored = await this.ctx.storage.get<string>(DOC);
    this.doc = normalizeHub(stored ? JSON.parse(stored) as Partial<HubDoc> : {}, username);
    return this.doc;
  }

  private async save(): Promise<void> {
    if (this.doc) await this.ctx.storage.put(DOC, JSON.stringify(this.doc));
  }

  // ─── Other objects ───────────────────────────────────────────────────
  private hub(username: string): DurableObjectStub {
    return this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(username)));
  }

  private async callHub<T>(username: string, path: string, body?: unknown): Promise<T | null> {
    const response = await this.hub(username).fetch(`https://hub${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", "x-hub-user": username },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return response.ok ? (await response.json() as T) : null;
  }

  private async callParty<T>(partyId: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; body: T }> {
    const stub = this.env.PARTIES.get(this.env.PARTIES.idFromName(partyObjectName(partyId)));
    const response = await stub.fetch(`https://party${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", "x-party-id": partyId },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { ok: response.ok, status: response.status, body: await response.json() as T };
  }

  private account(username: string): DurableObjectStub {
    return this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName(accountObjectName(username)));
  }

  private async exists(username: string): Promise<boolean> {
    const response = await this.account(username).fetch("https://account/exists");
    const body = await response.json().catch(() => null) as { exists?: boolean } | null;
    return !!body?.exists;
  }

  // ─── The socket ──────────────────────────────────────────────────────
  private online(): boolean {
    return this.ctx.getWebSockets().length > 0;
  }

  private push(message: SocialPush): void {
    const text = JSON.stringify(message);
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(text); } catch { /* closing */ }
    }
  }

  private async statusOf(doc: HubDoc): Promise<FriendView> {
    return {
      username: doc.username, name: doc.status.name, since: 0, online: this.online(),
      location: this.online() ? doc.status.location : null, body: doc.status.body, inParty: !!doc.partyId,
    };
  }

  /** Tell friends and the party where this player is now (or that they left). */
  private async announce(doc: HubDoc): Promise<void> {
    const view = await this.statusOf(doc);
    const friends = Object.keys(doc.friends);
    await Promise.all([
      ...friends.map((f) => this.callHub(f, "/internal/push", { message: { t: "friend_status", friend: { ...view, since: doc.friends[f]!.since } } satisfies SocialPush })),
      doc.partyId ? this.callParty(doc.partyId, "/member-status", { who: doc.username, name: doc.status.name, online: view.online, location: view.location, body: view.body }) : Promise.resolve(),
    ]);
  }

  async webSocketMessage(socket: CfWebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    let msg: SocialClientMsg;
    try { msg = JSON.parse(message) as SocialClientMsg; } catch { return; }
    const username = (socket.deserializeAttachment() as { user?: string } | null)?.user;
    if (!username) return;
    const doc = await this.load(username);
    if (msg.t === "ping") { socket.send(JSON.stringify({ t: "pong", at: Date.now() })); return; }
    if (msg.t === "status") {
      const name = cleanText(msg.name, 24) ?? doc.status.name;
      const location = typeof msg.location === "string" && msg.location.length <= 96 ? msg.location : null;
      const body = msg.body === "m1" || msg.body === "f1" ? msg.body : doc.status.body;
      const characterId = typeof msg.characterId === "string" && /^[0-9a-f]{16}$/.test(msg.characterId) ? msg.characterId : doc.status.characterId;
      const changed = name !== doc.status.name || location !== doc.status.location || body !== doc.status.body;
      doc.status = { name, body, location, characterId, at: Date.now() };
      await this.save();
      if (changed) await this.announce(doc);
    }
  }

  async webSocketClose(socket: CfWebSocket): Promise<void> {
    await this.gone(socket);
  }

  async webSocketError(socket: CfWebSocket): Promise<void> {
    await this.gone(socket);
  }

  private async gone(socket: CfWebSocket): Promise<void> {
    const username = (socket.deserializeAttachment() as { user?: string } | null)?.user;
    if (!username) return;
    try { socket.close(1000, "bye"); } catch { /* already closed */ }
    const doc = await this.load(username);
    // The closing socket may still be listed; announce once none is left.
    if (this.ctx.getWebSockets().filter((s) => s !== socket).length === 0) {
      doc.status = { ...doc.status, location: null, at: Date.now() };
      await this.save();
      await this.announce(doc);
    }
  }

  private acceptSocket(username: string): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ user: username });
    return new Response(null, { status: 101, webSocket: client } as ResponseInit);
  }

  // ─── Requests ────────────────────────────────────────────────────────
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const username = request.headers.get("x-hub-user") ?? "";
    if (!normalUsername(username)) return json({ error: "bad_request" }, 400);
    const doc = await this.load(username);
    const now = Date.now();
    // Letters past their time leave the box; untaken parcels go home.
    const expired = expireMail(doc, now);
    if (expired.length) {
      await this.save();
      for (const mail of expired) await this.sendHome(doc, mail, now);
    }
    if (request.method === "GET") {
      switch (url.pathname) {
        case "/ws": return request.headers.get("upgrade")?.toLowerCase() === "websocket" ? this.acceptSocket(username) : json({ error: "expected_websocket" }, 426);
        case "/snapshot": return json(await this.snapshot(doc));
        case "/internal/status": return json(await this.statusOf(doc));
        case "/internal/can-mail": {
          // Asked before a sender pays: would this box take a letter from them?
          const from = url.searchParams.get("from") ?? "";
          return json({ result: doc.blocked[from] ? "blocked" : doc.mail.length >= L.mailbox ? "full" : "ok" });
        }
        case "/internal/party": {
          // The player's party as it stands (a world boss fight asks): its leader and members.
          if (!doc.partyId) return json({ party: null });
          const answer = await this.callParty<PartyView | null>(doc.partyId, "/view");
          return json({ party: answer.ok ? answer.body : null });
        }
        case "/internal/party-bonus": {
          if (!doc.partyId) return json({ bonus: false });
          const answer = await this.callParty<{ bonus: boolean }>(doc.partyId, `/bonus?who=${encodeURIComponent(username)}&location=${encodeURIComponent(url.searchParams.get("location") ?? "")}`);
          return json({ bonus: answer.ok && answer.body.bonus });
        }
        default: return json({ error: "not_found" }, 404);
      }
    }
    const body = await readJson<Body>(request, 1_100_000);
    if (!body) return json({ error: "bad_request" }, 400);
    if (url.pathname.startsWith("/internal/")) return this.internal(doc, url.pathname, body, now);
    return this.action(doc, url.pathname, body, now);
  }

  private async snapshot(doc: HubDoc): Promise<SocialSnapshot> {
    const friends = await Promise.all(Object.entries(doc.friends).map(async ([username, f]) => {
      const status = await this.callHub<FriendView>(username, "/internal/status");
      return status ? { ...status, since: f.since, name: status.name || f.name } : { username, name: f.name, since: f.since, online: false, location: null, body: null, inParty: false };
    }));
    let party: PartyView | null = null;
    if (doc.partyId) {
      const view = await this.callParty<PartyView | null>(doc.partyId, "/view");
      party = view.ok && view.body && view.body.members.some((m) => m.username === doc.username) ? view.body : null;
      if (!party) { doc.partyId = null; await this.save(); }
    }
    const now = Date.now();
    for (const [id, invite] of Object.entries(doc.invites)) if (now - invite.at > L.inviteMs) delete doc.invites[id];
    return {
      me: refOf(doc),
      friends: friends.sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name)),
      requestsIn: Object.values(doc.requestsIn),
      requestsOut: Object.values(doc.requestsOut),
      blocked: Object.entries(doc.blocked).map(([username, b]) => ({ username, name: b.name })),
      mail: [...doc.mail].sort((a, b) => b.sentAt - a.sentAt),
      whispers: doc.whispers,
      party,
      invites: Object.values(doc.invites),
    };
  }

  /** A parcel goes back to whoever sent it (or is lost if that fails). */
  private async sendHome(doc: HubDoc, mail: Mail, now: number): Promise<void> {
    if (mail.from.username === POST_OFFICE.username) return;
    await this.callHub(mail.from.username, "/internal/mail", { mail: returnedLetter(mail, { ...POST_OFFICE, name: `${POST_OFFICE.name} · ${doc.status.name || doc.username}` }, now) });
  }

  // ─── The player's own actions ────────────────────────────────────────
  private async action(doc: HubDoc, path: string, body: Body, now: number): Promise<Response> {
    const me = refOf(doc);
    const other = normalUsername(body.to ?? body.from ?? body.username);
    switch (path) {
      case "/friends/request": {
        if (!other || other === doc.username) return json({ error: "bad_target" }, 400);
        if (doc.friends[other]) return json({ error: "already" }, 409);
        if (doc.blocked[other]) return json({ error: "blocked" }, 409);
        if (Object.keys(doc.requestsOut).length >= L.requests) return json({ error: "full" }, 409);
        if (!(await this.exists(other))) return json({ error: "no_player" }, 404);
        const answer = await this.callHub<{ outcome: RequestOutcome; name: string }>(other, "/internal/request", { from: me });
        if (!answer) return json({ error: "server_error" }, 502);
        if (answer.outcome === "blocked" || answer.outcome === "full") return json({ error: answer.outcome === "full" ? "their_list_full" : "refused" }, 409);
        recordAsked(doc, { username: other, name: answer.name }, answer.outcome, now);
        await this.save();
        if (answer.outcome === "friends") this.push({ t: "friend_added", friend: { username: other, name: answer.name } });
        return json({ outcome: answer.outcome });
      }
      case "/friends/accept": {
        if (!other) return json({ error: "bad_target" }, 400);
        const request = acceptRequest(doc, other, now);
        if (!request) return json({ error: "no_request" }, 404);
        await this.save();
        await this.callHub(other, "/internal/accepted", { from: me });
        this.push({ t: "friend_added", friend: { username: other, name: request.name } });
        return json({ ok: true });
      }
      case "/friends/decline":
      case "/friends/remove": {
        if (!other) return json({ error: "bad_target" }, 400);
        forget(doc, other);
        await this.save();
        await this.callHub(other, "/internal/forget", { from: me });
        this.push({ t: "friend_removed", username: other });
        return json({ ok: true });
      }
      case "/block": {
        if (!other || other === doc.username) return json({ error: "bad_target" }, 400);
        const name = typeof body.name === "string" ? body.name.slice(0, 24) : "";
        if (!block(doc, { username: other, name }, now)) return json({ error: "full" }, 409);
        await this.save();
        await this.callHub(other, "/internal/forget", { from: me });
        return json({ ok: true });
      }
      case "/unblock": {
        if (!other) return json({ error: "bad_target" }, 400);
        delete doc.blocked[other];
        await this.save();
        return json({ ok: true });
      }
      case "/whisper": {
        const text = cleanText(body.text, L.chatChars);
        if (!other || other === doc.username) return json({ error: "bad_target" }, 400);
        if (!text) return json({ error: "bad_text" }, 400);
        if (doc.blocked[other]) return json({ error: "blocked" }, 409);
        if (!takeChat(doc, now)) { await this.save(); return json({ error: "too_fast" }, 429); }
        const id = randomId();
        const answer = await this.callHub<{ ok: boolean; name: string; error?: string }>(other, "/internal/whisper", { whisper: { id, with: me, mine: false, text, at: now } satisfies Whisper });
        if (!answer?.ok) { await this.save(); return json({ error: answer?.error ?? "offline" }, answer ? 409 : 502); }
        const mine: Whisper = { id, with: { username: other, name: answer.name }, mine: true, text, at: now };
        keepWhisper(doc, mine);
        await this.save();
        this.push({ t: "whisper", whisper: mine });
        return json({ whisper: mine });
      }
      case "/mail/send": return this.sendMail(doc, body as unknown as SendMailRequest, now);
      case "/mail/read": {
        const ids = new Set(Array.isArray(body.ids) ? body.ids.map(String) : []);
        for (const mail of doc.mail) if (ids.has(mail.id)) mail.read = true;
        await this.save();
        return json({ ok: true });
      }
      case "/mail/claim": {
        const id = String(body.id ?? "");
        const characterId = String(body.characterId ?? "");
        const taken = claimMail(doc, id);
        if ("error" in taken) return json({ error: taken.error }, 409);
        if ("gold" in taken.parcel) {
          // The gold joins the character's save allowance, like a checked battle's purse.
          const grant = await this.account(doc.username).fetch(`https://account/characters/${encodeURIComponent(characterId)}/grant`, {
            method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gold: taken.parcel.gold }),
          });
          if (!grant.ok) {
            const mail = doc.mail.find((m) => m.id === id);
            if (mail) mail.claimed = false;
            return json({ error: "no_character" }, 404);
          }
        }
        await this.save();
        return json({ parcel: taken.parcel });
      }
      case "/mail/delete": {
        const back = deleteMail(doc, Array.isArray(body.ids) ? body.ids.map(String) : []);
        await this.save();
        for (const mail of back) await this.sendHome(doc, mail, now);
        return json({ ok: true, returned: back.length });
      }
      case "/party/invite": return this.partyInvite(doc, other, now);
      case "/party/accept": {
        const partyId = String(body.partyId ?? "");
        const invite = doc.invites[partyId];
        if (!invite) return json({ error: "no_invite" }, 404);
        if (doc.partyId && doc.partyId !== partyId) {
          // A party that has since dissolved does not count.
          const view = await this.callParty<PartyView | null>(doc.partyId, "/view");
          if (view.ok && view.body?.members.some((m) => m.username === doc.username)) return json({ error: "in_party" }, 409);
          doc.partyId = null;
        }
        const answer = await this.callParty<{ error?: string }>(partyId, "/join", { who: { ...me, location: doc.status.location, body: doc.status.body } });
        delete doc.invites[partyId];
        if (!answer.ok) { await this.save(); return json({ error: answer.body.error ?? "gone" }, 409); }
        doc.partyId = partyId;
        await this.save();
        return json({ ok: true });
      }
      case "/party/decline": {
        const partyId = String(body.partyId ?? "");
        delete doc.invites[partyId];
        await this.save();
        if (partyId) await this.callParty(partyId, "/decline", { who: doc.username });
        return json({ ok: true });
      }
      case "/party/leave": {
        const partyId = doc.partyId;
        doc.partyId = null;
        await this.save();
        if (partyId) await this.callParty(partyId, "/leave", { who: doc.username });
        this.push({ t: "party", party: null });
        return json({ ok: true });
      }
      case "/party/kick":
      case "/party/lead": {
        if (!doc.partyId || !other) return json({ error: "no_party" }, 409);
        const answer = await this.callParty<{ error?: string }>(doc.partyId, path === "/party/kick" ? "/kick" : "/lead", { by: doc.username, who: other });
        return answer.ok ? json({ ok: true }) : json({ error: answer.body.error ?? "refused" }, 409);
      }
      case "/party/chat": {
        const text = cleanText(body.text, L.chatChars);
        if (!doc.partyId) return json({ error: "no_party" }, 409);
        if (!text) return json({ error: "bad_text" }, 400);
        const answer = await this.callParty<{ error?: string }>(doc.partyId, "/chat", { who: me, text });
        return answer.ok ? json({ ok: true }) : json({ error: answer.body.error ?? "refused" }, answer.status);
      }
      default:
        return json({ error: "not_found" }, 404);
    }
  }

  private async partyInvite(doc: HubDoc, other: string | null, now: number): Promise<Response> {
    if (!other || other === doc.username) return json({ error: "bad_target" }, 400);
    if (doc.blocked[other]) return json({ error: "blocked" }, 409);
    if (!(await this.exists(other))) return json({ error: "no_player" }, 404);
    const me = refOf(doc);
    if (!doc.partyId) {
      const partyId = randomId();
      const created = await this.callParty(partyId, "/create", { leader: { ...me, location: doc.status.location, body: doc.status.body } });
      if (!created.ok) return json({ error: "server_error" }, 502);
      doc.partyId = partyId;
      await this.save();
    }
    const partyId = doc.partyId;
    const invited = await this.callParty<{ error?: string }>(partyId, "/invite", { by: doc.username, to: other });
    if (!invited.ok) return json({ error: invited.body.error ?? "refused" }, 409);
    const answer = await this.callHub<{ ok: boolean; error?: string }>(other, "/internal/party-invite", { invite: { partyId, from: me, at: now } });
    if (!answer?.ok) {
      await this.callParty(partyId, "/decline", { who: other });
      return json({ error: answer?.error ?? "refused" }, 409);
    }
    return json({ ok: true, partyId });
  }

  /**
   * Send a letter: the sender's save pays the parcel and postage first (the
   * AccountObject checks it really leaves the bag), then the letter goes; if
   * it cannot be delivered the parcel comes back at once.
   */
  private async sendMail(doc: HubDoc, req: SendMailRequest, now: number): Promise<Response> {
    const to = normalUsername(req.to);
    const text = cleanText(req.text, L.mailChars);
    const parcel: Parcel | null = req.parcel && typeof req.parcel === "object" ? req.parcel : null;
    if (!to || to === doc.username) return json({ error: "bad_target" }, 400);
    if (!text) return json({ error: "bad_text" }, 400);
    const problem = parcelProblem(parcel);
    if (problem) return json({ error: problem }, 422);
    if (doc.blocked[to]) return json({ error: "blocked" }, 409);
    if (typeof req.characterId !== "string" || !/^[0-9a-f]{16}$/.test(req.characterId)) return json({ error: "no_character" }, 404);
    if (!(await this.exists(to))) return json({ error: "no_player" }, 404);
    const open = await this.callHub<{ result: string }>(to, `/internal/can-mail?from=${encodeURIComponent(doc.username)}`);
    if (open?.result === "blocked") return json({ error: "refused" }, 409);
    if (open?.result === "full") return json({ error: "their_box_full" }, 409);
    if (!takeMail(doc, now)) { await this.save(); return json({ error: "too_many" }, 429); }
    await this.save();
    const debit = debitOf(parcel);
    const paid = await this.account(doc.username).fetch(`https://account/characters/${encodeURIComponent(req.characterId)}/save-debit`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ rev: req.rev, version: req.version, state: req.state, debit }),
    });
    const paidBody = await paid.json().catch(() => ({})) as { rev?: number; error?: string; detail?: string };
    if (!paid.ok) return json({ error: paidBody.error ?? "server_error", detail: paidBody.detail }, paid.status);
    const mail: Mail = { id: randomId(), from: refOf(doc), text, parcel, sentAt: now, read: false, claimed: false, returned: false };
    const delivered = await this.callHub<{ result: string }>(to, "/internal/mail", { mail });
    if (delivered?.result !== "ok") {
      if (parcel) receiveMail(doc, returnedLetter(mail, { ...POST_OFFICE, name: `${POST_OFFICE.name} · ${to}` }, now));
      await this.save();
      if (parcel) this.push({ t: "mail", mail: doc.mail[doc.mail.length - 1]! });
    }
    return json({ rev: paidBody.rev, mailId: mail.id, delivered: delivered?.result === "ok", reason: delivered?.result ?? "offline" });
  }

  // ─── From other hubs and parties ─────────────────────────────────────
  private async internal(doc: HubDoc, path: string, body: Body, now: number): Promise<Response> {
    const from = body.from as PlayerRef | undefined;
    switch (path) {
      case "/internal/request": {
        if (!from?.username) return json({ error: "bad_request" }, 400);
        const outcome = receiveRequest(doc, from, now);
        await this.save();
        if (outcome === "requested") this.push({ t: "friend_request", from: { ...from, at: now } });
        if (outcome === "friends") this.push({ t: "friend_added", friend: from });
        return json({ outcome, name: doc.status.name });
      }
      case "/internal/accepted": {
        if (!from?.username || !doc.requestsOut[from.username]) return json({ ok: false });
        recordAsked(doc, from, "friends", now);
        await this.save();
        this.push({ t: "friend_added", friend: from });
        return json({ ok: true });
      }
      case "/internal/forget": {
        if (!from?.username) return json({ ok: false });
        const was = !!doc.friends[from.username];
        forget(doc, from.username);
        await this.save();
        if (was) this.push({ t: "friend_removed", username: from.username });
        else this.push({ t: "refresh" });
        return json({ ok: true });
      }
      case "/internal/whisper": {
        const whisper = body.whisper as Whisper | undefined;
        if (!whisper?.with?.username) return json({ ok: false, error: "bad_request" });
        if (doc.blocked[whisper.with.username]) return json({ ok: false, error: "refused" });
        keepWhisper(doc, whisper);
        await this.save();
        this.push({ t: "whisper", whisper });
        return json({ ok: true, name: doc.status.name });
      }
      case "/internal/mail": {
        const mail = body.mail as Mail | undefined;
        if (!mail?.id) return json({ result: "bad_request" });
        const result = receiveMail(doc, mail);
        await this.save();
        if (result === "ok") this.push({ t: "mail", mail });
        return json({ result });
      }
      case "/internal/party-invite": {
        const invite = body.invite as { partyId: string; from: PlayerRef; at: number } | undefined;
        if (!invite?.partyId || !invite.from?.username) return json({ ok: false, error: "bad_request" });
        if (doc.blocked[invite.from.username]) return json({ ok: false, error: "refused" });
        if (doc.partyId === invite.partyId) return json({ ok: false, error: "member" });
        doc.invites[invite.partyId] = invite;
        await this.save();
        this.push({ t: "party_invite", invite });
        return json({ ok: true });
      }
      case "/internal/party-left": {
        if (doc.partyId && doc.partyId === body.partyId) {
          doc.partyId = null;
          await this.save();
          this.push({ t: "party", party: null });
        }
        return json({ ok: true });
      }
      case "/internal/push": {
        const message = body.message as SocialPush | undefined;
        if (message) this.push(message);
        return json({ ok: true });
      }
      default:
        return json({ error: "not_found" }, 404);
    }
  }
}
