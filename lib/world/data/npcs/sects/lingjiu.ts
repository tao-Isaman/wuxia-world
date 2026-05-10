import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_LINGJIU: readonly NpcDef[] = [
  {
    id: "sect_lingjiu_lady_zixia",
    name: "หญิงสาวจื่อเสีย",
    description: "หญิงนักรบลิ่งจิ้วกง เคลื่อนไหวรวดเร็ว ใช้เข็มและดาบลมประกอบกัน",
    locationIds: ["sect_lingjiu"],
    dialogSceneId: "npc_sect_lingjiu_lady_zixia_talk",
    sparOpponentId: "spar_lingjiu_lady",
    sparFameReward: 6,
    tags: ["lady_warrior", "lingjiu", "sparring"],
  },
];
