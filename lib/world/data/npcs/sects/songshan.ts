import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_SONGSHAN: readonly NpcDef[] = [
  {
    id: "sect_songshan_master_zuolengchan",
    name: "อาจารย์ใหญ่จั่วเหลิงฉาน",
    description: "อาจารย์ใหญ่แห่งซงซาน · ผู้ปกครองศาสตร์ดาบยอดเขากลาง · ผู้คนเรียกขานว่า \"ดาบเหล็กเย็นแห่งซงซาน\" · ใจเย็นแต่หนักแน่น มืออาชีพในการปกครอง",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_master_zuolengchan_talk",
    sparOpponentId: "spar_songshan_master_zuolengchan",
    sparFameReward: 12,
    questIds: [
      "qst_songshan_disciple_intro",
      "qst_songshan_sect_patrol",
      "qst_songshan_sect_iron",
      "qst_songshan_sect_wooden",
      "qst_songshan_art_pillar",
      "qst_songshan_redemption",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 5 },
      { itemId: "iron_ingot", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "swordsman", "songshan"],
  },

  {
    id: "sect_songshan_vice_lubai",
    name: "รองอาจารย์ลู่ไป๋",
    description: "รองอาจารย์แห่งซงซาน · มือขวาของอาจารย์จั่วเหลิงฉาน · ผู้บัญชาการห้าทวารปกติ · ดาบหนักหน่วงดั่งเสาเหล็ก",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_vice_lubai_talk",
    sparOpponentId: "spar_songshan_vice_lubai",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 4 },
      { itemId: "iron_ingot", weight: 2 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "swordsman", "songshan"],
  },

  {
    id: "sect_songshan_elder_dingmian",
    name: "อาจารย์อาวุโสติงเหมียน",
    description: "อาจารย์อาวุโสแห่งซงซาน · ผู้สอนเพลงดาบแกนหินเสาเขา · ดุดันและเข้มงวดต่อศิษย์ · นิยมประลองกับผู้กล้า",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_elder_dingmian_talk",
    sparOpponentId: "spar_songshan_elder_dingmian",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["elder", "swordsman", "songshan"],
  },

  {
    id: "sect_songshan_disciple_lifeng",
    name: "ศิษย์หลี่เฟิง",
    description: "เด็กหนุ่มแห่งซงซาน · ฝึกดาบเหล็กหนักด้วยใจเด็ดเดี่ยว · มาท้าประลองกับผู้แสวงหาฝีมือเสมอ · เชื่อว่าวันหนึ่งจะกลายเป็นห้าทวารใหญ่",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_disciple_lifeng_talk",
    sparOpponentId: "spar_songshan_disciple",
    sparFameReward: 5,
    tags: ["disciple", "swordsman", "songshan", "sparring"],
  },

  {
    id: "sect_songshan_disciple2_yangzhong",
    name: "ศิษย์หยางจง",
    description: "ศิษย์ใหม่แห่งซงซาน · ทำหน้าที่เฝ้าลานฝึกดาบ · เคารพอาจารย์อย่างที่สุด · ฝึกฝนเพลงดาบยอดเขากลางทุกวันโดยไม่ขาด",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_disciple2_yangzhong_talk",
    sparOpponentId: "spar_songshan_disciple2",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "songshan", "sparring"],
  },
];
