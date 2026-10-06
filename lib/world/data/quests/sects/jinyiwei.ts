import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_JINYIWEI: readonly QuestDef[] = [
  {
    id: "qst_jinyiwei_disciple_intro",
    name: "ขอเข้าเป็นศิษย์องครักษ์",
    description: "ผู้บัญชาการจ้าวฝู่สงสัยว่าทูตหลิวอิงแห่งพระราชวังจงหยางขายความลับให้ฝ่ายอ๋องเยียน — ผู้ที่อยากเข้ากรมต้องพิสูจน์ความภักดีด้วยการลักพาตัวทูตมาให้สอบสวน",
    briefSummary: "ลักพาตัวทูตหลิวอิงเพื่อพิสูจน์ความจงรักภักดี",
    type: "side",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 30 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "kidnap_envoy",
        description: "ลักพาตัวทูตหลิวอิงที่พระราชวังจงหยาง",
        autoAdvance: { t: "kidnappedNpc", npcId: "palace_zhongyang_envoy_liuying" },
      },
      {
        id: "report_back",
        description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 10 },
      { t: "joinSect", sectId: "jinyiwei" },
      { t: "sectPoints", sectId: "jinyiwei", amount: 30 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_patrol",
    name: "ปราบโจรในเขตหลวง",
    description: "ภารกิจประจำขององครักษ์ — กำราบโจรที่ก่อความวุ่นวายในเขตหลวง",
    briefSummary: "ปราบหัวหน้าโจร 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "patrol",
        description: "ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_arms",
    name: "ส่งเหล็กให้โรงตีอาวุธ",
    description: "โรงตีอาวุธของกรมราชต้องการเหล็กพิเศษและแร่เหล็กเพิ่มเพื่อหลอมดาบโซ่ใหม่ — เก็บมาให้ครบ",
    briefSummary: "ส่งแร่เหล็ก 6 + เหล็กแท่ง 2 · แต้มสำนัก +60",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "gather",
        description: "เก็บแร่เหล็ก 6 ก้อน + เหล็กแท่ง 2 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "iron_ore", count: 6 },
            { t: "hasItem", itemId: "iron_ingot", count: 2 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้ผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 60 },
    ],
  },

  {
    id: "qst_jinyiwei_art_godslayer",
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "ผู้บัญชาการจ้าวฝู่จะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความภักดี — ปราบหัวหน้าโจร 4 คน และสะสมความหยิ่งยโสให้ถึง 20 — กรมนี้ไม่ต้องการคนที่ก้มหัวให้ใคร (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "jinyiwei",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "jinyiwei" },
        { t: "sectRankAtLeast", sectId: "jinyiwei", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_loyalty",
        description: "พิสูจน์ความภักดี — สะสมความหยิ่งยโส ถึง 20",
        autoAdvance: { t: "trait", trait: "arrogance", min: 20 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "arrogance", amount: 5 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 200 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 20 },
    ],
  },

  {
    id: "qst_jinyiwei_redemption",
    name: "ไถ่บาปต่อองครักษ์เสื้อแพร",
    description: "เจ้าเคยทรยศองครักษ์เสื้อแพร สำนักจึงส่งนักล่ามาตามเจ้า — แต่ผู้บัญชาการจ้าวฝู่ยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำเหล็กแท่ง 5 แท่งมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาขององครักษ์เสื้อแพรที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อองครักษ์เสื้อแพร — ปราบหัวหน้าโจร 5 + ถวายเหล็กแท่ง 5 แท่ง",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectStatus", sectId: "jinyiwei", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำเหล็กแท่ง 5 แท่งมาถวาย", autoAdvance: { t: "hasItem", itemId: "iron_ingot", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อผู้บัญชาการจ้าวฝู่" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "jinyiwei" },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 10 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_scroll",
    name: "ส่งกระดาษสาให้กรม",
    description: "ภารกิจประจำของศิษย์องครักษ์เสื้อแพร — กรมใช้กระดาษสามากสำหรับสำนวนคดีและหมายจับ หากระดาษสา 6 แผ่นมาส่ง",
    briefSummary: "ส่งกระดาษสา 6 แผ่น · แต้มสำนัก +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      { id: "main", description: "เก็บกระดาษสา 6 แผ่น", autoAdvance: { t: "hasItem", itemId: "paper", count: 6 } },
      { id: "report", description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_thugs",
    name: "กวาดล้างตลาดหลวง",
    description: "พวกอันธพาลเริ่มเก็บค่าคุ้มครองในตลาดหลวง — ผู้บัญชาการจ้าวฝู่สั่งให้ศิษย์ออกไปกวาดล้างและนำสันติกลับสู่ตลาด",
    briefSummary: "ปราบโจรเร่ร่อน 5 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 5 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 5 } },
      { id: "report", description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_intel",
    name: "รวบรวมข่าวกรอง",
    description: "กรมต้องการเขียนรายงานลับให้ราชสำนัก — เก็บกระดาษสาและหมึกเข้มพร้อมเหรียญโบราณที่ใช้เป็นรหัสในการส่งสาร",
    briefSummary: "ส่งกระดาษสา 8 + หมึกเข้ม 6 + เหรียญโบราณ 2 · แต้มสำนัก +70",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "gather_paper",
        description: "เก็บกระดาษสา 8 แผ่น + หมึกเข้ม 6 แท่ง",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 8 },
            { t: "hasItem", itemId: "ink", count: 6 },
          ],
        },
      },
      {
        id: "gather_coin",
        description: "หาเหรียญโบราณ 2 เหรียญสำหรับเป็นรหัสลับ",
        autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 2 },
      },
      { id: "deliver", description: "ส่งทั้งหมดให้ผู้บัญชาการจ้าวฝู่" },
    ],
    rewards: [
      { t: "gold", amount: 160 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 4 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 70 },
    ],
  },

  {
    id: "qst_jinyiwei_sect_fugitive",
    name: "ตามจับโจรหนีหมายจับ",
    description: "หัวหน้าโจรหลบหนีจากเขตหลวงพร้อมขโมยเหรียญลับของกรมไป — ตามจับเขามาและนำเหรียญกลับคืน",
    briefSummary: "ปราบหัวหน้าโจร 3 คน + คืนเหรียญโบราณ 3 · แต้มสำนัก +65",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "hunt",
        description: "ปราบหัวหน้าโจร 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "recover",
        description: "นำเหรียญโบราณ 3 เหรียญคืนกรม",
        autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 3 },
      },
      { id: "report", description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 65 },
    ],
  },
];
