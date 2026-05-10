import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_JINYIWEI: readonly QuestDef[] = [
  {
    id: "qst_jinyiwei_disciple_intro",
    name: "ขอเข้าเป็นศิษย์องครักษ์",
    description: "ผู้บัญชาการจ้าวฝู่กำลังจับตามองทูตหลิวอิงในวังจงหยาง — เขาสงสัยว่าทูตคนนี้ขายความลับให้ฝ่ายตรงข้าม จงลักพาตัวเขามาเพื่อสอบสวน",
    briefSummary: "ลักพาตัวทูตหลิวอิงเพื่อพิสูจน์ความจงรักภักดี",
    type: "side",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 30 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "kidnap_envoy",
        description: "ลักพาตัวทูตหลิวอิงที่วังจงหยาง",
        autoAdvance: { t: "kidnappedNpc", npcId: "palace_zhongyang_envoy_liuying" },
      },
      {
        id: "report_back",
        description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 10 },
      { t: "joinSect", sectId: "jinyiwei" },
      { t: "sectPoints", sectId: "jinyiwei", amount: 30 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_patrol",
    name: "ปราบโจรในเขตหลวง",
    description: "ภารกิจประจำขององครักษ์ — กำราบโจรที่ก่อความวุ่นวายในเขตหลวง",
    briefSummary: "ปราบหัวหน้าโจร 2 คน · sect points +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "patrol",
        description: "ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_arms",
    name: "ส่งเหล็กให้โรงตีอาวุธ",
    description: "โรงตีอาวุธของกรมราชต้องการเหล็กพิเศษและเหล็กดิบเพิ่มเพื่อหลอมดาบโซ่ใหม่ — เก็บมาให้ครบ",
    briefSummary: "ส่งเหล็กดิบ 6 + เหล็กแท่ง 2 · sect points +60",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "gather",
        description: "เก็บเหล็กดิบ 6 ก้อน + เหล็กแท่ง 2 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "iron_ore", count: 6 },
            { t: "hasItem", itemId: "iron_ingot", count: 2 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้ผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 60 },
    ],
  },

  {
    id: "qst_jinyiwei_art_godslayer",
    name: "ตำราพลังประหารเทพ",
    description: "ผู้บัญชาการจ้าวฝู่ยอมเปิดตำราพลังประหารเทพให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความภักดี — เป็นวิชาลับสุดยอดของกรมราช",
    briefSummary: "ฝึกพลังประหารเทพ — รับ T4 art ลับขององครักษ์เสื้อแพร",
    type: "side",
    sectId: "jinyiwei",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "jinyiwei" },
        { t: "sectRankAtLeast", sectId: "jinyiwei", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร (bandit_chief) 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_loyalty",
        description: "พิสูจน์ความภักดี — สะสมความหยิ่ง (arrogance) ถึง 20",
        autoAdvance: { t: "trait", trait: "arrogance", min: 20 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "t4_jy_godslayer", level: 5 },
      { t: "trait", trait: "arrogance", amount: 5 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 200 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 20 },
    ],
  },

  {
    id: "qst_jinyiwei_redemption",
    name: "ไถ่บาปต่อองครักษ์เสื้อแพร",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักองครักษ์เสื้อแพรทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อองครักษ์เสื้อแพร — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectStatus", sectId: "jinyiwei", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — iron_ingot 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "iron_ingot", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักองครักษ์เสื้อแพร" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "jinyiwei" },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 10 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_scroll",
    name: "ส่งกระดาษให้กรม",
    description: "ภารกิจประจำของศิษย์องครักษ์เสื้อแพร — เก็บกระดาษ 6 ชิ้น",
    briefSummary: "ส่งกระดาษ 6 ชิ้น · sect points +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      { id: "main", description: "เก็บกระดาษ 6 ชิ้น", autoAdvance: { t: "hasItem", itemId: "paper", count: 6 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },
];
