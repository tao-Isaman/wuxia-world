import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_WUDU: readonly NpcDef[] = [
  {
    id: "sect_wudu_miao_aman",
    name: "หมอพิษอาหมาน",
    description: "ชาวเมี่ยวพิษห้าธาตุ พกงูพิษไว้ในย่าม ฝีมือเย็นแต่ลึก",
    locationIds: ["sect_wudu"],
    dialogSceneId: "npc_sect_wudu_miao_aman_talk",
    sparOpponentId: "spar_wudu_miao",
    sparFameReward: 6,
    tags: ["miao", "venom", "wudu", "sparring"],
  },
];
