import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_SONGSHAN: readonly NpcDef[] = [
  {
    id: "sect_songshan_disciple_lifeng",
    name: "ศิษย์หลี่เฟิง",
    description: "เด็กหนุ่มแห่งซงซาน ฝึกฝีมือด้วยใจเด็ดเดี่ยว มาท้าประลองกับผู้แสวงหา",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_disciple_lifeng_talk",
    sparOpponentId: "spar_songshan_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "songshan", "sparring"],
  },
];
