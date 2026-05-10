import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_TAISHAN: readonly QuestDef[] = [
  {
    id: "qst_taishan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ไท่ซาน",
    description: "เทียนเหมินเต้าเหรินรับศิษย์ใหม่ที่ใจสะอาดและพร้อมต้อนรับแสงแรกของฟ้า — ต้องนำหยกบูชาตะวัน 3 ก้อนมาถวายเทพสุริยันบนยอดบูรพา และค่าเข้าสำนัก 500 เหรียญทอง",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งหยก 3 ก้อน เข้าเป็นศิษย์ไท่ซานขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 10 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather_offering",
        description: "เตรียมหยก 3 ก้อน (เครื่องบูชาตะวัน) + เก็บเงินให้ครบ 500 ทอง",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "jade", count: 3 },
            { t: "goldAtLeast", amount: 500 },
          ],
        },
      },
      {
        id: "return_to_master",
        description: "นำหยกและเงินค่าเข้าสำนักไปถวายเทียนเหมินเต้าเหริน",
      },
    ],
    // Gold + jade deduction happens at the complete-scene's choice
    // (addGold:-500 + takeItem jade × 3) so the player only pays when
    // they actually accept the registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 5 },
      { t: "joinSect", sectId: "taishan" },
      { t: "sectPoints", sectId: "taishan", amount: 20 },
    ],
  },

  {
    id: "qst_taishan_sect_patrol",
    name: "ลาดตระเวนเชิงเขาบูรพา",
    description: "ภารกิจประจำของศิษย์ไท่ซาน — ลาดตระเวนเชิงเขาด้านบูรพาและกำราบโจรที่บุกรุกพื้นที่สำนัก",
    briefSummary: "ปราบโจรเร่ร่อน 2 คน · sect points +50",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectMember", sectId: "taishan" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเทียนเหมินเต้าเหริน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 3 },
      { t: "sectPoints", sectId: "taishan", amount: 50 },
    ],
  },

  {
    id: "qst_taishan_sect_jade",
    name: "ส่งหยกบูชาเทพสุริยัน",
    description: "หอบูชาตะวันของไท่ซานต้องการหยกใหม่สำหรับพิธีต้อนรับแสงแรกประจำเดือน — เก็บหยกมาถวายให้ครบ",
    briefSummary: "ส่งหยก 5 ก้อน · sect points +60",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectMember", sectId: "taishan" },
    stages: [
      {
        id: "gather_jade",
        description: "เก็บหยก 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งหยกให้เทียนเหมินเต้าเหริน",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 3 },
      { t: "sectPoints", sectId: "taishan", amount: 60 },
    ],
  },

  {
    id: "qst_taishan_sect_dawn_offering",
    name: "เครื่องบูชาแสงแรก",
    description: "ภารกิจประจำของศิษย์ไท่ซาน — โรงตีกระบี่ของสำนักต้องการเหล็กดิบใหม่เพื่อหลอมกระบี่สุริยันสำหรับศิษย์รุ่นใหม่",
    briefSummary: "ส่งเหล็กดิบ 5 ก้อน · sect points +50",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectMember", sectId: "taishan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บเหล็กดิบ 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้โรงตีกระบี่ของไท่ซาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 3 },
      { t: "sectPoints", sectId: "taishan", amount: 50 },
    ],
  },

  {
    id: "qst_taishan_art_sun",
    name: "ตำราหนึ่งพลังสุริยัน",
    description: "เทียนเหมินเต้าเหรินยอมเปิดตำราหนึ่งพลังสุริยันให้ศิษย์ที่พิสูจน์ใจ — ผ่านการประลองกับหัวหน้าโจรชั้นสูงและเก็บแร่เทพสำหรับหลอมกระบี่บูชาตะวัน",
    briefSummary: "ฝึกหนึ่งพลังสุริยัน — รับ T3 art ลับของไท่ซาน",
    type: "side",
    sectId: "taishan",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "taishan" },
        { t: "sectRankAtLeast", sectId: "taishan", maxRank: 5 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_iron",
        description: "พิสูจน์ใจ — รวบรวมแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากเทียนเหมินเต้าเหริน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_tsh_sun", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "taishan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 10 },
    ],
  },

  {
    id: "qst_taishan_redemption",
    name: "ไถ่บาปต่อไท่ซาน",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เทียนเหมินเต้าเหรินทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำหยกบูชาตะวันมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อไท่ซาน — ปราบหัวหน้าโจร 5 + ส่งหยก 5 ก้อน",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectStatus", sectId: "taishan", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำหยกบูชาตะวัน — jade 5 ก้อน", autoAdvance: { t: "hasItem", itemId: "jade", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเทียนเหมินเต้าเหริน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "taishan" },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 10 },
    ],
  },
];
