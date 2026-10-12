"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PagedGrid } from "@/components/ui/paged-grid";
import { useShortScreen } from "@/components/ui/use-short-screen";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { GOLD_ICON_URL, itemIconUrl } from "@/lib/world/data/item-icons";
import { getItem } from "@/lib/world";
import { getNpc } from "@/lib/world/data/npcs";
import { LETTER_RULES, RARITY_LABEL, letterGiftLabel, type GiftRarity } from "@/lib/world/letters";
import { npcPortrait } from "@/lib/world/data/npc-portraits";
import type { Letter } from "@/lib/world/types";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";
import { mailWaiting, useSocialStore } from "@/store/social-store";
import { ComposeLetter, PlayerMail } from "@/components/world/social/player-mail";

/** A letter whose gift has not been taken yet. */
const giftWaiting = (letter: Letter) => !letter.claimed && !!(letter.gold || letter.itemId);

interface Props {
  open: boolean;
  onClose: () => void;
}

/** The letter's gift as a bag-style tile: the item's icon (glyph fallback), or gold ingots. */
function GiftIcon({ letter, size }: { letter: Letter; size?: "sm" }) {
  const item = letter.itemId ? getItem(letter.itemId) : null;
  const glyph = letter.gold ? "金" : CATEGORY_GLYPH[item?.category ?? "misc"];
  return (
    <span className={`letter-gift${size === "sm" ? " letter-gift--sm" : ""}${letter.claimed ? " letter-gift--taken" : ""}`}>
      <ItemTile glyph={glyph} icon={letter.gold ? GOLD_ICON_URL : itemIconUrl(letter.itemId)} rarity={letter.rarity} count={letter.count} label={letterGiftLabel(letter)} />
    </span>
  );
}

// จดหมาย — two landscape columns: the inbox (newest first, a gift icon and an
// unread mark on each) and the open letter. Opening one only reads it; its
// gift waits behind รับของ (or รับทั้งหมด). Letters can be thrown away, one
// or all read ones; throwing away an untaken gift asks first.
export function LettersPopup({ open, onClose }: Props) {
  const online = useSocialStore((s) => s.status !== "off");
  const composeTo = useSocialStore((s) => s.composeTo);
  const playerMail = useSocialStore((s) => mailWaiting(s));
  const [tab, setTab] = useState<"npc" | "players" | "write">("npc");
  useEffect(() => { if (composeTo) setTab("write"); }, [composeTo]);
  useEffect(() => { if (!open) useSocialStore.setState({ composeTo: null }); }, [open]);
  const shown = online ? tab : "npc";
  return (
    <Modal open={open} onClose={onClose} title="✉ จดหมาย" fill>
      {online ? (
        <div className="letters-wrap">
          <div className="menu-tabs" role="tablist" aria-label="จดหมาย">
            <button type="button" role="tab" aria-selected={shown === "npc"} onClick={() => setTab("npc")} data-testid="letters-tab-npc">จากผู้คน</button>
            <button type="button" role="tab" aria-selected={shown === "players"} onClick={() => setTab("players")} data-testid="letters-tab-players">
              จากสหาย{playerMail > 0 ? ` (${playerMail})` : ""}</button>
            <button type="button" role="tab" aria-selected={shown === "write"} onClick={() => setTab("write")} data-testid="letters-tab-write">เขียนจดหมาย</button>
          </div>
          {shown === "npc" && <NpcLetters open={open} />}
          {shown === "players" && <PlayerMail />}
          {shown === "write" && <ComposeLetter onSent={() => setTab("players")} />}
        </div>
      ) : <NpcLetters open={open} />}
    </Modal>
  );
}

