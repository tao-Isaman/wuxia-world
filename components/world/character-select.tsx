"use client";

// Step 2 of the online flow (docs/online.md#characters-and-saves): the
// account's characters on the server. Play one, delete one, start a new one
// (the hero form in start-screen.tsx), or bring in this browser's old local
// hero once.
import { useEffect } from "react";
import type { CharacterInfo } from "@/lib/net/client";
import { getScene } from "@/lib/world";
import { SECT_MEMBERSHIPS } from "@/lib/world/data/sect-memberships";
import { rankTitle } from "@/lib/world/data/liveness-roster";
import type { SectId } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";
import { useOnlineStore } from "@/store/online-store";
import { confirmDialog } from "@/store/confirm-store";
import { toast } from "@/store/toast-store";
import { cloudErrorText, localHero, resumeLastCharacter, useCloudSession } from "@/store/cloud-session";
import { FlowSteps } from "./account-step";

const MAX_CHARACTERS = 4;

function summaryLine(c: CharacterInfo): string {
  const s = c.summary;
  if (!s) return "ยังไม่ได้ออกเดินทาง";
  const parts = [`วันที่ ${s.day.toLocaleString("th-TH")}`, `ทอง ${s.gold.toLocaleString("th-TH")}`];
  const sect = s.sect ? SECT_MEMBERSHIPS[s.sect as SectId]?.name ?? null : null;
  if (sect) parts.push(rankTitle(s.rank ?? 9, sect));
  const place = s.location ? getScene(s.location) : undefined;
  if (place && "name" in place && place.name) parts.push(String(place.name));
  return parts.join(" · ");
}

export function CharacterSelect({ onNew }: { onNew: () => void }) {
  const account = useOnlineStore((s) => s.username);
  const characters = useCloudSession((s) => s.characters);
  const phase = useCloudSession((s) => s.phase);
  const busy = useCloudSession((s) => s.busy);
  const error = useCloudSession((s) => s.error);
  const current = useCloudSession((s) => s.current);
  const enter = useCloudSession((s) => s.enter);
  const remove = useCloudSession((s) => s.remove);
  const importLocal = useCloudSession((s) => s.importLocal);
  const signOut = useCloudSession((s) => s.signOut);
  const local = typeof window === "undefined" ? null : localHero();

  // Load the list, and re-enter the character last played on this browser.
  useEffect(() => { void resumeLastCharacter(); }, []);

  const entering = phase === "entering";
  const full = (characters?.length ?? 0) >= MAX_CHARACTERS;

  return (
    <section className="hero-creation pixel-panel character-select" data-testid="character-select" aria-busy={busy || entering}>
      <FlowSteps step={2} />
      <div className="creation-heading"><span>เลือกตัวละคร</span><span className="text-[#d7bd82]">❖</span></div>
      <p className="account-line" data-testid="account-line">บัญชี <b data-testid="online-username">{account}</b>
        <button type="button" onClick={() => void signOut()} disabled={entering}>ออกจากระบบ</button></p>
      {entering && current && <p className="character-entering" role="status">กำลังโหลด {current.name}…</p>}
      {characters === null ? <p className="character-empty" role="status">กำลังโหลดรายชื่อ…</p> : (
        <ul className="character-list" data-testid="character-list">
          {characters.map((c) => (
            <li key={c.id} className="character-card" data-testid="character-card" data-character-id={c.id}>
              <div className="character-portrait" aria-hidden="true"><CharacterPreview id={c.body} /></div>
              <div className="character-info">
                <p className="character-name">{c.name}</p>
                <p className="character-meta">{summaryLine(c)}</p>
              </div>
              <div className="character-actions">
                <button type="button" className="pixel-action" data-testid="character-play" disabled={busy || entering}
                  onClick={() => void enter(c)}>เล่น</button>
                <button type="button" className="character-delete" data-testid="character-delete" disabled={busy || entering}
                  aria-label={`ลบ ${c.name}`} onClick={async () => {
                    const ok = await confirmDialog({
                      title: "ลบตัวละคร",
                      message: `ลบ "${c.name}" ถาวร? ความคืบหน้าทั้งหมดของตัวละครนี้จะหายไป กู้คืนไม่ได้`,
                      confirmText: "ลบถาวร",
                      variant: "danger",
                    });
                    if (ok && await remove(c.id)) toast("info", `ลบ ${c.name} แล้ว`);
                  }}>ลบ</button>
              </div>
            </li>
          ))}
          {characters.length === 0 && <li className="character-empty">ยังไม่มีตัวละครในบัญชีนี้</li>}
        </ul>
      )}
      {error && <p className="account-error" role="alert">{cloudErrorText(error)}</p>}
      {local && !full && (
        <button type="button" className="character-import" data-testid="character-import" disabled={busy || entering}
          onClick={async () => {
            const ok = await confirmDialog({
              title: "นำเข้าตัวละคร",
              message: `นำ "${local.name}" จากเบราว์เซอร์นี้ขึ้นเซิร์ฟเวอร์? ทองจะถูกจำกัดไว้ไม่เกิน 100,000`,
              confirmText: "นำเข้า",
            });
            if (ok && await importLocal()) toast("success", `นำเข้า ${local.name} แล้ว`);
          }}>นำเข้าตัวละครจากเครื่องนี้: <b>{local.name}</b></button>
      )}
      <button type="button" className="pixel-action start-adventure" data-testid="character-new" disabled={full || busy || entering}
        onClick={onNew}>{full ? `มีตัวละครครบ ${MAX_CHARACTERS} ตัวแล้ว` : "สร้างตัวละครใหม่"} <span aria-hidden="true">＋</span></button>
      <p className="creation-save-note">บัญชีละไม่เกิน {MAX_CHARACTERS} ตัวละคร · บันทึกอยู่บนเซิร์ฟเวอร์</p>
    </section>
  );
}
