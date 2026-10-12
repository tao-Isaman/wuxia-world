"use client";

// Letters between players (docs/design/social.md), in the จดหมาย window:
// จากสหาย (the server keeps them; a parcel waits behind รับของ, once) and
// เขียนจดหมาย (to a username, with gold or one stack of an item; the bag pays
// the parcel and the 10-ตำลึง postage when the letter goes).
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getItem } from "@/lib/world";
import { SOCIAL_LIMITS, type Mail, type Parcel } from "@/lib/net/social-protocol";
import { mailableItems, parcelLabel, socialErrorText, useSocialStore } from "@/store/social-store";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";

const waiting = (m: Mail) => !!m.parcel && !m.claimed;
const sender = (m: Mail) => m.from.name || `@${m.from.username}`;
const when = (at: number) => new Date(at).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function PlayerMail() {
  const mail = useSocialStore((s) => s.mail);
  const store = useSocialStore.getState();
  const [reading, setReading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = mail.find((m) => m.id === reading) ?? null;
  const readIds = mail.filter((m) => m.read && !waiting(m)).map((m) => m.id);

  const open = (id: string) => {
    setReading(id);
    void store.readMail([id]);
  };
  const claim = async (id: string) => {
    setBusy(true);
    const result = await store.claimMail(id);
    setBusy(false);
    if (result.ok) toast("success", `ได้รับ ${result.label}`);
    else toast("warn", socialErrorText(result.error));
  };
  const remove = async (ids: string[], what: string) => {
    const untaken = mail.filter((m) => ids.includes(m.id) && waiting(m) && !m.returned).length;
    const lost = mail.filter((m) => ids.includes(m.id) && waiting(m) && m.returned).length;
    const notes = [untaken ? `ของแนบที่ยังไม่ได้รับ ${untaken} ชิ้นจะถูกส่งคืนผู้ส่ง` : "", lost ? `ของที่ถูกส่งคืน ${lost} ชิ้นจะหายไป` : ""].filter(Boolean);
    if (!(await confirmDialog({ title: "ลบจดหมาย", message: `${what}?${notes.length ? `\n${notes.join("\n")}` : ""}`, confirmText: "ลบ", variant: "warn" }))) return;
    const result = await store.deleteMail(ids);
    if (!result.ok) toast("warn", socialErrorText(result.error));
    else if (reading && ids.includes(reading)) setReading(null);
  };

  return (
    <div className="menu-cols letters-cols">
      <section className="menu-col menu-col--scroll" aria-label="จดหมายจากสหาย">
        <div className="menu-col-head">
          <span className="menu-col-title">จากสหาย ({mail.length}/{SOCIAL_LIMITS.mailbox})</span>
          {readIds.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px] text-destructive"
              onClick={() => void remove(readIds, `ลบจดหมายที่อ่านแล้ว ${readIds.length} ฉบับ`)}>ลบที่อ่านแล้ว</Button>
          )}
        </div>
        {mail.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="mail-empty">ยังไม่มีจดหมายจากผู้เล่น — จดหมายเก็บไว้ 30 วัน ของที่ไม่ได้รับจะส่งคืนผู้ส่ง</p>
        ) : (
          <ul className="social-list" data-testid="mail-list">
            {mail.map((m) => (
              <li key={m.id}>
                <button type="button" className={`letters-row${m.read ? "" : " letters-row--unread"}`} aria-pressed={m.id === reading}
                  onClick={() => open(m.id)} data-mail={m.id}>
                  <span className="letters-row-text">
                    <span>{m.read ? "" : "● "}{m.returned ? "ส่งคืน · " : "จาก "}{sender(m)}</span>
                    <small>{when(m.sentAt)} · {m.parcel ? (m.claimed ? `รับแล้ว · ${parcelLabel(m.parcel)}` : `🎁 ${parcelLabel(m.parcel)}`) : "ไม่มีของแนบ"}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="menu-col menu-col--scroll" aria-label="จดหมายที่เปิด">
        {current ? (
          <div className="letter-open" data-testid="mail-open">
            <div className="letter-open-head">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{current.returned ? "พัสดุส่งคืน" : `จาก ${sender(current)}`} <small className="text-muted-foreground">@{current.from.username}</small></div>
                <div className="text-[11px] text-muted-foreground">{when(current.sentAt)}</div>
              </div>
              {!current.returned && <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" onClick={() => store.writeTo(current.from.username)}>ตอบกลับ</Button>}
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px] text-destructive" onClick={() => void remove([current.id], "ลบจดหมายฉบับนี้")}>ลบ</Button>
            </div>
            <p className="letter-text">{current.text}</p>
            {current.parcel && (
              <div className="letter-gift-row">
                <div className="min-w-0">
                  <div className="text-[12px] text-muted-foreground">ของที่แนบมา</div>
                  <strong>{parcelLabel(current.parcel)}</strong>
                </div>
                {waiting(current)
                  ? <Button size="sm" className="ml-auto h-8 px-3" disabled={busy} data-testid="mail-claim" onClick={() => void claim(current.id)}>รับของ</Button>
                  : <span className="ml-auto text-[12px] text-muted-foreground" data-testid="mail-claimed">รับแล้ว</span>}
              </div>
            )}
          </div>
        ) : (
          <p className="bag-detail-hint text-sm">{mail.length ? "เลือกจดหมายเพื่ออ่าน — กด รับของ เมื่อพร้อม" : ""}</p>
        )}
      </section>
    </div>
  );
}

export function ComposeLetter({ onSent }: { onSent: () => void }) {
  const composeTo = useSocialStore((s) => s.composeTo);
  const friends = useSocialStore((s) => s.friends);
  const gold = useWorldStore((s) => s.gold);
  const inventory = useWorldStore((s) => s.inventory);
  const [to, setTo] = useState(composeTo ?? "");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"none" | "gold" | "item">("none");
  const [amount, setAmount] = useState(100);
  const [itemId, setItemId] = useState("");
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (composeTo) setTo(composeTo); }, [composeTo]);
  const items = useMemo(() => mailableItems(inventory), [inventory]);
  const held = items.find((i) => i.id === itemId)?.count ?? 0;
  const parcel: Parcel | null = kind === "gold" ? { gold: Math.floor(amount) } : kind === "item" && itemId ? { itemId, count: Math.floor(count) } : null;
  const cost = SOCIAL_LIMITS.postage + (parcel && "gold" in parcel ? parcel.gold : 0);
  const problem = !to.trim() ? "ใส่ชื่อผู้ใช้ผู้รับ"
    : !text.trim() ? "เขียนข้อความ"
    : kind === "gold" && (!(amount >= 1) || amount > SOCIAL_LIMITS.maxParcelGold) ? `ส่งทองได้ 1–${SOCIAL_LIMITS.maxParcelGold.toLocaleString()} ตำลึง`
    : kind === "item" && (!itemId || !(count >= 1) || count > held) ? "เลือกของและจำนวนที่มี"
    : cost > gold ? "ทองไม่พอ" : null;

  const send = async () => {
    if (problem || busy) return;
    setBusy(true);
    const result = await useSocialStore.getState().sendMail(to, text, parcel);
    setBusy(false);
    if (!result.ok) { toast("warn", socialErrorText(result.error)); return; }
    toast(result.delivered ? "success" : "warn", result.delivered ? "ม้าเร็วนำจดหมายไปส่งแล้ว" : "ส่งไม่ถึงผู้รับ — พัสดุถูกส่งคืนในกล่องของท่าน");
    useSocialStore.setState({ composeTo: null });
    setText(""); setKind("none");
    onSent();
  };

  return (
    <form className="mail-compose" data-testid="mail-compose" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <label className="mail-field">
        <span>ถึง</span>
        <input list="mail-friends" value={to} onChange={(e) => setTo(e.target.value)} placeholder="ชื่อผู้ใช้" maxLength={21} data-testid="mail-to" />
        <datalist id="mail-friends">{friends.map((f) => <option key={f.username} value={f.username}>{f.name}</option>)}</datalist>
      </label>
      <label className="mail-field mail-field--text">
        <span>ข้อความ</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={SOCIAL_LIMITS.mailChars} rows={4} data-testid="mail-text" />
        <small>{[...text].length}/{SOCIAL_LIMITS.mailChars}</small>
      </label>
      <div className="mail-field">
        <span>ของแนบ</span>
        <div className="menu-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={kind === "none"} onClick={() => setKind("none")}>ไม่มี</button>
          <button type="button" role="tab" aria-selected={kind === "gold"} onClick={() => setKind("gold")} data-testid="mail-kind-gold">ทอง</button>
          <button type="button" role="tab" aria-selected={kind === "item"} onClick={() => setKind("item")} disabled={!items.length}>ของ</button>
        </div>
      </div>
      {kind === "gold" && (
        <label className="mail-field">
          <span>ตำลึง</span>
          <input type="number" min={1} max={SOCIAL_LIMITS.maxParcelGold} value={amount} onChange={(e) => setAmount(Number(e.target.value))} data-testid="mail-gold" />
        </label>
      )}
      {kind === "item" && (
        <div className="mail-field">
          <span>ของ</span>
          <select value={itemId} onChange={(e) => { setItemId(e.target.value); setCount(1); }} data-testid="mail-item">
            <option value="">— เลือก —</option>
            {items.map((i) => <option key={i.id} value={i.id}>{getItem(i.id)?.name ?? i.id} (มี {i.count})</option>)}
          </select>
          <input type="number" min={1} max={held || 1} value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="จำนวน" />
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        ค่าม้าเร็ว {SOCIAL_LIMITS.postage} ตำลึง{parcel && "gold" in parcel ? ` + ทองแนบ ${parcel.gold.toLocaleString()}` : ""} · ท่านมี {gold.toLocaleString()} ตำลึง
        · ผู้รับกดรับของเมื่อใดก็ได้ภายใน 30 วัน ไม่รับจะส่งคืน
      </p>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!!problem || busy} data-testid="mail-send">{busy ? "กำลังส่ง…" : "ส่งจดหมาย"}</Button>
        {problem && <small className="text-muted-foreground">{problem}</small>}
      </div>
    </form>
  );
}
