import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_XUEYU: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_xueyu_master_chiying_talk",
    lines: [
      { t: "dialogue", speaker: "จอมยุทธฉือยิง", text: "เจ้าสำนักดาบโลหิตยินดีรับการประลอง — ถ้าเจ้ารอดได้" },
      { t: "narration", text: "ดวงตาของเขาแดงเหมือนเลือดแห้ง รอยยิ้มเย็นลึกลับ" },
    ],
  },
];
