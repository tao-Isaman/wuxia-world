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
        description: "รับจดหมายลับจากผู้อาวุโสจูอิงที่พรรคตะวันจันทรา",
        objective: {
          spots: [
            { locationId: "sect_ming", label: "รับจดหมายลับจากผู้อาวุโสจูอิง", npcId: "sect_ming_elder_zhuying", text: "ผู้อาวุโสจูอิงยื่นจดหมายผนึกขี้ผึ้งให้ — ห้ามให้ใครเห็นเด็ดขาด" },
          ],
        },
      },
      {
        id: "travel_palace",
        description: "เดินทางไปยังพระราชวังจงหยาง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_zhongyang" },
      },
      {
        id: "deliver_letter",
        description: "ส่งจดหมายให้สายลับในพระราชวังจงหยางอย่างลับ ๆ",
        objective: {
          spots: [
            { locationId: "palace_zhongyang", label: "ส่งจดหมายให้สายลับในวัง", text: "ขันทีผู้หนึ่งรับจดหมายไปอย่างแนบเนียนแล้วหายเข้าระเบียงวัง" },
          ],
        },
      },
      {
        id: "return_confirm",
        description: "กลับไปรายงานผู้อาวุโสจูอิง",
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
    description: "สมาชิกพรรคตะวันจันทราคนหนึ่งหนีไปซ่อนตัวที่ไม้ดำหน้าผา ผู้อาวุโสจูอิงให้เจ้าไปตามและตัดสิน — ปล่อยไป หรือนำตัวกลับมา?",
    briefSummary: "ตัดสินชะตากรรมของผู้ที่ต้องการออกจากพรรคตะวันจันทรา",
    type: "side",
    giverNpcId: "sect_ming_elder_zhuying",
    prereqs: { t: "questStatus", questId: "qst_ming_spy_mission", status: "done" },
    stages: [
      {
        id: "find_defector",
        description: "ตามหาผู้แปรพักตร์ที่ไม้ดำหน้าผา",
        objective: {
          spots: [
            { locationId: "cliff_heimu", label: "ตามหาผู้แปรพักตร์ที่ผาดำ", text: "พบชายผู้หนึ่งหลบซ่อนอยู่ในเงาผา เขายอมพูดด้วยหากไม่ถูกทำร้าย" },
          ],
        },
      },
      {
        id: "hear_story",
        description: "ฟังเรื่องราวของเขา แล้วตัดสินใจ: ปล่อยไป หรือนำตัวกลับพรรค",
        objective: {
          spots: [
            { locationId: "cliff_heimu", label: "ฟังเรื่องราวของผู้แปรพักตร์", sceneId: "qs_qst_ming_defector_decide" },
          ],
        },
      },
      {
        id: "decide",
        description: "กลับไปรายงานผู้อาวุโสจูอิงที่พรรคตะวันจันทรา",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_ming_elder_zhuying", amount: 10 },
    ],
  },
];
