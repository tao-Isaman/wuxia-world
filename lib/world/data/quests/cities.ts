import type { QuestDef } from "../../types";

// Side quests owned by content agent A — anchored to NPCs in
// lib/world/data/npcs/cities.ts. All `giverNpcId` and `turnInNpcId` values
// must match an id in that file. Dialog scene ids referenced from these
// quests must exist in lib/world/data/scenes-content/cities.ts.
export const QUESTS_CITIES: readonly QuestDef[] = [

  // ═══════════════════════════════════════════════════════════════════
  // city_capital_magistrate_wu — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 1. Investigation — dialog-only
  {
    id: "qc_capital_lost_ledger",
    name: "บัญชีคลังหลวงที่หายไป",
    description: "นายอำเภอหวู่ขอให้สืบหาบัญชีรายรับรายจ่ายของคลังหลวงที่ถูกขโมยจากห้องเก็บเอกสาร",
    briefSummary: "สืบหาบัญชีคลังที่หายและนำกลับมาให้นายอำเภอ",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "investigate",
        description: "สืบสวนว่าใครขโมยบัญชีคลังหลวง พูดคุยกับเสมียนในสำนักงาน",
      },
      {
        id: "find_ledger",
        description: "ค้นหาบัญชีที่ถูกซ่อน ต้องมีกุญแจเก่าอยู่ในครอบครอง",
        autoAdvance: { t: "hasItem", itemId: "old_key", count: 1 },
      },
      {
        id: "return",
        description: "นำบัญชีกลับคืนนายอำเภอหวู่",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "city_capital_magistrate_wu", amount: 8 },
    ],
  },

  // 2. Investigation — defeat & dialog
  {
    id: "qc_capital_corrupt_clerk",
    name: "เสมียนฉ้อฉล",
    description: "สืบสวนเสมียนในสำนักงานนายอำเภอที่ต้องสงสัยว่ารับสินบนจากพ่อค้า",
    briefSummary: "รวบรวมหลักฐานการรับสินบนของเสมียนในสำนักงาน",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "surveil",
        description: "ติดตามสังเกตเสมียนต้องสงสัยในและรอบสำนักงาน",
      },
      {
        id: "confront",
        description: "ปราบโจรหรือนักเลงที่เป็นพวกพ้องของเสมียน เพื่อให้ได้หลักฐาน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "รายงานหลักฐานต่อนายอำเภอหวู่",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 40 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "city_capital_magistrate_wu", amount: 10 },
    ],
  },

  // 3. Deliver — carry document across cities
  {
    id: "qc_capital_royal_pardon",
    name: "หนังสือนิรโทษกรรม",
    description: "นายอำเภอหวู่ขอให้นำหนังสือสำคัญไปส่งที่จินหลิงเพื่อช่วยเหลือนักโทษที่ถูกจำคุกอย่างไม่เป็นธรรม",
    briefSummary: "ส่งหนังสือนิรโทษกรรมจากนครหลวงไปยังจินหลิง",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "receive_letter",
        description: "รับหนังสือจากนายอำเภอหวู่",
      },
      {
        id: "travel_jinling",
        description: "เดินทางไปยังจินหลิง",
        autoAdvance: { t: "visitedLocation", locationId: "city_jinling" },
      },
      {
        id: "deliver",
        description: "ส่งหนังสือให้ผู้รับและกลับมารายงานนายอำเภอ",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "good", amount: 10 },
      { t: "npcRelationship", npcId: "city_capital_magistrate_wu", amount: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_capital_physician_lin — 2 quests
  // ═══════════════════════════════════════════════════════════════════

  // 4. Fetch — auto-advance on item
  {
    id: "qc_capital_rare_herb",
    name: "บัวหิมะเพื่อผู้ป่วย",
    description: "หมอหลินต้องการบัวหิมะสำหรับปรุงยาพิเศษให้ผู้ป่วยหนัก",
    briefSummary: "หาบัวหิมะหนึ่งดอกส่งให้หมอหลินในนครหลวง",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    stages: [
      {
        id: "find_herb",
        description: "หาบัวหิมะ — พบได้บนภูเขาสูงทางเหนือ",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      {
        id: "deliver_herb",
        description: "นำบัวหิมะไปส่งหมอหลินที่นครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "ginseng", count: 3 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "city_capital_physician_lin", amount: 10 },
    ],
  },

  // 5. Investigation — dialog
  {
    id: "qc_capital_stolen_formula",
    name: "ตำรับยาที่ถูกขโมย",
    description: "ตำรับยาลับของหมอหลินถูกขโมยไป ต้องสืบและนำมันกลับคืน",
    briefSummary: "สืบหาและนำตำรับยาลับของหมอหลินกลับคืน",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    prereqs: { t: "npcRelationship", npcId: "city_capital_physician_lin", min: 5 },
    stages: [
      {
        id: "investigate",
        description: "สืบสวนว่าใครขโมยตำรับยาจากคลินิก",
      },
      {
        id: "find_thief",
        description: "ปราบโจรที่ขโมยตำรับยาและนำมันกลับคืน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "fortune_thief", count: 1 },
      },
      {
        id: "return_formula",
        description: "นำตำรับยาคืนให้หมอหลิน — ต้องมีตำราขั้นสูงอยู่ในครอบครอง",
        autoAdvance: { t: "hasItem", itemId: "book_advanced", count: 1 },
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 40 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "npcRelationship", npcId: "city_capital_physician_lin", amount: 15 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_xixia_blacksmith_dugu — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 6. Fetch — auto-advance on item
  {
    id: "qc_xixia_iron_supply",
    name: "แร่เหล็กสำหรับตีเหล็ก",
    description: "ช่างดูกูต้องการแร่เหล็กสิบก้อนสำหรับงานตีอาวุธที่ค้างอยู่",
    briefSummary: "จัดหาแร่เหล็กสิบก้อนให้ช่างดูกู",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    stages: [
      {
        id: "gather_ore",
        description: "รวบรวมแร่เหล็กสิบก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 10 },
      },
      {
        id: "deliver_ore",
        description: "นำแร่เหล็กส่งให้ช่างดูกูที่ซีเซี่ย",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "iron_blade", count: 2 },
      { t: "wExp", amount: 25 },
      { t: "npcRelationship", npcId: "city_xixia_blacksmith_dugu", amount: 8 },
    ],
  },

  // 7. Fetch rare — mithril for legendary weapon
  {
    id: "qc_xixia_legendary_blade",
    name: "ดาบในตำนาน",
    description: "ช่างดูกูฝันอยากตีดาบในตำนาน ต้องการแร่เทพสองก้อนจากถ้ำอันตราย",
    briefSummary: "นำแร่เทพสองก้อนให้ช่างดูกูตีดาบในตำนาน",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    prereqs: { t: "npcRelationship", npcId: "city_xixia_blacksmith_dugu", min: 5 },
    stages: [
      {
        id: "defeat_guardian",
        description: "ปราบผู้พิทักษ์ถ้ำเพื่อเข้าถึงแร่เทพ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 2 },
      },
      {
        id: "gather_mithril",
        description: "เก็บแร่เทพสองก้อนจากถ้ำ",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 2 },
      },
      {
        id: "deliver_mithril",
        description: "นำแร่เทพส่งช่างดูกูและรับดาบ",
      },
    ],
    rewards: [
      { t: "gold", amount: 50 },
      { t: "item", itemId: "steel_sword", count: 1 },
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "npcRelationship", npcId: "city_xixia_blacksmith_dugu", amount: 15 },
    ],
  },

  // 8. Defeat — bandit chief
  {
    id: "qc_xixia_bandit_ore",
    name: "โจรปล้นกองคาราวานแร่",
    description: "ช่างดูกูต้องการให้จัดการหัวหน้าโจรที่ขัดขวางการขนส่งแร่เหล็ก",
    briefSummary: "ปราบหัวหน้าโจรที่ปล้นกองคาราวานแร่เหล็ก",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    stages: [
      {
        id: "defeat_chief",
        description: "ปราบหัวหน้าโจรแห่งชายป่า",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานให้ช่างดูกูทราบ",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "fame", amount: 3 },
      { t: "npcRelationship", npcId: "city_xixia_blacksmith_dugu", amount: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_dali_scholar_duan — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 9. Fetch — auto-advance via defeating beasts + visiting ruin
  {
    id: "qc_dali_ancient_scroll",
    name: "คัมภีร์โบราณในวัดร้าง",
    description: "บัณฑิตต้วนต้องการคัมภีร์โบราณจากวัดร้างที่มีสัตว์ป่าอาศัยอยู่",
    briefSummary: "นำคัมภีร์โบราณจากวัดร้างมาให้บัณฑิตต้วน",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "clear_beasts",
        description: "ปราบสัตว์ป่าที่ยึดวัดร้าง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_beast", count: 2 },
      },
      {
        id: "find_scroll",
        description: "หาคัมภีร์ในห้องสมุดเก่าของวัด — ต้องมีตำราเบื้องต้น",
        autoAdvance: { t: "hasItem", itemId: "book_basic", count: 1 },
      },
      {
        id: "return_scroll",
        description: "นำคัมภีร์ส่งบัณฑิตต้วนที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 40 },
      { t: "item", itemId: "book_inter", count: 1 },
      { t: "npcRelationship", npcId: "city_dali_scholar_duan", amount: 10 },
    ],
  },

  // 10. Visit — travel to suzhou and return
  {
    id: "qc_dali_history_route",
    name: "แผนที่ประวัติศาสตร์",
    description: "บัณฑิตต้วนต้องการข้อมูลเกี่ยวกับสภาพปัจจุบันของซูโจวเพื่อจัดทำแผนที่ประวัติศาสตร์",
    briefSummary: "ไปเยี่ยมซูโจวและกลับมารายงานบัณฑิตต้วน",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "visit_suzhou",
        description: "เดินทางไปยังซูโจวและสำรวจเมือง",
        autoAdvance: { t: "visitedLocation", locationId: "city_suzhou" },
      },
      {
        id: "report_back",
        description: "กลับมารายงานบัณฑิตต้วนที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "city_dali_scholar_duan", amount: 8 },
    ],
  },

  // 11. Deliver — cross-NPC delivery (dali → suzhou → dali)
  {
    id: "qc_dali_missing_page",
    name: "หน้าหนังสือที่หายไป",
    description: "บัณฑิตต้วนส่งหนังสือประวัติศาสตร์ขาดหน้ากลาง ต้องไปติดต่อพ่อค้าหนังสือในซูโจวเพื่อขอคืน",
    briefSummary: "นำหน้าหนังสือที่หายไปกลับคืนจากพ่อค้าในซูโจว",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "travel_suzhou",
        description: "เดินทางไปซูโจวพร้อมกระดาษที่บัณฑิตต้วนให้",
        autoAdvance: { t: "visitedLocation", locationId: "city_suzhou" },
      },
      {
        id: "negotiate",
        description: "เจรจาขอหน้าหนังสือคืนจากพ่อค้าหนังสือ",
      },
      {
        id: "return_page",
        description: "นำหน้าหนังสือกลับต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 35 },
      { t: "item", itemId: "book_basic", count: 1 },
      { t: "npcRelationship", npcId: "city_dali_scholar_duan", amount: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_dali_herbalist_bai — 2 quests
  // ═══════════════════════════════════════════════════════════════════

  // 12. Fetch — auto-advance on ginseng count
  {
    id: "qc_dali_herb_collection",
    name: "เก็บโสมห้าหัว",
    description: "หมอยาไป๋ต้องการโสมห้าหัวสำหรับยาล็อตส่งออก พื้นที่เก็บโสมมีสัตว์ป่าชุม",
    briefSummary: "เก็บโสมห้าหัวและส่งให้หมอยาไป๋",
    type: "side",
    giverNpcId: "city_dali_herbalist_bai",
    stages: [
      {
        id: "clear_area",
        description: "ปราบสัตว์ป่าในพื้นที่เก็บโสม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_wolf", count: 1 },
      },
      {
        id: "gather_ginseng",
        description: "เก็บโสมห้าหัวจากชายป่าชื้น",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 5 },
      },
      {
        id: "deliver_ginseng",
        description: "ส่งโสมให้หมอยาไป๋ที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "potion", count: 3 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "city_dali_herbalist_bai", amount: 10 },
    ],
  },

  // 13. Defeat — kill venom beast
  {
    id: "qc_dali_venom_beast",
    name: "งูเห่ายักษ์และพิษต้านพิษ",
    description: "งูเห่ายักษ์รบกวนชาวบ้านใกล้ต้าหลี่ หมอยาไป๋ต้องการพิษของมันเพื่อทำยาต้านพิษ",
    briefSummary: "ปราบงูเห่ายักษ์และนำพิษมาให้หมอยาไป๋",
    type: "side",
    giverNpcId: "city_dali_herbalist_bai",
    stages: [
      {
        id: "defeat_viper",
        description: "ปราบงูเห่ายักษ์ที่ป่าชายเขาทางตะวันออก",
        autoAdvance: { t: "defeatedOpponent", opponentId: "viper_snake", count: 1 },
      },
      {
        id: "collect_venom",
        description: "เก็บพิษงูเห่า — ต้องมีพิษงูอยู่ในครอบครอง",
        autoAdvance: { t: "hasItem", itemId: "viper_venom", count: 1 },
      },
      {
        id: "deliver_venom",
        description: "ส่งพิษให้หมอยาไป๋ที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "wExp", amount: 45 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "city_dali_herbalist_bai", amount: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_yangzhou_chef_su — 2 quests
  // ═══════════════════════════════════════════════════════════════════

  // 14. Fetch — rare fish
  {
    id: "qc_yangzhou_rare_fish",
    name: "ปลามังกรสำหรับลูกค้าขาใหญ่",
    description: "พ่อครัวซูต้องการปลามังกรสำหรับเมนูพิเศษที่ลูกค้าขาใหญ่จอง",
    briefSummary: "หาปลามังกรให้พ่อครัวซูในหยางโจว",
    type: "side",
    giverNpcId: "city_yangzhou_chef_su",
    stages: [
      {
        id: "find_fish",
        description: "หาปลามังกรจากแม่น้ำลึก",
        autoAdvance: { t: "hasItem", itemId: "fish_dragon", count: 1 },
      },
      {
        id: "deliver_fish",
        description: "ส่งปลามังกรให้พ่อครัวซู",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "item", itemId: "spicy_stew", count: 2 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "city_yangzhou_chef_su", amount: 10 },
    ],
  },

  // 15. Deliver — cross-city delivery (yangzhou → capital)
  {
    id: "qc_yangzhou_spice_delivery",
    name: "เครื่องเทศพิเศษจากนครหลวง",
    description: "พ่อครัวซูต้องการคนรับเครื่องเทศพิเศษจากนครหลวงและนำมาส่งที่หยางโจว",
    briefSummary: "นำเครื่องเทศพิเศษจากนครหลวงมาส่งพ่อครัวซู",
    type: "side",
    giverNpcId: "city_yangzhou_chef_su",
    stages: [
      {
        id: "travel_capital",
        description: "เดินทางไปนครหลวงและพบนายหวังเพื่อรับสินค้า",
        autoAdvance: { t: "visitedLocation", locationId: "city_capital" },
      },
      {
        id: "return_delivery",
        description: "นำเครื่องเทศกลับมาส่งที่หยางโจว",
      },
    ],
    rewards: [
      { t: "gold", amount: 180 },
      { t: "item", itemId: "rice_dish", count: 3 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "city_yangzhou_chef_su", amount: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_yangzhou_fisherman_chen — 2 quests
  // ═══════════════════════════════════════════════════════════════════

  // 16. Defeat — pirates
  {
    id: "qc_yangzhou_river_pirates",
    name: "โจรสลัดแม่น้ำ",
    description: "ชาวประมงเฉินต้องการให้ปราบโจรสลัดที่ยึดท่าเรือทางเหนือของหยางโจว",
    briefSummary: "ปราบโจรสลัดสามคนเพื่อปลดปล่อยท่าเรือ",
    type: "side",
    giverNpcId: "city_yangzhou_fisherman_chen",
    stages: [
      {
        id: "defeat_pirates",
        description: "ปราบโจรสลัดแม่น้ำอย่างน้อยสามคน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 3 },
      },
      {
        id: "report",
        description: "กลับมารายงานชาวประมงเฉิน",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 55 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "city_yangzhou_fisherman_chen", amount: 15 },
    ],
  },

  // 17. Investigation — find sunken cargo
  {
    id: "qc_yangzhou_sunken_cargo",
    name: "สินค้าจมน้ำ",
    description: "เรือสินค้าของชาวประมงเฉินจมตอนโจรสลัดโจมตี มีหีบทองแดงอยู่ในนั้น ต้องการคนช่วยกู้",
    briefSummary: "กู้หีบทองแดงจากเรือที่จมในแม่น้ำหยางโจว",
    type: "side",
    giverNpcId: "city_yangzhou_fisherman_chen",
    prereqs: { t: "questStatus", questId: "qc_yangzhou_river_pirates", status: "done" },
    stages: [
      {
        id: "defeat_guard",
        description: "ปราบโจรสลัดที่ยังเฝ้าซากเรืออยู่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
      {
        id: "collect_cargo",
        description: "กู้แร่ทองแดงจากซากเรือ",
        autoAdvance: { t: "hasItem", itemId: "copper_ore", count: 5 },
      },
      {
        id: "return_cargo",
        description: "ส่งสินค้าคืนชาวประมงเฉิน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "item", itemId: "copper_ore", count: 3 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "city_yangzhou_fisherman_chen", amount: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_suzhou_weaver_mei — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 18. Deliver — carry silk to capital
  {
    id: "qc_suzhou_silk_shipment",
    name: "ส่งผ้าไหมสำหรับราชสำนัก",
    description: "ช่างทอเหมยต้องการคนส่งผ้าไหมล็อตสำคัญไปยังนครหลวง คนส่งเดิมล้มป่วย",
    briefSummary: "ส่งผ้าไหมจากซูโจวไปยังนครหลวงในเวลาที่กำหนด",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "receive_silk",
        description: "รับผ้าไหมและใบสั่งงานจากช่างทอเหมย",
      },
      {
        id: "travel_capital",
        description: "เดินทางไปนครหลวงพร้อมผ้าไหม",
        autoAdvance: { t: "visitedLocation", locationId: "city_capital" },
      },
      {
        id: "deliver_and_return",
        description: "ส่งผ้าไหมและนำใบรับคืนให้ช่างทอเหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "item", itemId: "silk_robe", count: 1 },
      { t: "wExp", amount: 45 },
      { t: "npcRelationship", npcId: "city_suzhou_weaver_mei", amount: 10 },
    ],
  },

  // 19. Fetch — lotus seeds for dye
  {
    id: "qc_suzhou_dye_ingredient",
    name: "เม็ดบัวสำหรับสีย้อม",
    description: "ช่างทอเหมยต้องการเม็ดบัวห้าหัวสำหรับสีย้อมพิเศษที่ทำให้ผ้าไหมโดดเด่น",
    briefSummary: "เก็บเม็ดบัวห้าหัวจากป่าชุ่มน้ำทางใต้ของซูโจว",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "gather_lotus",
        description: "เก็บเม็ดบัวห้าหัวจากป่าชุ่มน้ำ",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 },
      },
      {
        id: "deliver_lotus",
        description: "ส่งเม็ดบัวให้ช่างทอเหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "cloth_robe", count: 1 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "city_suzhou_weaver_mei", amount: 8 },
    ],
  },

  // 20. Investigation — expose copycat guild
  {
    id: "qc_suzhou_copycat_guild",
    name: "กลุ่มช่างปลอม",
    description: "กลุ่มช่างปลอมลอกลวดลายผ้าไหมของช่างทอเหมย ต้องสืบที่ซ่องและรายงาน",
    briefSummary: "สืบที่ซ่องของกลุ่มช่างปลอมในซูโจวและรายงานช่างทอเหมย",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "surveil_market",
        description: "สังเกตตลาดริมน้ำหาพ่อค้าที่ขายผ้าลอกลวดลาย",
      },
      {
        id: "confront_guild",
        description: "ปราบนักเลงที่คุ้มครองกลุ่มช่างปลอม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "ruffian", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานช่างทอเหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 180 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "city_suzhou_weaver_mei", amount: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_jinling_strategist_kong — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 21. Visit + investigation — spy network
  {
    id: "qc_jinling_spy_network",
    name: "เครือข่ายสายลับ",
    description: "นักยุทธศาสตร์กงต้องการข้อมูลเกี่ยวกับสายลับที่แทรกซึมสำนักในฉางอัน",
    briefSummary: "ไปสืบข้อมูลที่ฉางอันแล้วกลับมารายงานนักยุทธศาสตร์กง",
    type: "side",
    giverNpcId: "city_jinling_strategist_kong",
    stages: [
      {
        id: "visit_changan",
        description: "เดินทางไปฉางอันเพื่อสืบข้อมูล",
        autoAdvance: { t: "visitedLocation", locationId: "city_changan" },
      },
      {
        id: "observe",
        description: "สังเกตสถานการณ์ที่ประตูเมืองและตลาด",
      },
      {
        id: "report_back",
        description: "กลับมารายงานนักยุทธศาสตร์กงที่จินหลิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "city_jinling_strategist_kong", amount: 10 },
    ],
  },

  // 22. Deliver — coded letter to scholar in dali
  {
    id: "qc_jinling_coded_letter",
    name: "จดหมายรหัสลับ",
    description: "นักยุทธศาสตร์กงต้องการให้นำจดหมายรหัสลับไปให้บัณฑิตในต้าหลี่แปล แล้วนำผลการแปลกลับมา",
    briefSummary: "ส่งจดหมายรหัสลับไปที่ต้าหลี่และนำผลการแปลกลับมาจินหลิง",
    type: "side",
    giverNpcId: "city_jinling_strategist_kong",
    stages: [
      {
        id: "travel_dali",
        description: "เดินทางไปต้าหลี่พร้อมจดหมาย",
        autoAdvance: { t: "visitedLocation", locationId: "city_dali" },
      },
      {
        id: "get_translation",
        description: "ให้บัณฑิตต้วนแปลจดหมายรหัสลับ",
      },
      {
        id: "return_result",
        description: "นำผลการแปลกลับมาส่งนักยุทธศาสตร์กงที่จินหลิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "city_jinling_strategist_kong", amount: 12 },
    ],
  },

  // 23. Escort — guide defector from changan to jinling
  {
    id: "qc_jinling_defector",
    name: "คุ้มครองผู้แปรพักตร์",
    description: "นักยุทธศาสตร์กงต้องการให้พาผู้แปรพักตร์จากสำนักหนึ่งออกมาจากฉางอันอย่างปลอดภัย",
    briefSummary: "ไปรับผู้แปรพักตร์ที่ฉางอันและพาปลอดภัยมาจินหลิง",
    type: "side",
    giverNpcId: "city_jinling_strategist_kong",
    prereqs: { t: "npcRelationship", npcId: "city_jinling_strategist_kong", min: 10 },
    stages: [
      {
        id: "travel_changan",
        description: "เดินทางไปฉางอันเพื่อพบผู้แปรพักตร์ที่โรงเตี๊ยมชายเมือง",
        autoAdvance: { t: "visitedLocation", locationId: "city_changan" },
      },
      {
        id: "defeat_pursuers",
        description: "ปราบผู้ไล่ตามที่ขัดขวางการเดินทาง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_disciple", count: 2 },
      },
      {
        id: "escort_complete",
        description: "พาผู้แปรพักตร์มาถึงจินหลิงปลอดภัย",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 8 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "npcRelationship", npcId: "city_jinling_strategist_kong", amount: 15 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // city_changan_guard_yan — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // 24. Investigation — gate intruder
  {
    id: "qc_changan_gate_intruder",
    name: "ผู้บุกรุกประตูเมือง",
    description: "ยามหยานพบว่ามีคนแอบผ่านประตูเมืองฉางอันโดยไม่มีใบอนุญาต ต้องตามหาว่าหนีไปไหน",
    briefSummary: "สืบหาผู้บุกรุกที่แอบผ่านประตูเมืองฉางอัน",
    type: "side",
    giverNpcId: "city_changan_guard_yan",
    stages: [
      {
        id: "investigate",
        description: "ติดตามรอยเท้าจากประตูเมืองไปยังตลาดตะวันออก",
      },
      {
        id: "confront",
        description: "ปราบผู้บุกรุกและส่งตัวให้ทางการ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "petty_thief", count: 1 },
      },
      {
        id: "report",
        description: "รายงานผลต่อยามหยาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 35 },
      { t: "npcRelationship", npcId: "city_changan_guard_yan", amount: 8 },
    ],
  },

  // 25. Branching moral — weapon smuggle
  {
    id: "qc_changan_missing_soldier",
    name: "ทหารที่หายไป",
    description: "ทหารในหน่วยของยามหยานหายตัวไปสามวัน ต้องตามหาให้พบ",
    briefSummary: "ตามหาทหารที่หายไปของยามหยาน",
    type: "side",
    giverNpcId: "city_changan_guard_yan",
    stages: [
      {
        id: "search",
        description: "ค้นหาทหารที่หายไปบริเวณชายเมืองด้านใต้",
      },
      {
        id: "defeat_captors",
        description: "ปราบผู้จับกุมทหารที่ซ่อนอยู่ในโกดัง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 2 },
      },
      {
        id: "rescue",
        description: "ช่วยทหารออกมาและพากลับรายงานยามหยาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 55 },
      { t: "trait", trait: "good", amount: 8 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "npcRelationship", npcId: "city_changan_guard_yan", amount: 12 },
    ],
  },

  // 26 (bonus) — branching moral: weapon smuggling
  {
    id: "qc_changan_weapon_smuggle",
    name: "การลักลอบขนอาวุธ",
    description: "ยามหยานพบหลักฐานการลักลอบขนอาวุธเข้าเมือง ต้องสืบว่าผู้รับคือใครและตัดสินใจว่าจะทำอย่างไร",
    briefSummary: "สืบการลักลอบขนอาวุธและตัดสินใจระหว่างกฎหมายกับความยุติธรรม",
    type: "side",
    giverNpcId: "city_changan_guard_yan",
    prereqs: { t: "questStatus", questId: "qc_changan_missing_soldier", status: "done" },
    stages: [
      {
        id: "investigate",
        description: "สืบสวนเครือข่ายลักลอบขนอาวุธในเมืองฉางอัน",
      },
      {
        id: "defeat_smugglers",
        description: "ปราบผู้ลักลอบขนอาวุธเพื่อหาข้อมูลเพิ่มเติม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 },
      },
      {
        id: "decide",
        description: "ตัดสินใจว่าจะรายงานหรือนิ่งเฉย — กลับมาหารือกับยามหยาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "city_changan_guard_yan", amount: 10 },
    ],
  },
];
