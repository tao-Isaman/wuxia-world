"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArtCard, SkillCard } from "@/components/world/skill-tooltip";
import type { TextOverrides } from "@/lib/assets/types";
import { DRAFT_KEYS, readDraft, writeDraft } from "@/lib/engine/draft";
import {
  DESC_MAX, NAME_MAX, artNumbers, filterTextRows, hasErrors, isEdited, overridesToSave, questsMentioning, resetRow, rowKey, rowText,
  sameOverrides, setRowText, skillNumbers, textRows, validateTextRows, type QuestText, type TextFilter, type TextIssue, type TextKind, type TextRow,
} from "@/lib/engine/text-edit";
import { TEXT_OVERRIDES } from "@/lib/game/data/text-overrides";
import { TIERS } from "@/lib/game/data/tiers";
import { WEAPON_FAMILY_LABEL } from "@/lib/game/data/weapons";
import type { WeaponFamily } from "@/lib/game/types";
import type { EngineSave } from "./engine-app";

const KIND_LABEL: Record<TextKind, string> = { skill: "วิชาฝีมือ", art: "วิชาในกาย" };

export function SkillTextEditor({ save }: { save: EngineSave }) {
  const rows = useMemo(() => textRows(), []);
  const [baseline, setBaseline] = useState<TextOverrides>(() => overridesToSave(TEXT_OVERRIDES, rows));
  const [draft, setDraft] = useState<TextOverrides>(baseline);
  const [loaded, setLoaded] = useState(false);
  const [quests, setQuests] = useState<QuestText[]>([]);
  const [filter, setFilter] = useState<TextFilter>({});
  const [selectedKey, setSelectedKey] = useState<string>(() => rowKey(rows[0]));
  const [saving, setSaving] = useState(false);
  const deferredText = useDeferredValue(filter.text ?? "");

  useEffect(() => {
    const saved = readDraft<TextOverrides>(DRAFT_KEYS.text);
    if (saved?.skills && saved.arts) setDraft(overridesToSave(saved, rows));
    setLoaded(true);
    let live = true;
    import("@/lib/engine/quest-text").then((m) => { if (live) setQuests(m.questTexts()); }).catch(() => undefined);
    return () => { live = false; };
  }, [rows]);

  const toSave = useMemo(() => overridesToSave(draft, rows), [draft, rows]);
  const dirty = !sameOverrides(toSave, baseline);
  useEffect(() => { if (loaded) writeDraft(DRAFT_KEYS.text, dirty ? toSave : null); }, [loaded, dirty, toSave]);

  const issues = useMemo(() => validateTextRows(rows, draft, quests), [rows, draft, quests]);
  const blocked = hasErrors(issues);
  const sects = useMemo(() => [...new Set(rows.map((r) => r.sc))], [rows]);
  const weapons = useMemo(() => [...new Set(rows.flatMap((r) => (r.w ? [r.w] : [])))] as WeaponFamily[], [rows]);
  const shown = useMemo(() => filterTextRows(rows, { ...filter, text: deferredText }, draft, issues), [rows, filter, deferredText, draft, issues]);
  const selected = rows.find((r) => rowKey(r) === selectedKey) ?? rows[0];
  const editedCount = Object.keys(toSave.skills).length + Object.keys(toSave.arts).length;

  const update = (patch: Partial<TextFilter>) => setFilter((f) => ({ ...f, ...patch }));
  const onSave = async () => {
    setSaving(true);
    try {
      const outcome = await save("textOverrides", toSave);
      if (outcome === "written") { setBaseline(toSave); writeDraft(DRAFT_KEYS.text, null); }
    } finally { setSaving(false); }
  };

  return (
    <div className="eng-skills">
      <aside className="eng-sidebar" aria-label="ตัวกรองวิชา">
        <label className="eng-field">
          <span>ค้นหา</span>
          <input type="search" placeholder="id, ชื่อ หรือคำบรรยาย" value={filter.text ?? ""} onChange={(e) => update({ text: e.target.value })} data-testid="skill-search" />
        </label>
        <label className="eng-field">
          <span>ชนิด</span>
          <select value={filter.kind ?? ""} onChange={(e) => update({ kind: e.target.value as TextKind | "" })} data-testid="skill-kind">
            <option value="">ทั้งหมด</option>
            <option value="skill">วิชาฝีมือ</option>
            <option value="art">วิชาในกาย</option>
          </select>
        </label>
        <label className="eng-field">
          <span>สำนัก</span>
          <select value={filter.sect ?? ""} onChange={(e) => update({ sect: e.target.value })} data-testid="skill-sect">
            <option value="">ทั้งหมด</option>
            {sects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="eng-field">
          <span>ขั้น</span>
          <select value={String(filter.tier ?? "")} onChange={(e) => update({ tier: e.target.value === "" ? "" : Number(e.target.value) })} data-testid="skill-tier">
            <option value="">ทั้งหมด</option>
            {TIERS.map((t, i) => <option key={t.n} value={i}>{i} · {t.n}</option>)}
          </select>
        </label>
        <label className="eng-field">
          <span>อาวุธ (วิชาฝีมือ)</span>
          <select value={filter.weapon ?? ""} onChange={(e) => update({ weapon: e.target.value as WeaponFamily | "" })} data-testid="skill-weapon">
            <option value="">ทั้งหมด</option>
            {weapons.map((w) => <option key={w} value={w}>{WEAPON_FAMILY_LABEL[w]}</option>)}
          </select>
        </label>
        <label className="eng-check"><input type="checkbox" checked={!!filter.editedOnly} onChange={(e) => update({ editedOnly: e.target.checked })} /><span>เฉพาะที่แก้ไข</span></label>
        <label className="eng-check"><input type="checkbox" checked={!!filter.issuesOnly} onChange={(e) => update({ issuesOnly: e.target.checked })} /><span>เฉพาะที่มีปัญหา</span></label>
        <div className="eng-savebox">
          {dirty
            ? <p className="eng-dirty" data-testid="text-dirty">มีการแก้ไขที่ยังไม่บันทึก</p>
            : <p className="eng-muted">ไม่มีการแก้ไขค้าง</p>}
          <p className="eng-muted">แก้ไขแล้ว {editedCount} รายการ (ในไฟล์ text-overrides.json)</p>
          {blocked && <p className="eng-error">มีข้อผิดพลาด ต้องแก้ก่อนบันทึก</p>}
          <button type="button" className="eng-btn eng-btn-primary" disabled={!dirty || blocked || saving} onClick={onSave} data-testid="text-save">
            บันทึกข้อความวิชา
          </button>
          <button type="button" className="eng-btn" disabled={!dirty} onClick={() => { if (window.confirm("ทิ้งการแก้ไขข้อความวิชาที่ยังไม่บันทึก?")) setDraft(baseline); }}>
            ทิ้งการแก้ไข
          </button>
        </div>
      </aside>

      <div className="eng-tablecol">
        <div className="eng-toolbar"><span data-testid="skill-total">{shown.length} รายการ</span></div>
        <div className="eng-tablewrap">
          <table className="eng-table" data-testid="skill-table">
            <thead>
              <tr><th aria-label="สถานะ" /><th>ชนิด</th><th>id</th><th>สำนัก</th><th>ขั้น</th><th>อาวุธ</th><th>ชื่อ</th><th>คำบรรยาย</th></tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const key = rowKey(row);
                const text = rowText(row, draft);
                const rowIssues = issues.get(key) ?? [];
                const mark = rowIssues.some((i) => i.level === "error") ? "eng-mark-error" : rowIssues.length ? "eng-mark-warn" : isEdited(draft, row) ? "eng-mark-edit" : "";
                return (
                  <tr key={key} data-row={key} aria-selected={key === selectedKey} onClick={() => setSelectedKey(key)}>
                    <td><span className={`eng-mark ${mark}`} title={rowIssues.map((i) => i.message).join("\n") || (isEdited(draft, row) ? "แก้ไขแล้ว" : "")} /></td>
                    <td>{KIND_LABEL[row.kind]}</td>
                    <td><code>{row.id}</code></td>
                    <td>{row.sc}</td>
                    <td>{TIERS[row.ti]?.n}</td>
                    <td>{row.w ? WEAPON_FAMILY_LABEL[row.w] : "—"}</td>
                    <td className="eng-td-name">{text.n}</td>
                    <td className="eng-td-desc">{text.d}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="eng-detailcol" aria-label="แก้ไขวิชา">
        {selected && <TextRowEditor key={rowKey(selected)} row={selected} draft={draft} setDraft={setDraft} issues={issues.get(rowKey(selected)) ?? []} quests={quests} />}
      </aside>
    </div>
  );
}

function TextRowEditor({ row, draft, setDraft, issues, quests }: {
  row: TextRow; draft: TextOverrides; setDraft: (update: (d: TextOverrides) => TextOverrides) => void;
  issues: TextIssue[]; quests: QuestText[];
}) {
  const { n, d } = rowText(row, draft);
  const edited = isEdited(draft, row);
  const mentions = useMemo(() => questsMentioning(n, quests), [n, quests]);
  const preview = row.skill ? <SkillCard skill={{ ...row.skill, n, d }} /> : row.art ? <ArtCard art={{ ...row.art, n, d: d || undefined }} /> : null;

  return (
    <div className="eng-detail" data-testid="skill-editor" data-row={rowKey(row)}>
      <div className="eng-detail-head">
        <h2>{n || "(ไม่มีชื่อ)"}</h2>
        <code>{row.id}</code>
        {edited && <button type="button" className="eng-link" onClick={() => setDraft((x) => resetRow(x, row))}>คืนข้อความเดิม</button>}
      </div>
      <p className="eng-muted">{KIND_LABEL[row.kind]} · {row.sc}</p>
      <div className="eng-form">
        <label className="eng-field">
          <span>ชื่อ <small>({n.length}/{NAME_MAX})</small></span>
          <input value={n} onChange={(e) => setDraft((x) => setRowText(x, row, "n", e.target.value))} data-testid="skill-name-input" />
          {n !== row.baseN && <small className="eng-muted">เดิม: {row.baseN}</small>}
        </label>
        <label className="eng-field">
          <span>คำบรรยาย <small>({d.length}/{DESC_MAX})</small></span>
          <textarea rows={3} value={d} onChange={(e) => setDraft((x) => setRowText(x, row, "d", e.target.value))} data-testid="skill-desc-input"
            placeholder={row.kind === "art" ? "วิชาในกายยังไม่มีคำบรรยายในตาราง — ใส่ได้ จะแสดงบนการ์ดวิชา" : ""} />
          {d !== row.baseD && row.baseD && <small className="eng-muted">เดิม: {row.baseD}</small>}
        </label>
      </div>
      {issues.length > 0 && (
        <ul className="eng-issues" data-testid="skill-issues">
          {issues.map((issue, i) => <li key={i} className={`eng-issue-${issue.level}`}>{issue.level === "error" ? "✖" : "⚠"} {issue.message}</li>)}
        </ul>
      )}
      <h3>ตัวอย่างในเกม</h3>
      <div className="eng-card-preview" data-testid="skill-preview">{preview}</div>
      <h3>ตัวเลข (อ่านอย่างเดียว)</h3>
      <p className="eng-numbers">{row.skill ? skillNumbers(row.skill) : row.art ? artNumbers(row.art) : ""}</p>
      <h3>เควสที่เอ่ยชื่อนี้</h3>
      {quests.length === 0 ? <p className="eng-muted">กำลังโหลดเควส…</p>
        : mentions.length === 0 ? <p className="eng-muted">ไม่มี</p>
        : <ul className="eng-mentions">{mentions.slice(0, 12).map((q) => <li key={q.id}><code>{q.id}</code> {q.name}</li>)}{mentions.length > 12 && <li>…อีก {mentions.length - 12}</li>}</ul>}
    </div>
  );
}
