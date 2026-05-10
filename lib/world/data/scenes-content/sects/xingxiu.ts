import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_XINGXIU: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_xingxiu_disciple_dushou_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์ตู๋โซ่ว", text: "พิษไม่ใช่การโกง — มันคือศิลปะ" },
      { t: "narration", text: "เข็มเล็ก ๆ ในมือเขาแวววาวด้วยของเหลวสีเขียว" },
    ],
  },
];
