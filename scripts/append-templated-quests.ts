// Append the templated quests (redemption + 3rd-quest backfill) as
// plain expanded entries into the per-sect quest files. Runs once
// after split-sects-file.ts to recover the .map()-generated content
// the splitter couldn't parse.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const META_DIR = (import.meta as unknown as { dir: string }).dir;
const ROOT = path.resolve(META_DIR, "..");

const SECT_DISPLAY: Record<string, string> = {
  shaolin: "เส้าหลิน",
  wudang: "อู่ตัง",
  huashan: "หัวซาน",
  quanzhen: "ฉวนเจิน",
  emei: "ง้อไบ๊",
  gumu: "สุสานโบราณ",
  beggars: "พรรคยาจก",
  jinyiwei: "องครักษ์เสื้อแพร",
  sunmoon: "พรรคตะวันจันทรา",
  tang: "สำนักสุลถัง",
};
const ITEM_DISPLAY: Record<string, string> = {
  wood_hard: "ไม้แข็ง",
  lotus_seed: "เม็ดบัว",
  rice_dish: "ข้าวห่อ",
  paper: "กระดาษ",
  viper_venom: "พิษงู",
};

// 10 redemption quests — one per joinable sect.
const REDEMPTIONS: Array<[string, string, string, string]> = [
  ["shaolin",   "sect_shaolin_abbot_huiyuan",     "เส้าหลิน",          "ginseng"],
  ["wudang",    "sect_wudang_master_qingxu",      "อู่ตัง",            "snow_lotus"],
  ["huashan",   "sect_huashan_master_yiqing",     "หัวซาน",           "iron_ore"],
  ["quanzhen",  "sect_quanzhen_master_chongyang", "ฉวนเจิน",           "paper"],
  ["emei",      "sect_emei_abbess_jingchan",      "ง้อไบ๊",            "lotus_seed"],
  ["gumu",      "sect_gumu_mystery_woman",        "สุสานโบราณ",        "snow_lotus"],
  ["beggars",   "sect_beggars_chief_hongtian",    "พรรคยาจก",         "rice_dish"],
  ["jinyiwei",  "sect_jinyiwei_leader_zhao",      "องครักษ์เสื้อแพร",  "iron_ingot"],
  ["sunmoon",   "sect_sunmoon_chief_dongfang",    "พรรคตะวันจันทรา",   "ancient_coin"],
  ["tang",      "sect_tang_chief_tangmen",        "สำนักสุลถัง",       "centipede_venom"],
];

// 9 backfill 3rd-sect quests — one per non-Shaolin sect (Shaolin already had 3).
const BACKFILLS: Array<[string, string, string, string, string, number]> = [
  ["wudang",   "sect_wudang_master_qingxu",      "ทำความสะอาดศาลา",      "kindling",   "wood_hard",  4],
  ["huashan",  "sect_huashan_master_yiqing",     "ส่งไม้ให้โรงดาบ",        "wooden",     "wood_hard",  5],
  ["quanzhen", "sect_quanzhen_master_chongyang", "ลาดตระเวนภูเขา",        "patrol2",    "thug",       3],
  ["emei",     "sect_emei_abbess_jingchan",      "ส่งเม็ดบัวให้แม่ชี",     "lotus",      "lotus_seed", 6],
  ["gumu",     "sect_gumu_mystery_woman",        "ลาดตระเวนสุสาน",        "patrol2",    "thug",       2],
  ["beggars",  "sect_beggars_chief_hongtian",    "เก็บข้าวห่อให้คนยาก",    "rice2",      "rice_dish",  6],
  ["jinyiwei", "sect_jinyiwei_leader_zhao",      "ส่งกระดาษให้กรม",        "scroll",     "paper",      6],
  ["sunmoon",  "sect_sunmoon_chief_dongfang",    "ลาดตระเวนยอดเขา",       "patrol2",    "thug",       3],
  ["tang",     "sect_tang_chief_tangmen",        "เก็บพิษเพิ่ม",            "venom2",    "viper_venom", 6],
];

