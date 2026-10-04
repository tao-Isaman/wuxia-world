/**
 * The engine's skill & art text editor (วิชา), pure part: the rows, the
 * overrides draft (only changed fields), validation and the readable number
 * summaries. The React side is components/engine/skill-text-editor.tsx.
 * See docs/engine.md.
 */
import { ARTS } from "@/lib/game/data/arts";
import { SKILLS } from "@/lib/game/data/skills";
import { TIERS } from "@/lib/game/data/tiers";
import { WEAPON_FAMILY_LABEL } from "@/lib/game/data/weapons";
import { BASE_TEXT, type GameTextOverrides, type TextTable } from "@/lib/game/data/text-overrides";
import type { Art, Skill, WeaponFamily } from "@/lib/game/types";
import type { TextOverrides } from "@/lib/assets/types";

/** Longest name the in-game cards hold on one line (current longest: 31). */
export const NAME_MAX = 32;
/** Longest description the skill card / skills window shows well (current longest: 116). */
export const DESC_MAX = 140;

export type TextKind = "skill" | "art";
export const TABLE_OF: Record<TextKind, TextTable> = { skill: "skills", art: "arts" };

export interface TextRow {
  kind: TextKind;
  id: string;
  sc: string;
  ti: number;
  /** Skills only. */
  w?: WeaponFamily;
  /** Name and description before any override. */
  baseN: string;
  baseD: string;
  skill?: Skill;
  art?: Art;
}

/** Every skill and art (not the `none` placeholder), with their table text. */
export function textRows(): TextRow[] {
  const rows: TextRow[] = [];
  for (const skill of SKILLS) {
    const base = BASE_TEXT.skills.get(skill.id);
    rows.push({ kind: "skill", id: skill.id, sc: skill.sc, ti: skill.ti, w: skill.w, baseN: base?.n ?? skill.n, baseD: base?.d ?? skill.d, skill });
  }
  for (const art of ARTS) {
    if (art.id === "none") continue;
    const base = BASE_TEXT.arts.get(art.id);
    rows.push({ kind: "art", id: art.id, sc: art.sc, ti: art.ti, baseN: base?.n ?? art.n, baseD: base?.d ?? "", art });
  }
  return rows;
}

export const rowKey = (row: Pick<TextRow, "kind" | "id">) => `${row.kind}:${row.id}`;

export function emptyOverrides(): TextOverrides { return { version: 1, skills: {}, arts: {} }; }

/** The name and description a row shows with the draft. */
export function rowText(row: TextRow, draft: GameTextOverrides | TextOverrides): { n: string; d: string } {
  const o = draft[TABLE_OF[row.kind]][row.id];
  return { n: o?.n ?? row.baseN, d: o?.d ?? row.baseD };
}

/** Set one field; a value equal to the table's drops the override. Returns a new draft. */
export function setRowText(draft: TextOverrides, row: TextRow, field: "n" | "d", value: string): TextOverrides {
  const table = TABLE_OF[row.kind];
  const entry = { ...draft[table][row.id] };
  const base = field === "n" ? row.baseN : row.baseD;
  if (value === base) delete entry[field]; else entry[field] = value;
  const rows = { ...draft[table] };
  if (entry.n === undefined && entry.d === undefined) delete rows[row.id]; else rows[row.id] = entry;
  return { ...draft, [table]: rows };
}

/** Back to the table's text. */
export function resetRow(draft: TextOverrides, row: TextRow): TextOverrides {
  const table = TABLE_OF[row.kind];
  const rows = { ...draft[table] };
  delete rows[row.id];
  return { ...draft, [table]: rows };
}

export function isEdited(draft: TextOverrides, row: TextRow): boolean {
  return Object.prototype.hasOwnProperty.call(draft[TABLE_OF[row.kind]], row.id);
}

/**
 * The file to save: only known ids, only fields that differ from the table,
 * names trimmed; sorted by id so diffs stay small.
 */
