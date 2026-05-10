import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_MING: readonly QuestDef[] = [
  {
    id: "qst_ming_spy_mission",
    name: "จดหมายลับแห่งพรรค",
    description: "ผู้อาวุโสจูอิงขอให้ส่งจดหมายลับไปยังสายลับในพระราชวังจงหยาง โดยไม่ให้ใครรู้",
    briefSummary: "ส่งจดหมายลับให้สายลับในพระราชวัง",
    type: "side",
    giverNpcId: "sect_ming_elder_zhuying",
    stages: [
      {
        id: "receive_letter",
        description: "รับจดหมายลับจากผู้อาวุโส",
      },
      {
        id: "travel_palace",
        description: "เดินทางไปยังพระราชวังจงหยาง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_zhongyang" },
      },
      {
        id: "deliver_letter",
        description: "ส่งจดหมายให้สายลับอย่างลับ ๆ",
      },
      {
        id: "return_confirm",
        description: "กลับรายงานผู้อาวุโส",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "sect_ming_elder_zhuying", amount: 12 },
    ],
  },

  {
    id: "qst_ming_defector_choice",
    name: "ผู้แปรพักตร์",
    description: "สมาชิกพรรคตะวันจันทราต้องการออกจากพรรค ผู้อาวุโสให้เจ้าตัดสิน — ปล่อยไปหรือนำตัวกลับมา?",
    briefSummary: "ตัดสินชะตากรรมของผู้ที่ต้องการออกจากพรรคตะวันจันทรา",
    type: "side",
    giverNpcId: "sect_ming_elder_zhuying",
    prereqs: { t: "questStatus", questId: "qst_ming_spy_mission", status: "done" },
    stages: [
      {
        id: "find_defector",
        description: "ตามหาผู้แปรพักตร์",
      },
      {
        id: "hear_story",
        description: "ฟังเรื่องราวของเขา",
      },
      {
        id: "decide",
        description: "ตัดสินใจ: ปล่อยไปหรือนำตัวกลับ",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_ming_elder_zhuying", amount: 10 },
    ],
  },
];
