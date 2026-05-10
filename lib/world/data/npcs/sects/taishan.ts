import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_TAISHAN: readonly NpcDef[] = [
  {
    id: "sect_taishan_disciple_kunwu",
    name: "ศิษย์คุนหวู่",
    description: "ลูกศิษย์ดาบไท่ซานวัยกลาง ใจกล้า ใช้ดาบยาวสองมือเป็นอาวุธคู่หู",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_disciple_kunwu_talk",
    sparOpponentId: "spar_taishan_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "taishan", "sparring"],
  },
];
