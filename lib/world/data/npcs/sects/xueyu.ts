import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_XUEYU: readonly NpcDef[] = [
  {
    id: "sect_xueyu_master_chiying",
    name: "จอมยุทธฉือยิง",
    description: "เจ้าสำนักดาบโลหิตเลือดเย็น ฝีมือใกล้เคียงดาบราชาแต่อยู่ฝ่ายอธรรม",
    locationIds: ["sect_xueyu"],
    dialogSceneId: "npc_sect_xueyu_master_chiying_talk",
    sparOpponentId: "spar_xueyu_master",
    sparFameReward: 12,
    tags: ["master", "evil_sect", "xueyu", "sparring"],
  },
];
