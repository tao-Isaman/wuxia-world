"use client";

// คู่มือวิชา — the skills window's guide (move-skills-popup.tsx): an
// infographic of the rules behind a move's damage and a build's stats, drawn
// with the hero's own numbers. Three cards: วิชาขัดแย้ง (the three opposing
// pairs, live tallies against the 60 % line, what shrinks and what does not),
// อาวุธในมือ (weapon match ±10 %, the weapon held) and ความชำนาญ (mastery from
// the slotted moves, up to ×1.5), then how they multiply into a hit.
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  CONFLICT_AXES,
  CONFLICT_MIN_LEARNED,
  CONFLICT_THRESHOLD,
  SKILL_TYPE_LABEL,
  WEAPON_FAMILY_LABEL,
  conflictSeverity,
  conflictTally,
  getArt,
  getMasteryMap,
  getSkill,
  type CharacterBuild,
  type SkillType,
  type WeaponFamily,
} from "@/lib/game";
import { WEAPON_MATCH_BONUS, WEAPON_MISMATCH_MALUS, heldWeaponFamily } from "@/lib/game/weapon-match";
import { getEquip } from "@/lib/game/data/equipment";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const TYPE_GLYPH: Record<SkillType, string> = { yang: "☀", yin: "☾", hard: "⛰", soft: "🌊", external: "👊", internal: "☯", balance: "⚖" };

