import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_XUEDAO: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_xuedao_blade_xuelang_talk",
    lines: [
      { t: "dialogue", speaker: "ดาบเลือดเซียะลาง", text: "ดาบของข้ากระหายเลือด... รวมทั้งของเจ้าด้วย" },
      { t: "narration", text: "ดาบยาวสีเลือดในมือเขาดูเหมือนสั่นเล็กน้อย" },
    ],
  },
];
