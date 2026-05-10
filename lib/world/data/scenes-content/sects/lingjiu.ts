import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_LINGJIU: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_lingjiu_lady_zixia_talk",
    lines: [
      { t: "dialogue", speaker: "หญิงสาวจื่อเสีย", text: "เข็มและดาบลม — ใช้คู่กันยากกว่าที่คิด" },
      { t: "narration", text: "เธอเคลื่อนไหวอย่างเงียบ ๆ ราวกับลมพัด" },
    ],
  },
];