export function overridesToSave(draft: TextOverrides, rows: readonly TextRow[]): TextOverrides {
  const out = emptyOverrides();
  const byKey = new Map(rows.map((row) => [rowKey(row), row]));
  for (const kind of ["skill", "art"] as const) {
    const table = TABLE_OF[kind];
    for (const id of Object.keys(draft[table]).sort()) {
      const row = byKey.get(`${kind}:${id}`);
      if (!row) continue;
      const o = draft[table][id];
      const entry: { n?: string; d?: string } = {};
      const n = o.n?.trim();
      if (n && n !== row.baseN) entry.n = n;
      if (typeof o.d === "string" && o.d !== row.baseD) entry.d = o.d;
      if (entry.n !== undefined || entry.d !== undefined) out[table][id] = entry;
    }
  }
  return out;
}

export function sameOverrides(a: TextOverrides, b: TextOverrides): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─── Validation ─────────────────────────────────────────────────────────

export interface TextIssue { level: "error" | "warning"; field: "n" | "d"; message: string }

/** A quest's text and the moves it rewards (lib/engine/quest-text.ts builds these). */
export interface QuestText {
  id: string;
  name: string;
  /** Name, description and brief summary. */
  texts: string[];
  skills: string[];
  arts: string[];
}

/**
 * Problems per row key: an empty or over-long name, a name shared with
 * another move (an error when an edit made it, a warning when the table
 * already had it), an over-long description, and a quest that teaches the
 * move and names it (test:story fails on that: quests say วิชาลึกลับ).
 */
export function validateTextRows(rows: readonly TextRow[], draft: TextOverrides, quests: readonly QuestText[] = []): Map<string, TextIssue[]> {
  const issues = new Map<string, TextIssue[]>();
  const add = (row: TextRow, issue: TextIssue) => {
    const key = rowKey(row);
    issues.set(key, [...(issues.get(key) ?? []), issue]);
  };
  const byName = new Map<string, TextRow[]>();
  for (const row of rows) {
    const { n } = rowText(row, draft);
    const name = n.trim();
    byName.set(name, [...(byName.get(name) ?? []), row]);
  }
  for (const row of rows) {
    const { n, d } = rowText(row, draft);
    const name = n.trim();
    const edited = name !== row.baseN;
    if (!name) add(row, { level: "error", field: "n", message: "ชื่อว่างไม่ได้" });
    else if (name.length > NAME_MAX) add(row, { level: "error", field: "n", message: `ชื่อยาวเกิน ${NAME_MAX} ตัวอักษร` });
    if (name) {
      const others = (byName.get(name) ?? []).filter((other) => other !== row);
      const sameKind = others.filter((other) => other.kind === row.kind);
      const editedClash = edited || sameKind.some((other) => rowText(other, draft).n.trim() !== other.baseN);
      if (sameKind.length) add(row, { level: editedClash ? "error" : "warning", field: "n", message: `ชื่อซ้ำกับ ${sameKind.map((o) => o.id).join(", ")}${editedClash ? "" : " (มีอยู่เดิม)"}` });
      const otherKind = others.filter((other) => other.kind !== row.kind);
      if (otherKind.length) add(row, { level: "warning", field: "n", message: `ชื่อเดียวกับ${row.kind === "skill" ? "วิชาในกาย" : "วิชาฝีมือ"} ${otherKind.map((o) => o.id).join(", ")}` });
    }
    if (d.length > DESC_MAX) add(row, { level: "error", field: "d", message: `คำบรรยายยาวเกิน ${DESC_MAX} ตัวอักษร (${d.length})` });
    if (row.kind === "skill" && !d.trim()) add(row, { level: "warning", field: "d", message: "ไม่มีคำบรรยาย" });
    if (name) {
      const naming = quests.filter((q) => (row.kind === "skill" ? q.skills : q.arts).includes(row.id) && q.texts.some((text) => text.includes(name)));
      if (naming.length) add(row, { level: "warning", field: "n", message: `เควสที่ให้วิชานี้เอ่ยชื่อ "${name}": ${naming.map((q) => q.id).join(", ")} — เควสต้องไม่บอกชื่อวิชาที่ให้ (test:story จะไม่ผ่าน)` });
    }
  }
  return issues;
}

