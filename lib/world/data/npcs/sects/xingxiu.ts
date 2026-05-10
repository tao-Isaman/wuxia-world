import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_XINGXIU: readonly NpcDef[] = [
  {
    id: "sect_xingxiu_disciple_dushou",
    name: "ศิษย์ตู๋โซ่ว",
    description: "ลูกศิษย์ดาวดึงส์ผู้คลั่งพิษ เข็มกับการตีจุดเป็นเครื่องมือสองชิ้นโปรด",
    locationIds: ["sect_xingxiu"],
    dialogSceneId: "npc_sect_xingxiu_disciple_dushou_talk",
    sparOpponentId: "spar_xingxiu_disciple",
    sparFameReward: 6,
    tags: ["disciple", "venom", "xingxiu", "sparring"],
  },
];
