"use client";

// Friends, party, chat and mail between players (docs/design/social.md): what
// the สหาย window, the chat box, the party frame and the จดหมาย window's
// จากสหาย list show, kept current by the social socket (lib/net/social.ts) and
// the map room (lib/net/session.ts). Actions call the game server; nothing
// here is saved (the server keeps it all). Only used with a game server.
import { create } from "zustand";
import {
  ApiFailure, claimMail as claimMailCall, loadSocial, partyAction, sendMail as sendMailCall, socialAction,
} from "@/lib/net/client";
import { cloudSave } from "@/lib/net/cloud-save";
import { onlineSession, type MapLine } from "@/lib/net/session";
import { socialSocket, type SocialStatus } from "@/lib/net/social";
import {
  SOCIAL_LIMITS, cleanText, normalUsername,
  type FriendRequest, type FriendView, type Mail, type Parcel, type PartyInvite, type PartyView, type PlayerRef,
  type SocialPush, type SocialSnapshot, type Whisper,
} from "@/lib/net/social-protocol";
import { getItem } from "@/lib/world";
import { giftable } from "@/lib/world/gifts";
import { useWorldStore } from "./world-store";
import { appendActionLog, draftFrom } from "./world/state";
import { partializeSave } from "./world/persist";
import { SAVE_VERSION } from "./world/save-version";
import { toast } from "./toast-store";

export type ChatChannel = "map" | "party" | "whisper";

export interface ChatLine {
  id: string;
  channel: ChatChannel;
  from: PlayerRef;
  text: string;
  at: number;
  mine: boolean;
  /** A whisper's other player. */
  with?: PlayerRef;
}

/** Lines the chat box keeps (all channels). */
const MAX_LINES = 120;

export const SOCIAL_ERROR_TEXT: Record<string, string> = {
  no_player: "ไม่พบผู้เล่นชื่อนี้",
  bad_target: "เลือกผู้เล่นไม่ถูกต้อง",
  already: "เป็นสหายกันอยู่แล้ว",
  blocked: "ท่านบล็อกผู้เล่นนี้อยู่",
  refused: "อีกฝ่ายไม่รับ",
  full: "รายชื่อเต็มแล้ว",
  their_list_full: "รายชื่อของอีกฝ่ายเต็มแล้ว",
  their_box_full: "กล่องจดหมายของอีกฝ่ายเต็ม",
  no_request: "ไม่มีคำขอนี้แล้ว",
  bad_text: "ข้อความต้องยาว 1–120 ตัวอักษร",
  too_fast: "พิมพ์เร็วเกินไป รอสักครู่",
  too_many: "ส่งจดหมายครบ 10 ฉบับในชั่วโมงนี้แล้ว",
  offline: "อีกฝ่ายไม่ได้ออนไลน์",
  not_enough: "ทองหรือของไม่พอ",
  bad_parcel: "ของแนบไม่ถูกต้อง",
  not_mailable: "ของชิ้นนี้ส่งทางจดหมายไม่ได้",
  no_mail: "ไม่พบจดหมายนี้",
  claimed: "รับของไปแล้ว",
  no_character: "ต้องเล่นตัวละครอยู่จึงรับของได้",
  no_party: "ยังไม่ได้อยู่ในคณะ",
  not_leader: "เฉพาะหัวหน้าคณะเท่านั้น",
  member: "อยู่ในคณะแล้ว",
  in_party: "ท่านอยู่ในคณะอื่นอยู่",
  no_invite: "คำเชิญหมดอายุแล้ว",
  not_invited: "คำเชิญหมดอายุแล้ว",
  gone: "คณะนี้แยกย้ายไปแล้ว",
  self: "ทำกับตัวเองไม่ได้",
  not_member: "ผู้นี้ไม่ได้อยู่ในคณะ",
  stale: "บันทึกตัวละครไม่ตรงกับเซิร์ฟเวอร์",
  not_saved: "ยังบันทึกตัวละครไม่เสร็จ ลองอีกครั้ง",
  network: "ติดต่อเซิร์ฟเวอร์ไม่ได้",
};
export const socialErrorText = (code: string) => SOCIAL_ERROR_TEXT[code] ?? `ไม่สำเร็จ (${code})`;

