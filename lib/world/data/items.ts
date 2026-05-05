import type { ItemDef } from "../types";

// Items table. Add new items here.
export const ITEMS: readonly ItemDef[] = [
  {
    id: "potion",
    name: "ยาเลือดเล็ก",
    description: "ยาฟื้นพลังชีวิต ใช้ในยามฉุกเฉิน",
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
  { id: "ginseng",     name: "โสม",              description: "รากโสมสด ใช้ฟื้นพลังภายในและทำยาบำรุง" },
  { id: "lotus_seed",  name: "เม็ดบัว",          description: "เม็ดบัวสด ใช้ทำยาฟื้นใจและล้างพิษ" },
  { id: "snow_lotus",  name: "บัวหิมะ",          description: "บัวหิมะที่ขึ้นบนเขาสูง ของวิเศษหายาก" },

  // ─── Venom / poisonous fauna ─────────────────────────────────────────
  { id: "viper_venom",     name: "พิษงู",         description: "ของเหลวสีเขียวเข้ม สกัดจากเขี้ยวงูเห่า" },
  { id: "scorpion_venom",  name: "พิษแมงป่อง",    description: "พิษอ่อนแต่ทำลายเส้นประสาท ใช้ในยาพิษ" },
  { id: "centipede_venom", name: "พิษตะขาบ",      description: "พิษหายากจากตะขาบยักษ์ มีราคาสูงในตลาดมืด" },

  // ─── Crafted intermediates ───────────────────────────────────────────
  { id: "iron_ingot",  name: "เหล็กแท่ง",        description: "เหล็กที่ถูกถลุงและตีเป็นแท่ง พร้อมขึ้นรูป" },
  { id: "leather",     name: "หนังฟอก",          description: "หนังสัตว์ที่ฟอกแล้ว เหมาะกับงานเย็บเสื้อหนัง" },
  { id: "cooked_meat", name: "เนื้อย่าง",        description: "เนื้อสดที่ปรุงแล้ว เพิ่มแรงระหว่างเดินทาง" },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
