import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_TAISHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_taishan_disciple_kunwu_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์คุนหวู่", text: "ดาบไท่ซานสองมือไม่อายใคร อยากลองวัดฝีมือกับข้าหรือ?" },
      { t: "narration", text: "เขาวางดาบลงบนไหล่อย่างมั่นใจ" },
    ],
  },
];
