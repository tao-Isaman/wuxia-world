"use client";

// Another player's card (tap them on the map, or their name in the chat or
// the สหาย window): whisper, befriend, invite to the party, write, block.
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useSocialStore } from "@/store/social-store";
import { confirmDialog } from "@/store/confirm-store";
import { act, placeName } from "./friends-popup";

export function PlayerCard() {
  const card = useSocialStore((s) => s.card);
  const friend = useSocialStore((s) => s.friends.find((f) => f.username === s.card?.username) ?? null);
  const asked = useSocialStore((s) => s.requestsOut.some((r) => r.username === s.card?.username));
  const askedMe = useSocialStore((s) => s.requestsIn.some((r) => r.username === s.card?.username));
  const blocked = useSocialStore((s) => s.blocked.some((b) => b.username === s.card?.username));
  const inParty = useSocialStore((s) => !!s.party?.members.some((m) => m.username === s.card?.username));
  const me = useSocialStore((s) => s.me.username);
  const store = useSocialStore.getState();
  if (!card || card.username === me) return null;
  const close = () => store.showCard(null);
  const name = card.name || card.username;

  return (
    <Modal open onClose={close} title={name} maxWidth="max-w-sm">
      <div className="player-card" data-testid="player-card" data-player={card.username}>
        <p className="text-sm">
          <b>{name}</b> <small className="text-muted-foreground">@{card.username}</small>
        </p>
        {friend && (
          <p className="text-[12px] text-muted-foreground">
            สหาย · {friend.online ? (placeName(friend.location) ?? "ออนไลน์") : "ออฟไลน์"}
          </p>
        )}
        {inParty && <p className="text-[12px] text-muted-foreground">อยู่ในคณะเดียวกัน</p>}
        <div className="player-card-actions">
          <Button size="sm" disabled={blocked} data-testid="card-whisper" onClick={() => store.whisper(card)}>กระซิบ</Button>
          {!friend && (
            askedMe
              ? <Button size="sm" disabled={blocked} onClick={() => void act(() => store.acceptFriend(card.username), "เป็นสหายแล้ว")}>รับเป็นสหาย</Button>
              : <Button size="sm" disabled={blocked || asked} data-testid="card-befriend"
                  onClick={() => void act(() => store.requestFriend(card.username), "ส่งคำขอเป็นสหายแล้ว")}>{asked ? "ขอเป็นสหายแล้ว" : "เพิ่มสหาย"}</Button>
          )}
          {!inParty && <Button size="sm" disabled={blocked} data-testid="card-invite"
            onClick={() => void act(() => store.inviteToParty(card.username), "ส่งคำเชิญเข้าคณะแล้ว")}>ชวนเข้าคณะ</Button>}
          <Button size="sm" disabled={blocked} data-testid="card-mail" onClick={() => store.writeTo(card.username)}>เขียนจดหมาย</Button>
          {blocked
            ? <Button size="sm" variant="ghost" onClick={() => void act(() => store.unblock(card.username))}>เลิกบล็อก</Button>
            : <Button size="sm" variant="ghost" className="text-destructive" data-testid="card-block" onClick={async () => {
                if (await confirmDialog({ title: "บล็อก", message: `บล็อก ${name}? จะไม่เห็นข้อความ คำขอ คำเชิญ และจดหมายจากผู้นี้`, confirmText: "บล็อก", variant: "warn" })) {
                  if (await act(() => store.block(card), "บล็อกแล้ว")) close();
                }
              }}>บล็อก</Button>}
        </div>
      </div>
    </Modal>
  );
}
