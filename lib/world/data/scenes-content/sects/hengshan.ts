import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_HENGSHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_disciple_yuepan_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์เยว่ผาน", text: "ห้ายอดเฮิงซานเล่นกระบี่เป็นระบำ มาเต้นกันสักท่าไหม?" },
      { t: "narration", text: "เขายิ้มกว้าง ปลายกระบี่หมุนเล่นในมือ" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_nun_jingxin_talk",
    lines: [
      { t: "dialogue", speaker: "นักพรตจิงซิน", text: "ดนตรีกับดาบไม่ขัดกัน — ถ้าใจสงบ" },
      { t: "narration", text: "ขลุ่ยในมือเธอแอบบรรจุใบดาบบาง ๆ" },
    ],
  },
];
