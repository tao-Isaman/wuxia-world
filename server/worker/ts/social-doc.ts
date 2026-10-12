// A player's social home, as the server keeps it (docs/design/social.md):
// friends, requests, blocks, player mail, whispers and their status. Pure: the
// PlayerHub Durable Object (hub-object.ts) stores this document and does the
// talking to other hubs and parties; these functions decide.
import { SOCIAL_LIMITS as L, type FriendRequest, type Mail, type Parcel, type PlayerRef, type Whisper } from "@/lib/net/social-protocol";
import { getItem } from "@/lib/world/data/items";
import { giftable } from "@/lib/world/gifts";

export interface HubStatus {
  name: string;
  body: string | null;
  location: string | null;
  characterId: string | null;
  /** When the hub last heard from a socket (ms). */
  at: number;
}

export interface HubDoc {
  username: string;
  friends: Record<string, { since: number; name: string }>;
  requestsIn: Record<string, FriendRequest>;
  requestsOut: Record<string, FriendRequest>;
  blocked: Record<string, { at: number; name: string }>;
  mail: Mail[];
  whispers: Whisper[];
  status: HubStatus;
  partyId: string | null;
  invites: Record<string, { partyId: string; from: PlayerRef; at: number }>;
  /** Recent sends, for rate limits (ms). */
  mailSent: number[];
  chatSent: number[];
}

export function emptyHub(username: string): HubDoc {
  return {
    username, friends: {}, requestsIn: {}, requestsOut: {}, blocked: {}, mail: [], whispers: [],
    status: { name: "", body: null, location: null, characterId: null, at: 0 },
    partyId: null, invites: {}, mailSent: [], chatSent: [],
  };
}

/** Fill fields a document stored by an older server lacks. */
export function normalizeHub(doc: Partial<HubDoc>, username: string): HubDoc {
  return { ...emptyHub(username), ...doc, username };
}

export const refOf = (doc: HubDoc): PlayerRef => ({ username: doc.username, name: doc.status.name });

// ─── Rates ─────────────────────────────────────────────────────────────

/** Whether one more chat line fits the burst limit now (and count it). */
export function takeChat(doc: HubDoc, at: number): boolean {
  doc.chatSent = doc.chatSent.filter((t) => at - t < L.chatWindowMs);
  if (doc.chatSent.length >= L.chatBurst) return false;
  doc.chatSent.push(at);
  return true;
}

/** Whether one more letter fits the hourly limit now (and count it). */
export function takeMail(doc: HubDoc, at: number): boolean {
  doc.mailSent = doc.mailSent.filter((t) => at - t < 3_600_000);
  if (doc.mailSent.length >= L.mailPerHour) return false;
  doc.mailSent.push(at);
  return true;
}

// ─── Friends ───────────────────────────────────────────────────────────

export type RequestOutcome = "requested" | "friends" | "already" | "blocked" | "full";

/** Someone asks to be friends (this hub is theirs to ask). */
export function receiveRequest(doc: HubDoc, from: PlayerRef, at: number): RequestOutcome {
  if (doc.blocked[from.username]) return "blocked";
  if (doc.friends[from.username]) return "already";
  // We asked them too: that is a yes from both.
  if (doc.requestsOut[from.username]) {
    if (Object.keys(doc.friends).length >= L.friends) return "full";
    delete doc.requestsOut[from.username];
    doc.friends[from.username] = { since: at, name: from.name };
    return "friends";
  }
  if (Object.keys(doc.requestsIn).length >= L.requests) return "full";
  doc.requestsIn[from.username] = { ...from, at };
  return "requested";
}

/** This hub's player asked `to` (after the other hub answered). */
export function recordAsked(doc: HubDoc, to: PlayerRef, outcome: RequestOutcome, at: number): void {
  if (outcome === "requested") doc.requestsOut[to.username] = { ...to, at };
  if (outcome === "friends") {
    delete doc.requestsOut[to.username];
    delete doc.requestsIn[to.username];
    doc.friends[to.username] = { since: at, name: to.name };
  }
}

/** Accept a request; null when there was none. */
export function acceptRequest(doc: HubDoc, from: string, at: number): FriendRequest | null {
  const request = doc.requestsIn[from];
  if (!request || Object.keys(doc.friends).length >= L.friends) return null;
  delete doc.requestsIn[from];
  doc.friends[from] = { since: at, name: request.name };
  return request;
}

