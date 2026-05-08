import type { ItemDef } from "../types";

// Items table — every entry has an explicit `category` and a base `price`
// in gold. Shops use these for buy/sell; inns may restrict acceptance to
// specific categories. Items without a price (or price 0) are unsellable
// (quest items / story items).
export const ITEMS: readonly ItemDef[] = [
  // ─── Quest / story items ───────────────────────────────────────────
  // Quest items use price: 0 so shops won't sell them and players can't
  // dispose of them by accident — they're consumed via `takeItem` effects
  // in the completion dialog.
  { id: "old_key", name: "กุญแจเก่า", category: "quest", price: 0,
    description: "กุญแจเก่าแก่ ไม่รู้ว่าใช้กับประตูไหน" },
  { id: "qst_capital_spice", name: "เครื่องเทศพิเศษนครหลวง", category: "quest", price: 0,
    description: "ห่อเครื่องเทศพิเศษจากพ่อค้าหวังในนครหลวง สำหรับส่งให้พ่อครัวซูที่หยางโจว" },
  { id: "qst_capital_silk", name: "ผ้าไหมล็อตราชสำนัก", category: "quest", price: 0,
    description: "ผ้าไหมคุณภาพสูงล็อตสำคัญจากซีเซี่ย สำหรับส่งให้ลูกค้าในนครหลวง" },
  { id: "qst_capital_silk_receipt", name: "ใบรับสินค้าจากนครหลวง", category: "quest", price: 0,
    description: "ใบรับสินค้าผ้าไหมที่ลูกค้าในนครหลวงเซ็นรับ — ต้องนำกลับให้ช่างทอเหมยที่ซีเซี่ย" },
  { id: "qst_amnesty_letter", name: "หนังสือนิรโทษกรรม", category: "quest", price: 0,
    description: "หนังสือสำคัญจากนายอำเภอหวู่ สำหรับส่งให้ผู้พิพากษาในจินหลิง" },
  { id: "qst_amnesty_receipt", name: "ใบรับหนังสือนิรโทษกรรม", category: "quest", price: 0,
    description: "ใบเซ็นรับหนังสือจากผู้พิพากษาที่จินหลิง — ต้องกลับมารายงานนายอำเภอหวู่" },
  { id: "qst_dali_book_pages", name: "หน้าหนังสือประวัติศาสตร์", category: "quest", price: 0,
    description: "หน้าหนังสือที่ขาดหายของบัณฑิตต้วน ได้คืนจากพ่อค้าหนังสือในซูโจว" },
  { id: "qst_dali_encrypted", name: "จดหมายรหัสลับ", category: "quest", price: 0,
    description: "จดหมายรหัสลับจากนักยุทธศาสตร์กง สำหรับให้บัณฑิตในต้าหลี่แปล" },
  { id: "qst_dali_decoded", name: "คำแปลจดหมายลับ", category: "quest", price: 0,
    description: "คำแปลจดหมายรหัสลับ — ต้องนำกลับให้นักยุทธศาสตร์กงที่จินหลิง" },
  { id: "qst_kunlun_evidence", name: "ม้วนหนังสือพิสูจน์ฤๅษี", category: "quest", price: 0,
    description: "ม้วนหนังสือเก่าที่บัณฑิตเว่ยชิงเหวินเก็บไว้ในถ้ำน้ำแข็งไหม — หลักฐานพิสูจน์ความบริสุทธิ์ของฤๅษีชิวเฉียน" },
  { id: "qst_kunlun_snow_ginseng", name: "โสมหิมะคุนหลุน", category: "quest", price: 0,
    description: "โสมหายากที่งอกบนนิรันดร์คุนหลุนเท่านั้น — ฉ่ำเย็นเหมือนน้ำแข็ง ใช้ปรุงยาขจัดไข้น้ำแข็งได้" },
  { id: "qst_jinshe_golden_snake", name: "งูทองของซวีเหลิงชิง", category: "quest", price: 0,
    description: "งูทองที่หายไปในถ้ำงูทอง — ตัวเล็กแต่ฉลาด ปลายหางเหมือนปอยทอง" },
  { id: "qst_motian_ancient_sword", name: "ดาบโบราณของเหลียงเก๋อ", category: "quest", price: 0,
    description: "ดาบเก่าที่นอนอยู่ในคลังสมบัติลับ ใบดาบขึ้นสนิม แต่จิตวิญญาณยังเรียกร้องเจ้าของอยู่" },

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

  // ─── Accessory outputs ─────────────────────────────────────────────
  // Belts, fans, talismans — crafted by `accessory` artisans. These are
  // currently flavour items (no `use` effect); future iterations can
  // wire them up as equippable trinkets in `EQUIPMENT`.
  { id: "silk_fan",       name: "พัดผ้าไหม",          category: "craft", price: 220,
    description: "พัดผ้าไหมประดับดวงตรา ใช้คลายร้อนและพกติดกายของผู้สูงศักดิ์" },
  { id: "warrior_belt",   name: "เข็มขัดนักรบ",       category: "craft", price: 320,
    description: "เข็มขัดหนังเสริมโลหะ พื้นฐานของยอดยุทธผู้ออกศึก" },
  { id: "jade_pendant",   name: "จี้หยก",              category: "craft", price: 480,
    description: "จี้หยกแกะสลักลวดลายเมฆ ผูกด้วยเชือกถัก" },
  { id: "fortune_charm",  name: "เครื่องรางเสริมโชค",  category: "craft", price: 280,
    description: "เครื่องรางพันด้ายแดง ผู้คนเชื่อกันว่าเสริมโชคยามเดินทาง" },

  // ─── ตำราวิชา (manuals — single-use, teach a move skill or inner art) ─
  // Stat requirement is on the player's *base* stat (not derived) — see
  // MANUAL_TIER_REQ in lib/world/types.ts. Tier→req: 0=0 · 1=10 · 2=15 ·
  // 3=20 · 4=30. Each manual picks ONE stat that fits the move's nature
  // (STR for fist/blade, POW for internal, AGI for evasive, DEX for hidden
  // / venom, VIT for hard arts).

  // Move-skill manuals — T0 (req 0)
  { id: "man_sf", name: "ตำราหมัดเส้าหลิน", category: "manual", price: 200,
    description: "ตำรามรดกของวัดเส้าหลิน · ฝึกหมัดสายแข็งภายนอก",
    use: { t: "manualLearnSkill", skillId: "sf", reqStat: "STR", reqValue: 0 } },
  { id: "man_tj", name: "ตำราไทจี้เจี้ยน", category: "manual", price: 200,
    description: "ตำรากระบี่ไทจี้ของอู่ตัง · เน้นความสงบและไหลลื่น",
    use: { t: "manualLearnSkill", skillId: "tj", reqStat: "POW", reqValue: 0 } },
  { id: "man_qf", name: "ตำราชิงเฟิงเจี้ยน", category: "manual", price: 200,
    description: "ตำรากระบี่ลมพื้นฐานของยุทธจักร · เน้นความเร็ว",
    use: { t: "manualLearnSkill", skillId: "qf", reqStat: "AGI", reqValue: 0 } },
  { id: "man_ns1", name: "ตำรากระบี่เบื้องต้น", category: "manual", price: 200,
    description: "ตำราดาบโค้งพื้นฐาน · ใช้ในการฝึกฝนปรมาจารย์รุ่นเริ่ม",
    use: { t: "manualLearnSkill", skillId: "ns1", reqStat: "STR", reqValue: 0 } },
  { id: "man_nc1", name: "ตำราประกาศิตพรรคยาจก", category: "manual", price: 200,
    description: "ตำราหมัดของพรรคยาจก · เน้นแรงเรียบง่ายแต่หนัก",
    use: { t: "manualLearnSkill", skillId: "nc1", reqStat: "STR", reqValue: 0 } },
  { id: "man_nc3", name: "ตำรากระบี่น้ำ", category: "manual", price: 200,
    description: "ตำรากระบี่สายน้ำ · ปราณภายในพื้นฐาน",
    use: { t: "manualLearnSkill", skillId: "nc3", reqStat: "POW", reqValue: 0 } },
  { id: "man_nc7", name: "ตำราดาบยาวพื้นฐาน", category: "manual", price: 200,
    description: "ตำราดาบยาวสองมือ · พื้นฐานของนักรบเดินทาง",
    use: { t: "manualLearnSkill", skillId: "nc7", reqStat: "STR", reqValue: 0 } },
  { id: "man_nc9", name: "ตำราพัดพื้นฐาน", category: "manual", price: 200,
    description: "ตำราพัดสายภายใน · เหมาะกับศิลปินผู้ฝึกปราณ",
    use: { t: "manualLearnSkill", skillId: "nc9", reqStat: "POW", reqValue: 0 } },

  // Move-skill manuals — T1 (req 10)
  { id: "man_nd3", name: "ตำราดาบดาวเหนือ", category: "manual", price: 800,
    description: "ตำราดาบดาวเหนือ · ต้องการกำลังกายแข็งแกร่ง",
    use: { t: "manualLearnSkill", skillId: "nd3", reqStat: "STR", reqValue: 10 } },
  { id: "man_nm1", name: "ตำราดาบน้ำค้าง", category: "manual", price: 800,
    description: "ตำราดาบน้ำค้าง · ปราณภายในเป็นน้ำเย็น",
    use: { t: "manualLearnSkill", skillId: "nm1", reqStat: "POW", reqValue: 10 } },
  { id: "man_nm2", name: "ตำราฝ่ามือเกราะ", category: "manual", price: 800,
    description: "ตำราฝ่ามือเกราะ · บุกและกำบังเป็นหนึ่ง",
    use: { t: "manualLearnSkill", skillId: "nm2", reqStat: "STR", reqValue: 10 } },
  { id: "man_nd5", name: "ตำราหมัดอรหันต์", category: "manual", price: 800,
    description: "ตำราเส้าหลินขั้นกลาง · หมัดแข็งกร้าวเปลี่ยนเส้นทางมรรค",
    use: { t: "manualLearnSkill", skillId: "nd5", reqStat: "STR", reqValue: 10 } },
  { id: "man_nd9", name: "ตำราเข็มตีจุด", category: "manual", price: 800,
    description: "ตำราเข็มตีจุด · ต้องมีนิ้วมือไวมาก",
    use: { t: "manualLearnSkill", skillId: "nd9", reqStat: "DEX", reqValue: 10 } },
  { id: "man_nd10", name: "ตำรากรงเล็บเพลิง", category: "manual", price: 800,
    description: "ตำรากรงเล็บเพลิง · ฝ่ามือร้อนแรงดั่งไฟ",
    use: { t: "manualLearnSkill", skillId: "nd10", reqStat: "STR", reqValue: 10 } },
  { id: "man_nd11", name: "ตำรากระบี่ลม", category: "manual", price: 800,
    description: "ตำรากระบี่ลม · เน้นเคลื่อนไหวรวดเร็ว",
    use: { t: "manualLearnSkill", skillId: "nd11", reqStat: "AGI", reqValue: 10 } },
  { id: "man_pn", name: "ตำราเข็มพิษ", category: "manual", price: 800,
    description: "ตำราเข็มพิษ · ต้องการนิ้วเที่ยงตรง",
    use: { t: "manualLearnSkill", skillId: "pn", reqStat: "DEX", reqValue: 10 } },
  { id: "man_rf", name: "ตำราสะท้อนพลัง", category: "manual", price: 800,
    description: "ตำราสะท้อนพลังของอู่ตัง · ใช้ปราณภายในสะท้อนแรงคู่ต่อสู้",
    use: { t: "manualLearnSkill", skillId: "rf", reqStat: "POW", reqValue: 10 } },
  { id: "man_cs", name: "ตำราก้าวเมฆหมอก", category: "manual", price: 800,
    description: "ตำราก้าวเมฆหมอกของอู่ตัง · ต้องการความเร็วเหนือธรรมดา",
    use: { t: "manualLearnSkill", skillId: "cs", reqStat: "AGI", reqValue: 10 } },

  // Move-skill manuals — T2 (req 15)
  { id: "man_ne1", name: "ตำราสิบแปดฝ่ามือมังกร", category: "manual", price: 2000,
    description: "ตำราขั้นสูงของเส้าหลิน · ต้องการกำลังกายมหาศาล",
    use: { t: "manualLearnSkill", skillId: "ne1", reqStat: "STR", reqValue: 15 } },
  { id: "man_ne8", name: "ตำราหมัดเมา", category: "manual", price: 2000,
    description: "ตำราหมัดเมาของพรรคยาจก · เคลื่อนไหวประหลาดและคาดเดายาก",
    use: { t: "manualLearnSkill", skillId: "ne8", reqStat: "AGI", reqValue: 15 } },
  { id: "man_qzjf", name: "ตำรากระบี่ชวนจินก่า", category: "manual", price: 2000,
    description: "ตำรากระบี่สามทิศของฉวนเจิน · ปราณภายในเปี่ยมล้น",
    use: { t: "manualLearnSkill", skillId: "qzjf", reqStat: "POW", reqValue: 15 } },
  { id: "man_qz_punch", name: "ตำราหมัดชวนจินก่า", category: "manual", price: 2000,
    description: "ตำราหมัดของฉวนเจิน · ผสานปราณภายในกับหมัดให้เป็นหนึ่ง",
    use: { t: "manualLearnSkill", skillId: "qz_punch", reqStat: "POW", reqValue: 15 } },

  // Inner-art manuals — T0 (req 0)
  { id: "man_t0_sevenstar", name: "ตำราคัมภีร์เจ็ดดาวเหนือ", category: "manual", price: 300,
    description: "คัมภีร์ลมปราณเจ็ดดาวของยุทธจักร · เคลื่อนไหวเหมือนดาวบนฟ้า",
    use: { t: "manualLearnArt", artId: "t0_sevenstar", reqStat: "AGI", reqValue: 0, level: 1 } },
  { id: "man_t0_fiveyuan", name: "ตำราคัมภีร์ห้าธาตุ", category: "manual", price: 300,
    description: "คัมภีร์ห้าธาตุพื้นฐาน · เน้นความสมดุลของกายและปราณ",
    use: { t: "manualLearnArt", artId: "t0_fiveyuan", reqStat: "VIT", reqValue: 0, level: 1 } },
  { id: "man_t0_lohan", name: "ตำราคัมภีร์ลมปราณอรหันต์", category: "manual", price: 300,
    description: "คัมภีร์เส้าหลินพื้นฐาน · ปราณยาง·แข็ง",
    use: { t: "manualLearnArt", artId: "t0_lohan", reqStat: "STR", reqValue: 0, level: 1 } },
  { id: "man_t0_ironshirt", name: "ตำราคัมภีร์เกราะผ้าเหล็ก", category: "manual", price: 300,
    description: "คัมภีร์เกราะผ้าเหล็กของยุทธจักร · เน้นความทนทาน",
    use: { t: "manualLearnArt", artId: "t0_ironshirt", reqStat: "VIT", reqValue: 0, level: 1 } },

  // Inner-art manuals — T1 (req 10)
  { id: "man_t1_redlotus", name: "ตำราคัมภีร์บัวแดงเพลิง", category: "manual", price: 1000,
    description: "คัมภีร์ลมปราณบัวแดงเพลิงน้อย · ปราณยาง·ภายใน ต้องมีพื้นฐานปราณ",
    use: { t: "manualLearnArt", artId: "t1_redlotus", reqStat: "POW", reqValue: 10, level: 1 } },
  { id: "man_t1_blackiron", name: "ตำราคัมภีร์เหล็กดำ", category: "manual", price: 1000,
    description: "คัมภีร์ลมปราณเหล็กดำ · ปราณหยิน·ภายใน ต้องการพลังในกาย",
    use: { t: "manualLearnArt", artId: "t1_blackiron", reqStat: "POW", reqValue: 10, level: 1 } },
  { id: "man_t1_eagleclaw", name: "ตำราคัมภีร์กรงเล็บอินทรี", category: "manual", price: 1000,
    description: "คัมภีร์ลมปราณกรงเล็บอินทรี · ปราณยาง·ภายนอก",
    use: { t: "manualLearnArt", artId: "t1_eagleclaw", reqStat: "STR", reqValue: 10, level: 1 } },
  { id: "man_t1_goldenbell", name: "ตำราคัมภีร์กระดิ่งทอง", category: "manual", price: 1000,
    description: "คัมภีร์กระดิ่งทองของเส้าหลิน · ปราณแข็ง·ภายนอก ทำให้ร่างกายแข็งแกร่งดั่งเหล็ก",
    use: { t: "manualLearnArt", artId: "t1_goldenbell", reqStat: "VIT", reqValue: 10, level: 1 } },
  { id: "man_t1_whitehorse", name: "ตำราคัมภีร์ม้าขาว", category: "manual", price: 1000,
    description: "คัมภีร์ลมปราณม้าขาวของยุทธจักร · ปราณสมดุล",
    use: { t: "manualLearnArt", artId: "t1_whitehorse", reqStat: "AGI", reqValue: 10, level: 1 } },

  // Inner-art manuals — T2 (req 15)
  { id: "man_t2_plumblossom", name: "ตำราคัมภีร์เหมยห้ากลีบ", category: "manual", price: 2500,
    description: "คัมภีร์ลมปราณเหมยห้ากลีบ · ปราณหยิน·อ่อน หาเล่มได้ยาก",
    use: { t: "manualLearnArt", artId: "t2_plumblossom", reqStat: "POW", reqValue: 15, level: 1 } },
  { id: "man_t2_eighttri", name: "ตำราคัมภีร์แปดทิศ", category: "manual", price: 2500,
    description: "คัมภีร์ลมปราณแปดทิศมหาเวท · ปราณสมดุล·อ่อน",
    use: { t: "manualLearnArt", artId: "t2_eighttri", reqStat: "DEX", reqValue: 15, level: 1 } },
  { id: "man_t2_snakeform", name: "ตำราคัมภีร์งูพิษเจ็ดสี", category: "manual", price: 2500,
    description: "คัมภีร์ลมปราณงูพิษเจ็ดสีของพรรคเบญจพิษ · ปราณหยิน·อ่อน",
    use: { t: "manualLearnArt", artId: "t2_snakeform", reqStat: "DEX", reqValue: 15, level: 1 } },
  { id: "man_qzzq", name: "ตำราคัมภีร์ลมปราณชวนจินก่า", category: "manual", price: 2500,
    description: "คัมภีร์ลมปราณฉวนเจิน · ปราณยาง·ภายใน ต้องการพื้นฐานในกายแน่นแฟ้น",
    use: { t: "manualLearnArt", artId: "qzzq", reqStat: "POW", reqValue: 15, level: 1 } },

  // ─── องครักษ์เสื้อแพร — move-skill manuals (7) ─────────────────────
  { id: "man_jy_chain", name: "ตำราโซ่กรงเล็บฝึกหัด", category: "manual", price: 200,
    description: "ตำราโซ่ตวัดเริ่มต้นของกรมองครักษ์ · ปราณหยาง·ภายนอก",
    use: { t: "manualLearnSkill", skillId: "jy_chain", reqStat: "STR", reqValue: 0 } },
  { id: "man_jy_blade", name: "ตำราดาบราชสำนัก", category: "manual", price: 800,
    description: "ตำราดาบโค้งประจำกรมราช · ฟันแล้วทำให้แนวกันแตก",
    use: { t: "manualLearnSkill", skillId: "jy_blade", reqStat: "STR", reqValue: 10 } },
  { id: "man_jy_eagleclaw", name: "ตำรากรงเล็บอินทรี", category: "manual", price: 2500,
    description: "ตำรากรงเล็บอินทรีของกรมองครักษ์ · ฉีกตาผู้หลบหนี",
    use: { t: "manualLearnSkill", skillId: "jy_eagleclaw", reqStat: "DEX", reqValue: 15 } },
  { id: "man_jy_grapple", name: "ตำรากรงเล็บคว้าจับ", category: "manual", price: 2500,
    description: "ตำรากรงเล็บล็อกผู้หลบหนี · บีบจุดสำคัญให้ขยับไม่ได้",
    use: { t: "manualLearnSkill", skillId: "jy_grapple", reqStat: "STR", reqValue: 15 } },
  { id: "man_jy_sword", name: "ตำรากระบี่จารบุรุษ", category: "manual", price: 6000,
    description: "ตำรากระบี่นักจารกรรม · ลอบโจมตีและทำลายการมองเห็น",
    use: { t: "manualLearnSkill", skillId: "jy_sword", reqStat: "AGI", reqValue: 25 } },
  { id: "man_jy_chainmaster", name: "ตำราโซ่ทองเก้ามังกร", category: "manual", price: 6000,
    description: "ตำราโซ่ปลายทองเก้ามังกร · เครื่องมือสังหารยอดเยี่ยมของกรมราช",
    use: { t: "manualLearnSkill", skillId: "jy_chainmaster", reqStat: "DEX", reqValue: 25 } },
  { id: "man_jy_blade_king", name: "ตำราดาบเจ้าพระยา", category: "manual", price: 15000,
    description: "ตำราดาบของผู้บัญชาการกรมราช · เก็บไว้เพียงไม่กี่เล่มในแผ่นดิน",
    use: { t: "manualLearnSkill", skillId: "jy_blade_king", reqStat: "STR", reqValue: 40 } },

  // ─── องครักษ์เสื้อแพร — inner-art manuals (5) ──────────────────────
  { id: "man_jy_a0_brocade", name: "ตำราคัมภีร์ลมปราณเสื้อแพร", category: "manual", price: 500,
    description: "คัมภีร์ลมปราณเริ่มต้นขององครักษ์ · ปราณหยาง·ภายนอก",
    use: { t: "manualLearnArt", artId: "jy_a0_brocade", reqStat: "STR", reqValue: 0, level: 1 } },
  { id: "man_jy_a1_silktread", name: "ตำราคัมภีร์ฝีก้าวเส้นไหม", category: "manual", price: 2000,
    description: "คัมภีร์ฝีก้าวสายลมขององครักษ์ · ปราณหยาง·ภายนอก เน้น AGI",
    use: { t: "manualLearnArt", artId: "jy_a1_silktread", reqStat: "AGI", reqValue: 10, level: 1 } },
  { id: "man_jy_a2_goldarmor", name: "ตำราคัมภีร์เกราะทองอนุรักษ์", category: "manual", price: 5000,
    description: "คัมภีร์เกราะทองคุ้มภัย · ปราณหยาง·ภายนอก เน้น VIT",
    use: { t: "manualLearnArt", artId: "jy_a2_goldarmor", reqStat: "VIT", reqValue: 15, level: 1 } },
  { id: "man_jy_a3_thunderstride", name: "ตำราคัมภีร์ฟ้าผ่าก้าวเดิน", category: "manual", price: 12000,
    description: "คัมภีร์ฝีก้าวสายฟ้า · ปราณหยาง·ภายนอก ขั้นสูง",
    use: { t: "manualLearnArt", artId: "jy_a3_thunderstride", reqStat: "AGI", reqValue: 25, level: 1 } },
  { id: "man_jy_a4_brocadelord", name: "ตำราคัมภีร์เจ้านายเสื้อแพร", category: "manual", price: 30000,
    description: "คัมภีร์ลับของผู้บัญชาการกรม · ปราณหยาง·ภายนอก สูงสุดของสำนัก",
    use: { t: "manualLearnArt", artId: "jy_a4_brocadelord", reqStat: "STR", reqValue: 40, level: 1 } },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