type Result = { ok: true } | { ok: false; error: string };

interface SocialState extends Omit<SocialSnapshot, "whispers"> {
  status: SocialStatus;
  loaded: boolean;
  lines: ChatLine[];
  /** Chat lines that came while the chat box was closed. */
  unread: number;
  chatOpen: boolean;
  chatTab: ChatChannel;
  /** Who the กระซิบ tab writes to. */
  whisperTo: PlayerRef | null;
  /** The player card shown (tapped on the map, or picked in a list). */
  card: PlayerRef | null;
  /** A menu section to open (the HUD menu takes it and clears it). */
  menuRequest: "friends" | "letters" | null;
  /** A letter being written to this username (the จดหมาย window opens on เขียนจดหมาย). */
  composeTo: string | null;

  refresh: () => Promise<void>;
  setChatOpen: (open: boolean) => void;
  setChatTab: (tab: ChatChannel) => void;
  setWhisperTo: (to: PlayerRef | null) => void;
  showCard: (player: PlayerRef | null) => void;
  /** Open the chat on the กระซิบ tab, writing to `to`. */
  whisper: (to: PlayerRef) => void;
  /** Open the จดหมาย window on เขียนจดหมาย to `username`. */
  writeTo: (username: string) => void;
  /** Say a line on the open channel (map / party / whisper). */
  say: (channel: ChatChannel, text: string) => Promise<Result>;

  requestFriend: (username: string) => Promise<Result & { outcome?: string }>;
  acceptFriend: (username: string) => Promise<Result>;
  declineFriend: (username: string) => Promise<Result>;
  removeFriend: (username: string) => Promise<Result>;
  block: (player: PlayerRef) => Promise<Result>;
  unblock: (username: string) => Promise<Result>;

  inviteToParty: (username: string) => Promise<Result>;
  acceptInvite: (partyId: string) => Promise<Result>;
  declineInvite: (partyId: string) => Promise<Result>;
  leaveParty: () => Promise<Result>;
  kick: (username: string) => Promise<Result>;
  makeLeader: (username: string) => Promise<Result>;

  readMail: (ids: string[]) => Promise<void>;
  claimMail: (id: string) => Promise<Result & { label?: string }>;
  deleteMail: (ids: string[]) => Promise<Result>;
  sendMail: (to: string, text: string, parcel: Parcel | null) => Promise<Result & { delivered?: boolean }>;
}

function connection(): { server: string; token: string } | null {
  return cloudSave.session ?? null;
}

const failure = (error: unknown): { ok: false; error: string } =>
  ({ ok: false, error: error instanceof ApiFailure ? error.code : "network" });

/** A parcel's label for the player ("500 ตำลึง", "ยาสมุนไพร ×2"). */
export function parcelLabel(parcel: Parcel): string {
  if ("gold" in parcel) return `${parcel.gold.toLocaleString()} ตำลึง`;
  return `${getItem(parcel.itemId)?.name ?? parcel.itemId} ×${parcel.count}`;
}

/** Items the hero may put in a letter: in the bag, sellable, not a quest item or scroll. */
export function mailableItems(inventory: Record<string, number>): { id: string; count: number }[] {
  return Object.entries(inventory)
    .filter(([id, count]) => count > 0 && !id.startsWith("scroll_") && giftable(getItem(id)))
    .map(([id, count]) => ({ id, count }));
}

const whisperLine = (w: Whisper, me: string): ChatLine => ({
  id: `w:${w.id}`, channel: "whisper", from: w.mine ? { username: me, name: "" } : w.with, text: w.text, at: w.at, mine: w.mine, with: w.with,
});

