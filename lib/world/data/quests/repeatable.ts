import type { QuestDef } from "../../types";

// Repeatable quests (QuestDef.repeatEveryDays): offered again by their giver
// two real hours after they were last taken. The way to wear a trait back
// down — ความเลว, ความทะนง, ชื่อเสียง — and steady work for gold, ความดี and
// ชื่อเสียง. Trait rewards go through gainTrait (lib/world/effects.ts): a gain
// lowers the opposite trait by half.
const EVERY = 2;

export const QUESTS_REPEATABLE: readonly QuestDef[] = [
  {
    id: "qr_atonement_sutra",
    name: "คัดพระสูตรสำนึกผิด",
    description: "เจ้าอาวาสฮุ่ยหยวนรับฟังผู้ที่อยากล้างบาป — นำกระดาษสา 5 แผ่นกับหมึกเข้ม 2 แท่งมาคัดพระสูตรถวายวัด แล้วใจที่หนักอึ้งจะเบาลง (ลดความเลว · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "ล้างบาป — ลดความเลว",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    repeatEveryDays: EVERY,
    prereqs: { t: "trait", trait: "evil", min: 1 },
    stages: [
      { id: "materials", description: "นำกระดาษสา 5 แผ่น และหมึกเข้ม 2 แท่ง", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "paper", count: 5 }, { t: "hasItem", itemId: "ink", count: 2 }] } },
      { id: "return", description: "กลับไปคัดพระสูตรกับเจ้าอาวาสฮุ่ยหยวน" },
    ],
    rewards: [
      { t: "trait", trait: "evil", amount: -10 },
      { t: "trait", trait: "humility", amount: 2 },
    ],
  },
  {
    id: "qr_temple_chores",
    name: "ผ่าฟืนลดอัตตา",
    description: "เจ้าอาวาสฮุ่ยหยวนว่า ผู้ที่หยิ่งในฝีมือควรลองผ่าฟืนให้โรงครัววัด — นำไม้เนื้ออ่อน 6 ท่อนมา แล้วความทะนงจะสงบลง (ลดความหยิ่งยโส · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "ฝึกใจ — ลดความหยิ่งยโส",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    repeatEveryDays: EVERY,
    prereqs: { t: "trait", trait: "arrogance", min: 1 },
    stages: [
      { id: "firewood", description: "นำไม้เนื้ออ่อน 6 ท่อนไปโรงครัววัด", autoAdvance: { t: "hasItem", itemId: "wood_soft", count: 6 } },
      { id: "return", description: "กลับไปรายงานเจ้าอาวาสฮุ่ยหยวน" },
    ],
    rewards: [{ t: "trait", trait: "arrogance", amount: -10 }],
  },
  {
    id: "qr_quiet_name",
    name: "ปิดนามซ่อนตน",
    description: "โปผู้เล่าเรื่องรู้วิธีทำให้ข่าวลือจางลง — ขนมไหว้พระจันทร์ 3 ชิ้นเลี้ยงนักเล่าเรื่องทั้งโรงเตี๊ยม แล้วนิทานของเจ้าจะถูกเล่าน้อยลง (ลดชื่อเสียง · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "เก็บตัว — ลดชื่อเสียง",
    type: "side",
    giverNpcId: "inn_heluo_storyteller_po",
    repeatEveryDays: EVERY,
    prereqs: { t: "trait", trait: "fame", min: 1 },
    stages: [
      { id: "cakes", description: "นำขนมไหว้พระจันทร์ 3 ชิ้นมาเลี้ยงนักเล่าเรื่อง", autoAdvance: { t: "hasItem", itemId: "moon_cake", count: 3 } },
      { id: "return", description: "กลับไปหาโปผู้เล่าเรื่อง" },
    ],
    rewards: [{ t: "trait", trait: "fame", amount: -10 }],
  },
  {
    id: "qr_heal_the_poor",
    name: "ยาสำหรับคนยากไร้",
    description: "หมอหลินรักษาคนยากไร้ในนครหลวงโดยไม่คิดเงิน แต่สมุนไพรไม่เคยพอ — นำสมุนไพรหายาก 3 กำมาช่วย (เพิ่มความดี · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "ช่วยคนป่วย — เพิ่มความดี",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    repeatEveryDays: EVERY,
    stages: [
      { id: "herbs", description: "นำสมุนไพรหายาก 3 กำมาให้หมอหลิน", autoAdvance: { t: "hasItem", itemId: "herb", count: 3 } },
      { id: "return", description: "กลับไปหาหมอหลิน" },
    ],
    rewards: [
      { t: "trait", trait: "good", amount: 6 },
      { t: "gold", amount: 60 },
    ],
  },
  {
    id: "qr_bandit_sweep",
    name: "กวาดล้างโจรป่า",
    description: "นายอำเภอหวู่ประกาศค่าหัวโจรป่าที่ดักปล้นคาราวานรอบนครหลวง — ปราบโจรป่า 3 คนแล้วกลับมารับรางวัล (เงิน · ชื่อเสียง · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "ค่าหัวโจร — เงินและชื่อเสียง",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    repeatEveryDays: EVERY,
    stages: [
      { id: "bandits", description: "ปราบโจรป่า 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 } },
      { id: "return", description: "กลับไปรับค่าหัวจากนายอำเภอหวู่" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "fame", amount: 3 },
    ],
  },
  {
    id: "qr_ore_supply",
    name: "ส่งแร่ให้เถ้าแก่",
    description: "เถ้าแก่หวางรับซื้อแร่เหล็กราคาดีกว่าตลาดเสมอ — นำแร่เหล็ก 4 ก้อนมาส่ง (เงิน · รับซ้ำได้ทุก 2 ชั่วโมง)",
    briefSummary: "ส่งของ — เงิน",
    type: "side",
    giverNpcId: "merchant_wang",
    repeatEveryDays: EVERY,
    stages: [
      { id: "ore", description: "นำแร่เหล็ก 4 ก้อนมาส่งเถ้าแก่หวาง", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 4 } },
      { id: "return", description: "กลับไปรับเงินจากเถ้าแก่หวาง" },
    ],
    rewards: [{ t: "gold", amount: 170 }],
  },
];