export function SkillGuide({ open, onClose, build }: { open: boolean; onClose: () => void; build: CharacterBuild }) {
  const tally = conflictTally(build, { getSkill, getArt });
  const active = tally.entries > CONFLICT_MIN_LEARNED;
  const held = heldWeaponFamily(build);
  const weapon = getEquip(build.equipment.W);
  const mastery = getMasteryMap(build.skillIds, build.skillLevels);
  const best = Object.entries(mastery).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  const [page, setPage] = useState<"conflict" | "weapon">("conflict");

  return (
    <Modal open={open} onClose={onClose} title="📖 คู่มือวิชา" maxWidth="max-w-4xl">
      <div className="sg-tabs" role="tablist" aria-label="หัวข้อคู่มือ">
        <button type="button" role="tab" aria-selected={page === "conflict"} onClick={() => setPage("conflict")}>⚔ วิชาขัดแย้ง</button>
        <button type="button" role="tab" aria-selected={page === "weapon"} onClick={() => setPage("weapon")}>🗡 อาวุธ · ความชำนาญ · ความเสียหาย</button>
      </div>
      <div className="skill-guide" data-testid="skill-guide" data-page={page}>
        {/* ─── 1. Conflict ───────────────────────────────────────────── */}
        {page === "conflict" && <section className="sg-card sg-card--wide" aria-label="วิชาขัดแย้ง">
          <h4 className="sg-title"><span aria-hidden="true">⚔</span> วิชาขัดแย้ง</h4>
          <p className="sg-lead">
            ทุกวิชามี <b>ลักษณะ</b> อยู่บนสามคู่ตรงข้าม ถ้าเรียนเอียงไปฝั่งหนึ่ง <b>เกิน {pct(CONFLICT_THRESHOLD)}</b> ของคู่นั้น
            อีกฝั่งจะอ่อนกำลังลง — นับจาก <b>ทุกวิชาที่เรียนไว้</b> ไม่ใช่เฉพาะที่ติดตั้ง
          </p>
          <div className={`sg-gate${active ? " sg-gate--on" : ""}`} data-testid="sg-gate">
            <span className="sg-gate-count">{tally.entries}</span>
            <span>
              วิชาที่เรียนแล้ว · {active
                ? <>เกิน {CONFLICT_MIN_LEARNED} อย่าง <b>กฎขัดแย้งทำงานแล้ว</b></>
                : <>ยังไม่เกิน {CONFLICT_MIN_LEARNED} อย่าง <b>ยังไม่มีการขัดแย้ง</b></>}
            </span>
          </div>
          <div className="sg-axes">
            {CONFLICT_AXES.map(([left, right]) => {
              const a = tally.counts[left] ?? 0;
              const b = tally.counts[right] ?? 0;
              const sum = a + b;
              const share = sum ? a / sum : 0.5;
              const loser: SkillType | null = !active || !sum ? null
                : share > CONFLICT_THRESHOLD ? right : 1 - share > CONFLICT_THRESHOLD ? left : null;
              const severity = conflictSeverity(left);
              return (
                <div key={left} className="sg-axis" data-axis={`${left}-${right}`} data-loser={loser ?? ""}>
                  <div className="sg-axis-head">
                    <span className={loser === left ? "sg-lose" : ""}>{TYPE_GLYPH[left]} {SKILL_TYPE_LABEL[left]} <b>{a}</b></span>
                    <span className="sg-axis-rule">ฝั่งแพ้เหลือ ×{severity}</span>
                    <span className={loser === right ? "sg-lose" : ""}><b>{b}</b> {SKILL_TYPE_LABEL[right]} {TYPE_GLYPH[right]}</span>
                  </div>
                  <div className="sg-bar" role="img" aria-label={`${SKILL_TYPE_LABEL[left]} ${a} ต่อ ${SKILL_TYPE_LABEL[right]} ${b}`}>
                    <span className="sg-bar-left" style={{ width: `${share * 100}%` }} />
                    <span className="sg-bar-mark" style={{ left: `${(1 - CONFLICT_THRESHOLD) * 100}%` }} />
                    <span className="sg-bar-mark" style={{ left: `${CONFLICT_THRESHOLD * 100}%` }} />
                  </div>
                  <div className="sg-axis-state">
                    {!sum ? "ยังไม่มีวิชาบนคู่นี้"
                      : loser ? <>สาย<b>{SKILL_TYPE_LABEL[loser]}</b> อ่อนลงเหลือ ×{severity} ({pct(Math.max(share, 1 - share))} เอียงไปอีกฝั่ง)</>
                      : active ? <>สมดุล — ไม่มีฝั่งไหนเกิน {pct(CONFLICT_THRESHOLD)}</>
                      : <>{pct(share)} : {pct(1 - share)}</>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sg-split">
            <div className="sg-list sg-list--down">
              <h5>สิ่งที่ลดลง (วิชาฝั่งแพ้)</h5>
              <ul>
                <li>ค่าสถานะที่ท่าให้ — กำลัง ป้องกัน ร่างกาย ฯลฯ (ทุกท่าที่เรียน)</li>
                <li>ค่าสถานะ พลังชีวิต และปราณ ที่ลมปราณให้ (ทุกลมปราณที่เรียน)</li>
                <li>พลังของท่า เวลาออกท่าที่ติดตั้ง</li>
                <li>ความชำนาญอาวุธที่ท่าติดตั้งสะสมให้</li>
              </ul>
              <small>ค่าต่อสู้ที่คิดจากค่าสถานะ (พลังโจมตี ป้องกัน พลังชีวิต) จึงลดตามไปด้วย</small>
            </div>
            <div className="sg-list sg-list--keep">
              <h5>สิ่งที่ไม่ลด</h5>
              <ul>
                <li>ค่าสถานะของตัวเอง จากการฝึก</li>
                <li>ค่าจากอุปกรณ์ และชีพจร</li>
                <li>ผลพิเศษของท่า — พิษ สตัน บัฟ ดีบัฟ</li>
                <li>ท่าออกพลังและผลติดตัวของลมปราณ</li>
              </ul>
              <small>ลักษณะ “สมดุล” ไม่อยู่ฝั่งไหน แต่ยังนับเป็นวิชาที่เรียน</small>
            </div>
          </div>
        </section>}

        {page === "weapon" && <>
        {/* ─── 2. Weapon in hand ─────────────────────────────────────── */}
        <section className="sg-card" aria-label="อาวุธในมือ">
          <h4 className="sg-title"><span aria-hidden="true">🗡</span> อาวุธในมือ</h4>
          <div className="sg-held" data-testid="sg-held">
            ถืออยู่: <b>{weapon?.n ?? "มือเปล่า"}</b>
            {held && <span className="profile-chip">สาย{WEAPON_FAMILY_LABEL[held]}</span>}
          </div>
          <div className="sg-match">
            <div className="sg-match-up"><b>+{pct(WEAPON_MATCH_BONUS)}</b><span>ท่าสายเดียวกับอาวุธ</span></div>
            <div className="sg-match-down"><b>−{pct(WEAPON_MISMATCH_MALUS)}</b><span>ท่าสายอื่น</span></div>
          </div>
          <small>มือเปล่านับเป็นสายหมัด/ฝ่ามือ · ลมปราณไม่มีสาย จึงไม่ได้รับผล</small>
        </section>

        {/* ─── 3. Mastery ────────────────────────────────────────────── */}
        <section className="sg-card" aria-label="ความชำนาญอาวุธ">
          <h4 className="sg-title"><span aria-hidden="true">🎯</span> ความชำนาญอาวุธ</h4>
          <p className="sg-lead">ท่าที่ <b>ติดตั้ง</b> สะสมความชำนาญให้สายของมัน (สูงสุด 200) ท่าสายนั้นแรงขึ้นสูงสุด ×1.5 — ไม่ขึ้นกับอาวุธที่ถือ</p>
          <div className="sg-mastery">
            {(Object.keys(WEAPON_FAMILY_LABEL) as WeaponFamily[]).map((w) => {
              const v = Math.min(200, mastery[w] ?? 0);
              return (
                <div key={w} className="sg-mastery-row">
                  <span>{WEAPON_FAMILY_LABEL[w]}</span>
                  <span className="sg-mastery-bar"><span style={{ width: `${(v / 200) * 100}%` }} /></span>
                  <b>×{(1 + (v / 200) * 0.5).toFixed(2)}</b>
                </div>
              );
            })}
          </div>
          {best && <small>สูงสุดตอนนี้: สาย{WEAPON_FAMILY_LABEL[best[0] as WeaponFamily]} — ลมปราณใช้ความชำนาญสายที่สูงที่สุด</small>}
        </section>

        {/* ─── 4. How they multiply ──────────────────────────────────── */}
        <section className="sg-card sg-card--wide" aria-label="รวมเป็นความเสียหาย">
          <h4 className="sg-title"><span aria-hidden="true">💥</span> รวมเป็นความเสียหายหนึ่งครั้ง</h4>
          <div className="sg-flow">
            <span>พลังโจมตี + พลังของท่า<small>ลดได้ด้วยวิชาขัดแย้ง</small></span>
            <i aria-hidden="true">×</i>
            <span>ความชำนาญ<small>×1.0 – ×1.5</small></span>
            <i aria-hidden="true">−</i>
            <span>ป้องกันของศัตรู</span>
            <i aria-hidden="true">×</i>
            <span>อาวุธในมือ<small>×1.1 / ×0.9</small></span>
            <i aria-hidden="true">×</i>
            <span>ออปชันอุปกรณ์<small>ท่าสาย X แรงขึ้น</small></span>
          </div>
        </section>
        </>}
      </div>
    </Modal>
  );
}
