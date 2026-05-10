import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_SONGSHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_songshan_disciple_lifeng_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์หลี่เฟิง", text: "เด็กหนุ่มซงซานต้องวัดฝีมือเพื่อก้าวหน้า มาช่วยข้าหน่อย" },
      { t: "narration", text: "เขาย่อตัวลงในท่ามาตรฐานของซงซาน" },
    ],
  },
];
