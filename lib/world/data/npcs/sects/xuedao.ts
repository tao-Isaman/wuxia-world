import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_XUEDAO: readonly NpcDef[] = [
  {
    id: "sect_xuedao_blade_xuelang",
    name: "ดาบเลือดเซียะลาง",
    description: "ดาบโลหิตผู้กระหายการต่อสู้ ดวงตาแดงทุกครั้งที่ดึงดาบยาวสีเลือดออกจากฝัก",
    locationIds: ["sect_xuedao"],
    dialogSceneId: "npc_sect_xuedao_blade_xuelang_talk",
    sparOpponentId: "spar_xuedao_blade",
    sparFameReward: 11,
    tags: ["blade", "evil_sect", "xuedao", "sparring"],
  },
];