/** Quests whose text mentions a name (all of them, reward or not). */
export function questsMentioning(name: string, quests: readonly QuestText[]): QuestText[] {
  const needle = name.trim();
  if (needle.length < 2) return [];
  return quests.filter((q) => q.texts.some((text) => text.includes(needle)));
}

export function hasErrors(issues: Map<string, TextIssue[]>): boolean {
  for (const list of issues.values()) if (list.some((issue) => issue.level === "error")) return true;
  return false;
}

// ─── Readable numbers ───────────────────────────────────────────────────

const stats = (st: Record<string, number | undefined>) => Object.entries(st).filter(([, v]) => v).map(([k, v]) => `${k}+${v}`).join(" ");

/** A skill's numbers in short Thai. */
export function skillNumbers(skill: Skill): string {
  const parts = [
    `ขั้น${TIERS[skill.ti]?.n ?? skill.ti}`,
    WEAPON_FAMILY_LABEL[skill.w],
    skill.at === "phy" ? "ทางกาย" : skill.at === "int" ? "ทางใน" : "ไม่โจมตี",
  ];
  if (skill.at) parts.push(`พลัง ${skill.bp}${skill.p ? ` +${skill.p}%` : ""}${skill.f ? ` +${skill.f}` : ""}${skill.dm !== 1 ? ` ×${skill.dm}` : ""}${skill.hits && skill.hits > 1 ? ` · ${skill.hits} ครั้ง` : ""}`);
  if (skill.dr) parts.push(`ดูดเลือด ${skill.dr}%`);
  parts.push(`ฝีมือ +${skill.mg}`);
  const st = stats(skill.st);
  if (st) parts.push(`โบนัส ${st}`);
  if (skill.se) parts.push(`ตัวเอง: ${skill.se.t}`);
  if (skill.ee) parts.push(`ศัตรู: ${skill.ee.t}`);
  return parts.join(" · ");
}

/** An art's numbers in short Thai. */
export function artNumbers(art: Art): string {
  const parts = [`ขั้น${TIERS[art.ti]?.n ?? art.ti}`];
  if (art.tp) parts.push(art.tp);
  parts.push(`HP +${art.hL}/ขั้น`, `MP +${art.mL}/ขั้น`);
  const st = stats(art.stats);
  if (st) parts.push(`พลัง ${st} (×ขั้น/10)`);
  if (art.act) parts.push(`ออกพลัง ${art.act.n} (MP ${art.act.c} · CD ${art.act.cd})`);
  if (art.pas) parts.push(`ติดตัว ${art.pas.ch}%`);
  return parts.join(" · ");
}

// ─── Filters ────────────────────────────────────────────────────────────

export interface TextFilter {
  kind?: TextKind | "";
  sect?: string;
  tier?: number | "";
  weapon?: WeaponFamily | "";
  text?: string;
  editedOnly?: boolean;
  issuesOnly?: boolean;
}

export function filterTextRows(rows: readonly TextRow[], filter: TextFilter, draft: TextOverrides, issues?: Map<string, TextIssue[]>): TextRow[] {
  const text = filter.text?.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter.kind && row.kind !== filter.kind) return false;
    if (filter.sect && row.sc !== filter.sect) return false;
    if (filter.tier !== undefined && filter.tier !== "" && row.ti !== filter.tier) return false;
    if (filter.weapon && row.w !== filter.weapon) return false;
    if (filter.editedOnly && !isEdited(draft, row)) return false;
    if (filter.issuesOnly && !issues?.get(rowKey(row))?.length) return false;
    if (text) {
      const { n, d } = rowText(row, draft);
      if (![row.id, n, d, row.baseN].some((value) => value.toLowerCase().includes(text))) return false;
    }
    return true;
  });
}
