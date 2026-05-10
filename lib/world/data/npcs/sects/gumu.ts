import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_GUMU: readonly NpcDef[] = [
  {
    id: "sect_gumu_disciple_lengyue",
    name: "ศิษย์เลิ่งเยว่",
    description: "สาวกสุสานโบราณ ใช้กระบี่เย็นและคัมภีร์สาวหยกเป็นทางออกของฝีมือ",
    locationIds: ["sect_gumu"],
    dialogSceneId: "npc_sect_gumu_disciple_lengyue_talk",
    sparOpponentId: "spar_gumu_disciple",
    sparFameReward: 8,
    tags: ["disciple", "swordswoman", "gumu", "sparring"],
  },

  {
    id: "sect_gumu_mystery_woman",
    name: "หญิงปริศนาในสุสาน",
    description: "หญิงผู้สวมชุดขาวบริสุทธิ์ในสุสานโบราณ · ดวงตาเย็นเฉียบดั่งน้ำแข็ง · ฝีมือเหนือคำบรรยาย เกินกว่าอาจารย์ของพรรคใด ๆ ในยุทธจักร · ปรากฏเฉพาะแก่ผู้ที่เดินทางตามวิชาสุริยันต์มาถึงปลายเส้น",
    locationIds: ["sect_gumu"],
    dialogSceneId: "npc_sect_gumu_mystery_woman_talk",
    sparOpponentId: "spar_gumu_mystery_woman",
    sparFameReward: 22,
    questIds: [
      "qst_gumu_disciple_intro",
      "qst_gumu_sect_lonely",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 5 },
      { itemId: "snow_lotus", weight: 4 },
      { itemId: "jade", weight: 5 },
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "wood_sacred", weight: 3 },
      { itemId: "mithril_ore", weight: 2 },
    ],
    tags: ["sect_master", "mystery", "gumu", "secret"],
  },
];
