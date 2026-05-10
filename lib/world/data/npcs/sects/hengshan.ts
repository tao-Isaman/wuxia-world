import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_HENGSHAN: readonly NpcDef[] = [
  {
    id: "sect_hengshan_south_disciple_yuepan",
    name: "ศิษย์เยว่ผาน",
    description: "ลูกศิษย์เฮิงซานใต้ผู้ชำนาญลีลากระบี่ห้ายอด เคลื่อนไหวเหมือนระบำ",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_disciple_yuepan_talk",
    sparOpponentId: "spar_hengshan_south_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "hengshan", "sparring"],
  },

  {
    id: "sect_hengshan_north_nun_jingxin",
    name: "นักพรตจิงซิน",
    description: "ภิกษุณีเฮิงซานเหนือผู้ฝึกดาบในขลุ่ย เสียงดนตรีกับฝีมือเป็นหนึ่งเดียว",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_nun_jingxin_talk",
    sparOpponentId: "spar_hengshan_north_nun",
    sparFameReward: 3,
    tags: ["nun", "musician", "hengshan", "sparring"],
  },
];
