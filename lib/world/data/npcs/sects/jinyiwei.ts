import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_JINYIWEI: readonly NpcDef[] = [
  {
    id: "sect_jinyiwei_leader_zhao",
    name: "ผู้บัญชาการจ้าวฝู่",
    description: "ผู้บัญชาการกรมองครักษ์เสื้อแพร · มือขวาขององค์จักรพรรดิ · ฝีมือเทียบเท่าตำนานยุทธจักร · ผู้สืบทอดดาบประหารชีพและพลังประหารเทพ · ดวงตาคมราวดาบ พูดน้อยแต่หนัก",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_leader_zhao_talk",
    sparOpponentId: "spar_jinyiwei_leader",
    sparFameReward: 18,
    questIds: [
      "qst_jinyiwei_disciple_intro",
      "qst_jinyiwei_sect_patrol",
      "qst_jinyiwei_sect_arms",
      "qst_jinyiwei_art_godslayer",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 5 },
      { itemId: "jade", weight: 3 },
      { itemId: "jade_amulet", weight: 2 },
      { itemId: "potion_big", weight: 3 },
      { itemId: "man_jy_blade_king", weight: 1 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "imperial", "jinyiwei"],
  },

  {
    id: "sect_jinyiwei_soldier_qin",
    name: "องครักษ์ฉิน",
    description: "องครักษ์ระดับสูงประจำกรม · ดาบโค้งเสมอเอว ผู้คุมการสอนรุ่นน้อง",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_soldier_qin_talk",
    sparOpponentId: "spar_jinyiwei_qin",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_blade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "man_jy_blade", weight: 1 },
    ],
    tags: ["soldier", "imperial", "jinyiwei", "blade"],
  },

  {
    id: "sect_jinyiwei_soldier_lu",
    name: "องครักษ์ลู่",
    description: "องครักษ์ผู้เชี่ยวชาญโซ่และกรงเล็บ · เคยจับโจรชายแดนได้ทั้งกองคนเดียว",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_soldier_lu_talk",
    sparOpponentId: "spar_jinyiwei_lu",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ingot", weight: 4 },
      { itemId: "leather", weight: 3 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "man_jy_chain", weight: 1 },
      { itemId: "man_jy_chainmaster", weight: 1 },
    ],
    tags: ["soldier", "imperial", "jinyiwei", "chain"],
  },
];
