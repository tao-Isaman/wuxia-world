import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_WUDU: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_wudu_miao_aman_talk",
    lines: [
      { t: "dialogue", speaker: "อาหมาน", text: "งูในย่ามข้าหิวมาทั้งวัน... กล้าลองมือกับข้าไหม?" },
      { t: "narration", text: "เสียงเลื้อยเบา ๆ ในย่ามทำให้ผมเจ้าตั้งชัน" },
    ],
  },
];