const EMPTY: Omit<SocialSnapshot, "whispers"> = {
  me: { username: "", name: "" }, friends: [], requestsIn: [], requestsOut: [], blocked: [], mail: [], party: null, invites: [],
};

export const useSocialStore = create<SocialState>()((set, get) => {
  /** Add chat lines (once each), newest last. */
  const addLines = (lines: ChatLine[]) => {
    const state = get();
    const known = new Set(state.lines.map((l) => l.id));
    const fresh = lines.filter((l) => !known.has(l.id) && !(l.channel === "map" && state.blocked.some((b) => b.username === l.from.username)));
    if (!fresh.length) return;
    const next = [...state.lines, ...fresh].sort((a, b) => a.at - b.at).slice(-MAX_LINES);
    set({ lines: next, unread: state.chatOpen ? 0 : state.unread + fresh.filter((l) => !l.mine).length });
  };

  const call = async (fn: (c: { server: string; token: string }) => Promise<unknown>): Promise<Result> => {
    const c = connection();
    if (!c) return { ok: false, error: "network" };
    try {
      await fn(c);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  };

  const mergeFriend = (friend: FriendView) => {
    const friends = get().friends;
    if (!friends.some((f) => f.username === friend.username)) return;
    set({ friends: friends.map((f) => (f.username === friend.username ? { ...f, ...friend, since: f.since } : f))
      .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name)) });
  };

  socialSocket.onStatus = (status) => set({ status });
  socialSocket.onOpen = () => { void get().refresh(); };
  socialSocket.onPush = (message: SocialPush) => {
    const state = get();
    switch (message.t) {
      case "friend_request":
        set({ requestsIn: [...state.requestsIn.filter((r) => r.username !== message.from.username), message.from] });
        toast("info", `${message.from.name || message.from.username} ขอเป็นสหาย`);
        break;
      case "friend_added":
        toast("success", `${message.friend.name || message.friend.username} เป็นสหายแล้ว`);
        void get().refresh();
        break;
      case "friend_removed":
        set({ friends: state.friends.filter((f) => f.username !== message.username),
          requestsOut: state.requestsOut.filter((r) => r.username !== message.username) });
        break;
      case "friend_status":
        mergeFriend(message.friend);
        break;
      case "whisper":
        addLines([whisperLine(message.whisper, state.me.username)]);
        if (!message.whisper.mine && !state.whisperTo) set({ whisperTo: message.whisper.with });
        break;
      case "mail":
        set({ mail: [message.mail, ...state.mail.filter((m) => m.id !== message.mail.id)] });
        toast("info", message.mail.returned ? "มีพัสดุถูกส่งคืนมา" : `จดหมายจาก ${message.mail.from.name || message.mail.from.username}`);
        break;
      case "party":
        set({ party: message.party });
        break;
      case "party_invite":
        set({ invites: [...state.invites.filter((i) => i.partyId !== message.invite.partyId), message.invite] });
        toast("info", `${message.invite.from.name || message.invite.from.username} ชวนเข้าคณะ`);
        break;
      case "party_chat":
        addLines([{ id: `p:${message.at}:${message.from.username}`, channel: "party", from: message.from, text: message.text, at: message.at, mine: message.from.username === state.me.username }]);
        break;
      case "refresh":
        void get().refresh();
        break;
    }
  };
  onlineSession.onChat((line: MapLine) => {
    addLines([{ id: `m:${line.at}:${line.id}`, channel: "map", from: { username: line.id, name: line.name }, text: line.text, at: line.at, mine: line.id === onlineSession.you }]);
  });
  onlineSession.onChatError((code) => toast("warn", socialErrorText(code)));

  return {
    ...EMPTY,
    status: "off",
    loaded: false,
    lines: [],
    unread: 0,
    chatOpen: false,
    chatTab: "map",
    whisperTo: null,
    card: null,
    menuRequest: null,
    composeTo: null,

    async refresh() {
      const c = connection();
      if (!c) return;
      try {
        const snapshot = await loadSocial(c.server, c.token);
        const { whispers, ...rest } = snapshot;
        set({ ...rest, loaded: true });
        addLines(whispers.map((w) => whisperLine(w, snapshot.me.username)));
      } catch {
        // The socket's next open refreshes again.
      }
    },
    setChatOpen: (open) => set(open ? { chatOpen: true, unread: 0 } : { chatOpen: false }),
    setChatTab: (tab) => set({ chatTab: tab }),
    setWhisperTo: (to) => set({ whisperTo: to }),
    showCard: (player) => set({ card: player }),
    whisper: (to) => set({ whisperTo: to, chatTab: "whisper", chatOpen: true, unread: 0, card: null }),
    writeTo: (username) => set({ composeTo: username, menuRequest: "letters", card: null }),

    async say(channel, raw) {
      const text = cleanText(raw, SOCIAL_LIMITS.chatChars);
      if (!text) return { ok: false, error: "bad_text" };
      if (channel === "map") return onlineSession.say(text) ? { ok: true } : { ok: false, error: "offline" };
      if (channel === "party") return call((c) => partyAction(c.server, c.token, "chat", { text }));
      const to = get().whisperTo;
      if (!to) return { ok: false, error: "bad_target" };
      const c = connection();
      if (!c) return { ok: false, error: "network" };
      try {
        const { whisper } = await socialAction<{ whisper: Whisper }>(c.server, c.token, "whisper", { to: to.username, text });
        addLines([whisperLine(whisper, get().me.username)]);
        return { ok: true };
      } catch (error) {
        return failure(error);
      }
    },

    async requestFriend(raw) {
      const username = normalUsername(raw);
      if (!username) return { ok: false, error: "no_player" };
      const c = connection();
      if (!c) return { ok: false, error: "network" };
      try {
        const { outcome } = await socialAction<{ outcome: string }>(c.server, c.token, "friends/request", { to: username });
        await get().refresh();
        return { ok: true, outcome };
      } catch (error) {
        return failure(error);
      }
    },
    acceptFriend: async (username) => {
      const result = await call((c) => socialAction(c.server, c.token, "friends/accept", { from: username }));
      await get().refresh();
      return result;
    },
    declineFriend: async (username) => {
      const result = await call((c) => socialAction(c.server, c.token, "friends/decline", { from: username }));
      set({ requestsIn: get().requestsIn.filter((r: FriendRequest) => r.username !== username) });
      return result;
    },
    removeFriend: async (username) => {
      const result = await call((c) => socialAction(c.server, c.token, "friends/remove", { username }));
      await get().refresh();
      return result;
    },
    block: async (player) => {
      const result = await call((c) => socialAction(c.server, c.token, "block", { username: player.username, name: player.name }));
      await get().refresh();
      return result;
    },
    unblock: async (username) => {
      const result = await call((c) => socialAction(c.server, c.token, "unblock", { username }));
      await get().refresh();
      return result;
    },

    inviteToParty: (username) => call((c) => partyAction(c.server, c.token, "invite", { to: username })),
    acceptInvite: async (partyId) => {
      const result = await call((c) => partyAction(c.server, c.token, "accept", { partyId }));
      set({ invites: get().invites.filter((i: PartyInvite) => i.partyId !== partyId) });
      if (result.ok) await get().refresh();
      return result;
    },
    declineInvite: async (partyId) => {
      const result = await call((c) => partyAction(c.server, c.token, "decline", { partyId }));
      set({ invites: get().invites.filter((i) => i.partyId !== partyId) });
      return result;
    },
    leaveParty: async () => {
      const result = await call((c) => partyAction(c.server, c.token, "leave", {}));
      if (result.ok) set({ party: null });
      return result;
    },
    kick: (username) => call((c) => partyAction(c.server, c.token, "kick", { username })),
    makeLeader: (username) => call((c) => partyAction(c.server, c.token, "lead", { username })),

    async readMail(ids) {
      const unread = ids.filter((id) => get().mail.some((m) => m.id === id && !m.read));
      if (!unread.length) return;
      set({ mail: get().mail.map((m) => (unread.includes(m.id) ? { ...m, read: true } : m)) });
      await call((c) => socialAction(c.server, c.token, "mail/read", { ids: unread }));
    },

    async claimMail(id) {
      const c = cloudSave.session;
      if (!c) return { ok: false, error: "no_character" };
      try {
        const { parcel } = await claimMailCall(c.server, c.token, id, c.id);
        // The server marked it taken (and granted a purse to this hero's allowance): into the bag.
        const draft = draftFrom(useWorldStore.getState());
        if ("gold" in parcel) draft.gold += parcel.gold;
        else draft.inventory[parcel.itemId] = (draft.inventory[parcel.itemId] ?? 0) + parcel.count;
        const mail = get().mail.find((m) => m.id === id);
        appendActionLog(draft, "letter", `รับของจากจดหมายของ${mail?.from.name || mail?.from.username || "สหาย"} · ได้ ${parcelLabel(parcel)}`);
        useWorldStore.setState({ ...draft });
        set({ mail: get().mail.map((m) => (m.id === id ? { ...m, read: true, claimed: true } : m)) });
        return { ok: true, label: parcelLabel(parcel) };
      } catch (error) {
        return failure(error);
      }
    },

    async deleteMail(ids) {
      const result = await call((c) => socialAction(c.server, c.token, "mail/delete", { ids }));
      if (result.ok) set({ mail: get().mail.filter((m: Mail) => !ids.includes(m.id)) });
      return result;
    },

    async sendMail(rawTo, rawText, parcel) {
      const to = normalUsername(rawTo);
      const text = cleanText(rawText, SOCIAL_LIMITS.mailChars);
      if (!to) return { ok: false, error: "no_player" };
      if (!text) return { ok: false, error: "bad_text" };
      // What the letter takes from the bag: the parcel and the postage.
      const gold = SOCIAL_LIMITS.postage + (parcel && "gold" in parcel ? parcel.gold : 0);
      const item = parcel && "itemId" in parcel ? parcel : null;
      const world = useWorldStore.getState();
      if (world.gold < gold || (item && (world.inventory[item.itemId] ?? 0) < item.count)) return { ok: false, error: "not_enough" };
      try {
        const reply = await cloudSave.exclusive(async (at) => {
          const now = useWorldStore.getState();
          const paid = (s: { gold: number; inventory: Record<string, number> }) => {
            const inventory = { ...s.inventory };
            if (item) {
              const left = (inventory[item.itemId] ?? 0) - item.count;
              if (left > 0) inventory[item.itemId] = left; else delete inventory[item.itemId];
            }
            return { gold: s.gold - gold, inventory };
          };
          const state = { ...partializeSave(now), ...paid(now) } as unknown as Record<string, unknown>;
          const sent = await sendMailCall(at.server, at.token, { to, text, parcel, characterId: at.id, rev: at.rev, version: SAVE_VERSION, state });
          // The server keeps the paid save: the store takes the same payment now.
          const draft = draftFrom(useWorldStore.getState());
          Object.assign(draft, paid(draft));
          appendActionLog(draft, "letter", `ส่งจดหมายถึง @${to}${parcel ? ` พร้อม ${parcelLabel(parcel)}` : ""} · ค่าม้าเร็ว ${SOCIAL_LIMITS.postage} ตำลึง`);
          useWorldStore.setState({ ...draft });
          return sent;
        });
        return { ok: true, delivered: reply.delivered };
      } catch (error) {
        return failure(error);
      }
    },
  };
});

/** Unread player letters and parcels waiting (for the จดหมาย badge). */
export const mailWaiting = (s: Pick<SocialState, "mail">) => s.mail.filter((m) => !m.read || (m.parcel && !m.claimed)).length;