function jsonRedemption(sectId: string, npcId: string, sectName: string, gatherItem: string): string {
  const desc = `เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนัก${sectName}ทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น "ลาออก" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง`;
  return `  {
    id: "qst_${sectId}_redemption",
    name: "ไถ่บาปต่อ${sectName}",
    description: ${JSON.stringify(desc)},
    briefSummary: "ไถ่บาปต่อ${sectName} — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "${sectId}",
    giverNpcId: "${npcId}",
    prereqs: { t: "sectStatus", sectId: "${sectId}", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — ${gatherItem} 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "${gatherItem}", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนัก${sectName}" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "${sectId}" },
      { t: "npcRelationship", npcId: "${npcId}", amount: 10 },
    ],
  }`;
}

function jsonBackfill(sectId: string, npcId: string, name: string, slug: string, item: string, count: number): string {
  const isKill = item === "thug";
  const itemDisplay = ITEM_DISPLAY[item] ?? item;
  const desc = isKill
    ? `ภารกิจประจำของศิษย์${SECT_DISPLAY[sectId]} — ปราบโจร ${count} คน`
    : `ภารกิจประจำของศิษย์${SECT_DISPLAY[sectId]} — เก็บ${itemDisplay} ${count} ชิ้น`;
  const brief = isKill ? `ปราบโจร ${count} คน · sect points +50` : `ส่ง${itemDisplay} ${count} ชิ้น · sect points +50`;
  const stageDesc = isKill ? `ปราบโจรเร่ร่อน ${count} คน` : `เก็บ${itemDisplay} ${count} ชิ้น`;
  const auto = isKill
    ? `{ t: "defeatedOpponent", opponentId: "thug", count: ${count} }`
    : `{ t: "hasItem", itemId: "${item}", count: ${count} }`;
  return `  {
    id: "qst_${sectId}_sect_${slug}",
    name: "${name}",
    description: ${JSON.stringify(desc)},
    briefSummary: "${brief}",
    type: "side",
    sectId: "${sectId}",
    giverNpcId: "${npcId}",
    prereqs: { t: "sectMember", sectId: "${sectId}" },
    stages: [
      { id: "main", description: "${stageDesc}", autoAdvance: ${auto} },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "${npcId}", amount: 3 },
      { t: "sectPoints", sectId: "${sectId}", amount: 50 },
    ],
  }`;
}

// One extra gumu sect quest (the manual one I had inline).
const GUMU_EXTRA = `  {
    id: "qst_gumu_sect_offering",
    name: "ส่งของถวายสุสาน",
    description: "หญิงปริศนาขอให้นำเหล็กดิบและกระดาษมาเพิ่ม — สำหรับซ่อมแซมห้องลึก",
    briefSummary: "ส่งเหล็กดิบ 4 + กระดาษ 4 · sect points +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "gather", description: "เก็บเหล็กดิบ 4 + กระดาษ 4", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "iron_ore", count: 4 }, { t: "hasItem", itemId: "paper", count: 4 }] } },
      { id: "deliver", description: "ส่งของให้หญิงปริศนา" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 3 },
      { t: "sectPoints", sectId: "gumu", amount: 50 },
    ],
  }`;

// Append generated content to each sect file (insert just before the closing `];`).
function appendToSectFile(sectId: string, addEntries: string[]): void {
  const file = path.join(ROOT, `lib/world/data/quests/sects/${sectId}.ts`);
  const src = readFileSync(file, "utf8");
  const closeIdx = src.lastIndexOf("];");
  if (closeIdx < 0) throw new Error(`no array close in ${file}`);
  const before = src.slice(0, closeIdx);
  const after = src.slice(closeIdx);
  const insert = "\n" + addEntries.map((e) => e + ",").join("\n\n") + "\n";
  writeFileSync(file, before + insert + after, "utf8");
  console.log(`[append] ${sectId}: +${addEntries.length} entries`);
}

// Group templated entries by target sect.
const bySect = new Map<string, string[]>();
function add(sect: string, entry: string) {
  const list = bySect.get(sect) ?? [];
  list.push(entry);
  bySect.set(sect, list);
}

for (const [sectId, npcId, sectName, gatherItem] of REDEMPTIONS) {
  add(sectId, jsonRedemption(sectId, npcId, sectName, gatherItem));
}
for (const [sectId, npcId, name, slug, item, count] of BACKFILLS) {
  add(sectId, jsonBackfill(sectId, npcId, name, slug, item, count));
}
add("gumu", GUMU_EXTRA);

for (const [sect, entries] of bySect) {
  appendToSectFile(sect, entries);
}
console.log("[append] Done.");
