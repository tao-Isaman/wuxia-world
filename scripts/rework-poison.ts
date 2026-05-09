// One-shot poison-rework. Converts the 3 jianghu (sc:"ยุทธจักร") +
// 3 Tang (sc:"สำนักสุลถัง") poison skills from the legacy
// `debuff_poison` / `heavy_poison` enemy effects to the new clean
// `poison_dmg` (pure HP DoT, no Eva/Acc bundled). Stronger pp values
// since poison sacrifices side debuffs for raw HP pressure.
//
// Run: `bun scripts/rework-poison.ts`

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const META_DIR = (import.meta as unknown as { dir: string }).dir;
const FILE = path.resolve(META_DIR, "..", "lib/game/data/skills.ts");

interface Rework {
  id: string;
  n: string; // unique Thai display name (used to find the skill — id can
             // be corrupted by an earlier run since the previous regex
             // accidentally matched `id:` instead of `d:`)
  pp: number;
  u: number;
  desc: string; // new description
}

const REWORKS: Rework[] = [
  // Jianghu — human poison weapons
  { id: "pn", n: "เข็มพิษ", pp: 6, u: 5, desc: "พิษ 6%HP/ตา (5ตา) — เข็มพิษเย็นเฉียบ" },
  { id: "nf4", n: "ฝ่ามือยมฑูต", pp: 12, u: 5, desc: "Phy + พิษ 12%HP/ตา (5ตา) — ฝ่ามือยมฑูตอาบพิษ" },
  { id: "ng6", n: "ขลุ่ยพลิกโลก", pp: 16, u: 5, desc: "Int×125% + พิษ 16%HP/ตา (5ตา) — ขลุ่ยพลิกโลกหลอนพิษ" },
  // Tang sect skills
  { id: "tang_poison_knife", n: "มีดบินเคลือบพิษ", pp: 6, u: 5, desc: "Phy×110% · ปามีด 2 ครั้ง + พิษ 6%HP/ตา (5ตา) — มีดเคลือบพิษ" },
  { id: "tang_viperblade", n: "มีดสั้นร้อยอสรพิษ", pp: 12, u: 5, desc: "Phy×125%×1.15 · ตี 3 ครั้ง + พิษ 12%HP/ตา (5ตา) — มีดสั้นร้อยอสรพิษ" },
  { id: "tang_heartpierce", n: "มีดสั้นทะลวงใจ", pp: 16, u: 5, desc: "Phy×130%×1.2 + ATK+12% (≤3 ซ้อน) + พิษ 16%HP/ตา (5ตา) — มีดสั้นทะลวงใจ ลอบฆ่าด้วยพิษ" },
];

const src = readFileSync(FILE, "utf8");
const lines = src.split("\n");
let changed = 0;

// Field replacers using ", " as the right-side delimiter so we can be
// strict about which field we're targeting (avoids the `id:` / `d:`
// suffix collision the previous version had).
function setField(line: string, fieldStartPattern: RegExp, newAssignment: string): string {
  return line.replace(fieldStartPattern, newAssignment);
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]!;
  for (const r of REWORKS) {
    // Locate the entry by its unique `n: "<thaiName>"` field — id may
    // be corrupted, n is not.
    if (!line.includes(`n: "${r.n}"`)) continue;
    let newLine = line;
    // Restore `id` field (in case it was corrupted by the earlier bad run).
    newLine = setField(newLine, /\{ id:\s*"[^"]*"/, `{ id: "${r.id}"`);
    // Set `d:` description — use lookbehind for `, ` to avoid matching `id:`.
    newLine = setField(newLine, /, d:\s*"[^"]*"/, `, d: "${r.desc}"`);
    // Set `ee:` to new poison_dmg form.
    newLine = setField(newLine, /ee:\s*\{[^}]+\}/, `ee: { t: "poison_dmg", pp: ${r.pp}, u: ${r.u} }`);
    if (newLine !== line) {
      lines[i] = newLine;
      changed++;
      console.log(`[poison] ${r.id} → poison_dmg pp=${r.pp}`);
    }
  }
}

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log(`[poison] Done — ${changed} skills reworked.`);