/** Forget anything between this hub's player and `other` (unfriend, decline, block). */
export function forget(doc: HubDoc, other: string): void {
  delete doc.friends[other];
  delete doc.requestsIn[other];
  delete doc.requestsOut[other];
}

export function block(doc: HubDoc, other: PlayerRef, at: number): boolean {
  if (Object.keys(doc.blocked).length >= L.blocked && !doc.blocked[other.username]) return false;
  forget(doc, other.username);
  doc.blocked[other.username] = { at, name: other.name };
  for (const [id, invite] of Object.entries(doc.invites)) if (invite.from.username === other.username) delete doc.invites[id];
  return true;
}

// ─── Whispers ──────────────────────────────────────────────────────────

export function keepWhisper(doc: HubDoc, whisper: Whisper): void {
  doc.whispers = [...doc.whispers, whisper].slice(-L.whispers);
}

// ─── Mail ──────────────────────────────────────────────────────────────

/** Why a parcel cannot go by mail, or null. */
export function parcelProblem(parcel: Parcel | null): string | null {
  if (!parcel) return null;
  if ("gold" in parcel) {
    return Number.isInteger(parcel.gold) && parcel.gold >= 1 && parcel.gold <= L.maxParcelGold ? null : "bad_parcel";
  }
  if (!Number.isInteger(parcel.count) || parcel.count < 1 || parcel.count > 9_999) return "bad_parcel";
  const item = getItem(parcel.itemId);
  return item && giftable(item) && !parcel.itemId.startsWith("scroll_") ? null : "not_mailable";
}

/** The gold and items a letter takes out of the sender's bag (the parcel and the postage). */
export function debitOf(parcel: Parcel | null): { gold: number; itemId?: string; count?: number } {
  if (parcel && "itemId" in parcel) return { gold: L.postage, itemId: parcel.itemId, count: parcel.count };
  return { gold: L.postage + (parcel && "gold" in parcel ? parcel.gold : 0) };
}

/** A letter arrives. False when this hub will not take it (blocked sender, full inbox). */
export function receiveMail(doc: HubDoc, mail: Mail): "ok" | "blocked" | "full" {
  if (!mail.returned && doc.blocked[mail.from.username]) return "blocked";
  if (doc.mail.some((m) => m.id === mail.id)) return "ok";
  if (doc.mail.length >= L.mailbox) {
    // Room for a returned parcel always: drop the oldest read letter without one.
    const spare = doc.mail.findIndex((m) => m.read && (!m.parcel || m.claimed));
    if (!mail.returned || spare < 0) return "full";
    doc.mail.splice(spare, 1);
  }
  doc.mail = [...doc.mail, mail];
  return "ok";
}

/** Take a letter's parcel: the parcel, or why not. Marks it claimed. */
export function claimMail(doc: HubDoc, id: string): { parcel: Parcel } | { error: string } {
  const mail = doc.mail.find((m) => m.id === id);
  if (!mail) return { error: "no_mail" };
  if (!mail.parcel) return { error: "no_parcel" };
  if (mail.claimed) return { error: "claimed" };
  mail.claimed = true;
  mail.read = true;
  return { parcel: mail.parcel };
}

/**
 * Letters past their time, taken out of the box. Those still holding a parcel
 * (and not already returned once) are handed back to the caller, who sends
 * them home.
 */
export function expireMail(doc: HubDoc, at: number): Mail[] {
  const keep: Mail[] = [];
  const back: Mail[] = [];
  for (const mail of doc.mail) {
    if (at - mail.sentAt < L.mailKeepMs) keep.push(mail);
    else if (mail.parcel && !mail.claimed && !mail.returned) back.push(mail);
  }
  doc.mail = keep;
  return back;
}

/** A parcel going back to its sender, as the letter they receive. */
export function returnedLetter(mail: Mail, by: PlayerRef, at: number): Mail {
  return {
    id: `${mail.id}r`, from: by, text: `ส่งคืน: ${mail.text}`.slice(0, L.mailChars), parcel: mail.parcel,
    sentAt: at, read: false, claimed: false, returned: true,
  };
}

/**
 * Delete letters. An untaken parcel in a letter that came from someone goes
 * back to them (returned); a returned parcel deleted untaken is gone.
 */
export function deleteMail(doc: HubDoc, ids: readonly string[]): Mail[] {
  const gone = new Set(ids);
  const back: Mail[] = [];
  doc.mail = doc.mail.filter((mail) => {
    if (!gone.has(mail.id)) return true;
    if (mail.parcel && !mail.claimed && !mail.returned) back.push(mail);
    return false;
  });
  return back;
}
