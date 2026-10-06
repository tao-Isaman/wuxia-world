import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_TAISHAN: readonly QuestDef[] = [
  {
    id: "qst_taishan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ไท่ซาน",
    description: "ชิงสือเต้าเหรินรับศิษย์ใหม่ที่ใจสะอาดและพร้อมต้อนรับแสงแรกของฟ้า — ต้องนำหยกบูชาตะวัน 3 ก้อนมาถวายเทพสุริยันบนยอดบูรพา และค่าเข้าสำนัก 500 เหรียญทอง",
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
        description: "นำหยกและเงินค่าเข้าสำนักไปถวายเจ้าสำนักชิงสือเต้าเหริน",
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
    briefSummary: "ปราบโจรเร่ร่อน 2 คน · แต้มสำนัก +50",
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
        description: "กลับไปรายงานเจ้าสำนักชิงสือเต้าเหริน",
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
    briefSummary: "ส่งหยก 5 ก้อน · แต้มสำนัก +60",
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
        description: "ส่งหยกให้เจ้าสำนักชิงสือเต้าเหริน",
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
    name: "เหล็กหลอมกระบี่สุริยัน",
    description: "ภารกิจประจำของศิษย์ไท่ซาน — โรงตีกระบี่ของสำนักต้องการแร่เหล็กใหม่เพื่อหลอมกระบี่สุริยันสำหรับศิษย์รุ่นใหม่",
    briefSummary: "ส่งแร่เหล็ก 5 ก้อน · แต้มสำนัก +50",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectMember", sectId: "taishan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บแร่เหล็ก 5 ก้อน",
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
    name: "บททดสอบก่อนสืบทอด: วิชาลึกลับ",
    description: "ชิงสือเต้าเหรินจะทดสอบก่อนเปิดตำราวิชาลึกลับให้ศิษย์ที่พิสูจน์ใจ — ปราบหัวหน้าโจร 2 คน และหาแร่เทพ 1 ก้อนมาหลอมกระบี่บูชาตะวัน (ผ่านแล้วจึงรับภารกิจสืบทอดวิชาลึกลับได้)",
    briefSummary: "บททดสอบ — เปิดทางสู่การสืบทอดวิชาลึกลับ",
    type: "side",
    sectId: "taishan",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "taishan" },
        { t: "sectRankAtLeast", sectId: "taishan", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_iron",
        description: "พิสูจน์ใจ — รวบรวมแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อเจ้าสำนักชิงสือเต้าเหริน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "taishan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 10 },
    ],
  },

  {
    id: "qst_taishan_redemption",
    name: "ไถ่บาปต่อไท่ซาน",
    description: "เจ้าเคยทรยศไท่ซาน สำนักจึงส่งนักล่ามาตามเจ้า — แต่เจ้าสำนักชิงสือเต้าเหรินยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำหยกล้ำค่า 5 ก้อนมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของไท่ซานที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อไท่ซาน — ปราบหัวหน้าโจร 5 + ถวายหยกล้ำค่า 5 ก้อน",
    type: "side",
    sectId: "taishan",
    giverNpcId: "sect_taishan_master_tianmen",
    prereqs: { t: "sectStatus", sectId: "taishan", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำหยกล้ำค่า 5 ก้อนมาถวาย", autoAdvance: { t: "hasItem", itemId: "jade", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักชิงสือเต้าเหริน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "taishan" },
      { t: "npcRelationship", npcId: "sect_taishan_master_tianmen", amount: 10 },
    ],
  },
];
