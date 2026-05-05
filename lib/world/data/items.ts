import type { ItemDef } from "../types";

// Items table. Add new items here.
export const ITEMS: readonly ItemDef[] = [
  {
    id: "potion",
    name: "ยาเลือดเล็ก",
    description: "ยาฟื้นพลังชีวิต ใช้ในยามฉุกเฉิน",
    use: { t: "heal", hp: 30 },
  },
  {
    id: "old_key",
    name: "กุญแจเก่า",
    description: "กุญแจเก่าแก่ ไม่รู้ว่าใช้กับประตูไหน",
  },
  {
    id: "jade",
    name: "หยกล้ำค่า",
    description: "หยกเขียวขัดเงาวาว มูลค่าสูงในตลาดบู๊ลิ้ม",
  },
  {
    id: "herb",
    name: "สมุนไพรหายาก",
    description: "ใบไม้สมุนไพรกลิ่นหอม ใช้ทำยาฟื้นพลัง",
  },
  {
    id: "ancient_coin",
    name: "เหรียญโบราณ",
    description: "เหรียญทองคำโบราณ มีอักษรจีนแกะสลัก",
  },

  // ─── Mining ──────────────────────────────────────────────────────────
  { id: "rock",        name: "ก้อนหิน",         description: "หินธรรมดา ใช้เป็นวัตถุดิบสำหรับงานก่อสร้างหรือการตีเหล็ก" },
  { id: "iron_ore",    name: "แร่เหล็ก",         description: "แร่เหล็กคุณภาพดี วัตถุดิบหลักในการตีอาวุธ" },
  { id: "copper_ore",  name: "แร่ทองแดง",        description: "แร่ทองแดง ใช้ผสมโลหะเสริมความเหนียว" },
  { id: "silver_ore",  name: "แร่เงิน",          description: "แร่เงินบริสุทธิ์ ใช้ทำเครื่องประดับและของสะสม" },
  { id: "gold_ore",    name: "แร่ทองคำ",         description: "แร่ทองคำหายาก มูลค่าสูงในตลาด" },
  { id: "mithril_ore", name: "แร่เทพ",           description: "แร่เทพในตำนาน หาได้เพียงไม่กี่แห่งในแผ่นดิน" },

  // ─── Woodcutting ─────────────────────────────────────────────────────
  { id: "wood_soft",   name: "ไม้เนื้ออ่อน",     description: "ไม้สนหรือไม้ไผ่ ตัดง่าย ใช้กับงานเครื่องใช้ทั่วไป" },
  { id: "wood_hard",   name: "ไม้เนื้อแข็ง",     description: "ไม้โอ๊คหรือไม้สัก แข็งแรง เหมาะกับด้ามอาวุธ" },
  { id: "wood_sacred", name: "ไม้ศักดิ์สิทธิ์",  description: "ไม้จากต้นไม้โบราณ มีพลังบางอย่างซ่อนอยู่" },

  // ─── Hunting yield ───────────────────────────────────────────────────
  { id: "raw_meat",    name: "เนื้อสด",          description: "เนื้อสัตว์ป่าสด ใช้ทำอาหารหรือเป็นเหยื่อ" },
  { id: "fur_pelt",    name: "หนังสัตว์",        description: "หนังสัตว์ป่า ใช้ทำเสื้อผ้าและเกราะหนัง" },
  { id: "tiger_claw",  name: "เล็บเสือ",         description: "เล็บเสืออันทรงพลัง วัตถุดิบของอาวุธลับ" },
  { id: "bear_claw",   name: "อุ้งหมี",          description: "อุ้งเท้าหมีดิบ มูลค่าสูงในตลาดยา" },
  { id: "snake_skin",  name: "หนังงู",           description: "หนังงูพิษ ใช้ทำเชือกและเครื่องประดับลับ" },

  // ─── Fishing ─────────────────────────────────────────────────────────
  { id: "fish_carp",   name: "ปลาคาร์ป",         description: "ปลาน้ำจืดธรรมดา ใช้เป็นอาหารพื้นบ้าน" },
  { id: "fish_eel",    name: "ปลาไหล",           description: "ปลาไหลตัวยาว เนื้อมัน ราคาดีในเมือง" },
  { id: "fish_dragon", name: "ปลามังกร",         description: "ปลาในตำนาน มีเกล็ดสีรุ้ง พบได้น้อยมาก" },

  // ─── Herbalism ───────────────────────────────────────────────────────
  { id: "ginseng",     name: "โสม",              description: "รากโสมสด ใช้ฟื้นพลังภายในและทำยาบำรุง",
    use: { t: "heal", mp: 50 } },
  { id: "lotus_seed",  name: "เม็ดบัว",          description: "เม็ดบัวสด ใช้ทำยาฟื้นใจและล้างพิษ",
    use: { t: "heal", mp: 30 } },
  { id: "snow_lotus",  name: "บัวหิมะ",          description: "บัวหิมะที่ขึ้นบนเขาสูง ของวิเศษหายาก",
    use: { t: "heal", hp: 80, mp: 80 } },

  // ─── Venom / poisonous fauna ─────────────────────────────────────────
  { id: "viper_venom",     name: "พิษงู",         description: "ของเหลวสีเขียวเข้ม สกัดจากเขี้ยวงูเห่า" },
  { id: "scorpion_venom",  name: "พิษแมงป่อง",    description: "พิษอ่อนแต่ทำลายเส้นประสาท ใช้ในยาพิษ" },
  { id: "centipede_venom", name: "พิษตะขาบ",      description: "พิษหายากจากตะขาบยักษ์ มีราคาสูงในตลาดมืด" },

  // ─── Crafted intermediates ───────────────────────────────────────────
  { id: "iron_ingot",  name: "เหล็กแท่ง",        description: "เหล็กที่ถูกถลุงและตีเป็นแท่ง พร้อมขึ้นรูป" },
  { id: "leather",     name: "หนังฟอก",          description: "หนังสัตว์ที่ฟอกแล้ว เหมาะกับงานเย็บเสื้อหนัง" },
  { id: "cooked_meat", name: "เนื้อย่าง",        description: "เนื้อสดที่ปรุงแล้ว เพิ่มแรงระหว่างเดินทาง",
    use: { t: "heal", hp: 30 } },

  // ─── Crafting bases (paper / ink / silk) ─────────────────────────────
  { id: "paper",       name: "กระดาษสา",         description: "กระดาษพื้นเมือง ใช้สำหรับงานวาดและงานเขียน" },
  { id: "ink",         name: "หมึกเข้ม",         description: "หมึกจีนเข้มข้น ใช้คู่กับพู่กัน" },
  { id: "silk",        name: "ผ้าไหม",           description: "ผ้าไหมเนื้อดี ใช้ทำเสื้อชั้นสูง" },
  { id: "thread",      name: "เส้นด้าย",         description: "ด้ายเย็บคุณภาพ วัตถุดิบงานตัดเย็บ" },

  // ─── Books (reading mastery) ─────────────────────────────────────────
  { id: "book_basic",   name: "ตำราเบื้องต้น",    description: "ตำราสำหรับผู้เริ่มต้น อ่านเพื่อฝึกฝน",
    use: { t: "trainSkill", skill: "reading", xp: 30 } },
  { id: "book_inter",   name: "ตำราขั้นกลาง",     description: "ตำราระดับกลาง เพิ่มความรู้และมาสเตอร์รี่",
    use: { t: "trainSkill", skill: "reading", xp: 80 } },
  { id: "book_advanced", name: "ตำราขั้นสูง",     description: "ตำราที่หาได้ยาก ฝึกฝนการอ่านได้มาก",
    use: { t: "trainSkill", skill: "reading", xp: 180 } },
  { id: "book_legendary", name: "ตำราตำนาน",     description: "ตำราในตำนาน เพิ่มมาสเตอร์รี่อย่างมหาศาล",
    use: { t: "trainSkill", skill: "reading", xp: 400 } },

  // ─── Song books (music mastery) ──────────────────────────────────────
  { id: "song_basic",  name: "ตำราเพลงพื้นฐาน",  description: "ตำราเพลงสำหรับผู้เริ่มฝึกดนตรี",
    use: { t: "trainSkill", skill: "music", xp: 30 } },
  { id: "song_inter",  name: "ตำราเพลงขั้นกลาง", description: "ตำราเพลงระดับกลาง",
    use: { t: "trainSkill", skill: "music", xp: 80 } },
  { id: "song_advanced", name: "ตำราเพลงลึกลับ", description: "ตำราเพลงที่ซ่อนอยู่ในตำนาน",
    use: { t: "trainSkill", skill: "music", xp: 180 } },

  // ─── Image scrolls (drawing mastery) ─────────────────────────────────
  { id: "image_basic",  name: "ภาพวาดเบื้องต้น", description: "ม้วนภาพฝึกหัด ดูเพื่อฝึกการสังเกต",
    use: { t: "trainSkill", skill: "drawing", xp: 30 } },
  { id: "image_inter",  name: "ภาพวาดงานช่าง",   description: "ภาพวาดของช่างฝีมือดี",
    use: { t: "trainSkill", skill: "drawing", xp: 80 } },
  { id: "image_master", name: "ภาพวาดศิลปิน",    description: "ผลงานศิลปินชั้นเอก ทรงคุณค่าและฝึกได้มาก",
    use: { t: "trainSkill", skill: "drawing", xp: 180 } },

  // ─── Calligraphy scrolls (writing mastery) ───────────────────────────
  { id: "alpha_basic",  name: "ตัวอักษรพื้นฐาน",  description: "แผ่นอักษรฝึกเบื้องต้น",
    use: { t: "trainSkill", skill: "writing", xp: 30 } },
  { id: "alpha_inter",  name: "อักษรงดงาม",       description: "งานอักษรของบัณฑิต",
    use: { t: "trainSkill", skill: "writing", xp: 80 } },
  { id: "alpha_master", name: "อักษรเทพนิยม",     description: "งานอักษรของปรมาจารย์",
    use: { t: "trainSkill", skill: "writing", xp: 180 } },

  // ─── Forge outputs (sold or used as crafting base) ───────────────────
  { id: "iron_blade",  name: "ใบมีดเหล็ก",        description: "ใบมีดเหล็กผ่านการตี ใช้ทำดาบ" },
  { id: "iron_sword",  name: "ดาบเหล็กธรรมดา",    description: "ดาบเหล็กที่ช่างฝีมือทั่วไปทำได้" },
  { id: "steel_sword", name: "ดาบเหล็กกล้า",      description: "ดาบที่ตีจากเหล็กกล้าคุณภาพสูง" },

  // ─── Tailoring outputs ───────────────────────────────────────────────
  { id: "cloth_robe",  name: "เสื้อผ้าทอ",        description: "เสื้อผ้าฝ้ายธรรมดา" },
  { id: "leather_robe", name: "เสื้อหนังเบา",     description: "เสื้อหนังสัตว์ ป้องกันได้ดีพอประมาณ" },
  { id: "silk_robe",   name: "เสื้อผ้าไหม",       description: "เสื้อผ้าไหมราคาแพง" },

  // ─── Jewelry outputs ─────────────────────────────────────────────────
  { id: "silver_ring", name: "แหวนเงิน",          description: "แหวนเงินขัดเงา" },
  { id: "gold_ring",   name: "แหวนทอง",           description: "แหวนทองที่ช่างฝีมือทำ" },
  { id: "jade_amulet", name: "เครื่องราง·หยก",    description: "เครื่องรางทำจากหยก" },

  // ─── Alchemy outputs ─────────────────────────────────────────────────
  { id: "potion_mid",  name: "ยาเลือดกลาง",       description: "ยาฟื้นพลังชีวิตขั้นกลาง",
    use: { t: "heal", hp: 80 } },
  { id: "potion_big",  name: "ยาเลือดใหญ่",       description: "ยาฟื้นพลังชีวิตขั้นสูง",
    use: { t: "heal", hp: 200 } },
  { id: "poison_vial", name: "ขวดพิษ",            description: "ขวดพิษเข้มข้น ใช้กับงานลอบ" },

  // ─── Chef outputs ────────────────────────────────────────────────────
  { id: "rice_dish",   name: "ข้าวหมูแดง",         description: "ข้าวจานเดียวเรียบง่าย กินแล้วฟื้นแรง",
    use: { t: "heal", hp: 40 } },
  { id: "spicy_stew",  name: "ต้มยำเข้มข้น",       description: "ต้มยำเผ็ดร้อน เพิ่มแรงเดินทาง",
    use: { t: "heal", hp: 60 } },
  { id: "moon_cake",   name: "ขนมไหว้พระจันทร์",   description: "ของหวานพื้นเมือง รสหวานหอม",
    use: { t: "heal", hp: 20 } },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
