// A party (คณะ), as the server keeps it (docs/design/social.md): up to four
// players, a leader, pending invites, and where each member is. Pure: the
// PartyObject Durable Object (party-object.ts) stores this and tells the
// members' hubs; these functions decide.
import { SOCIAL_LIMITS as L, type PartyView, type PlayerRef } from "@/lib/net/social-protocol";

export interface PartyMemberDoc {
  name: string;
  joinedAt: number;
  online: boolean;
  location: string | null;
  body: string | null;
}

export interface PartyDoc {
  id: string;
  leader: string;
  members: Record<string, PartyMemberDoc>;
  /** username → when invited (ms). */
  invited: Record<string, number>;
  chatSent: Record<string, number[]>;
}

export function createParty(id: string, leader: PlayerRef & { location?: string | null; body?: string | null }, at: number): PartyDoc {
  return {
    id, leader: leader.username,
    members: { [leader.username]: { name: leader.name, joinedAt: at, online: true, location: leader.location ?? null, body: leader.body ?? null } },
    invited: {}, chatSent: {},
  };
}

const size = (doc: PartyDoc) => Object.keys(doc.members).length;

/** Drop lapsed invites. */
export function pruneInvites(doc: PartyDoc, at: number): void {
  for (const [who, when] of Object.entries(doc.invited)) if (at - when > L.inviteMs) delete doc.invited[who];
}

export function invite(doc: PartyDoc, by: string, to: string, at: number): "ok" | "not_leader" | "full" | "member" | "self" {
  pruneInvites(doc, at);
  if (by !== doc.leader) return "not_leader";
  if (to === by) return "self";
  if (doc.members[to]) return "member";
  if (size(doc) + Object.keys(doc.invited).length >= L.partySize && !doc.invited[to]) return "full";
  doc.invited[to] = at;
  return "ok";
}

export function join(doc: PartyDoc, who: PlayerRef & { location?: string | null; body?: string | null }, at: number): "ok" | "not_invited" | "full" {
  pruneInvites(doc, at);
  if (doc.members[who.username]) return "ok";
  if (!doc.invited[who.username]) return "not_invited";
  delete doc.invited[who.username];
  if (size(doc) >= L.partySize) return "full";
  doc.members[who.username] = { name: who.name, joinedAt: at, online: true, location: who.location ?? null, body: who.body ?? null };
  return "ok";
}

export function decline(doc: PartyDoc, who: string): void {
  delete doc.invited[who];
}

/**
 * A member leaves (or is kicked). A leader who leaves hands the lead to the
 * longest-standing member; a party of one dissolves. Returns whether it did.
 */
export function leave(doc: PartyDoc, who: string): { dissolved: boolean } {
  if (!doc.members[who]) return { dissolved: size(doc) < 2 };
  delete doc.members[who];
  delete doc.chatSent[who];
  if (doc.leader === who) {
    const next = Object.entries(doc.members).sort((a, b) => a[1].joinedAt - b[1].joinedAt)[0];
    if (next) doc.leader = next[0];
  }
  return { dissolved: size(doc) < 2 };
}

export function kick(doc: PartyDoc, by: string, who: string): "ok" | "not_leader" | "not_member" | "self" {
  if (by !== doc.leader) return "not_leader";
  if (by === who) return "self";
  if (!doc.members[who]) return "not_member";
  leave(doc, who);
  return "ok";
}

export function lead(doc: PartyDoc, by: string, who: string): "ok" | "not_leader" | "not_member" {
  if (by !== doc.leader) return "not_leader";
  if (!doc.members[who]) return "not_member";
  doc.leader = who;
  return "ok";
}

/** A member's hub reports where they are (and whether they are online). */
export function memberStatus(doc: PartyDoc, who: string, status: { name?: string; online: boolean; location: string | null; body: string | null }): boolean {
  const member = doc.members[who];
  if (!member) return false;
  const next = { ...member, online: status.online, location: status.location, body: status.body, name: status.name || member.name };
  const changed = JSON.stringify(next) !== JSON.stringify(member);
  doc.members[who] = next;
  return changed;
}

/** Whether one more party chat line from `who` fits the burst limit now (and count it). */
export function takePartyChat(doc: PartyDoc, who: string, at: number): boolean {
  const recent = (doc.chatSent[who] ?? []).filter((t) => at - t < L.chatWindowMs);
  if (recent.length >= L.chatBurst) { doc.chatSent[who] = recent; return false; }
  doc.chatSent[who] = [...recent, at];
  return true;
}

/** The party bonus: another online member stands on the same map. */
export function bonusFor(doc: PartyDoc, who: string, location: string | null): boolean {
  if (!location || !doc.members[who]) return false;
  return Object.entries(doc.members).some(([id, m]) => id !== who && m.online && m.location === location);
}

export function viewOf(doc: PartyDoc, at: number): PartyView {
  pruneInvites(doc, at);
  return {
    id: doc.id,
    leader: doc.leader,
    members: Object.entries(doc.members)
      .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
      .map(([username, m]) => ({ username, name: m.name, online: m.online, location: m.location, body: m.body, joinedAt: m.joinedAt })),
    invited: Object.keys(doc.invited),
  };
}