/** Letters from the people of the jianghu (NPCs; kept in the save). */
function NpcLetters({ open }: { open: boolean }) {
  const letters = useWorldStore((s) => s.letters);
  const readLetter = useWorldStore((s) => s.readLetter);
  const claimLetterGift = useWorldStore((s) => s.claimLetterGift);
  const claimAllLetterGifts = useWorldStore((s) => s.claimAllLetterGifts);
  const deleteLetters = useWorldStore((s) => s.deleteLetters);
  const [reading, setReading] = useState<string | null>(null);
  const short = useShortScreen();
  useEffect(() => { if (!open) setReading(null); }, [open]);
  const list = [...letters].reverse();
  const current = letters.find((l) => l.id === reading) ?? null;
  const readIds = letters.filter((l) => l.read).map((l) => l.id);
  const waiting = letters.filter(giftWaiting).length;

  const read = (id: string) => {
    readLetter(id);
    setReading(id);
  };
  const claim = (id: string) => {
    const result = claimLetterGift(id);
    if (result.gift) toast("success", `ได้รับ ${result.gift}`);
  };
  const claimAll = () => {
    const result = claimAllLetterGifts();
    if (result.gifts.length) toast("success", `ได้รับ ${result.gifts.join(", ")}`);
  };
  const remove = async (ids: string[], what: string) => {
    const untaken = letters.filter((l) => ids.includes(l.id) && giftWaiting(l)).length;
    const warning = untaken ? `\nยังมีของแนบที่ยังไม่ได้รับ ${untaken} ชิ้น — ของจะหายไปพร้อมจดหมาย` : "";
    const ok = await confirmDialog({ title: "ลบจดหมาย", message: `${what}?${warning}`, confirmText: "ลบ", variant: "warn" });
    if (!ok) return;
    const result = deleteLetters(ids);
    if (result.deleted) toast("info", `ลบจดหมาย ${result.deleted} ฉบับ`);
    if (reading && ids.includes(reading)) setReading(null);
  };

  return (
      <div className="menu-cols letters-cols">
        <section className="menu-col" aria-label="กล่องจดหมาย">
          <div className="menu-col-head">
            <span className="menu-col-title">กล่องจดหมาย ({letters.length})</span>
            {waiting > 0 && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" data-testid="letters-claim-all" onClick={claimAll}>
                รับทั้งหมด ({waiting})
              </Button>
            )}
            {readIds.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px] text-destructive" data-testid="letters-delete-read"
                onClick={() => remove(readIds, `ลบจดหมายที่อ่านแล้ว ${readIds.length} ฉบับ`)}>ลบที่อ่านแล้ว</Button>
            )}
          </div>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="letters-empty">
              ยังไม่มีจดหมาย — มิตรสหายที่สนิทกับท่าน (ความสัมพันธ์ {LETTER_RULES.minRelationship} ขึ้นไป) อาจส่งจดหมายพร้อมของขวัญมาให้
              ยิ่งมีชื่อเสียงและโชคดี ยิ่งได้รับบ่อยและของยิ่งล้ำค่า
            </p>
          ) : (
            <div className="letters-list" data-testid="letters-list">
              <PagedGrid items={list} itemKey={(l) => l.id} cellWidth={220} cellHeight={short ? 46 : 54} gap={4} focusKey={reading} label="รายการจดหมาย"
                render={(letter) => (
                  <button type="button" onClick={() => read(letter.id)} aria-pressed={letter.id === reading}
                    className={`letters-row${letter.read ? "" : " letters-row--unread"}`}>
                    <GiftIcon letter={letter} size="sm" />
                    <span className="letters-row-text">
                      <span>{letter.read ? "" : "● "}จาก {getNpc(letter.npcId)?.name ?? "สหาย"}</span>
                      <small>วันที่ {letter.day} · {giftWaiting(letter) ? "🎁 มีของรอรับ" : letter.claimed ? `รับแล้ว · ${letterGiftLabel(letter)}` : "ไม่มีของแนบ"}</small>
                    </span>
                  </button>
                )} />
            </div>
          )}
        </section>

        <section className="menu-col menu-col--scroll" aria-label="จดหมายที่เปิด">
          {current ? (
            <div className="letter-open" data-testid="letter-open">
              <div className="letter-open-head">
                {npcPortrait(current.npcId) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={npcPortrait(current.npcId)!} alt="" className="letter-portrait" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">จาก {getNpc(current.npcId)?.name ?? "สหาย"}</div>
                  <div className="text-[11px] text-muted-foreground">วันที่ {current.day}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px] text-destructive" data-testid="letter-delete"
                  onClick={() => remove([current.id], "ลบจดหมายฉบับนี้")}>ลบ</Button>
              </div>
              <p className="letter-text">{current.text}</p>
              <div className="letter-gift-row">
                <GiftIcon letter={current} />
                <div className="min-w-0">
                  <div className="text-[12px] text-muted-foreground">ของที่แนบมา</div>
                  <strong>{letterGiftLabel(current)}</strong>{" "}
                  <Badge variant="outline" className="text-[10px]">{RARITY_LABEL[current.rarity as GiftRarity] ?? ""}</Badge>
                </div>
                {giftWaiting(current) ? (
                  <Button size="sm" className="ml-auto h-8 px-3" data-testid="letter-claim" onClick={() => claim(current.id)}>รับของ</Button>
                ) : current.claimed ? (
                  <span className="ml-auto text-[12px] text-muted-foreground" data-testid="letter-claimed">รับแล้ว</span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="bag-detail-hint text-sm">{list.length ? "เลือกจดหมายเพื่ออ่าน — กด รับของ เมื่ออยากเก็บของแนบเข้าย่าม หรือจะปล่อยไว้ก่อนก็ได้" : ""}</p>
          )}
        </section>
      </div>
  );
}
