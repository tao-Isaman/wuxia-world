import type { ItemDef } from "../types";

// Items table — every entry has an explicit `category` and a base `price`
// in gold. Shops use these for buy/sell; inns may restrict acceptance to
// specific categories. Items without a price (or price 0) are unsellable
// (quest items / story items).
export const ITEMS: readonly ItemDef[] = [
  // ─── Quest / story items ───────────────────────────────────────────
  { id: "old_key", name: "กุญแจเก่า", category: "quest", price: 0,
    description: "กุญแจเก่าแก่ ไม่รู้ว่าใช้กับประตูไหน" },

  // ─── Valuables ─────────────────────────────────────────────────────
  { id: "jade", name: "หยกล้ำค่า", category: "valuable", price: 1000,
    description: "หยกเขียวขัดเงาวาว มูลค่าสูงในตลาดบู๊ลิ้ม" },
  { id: "ancient_coin", name: "เหรียญโบราณ", category: "valuable", price: 200,
    description: "เหรียญทองคำโบราณ มีอักษรจีนแกะสลัก" },

  // ─── Potions ───────────────────────────────────────────────────────
  { id: "potion", name: "ยาเลือดเล็ก", category: "potion", price: 50,
    description: "ยาฟื้นพลังชีวิต ใช้ในยามฉุกเฉิน",
    use: { t: "heal", hp: 30 } },
  { id: "potion_mid", name: "ยาเลือดกลาง", category: "potion", price: 200,
    description: "ยาฟื้นพลังชีวิตขั้นกลาง",
    use: { t: "heal", hp: 80 } },
  { id: "potion_big", name: "ยาเลือดใหญ่", category: "potion", price: 500,
    description: "ยาฟื้นพลังชีวิตขั้นสูง",
    use: { t: "heal", hp: 200 } },
  { id: "poison_vial", name: "ขวดพิษ", category: "potion", price: 250,
    description: "ขวดพิษเข้มข้น ใช้กับงานลอบ" },

  // ─── Mining materials ──────────────────────────────────────────────
  { id: "rock",        name: "ก้อนหิน",         category: "material", price: 5,
    description: "หินธรรมดา ใช้เป็นวัตถุดิบสำหรับงานก่อสร้างหรือการตีเหล็ก" },
  { id: "iron_ore",    name: "แร่เหล็ก",         category: "material", price: 30,
    description: "แร่เหล็กคุณภาพดี วัตถุดิบหลักในการตีอาวุธ" },
  { id: "copper_ore",  name: "แร่ทองแดง",        category: "material", price: 25,
    description: "แร่ทองแดง ใช้ผสมโลหะเสริมความเหนียว" },
  { id: "silver_ore",  name: "แร่เงิน",          category: "material", price: 100,
    description: "แร่เงินบริสุทธิ์ ใช้ทำเครื่องประดับและของสะสม" },
  { id: "gold_ore",    name: "แร่ทองคำ",         category: "valuable",  price: 300,
    description: "แร่ทองคำหายาก มูลค่าสูงในตลาด" },
  { id: "mithril_ore", name: "แร่เทพ",           category: "valuable",  price: 1500,
    description: "แร่เทพในตำนาน หาได้เพียงไม่กี่แห่งในแผ่นดิน" },

  // ─── Woodcutting ───────────────────────────────────────────────────
  { id: "wood_soft",   name: "ไม้เนื้ออ่อน",     category: "material", price: 10,
    description: "ไม้สนหรือไม้ไผ่ ตัดง่าย ใช้กับงานเครื่องใช้ทั่วไป" },
  { id: "wood_hard",   name: "ไม้เนื้อแข็ง",     category: "material", price: 35,
    description: "ไม้โอ๊คหรือไม้สัก แข็งแรง เหมาะกับด้ามอาวุธ" },
  { id: "wood_sacred", name: "ไม้ศักดิ์สิทธิ์",  category: "valuable", price: 800,
    description: "ไม้จากต้นไม้โบราณ มีพลังบางอย่างซ่อนอยู่" },

  // ─── Hunting yield ─────────────────────────────────────────────────
  { id: "raw_meat",    name: "เนื้อสด",          category: "material", price: 15,
    description: "เนื้อสัตว์ป่าสด ใช้ทำอาหารหรือเป็นเหยื่อ" },
  { id: "fur_pelt",    name: "หนังสัตว์",        category: "material", price: 40,
    description: "หนังสัตว์ป่า ใช้ทำเสื้อผ้าและเกราะหนัง" },
  { id: "tiger_claw",  name: "เล็บเสือ",         category: "valuable", price: 200,
    description: "เล็บเสืออันทรงพลัง วัตถุดิบของอาวุธลับ" },
  { id: "bear_claw",   name: "อุ้งหมี",          category: "valuable", price: 150,
    description: "อุ้งเท้าหมีดิบ มูลค่าสูงในตลาดยา" },
  { id: "snake_skin",  name: "หนังงู",           category: "material", price: 80,
    description: "หนังงูพิษ ใช้ทำเชือกและเครื่องประดับลับ" },

  // ─── Fishing ───────────────────────────────────────────────────────
  { id: "fish_carp",   name: "ปลาคาร์ป",         category: "material", price: 20,
    description: "ปลาน้ำจืดธรรมดา ใช้เป็นอาหารพื้นบ้าน" },
  { id: "fish_eel",    name: "ปลาไหล",           category: "material", price: 50,
    description: "ปลาไหลตัวยาว เนื้อมัน ราคาดีในเมือง" },
  { id: "fish_dragon", name: "ปลามังกร",         category: "valuable", price: 1500,
    description: "ปลาในตำนาน มีเกล็ดสีรุ้ง พบได้น้อยมาก" },

  // ─── Herbalism ─────────────────────────────────────────────────────
  { id: "herb",        name: "สมุนไพรหายาก",     category: "herb", price: 50,
    description: "ใบไม้สมุนไพรกลิ่นหอม ใช้ทำยาฟื้นพลัง" },
  { id: "ginseng",     name: "โสม",              category: "herb", price: 80,
    description: "รากโสมสด ใช้ฟื้นพลังภายในและทำยาบำรุง",
    use: { t: "heal", mp: 50 } },
  { id: "lotus_seed",  name: "เม็ดบัว",          category: "herb", price: 60,
    description: "เม็ดบัวสด ใช้ทำยาฟื้นใจและล้างพิษ",
    use: { t: "heal", mp: 30 } },
  { id: "snow_lotus",  name: "บัวหิมะ",          category: "herb", price: 1200,
    description: "บัวหิมะที่ขึ้นบนเขาสูง ของวิเศษหายาก",
    use: { t: "heal", hp: 80, mp: 80 } },

  // ─── Venom ─────────────────────────────────────────────────────────
  { id: "viper_venom",     name: "พิษงู",         category: "venom", price: 100,
    description: "ของเหลวสีเขียวเข้ม สกัดจากเขี้ยวงูเห่า" },
  { id: "scorpion_venom",  name: "พิษแมงป่อง",    category: "venom", price: 150,
    description: "พิษอ่อนแต่ทำลายเส้นประสาท ใช้ในยาพิษ" },
  { id: "centipede_venom", name: "พิษตะขาบ",      category: "venom", price: 800,
    description: "พิษหายากจากตะขาบยักษ์ มีราคาสูงในตลาดมืด" },

  // ─── Crafted intermediates ─────────────────────────────────────────
  { id: "iron_ingot",  name: "เหล็กแท่ง",        category: "material", price: 80,
    description: "เหล็กที่ถูกถลุงและตีเป็นแท่ง พร้อมขึ้นรูป" },
  { id: "leather",     name: "หนังฟอก",          category: "material", price: 60,
    description: "หนังสัตว์ที่ฟอกแล้ว เหมาะกับงานเย็บเสื้อหนัง" },
  { id: "cooked_meat", name: "เนื้อย่าง",        category: "food", price: 50,
    description: "เนื้อสดที่ปรุงแล้ว เพิ่มแรงระหว่างเดินทาง",
    use: { t: "heal", hp: 30 } },

  // ─── Crafting bases (paper / ink / silk) ───────────────────────────
  { id: "paper",       name: "กระดาษสา",         category: "material", price: 15,
    description: "กระดาษพื้นเมือง ใช้สำหรับงานวาดและงานเขียน" },
  { id: "ink",         name: "หมึกเข้ม",         category: "material", price: 25,
    description: "หมึกจีนเข้มข้น ใช้คู่กับพู่กัน" },
  { id: "silk",        name: "ผ้าไหม",           category: "material", price: 80,
    description: "ผ้าไหมเนื้อดี ใช้ทำเสื้อชั้นสูง" },
  { id: "thread",      name: "เส้นด้าย",         category: "material", price: 20,
    description: "ด้ายเย็บคุณภาพ วัตถุดิบงานตัดเย็บ" },

  // ─── Books / scrolls / images ──────────────────────────────────────
  { id: "book_basic",   name: "ตำราเบื้องต้น",    category: "book", price: 100,
    description: "ตำราสำหรับผู้เริ่มต้น อ่านเพื่อฝึกฝน",
    use: { t: "trainSkill", skill: "reading", xp: 30 } },
  { id: "book_inter",   name: "ตำราขั้นกลาง",     category: "book", price: 300,
    description: "ตำราระดับกลาง เพิ่มความรู้และมาสเตอร์รี่",
    use: { t: "trainSkill", skill: "reading", xp: 80 } },
  { id: "book_advanced", name: "ตำราขั้นสูง",     category: "book", price: 800,
    description: "ตำราที่หาได้ยาก ฝึกฝนการอ่านได้มาก",
    use: { t: "trainSkill", skill: "reading", xp: 180 } },
  { id: "book_legendary", name: "ตำราตำนาน",     category: "book", price: 2000,
    description: "ตำราในตำนาน เพิ่มมาสเตอร์รี่อย่างมหาศาล",
    use: { t: "trainSkill", skill: "reading", xp: 400 } },

  { id: "song_basic",  name: "ตำราเพลงพื้นฐาน",  category: "book", price: 100,
    description: "ตำราเพลงสำหรับผู้เริ่มฝึกดนตรี",
    use: { t: "trainSkill", skill: "music", xp: 30 } },
  { id: "song_inter",  name: "ตำราเพลงขั้นกลาง", category: "book", price: 300,
    description: "ตำราเพลงระดับกลาง",
    use: { t: "trainSkill", skill: "music", xp: 80 } },
  { id: "song_advanced", name: "ตำราเพลงลึกลับ", category: "book", price: 800,
    description: "ตำราเพลงที่ซ่อนอยู่ในตำนาน",
    use: { t: "trainSkill", skill: "music", xp: 180 } },

  { id: "image_basic",  name: "ภาพวาดเบื้องต้น", category: "book", price: 100,
    description: "ม้วนภาพฝึกหัด ดูเพื่อฝึกการสังเกต",
    use: { t: "trainSkill", skill: "drawing", xp: 30 } },
  { id: "image_inter",  name: "ภาพวาดงานช่าง",   category: "book", price: 300,
    description: "ภาพวาดของช่างฝีมือดี",
    use: { t: "trainSkill", skill: "drawing", xp: 80 } },
  { id: "image_master", name: "ภาพวาดศิลปิน",    category: "book", price: 800,
    description: "ผลงานศิลปินชั้นเอก ทรงคุณค่าและฝึกได้มาก",
    use: { t: "trainSkill", skill: "drawing", xp: 180 } },

  { id: "alpha_basic",  name: "ตัวอักษรพื้นฐาน",  category: "book", price: 100,
    description: "แผ่นอักษรฝึกเบื้องต้น",
    use: { t: "trainSkill", skill: "writing", xp: 30 } },
  { id: "alpha_inter",  name: "อักษรงดงาม",       category: "book", price: 300,
    description: "งานอักษรของบัณฑิต",
    use: { t: "trainSkill", skill: "writing", xp: 80 } },
  { id: "alpha_master", name: "อักษรเทพนิยม",     category: "book", price: 800,
    description: "งานอักษรของปรมาจารย์",
    use: { t: "trainSkill", skill: "writing", xp: 180 } },

  // ─── Forge outputs ─────────────────────────────────────────────────
  { id: "iron_blade",  name: "ใบมีดเหล็ก",        category: "craft", price: 150,
    description: "ใบมีดเหล็กผ่านการตี ใช้ทำดาบ" },
  { id: "iron_sword",  name: "ดาบเหล็กธรรมดา",    category: "craft", price: 250,
    description: "ดาบเหล็กที่ช่างฝีมือทั่วไปทำได้" },
  { id: "steel_sword", name: "ดาบเหล็กกล้า",      category: "craft", price: 800,
    description: "ดาบที่ตีจากเหล็กกล้าคุณภาพสูง" },

  // ─── Tailoring outputs ─────────────────────────────────────────────
  { id: "cloth_robe",   name: "เสื้อผ้าทอ",       category: "craft", price: 100,
    description: "เสื้อผ้าฝ้ายธรรมดา" },
  { id: "leather_robe", name: "เสื้อหนังเบา",     category: "craft", price: 300,
    description: "เสื้อหนังสัตว์ ป้องกันได้ดีพอประมาณ" },
  { id: "silk_robe",    name: "เสื้อผ้าไหม",      category: "craft", price: 600,
    description: "เสื้อผ้าไหมราคาแพง" },

  // ─── Jewelry outputs ───────────────────────────────────────────────
  { id: "silver_ring", name: "แหวนเงิน",          category: "craft", price: 250,
    description: "แหวนเงินขัดเงา" },
  { id: "gold_ring",   name: "แหวนทอง",           category: "craft", price: 700,
    description: "แหวนทองที่ช่างฝีมือทำ" },
  { id: "jade_amulet", name: "เครื่องราง·หยก",    category: "craft", price: 1500,
    description: "เครื่องรางทำจากหยก" },

  // ─── Chef outputs (food) ───────────────────────────────────────────
  { id: "rice_dish",   name: "ข้าวหมูแดง",         category: "food", price: 60,
    description: "ข้าวจานเดียวเรียบง่าย กินแล้วฟื้นแรง",
    use: { t: "heal", hp: 40 } },
  { id: "spicy_stew",  name: "ต้มยำเข้มข้น",       category: "food", price: 90,
    description: "ต้มยำเผ็ดร้อน เพิ่มแรงเดินทาง",
    use: { t: "heal", hp: 60 } },
  { id: "moon_cake",   name: "ขนมไหว้พระจันทร์",   category: "food", price: 30,
    description: "ของหวานพื้นเมือง รสหวานหอม",
    use: { t: "heal", hp: 20 } },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
