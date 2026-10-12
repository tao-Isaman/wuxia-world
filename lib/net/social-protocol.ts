// Friends, party, whispers and mail between players (docs/design/social.md,
// docs/online.md "Friends, party, chat and mail"). Types and the small shared
// rules only, used by the browser and by the server's PlayerHub / PartyObject.

/** A player as others see them: the account, and the hero being played (or last played). */
export interface PlayerRef {
  username: string;
  /** The hero name (empty until they first play a character online). */
  name: string;
}

export interface FriendView extends PlayerRef {
  since: number;
  online: boolean;
  /** Where they stand (a scene id), when online. */
  location: string | null;
  body: string | null;
  inParty: boolean;
}

export interface FriendRequest extends PlayerRef {
  at: number;
}

/** What a letter carries: gold, or one stack of an item. */
export type Parcel = { gold: number } | { itemId: string; count: number };

export interface Mail {
  id: string;
  from: PlayerRef;
  text: string;
  parcel: Parcel | null;
  sentAt: number;
  read: boolean;
  claimed: boolean;
  /** The parcel came back (the recipient did not take it, or could not get it). */
  returned: boolean;
}

export interface Whisper {
  id: string;
  /** The other player. */
  with: PlayerRef;
  /** Whether this hub's player wrote it. */
  mine: boolean;
  text: string;
  at: number;
}

export interface PartyMember extends PlayerRef {
  online: boolean;
  location: string | null;
  body: string | null;
  joinedAt: number;
}

export interface PartyView {
  id: string;
  leader: string;
  members: PartyMember[];
  /** Usernames invited and not yet answered. */
  invited: string[];
}

export interface PartyInvite {
  partyId: string;
  from: PlayerRef;
  at: number;
}

/** `GET /social`: everything the สหาย and จดหมาย windows show. */
export interface SocialSnapshot {
  me: PlayerRef;
  friends: FriendView[];
  requestsIn: FriendRequest[];
  requestsOut: FriendRequest[];
  blocked: PlayerRef[];
  mail: Mail[];
  whispers: Whisper[];
  party: PartyView | null;
  invites: PartyInvite[];
}

/** What the social socket pushes (server → browser). */
export type SocialPush =
  | { t: "friend_request"; from: FriendRequest }
  | { t: "friend_added"; friend: PlayerRef }
  | { t: "friend_removed"; username: string }
  | { t: "friend_status"; friend: FriendView }
  | { t: "whisper"; whisper: Whisper }
  | { t: "mail"; mail: Mail }
  | { t: "party"; party: PartyView | null }
  | { t: "party_invite"; invite: PartyInvite }
  | { t: "party_chat"; from: PlayerRef; text: string; at: number }
  | { t: "refresh" };

/** What the browser tells its hub over the socket (browser → server). */
export type SocialClientMsg =
  | { t: "status"; name: string; body: string; location: string | null; characterId: string | null }
  | { t: "ping" };

/** `POST /social/mail` body: the letter, and the save that pays for it (parcel and postage). */
export interface SendMailRequest {
  to: string;
  text: string;
  parcel: Parcel | null;
  characterId: string;
  rev: number;
  version: number;
  state: Record<string, unknown>;
}

export const SOCIAL_LIMITS = {
  friends: 100,
  requests: 30,
  blocked: 100,
  mailbox: 50,
  whispers: 50,
  partySize: 4,
  /** Chat lines (whisper / party) per player… */
  chatBurst: 5,
  /** …per this many ms. */
  chatWindowMs: 10_000,
  chatChars: 120,
  mailChars: 500,
  /** Letters a player may send per real hour. */
  mailPerHour: 10,
  /** Gold postage for every letter (ค่าม้าเร็ว). */
  postage: 10,
  maxParcelGold: 50_000,
  /** Letters are kept this long (ms); an untaken parcel then goes back. */
  mailKeepMs: 30 * 24 * 3_600_000,
  /** A party invite lapses after this long (ms). */
  inviteMs: 120_000,
  /** A party battle bonus: w-exp and move xp ×(1 + this). */
  partyBonus: 0.1,
} as const;

/** A chat or letter text as kept: control characters out, trimmed; null when empty or too long. */
export function cleanText(text: unknown, max: number): string | null {
  if (typeof text !== "string") return null;
  const clean = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+$/u, "").replace(/^\s+/u, "");
  const length = [...clean].length;
  return length === 0 || length > max ? null : clean;
}

/** A username as accounts have them (`server/core/src/auth.rs` normalize_username): 3–20 of a–z, 0–9, _. */
export function normalUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(name) ? name : null;
}
