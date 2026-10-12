"use client";

// สหาย — friends and the party (docs/design/social.md), three columns:
// friends (online first: hero name, where they are, actions; add one by
// username), requests and party invites, and the party (members, where they
// stand, the leader's tools) with the blocked list under it. Online only.
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getScene } from "@/lib/world";
import { SOCIAL_LIMITS, type PlayerRef } from "@/lib/net/social-protocol";
import { socialErrorText, useSocialStore } from "@/store/social-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";

export const placeName = (id: string | null | undefined) =>
  id ? ((getScene(id) as { name?: string } | null)?.name ?? id) : null;

const display = (p: PlayerRef) => p.name || p.username;

/** Run a social action and say how it went. */
export async function act(run: () => Promise<{ ok: boolean; error?: string }>, success?: string): Promise<boolean> {
  const result = await run();
  if (result.ok && success) toast("success", success);
  if (!result.ok) toast("warn", socialErrorText((result as { error: string }).error));
  return result.ok;
}

export function FriendsPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useSocialStore((s) => s.status);
  const me = useSocialStore((s) => s.me);
  const friends = useSocialStore((s) => s.friends);
  const requestsIn = useSocialStore((s) => s.requestsIn);
  const requestsOut = useSocialStore((s) => s.requestsOut);
  const invites = useSocialStore((s) => s.invites);
  const party = useSocialStore((s) => s.party);
  const blocked = useSocialStore((s) => s.blocked);
  const store = useSocialStore.getState();
  const [name, setName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const leader = party?.leader === me.username;

  if (status === "off") {
    return (
      <Modal open={open} onClose={onClose} title="สหาย" fill>
        <p className="text-sm text-muted-foreground" data-testid="friends-offline">ระบบสหายและคณะใช้ได้เมื่อเล่นออนไลน์ (เข้าสู่ระบบแล้วเลือกตัวละคร)</p>
      </Modal>
    );
  }

  const add = async () => {
    const ok = await act(() => store.requestFriend(name), "ส่งคำขอเป็นสหายแล้ว");
    if (ok) setName("");
  };
  const invite = async (username: string) => {
    const ok = await act(() => store.inviteToParty(username), "ส่งคำเชิญเข้าคณะแล้ว");
    if (ok) setInviteName("");
  };

  return (
    <Modal open={open} onClose={onClose} title="สหาย" fill>
      <div className="menu-cols social-cols" data-testid="friends-popup">
        <section className="menu-col menu-col--scroll" aria-label="สหาย">
          <div className="menu-col-head">
            <span className="menu-col-title">สหาย ({friends.length}/{SOCIAL_LIMITS.friends})</span>
            <small className="text-muted-foreground">ท่านคือ @{me.username}</small>
          </div>
          <form className="social-add" onSubmit={(e) => { e.preventDefault(); void add(); }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อผู้ใช้ของสหาย" maxLength={21}
              data-testid="friend-add-input" />
            <Button size="sm" type="submit" disabled={!name.trim()} data-testid="friend-add">เพิ่มสหาย</Button>
          </form>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีสหาย — แตะผู้เล่นคนอื่นบนแผนที่ หรือพิมพ์ชื่อผู้ใช้ด้านบน</p>
          ) : (
            <ul className="social-list" data-testid="friend-list">
              {friends.map((f) => (
                <li key={f.username} className="social-row" data-friend={f.username}>
                  <button type="button" className="social-who" onClick={() => store.showCard(f)}>
                    <span className={`online-dot online-dot-${f.online ? "online" : "off"}`} aria-hidden="true" />
                    <b>{display(f)}</b> <small>@{f.username}</small>
                    <small className="social-where">{f.online ? (placeName(f.location) ?? "ออนไลน์") : "ออฟไลน์"}{f.inParty ? " · อยู่ในคณะ" : ""}</small>
                  </button>
                  <div className="social-actions">
                    <Button size="sm" variant="ghost" onClick={() => { store.whisper(f); onClose(); }}>กระซิบ</Button>
                    <Button size="sm" variant="ghost" onClick={() => void invite(f.username)}>ชวนเข้าคณะ</Button>
                    <Button size="sm" variant="ghost" onClick={() => store.writeTo(f.username)}>จดหมาย</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                      if (await confirmDialog({ title: "ลบสหาย", message: `ลบ ${display(f)} ออกจากสหาย?`, confirmText: "ลบ", variant: "warn" })) {
                        void act(() => store.removeFriend(f.username));
                      }
                    }}>ลบ</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="menu-col menu-col--scroll" aria-label="คำขอและคำเชิญ">
          <div className="menu-col-head"><span className="menu-col-title">คำขอ · คำเชิญ</span></div>
          {invites.length > 0 && (
            <ul className="social-list" data-testid="party-invites">
              {invites.map((i) => (
                <li key={i.partyId} className="social-row">
                  <span className="social-who"><b>{display(i.from)}</b> ชวนท่านเข้าคณะ</span>
                  <div className="social-actions">
                    <Button size="sm" data-testid="party-accept" onClick={() => void act(() => store.acceptInvite(i.partyId), "เข้าร่วมคณะแล้ว")}>เข้าร่วม</Button>
                    <Button size="sm" variant="ghost" onClick={() => void act(() => store.declineInvite(i.partyId))}>ปฏิเสธ</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {requestsIn.length > 0 && (
            <ul className="social-list" data-testid="friend-requests">
              {requestsIn.map((r) => (
                <li key={r.username} className="social-row">
                  <span className="social-who"><b>{display(r)}</b> <small>@{r.username}</small> ขอเป็นสหาย</span>
                  <div className="social-actions">
                    <Button size="sm" data-testid="friend-accept" onClick={() => void act(() => store.acceptFriend(r.username))}>รับ</Button>
                    <Button size="sm" variant="ghost" onClick={() => void act(() => store.declineFriend(r.username))}>ปฏิเสธ</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {requestsOut.length > 0 && (
            <>
              <p className="text-[12px] text-muted-foreground">รอคำตอบ</p>
              <ul className="social-list">
                {requestsOut.map((r) => (
                  <li key={r.username} className="social-row">
                    <span className="social-who">{display(r)} <small>@{r.username}</small></span>
                    <Button size="sm" variant="ghost" onClick={() => void act(() => store.declineFriend(r.username))}>ยกเลิก</Button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!invites.length && !requestsIn.length && !requestsOut.length && <p className="text-sm text-muted-foreground">ไม่มีคำขอใหม่</p>}
        </section>

        <section className="menu-col menu-col--scroll" aria-label="คณะ">
          <div className="menu-col-head">
            <span className="menu-col-title">คณะ {party ? `(${party.members.length}/${SOCIAL_LIMITS.partySize})` : ""}</span>
            {party && <Button size="sm" variant="ghost" className="text-destructive" data-testid="party-leave"
              onClick={() => void act(() => store.leaveParty(), "ออกจากคณะแล้ว")}>ออกจากคณะ</Button>}
          </div>
          {party ? (
            <ul className="social-list" data-testid="party-members">
              {party.members.map((m) => (
                <li key={m.username} className="social-row" data-member={m.username}>
                  <span className="social-who">
                    <span className={`online-dot online-dot-${m.online ? "online" : "off"}`} aria-hidden="true" />
                    {party.leader === m.username && <span title="หัวหน้าคณะ">👑 </span>}
                    <b>{display(m)}</b>{m.username === me.username && <small> (ท่าน)</small>}
                    <small className="social-where">{m.online ? (placeName(m.location) ?? "") : "ออฟไลน์"}</small>
                  </span>
                  {leader && m.username !== me.username && (
                    <div className="social-actions">
                      <Button size="sm" variant="ghost" onClick={() => void act(() => store.makeLeader(m.username))}>ให้เป็นหัวหน้า</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void act(() => store.kick(m.username))}>เชิญออก</Button>
                    </div>
                  )}
                </li>
              ))}
              {party.invited.map((u) => <li key={u} className="social-row text-muted-foreground"><small>เชิญ @{u} แล้ว รอคำตอบ</small></li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">ร่วมเดินทางได้ถึง {SOCIAL_LIMITS.partySize} คน — ชนะศึกขณะมีสหายในคณะอยู่แผนที่เดียวกัน ได้ประสบการณ์เพิ่ม {Math.round(SOCIAL_LIMITS.partyBonus * 100)}%</p>
          )}
          {(!party || leader) && (
            <form className="social-add" onSubmit={(e) => { e.preventDefault(); void invite(inviteName.trim().replace(/^@/, "")); }}>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="ชวนด้วยชื่อผู้ใช้" maxLength={21}
                data-testid="party-invite-input" />
              <Button size="sm" type="submit" disabled={!inviteName.trim()}>ชวน</Button>
            </form>
          )}
          {blocked.length > 0 && (
            <>
              <p className="text-[12px] text-muted-foreground mt-2">บล็อกไว้</p>
              <ul className="social-list" data-testid="blocked-list">
                {blocked.map((b) => (
                  <li key={b.username} className="social-row">
                    <span className="social-who">{display(b)} <small>@{b.username}</small></span>
                    <Button size="sm" variant="ghost" onClick={() => void act(() => store.unblock(b.username))}>เลิกบล็อก</Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
