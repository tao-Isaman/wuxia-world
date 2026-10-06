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
    description: "นายอำเภอหวู่ขอให้สืบหาบัญชีคลังหลวง เริ่มจากเสมียนนายฉิงที่หน้าสำนักงานทางเหนือของนครหลวง ด้านซ้ายของนายอำเภอ",
    briefSummary: "คุยกับเสมียนนายฉิงข้างหวู่ · เปิดหีบเอกสาร · นำบัญชีกลับมา",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "investigate",
        description: "ทักทายเสมียนนายฉิงที่หน้าสำนักงานทางเหนือของนครหลวง ด้านซ้ายของนายอำเภอหวู่ แล้วถามถึงบัญชีที่หายไป",
        autoAdvance: { t: "flag", flag: "capital_ledger_qing_interviewed" },
      },
      {
        id: "find_ledger",
        description: "คุยกับเสมียนนายฉิงแล้วเลือกตรวจหีบเอกสาร ใช้กุญแจเก่าเปิดหีบและหยิบบัญชี หากไม่มีกุญแจให้ขอยืมจากนายฉิง",
        autoAdvance: { t: "flag", flag: "capital_ledger_recovered" },
      },
      {
        id: "return",
        description: "ส่งบัญชีให้นายอำเภอหวู่ที่นครหลวง (บัญชีที่หยิบจากหีบเอกสารข้างเสมียน) แล้วรับรางวัล",
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
    description: "นายอำเภอหวู่แห่งนครหลวงสงสัยว่าเสมียนคนหนึ่งในที่ว่าการรับสินบนจากพ่อค้า ถามเบาะแสจากเสมียนนายฉิง แล้วยึดใบรับเงินจากโจรเร่ร่อนที่เป็นคนเดินเงินมาเป็นหลักฐาน",
    briefSummary: "ถามเสมียนนายฉิง · ปราบโจรเร่ร่อน 2 คนเอาหลักฐาน · รายงานนายอำเภอหวู่",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "surveil",
        description: "ทักทายเสมียนนายฉิงด้านซ้ายของนายอำเภอหวู่ที่นครหลวง แล้วถามเรื่องสินบนในสำนักงาน",
        autoAdvance: { t: "flag", flag: "capital_clerk_bribery_lead" },
      },
      {
        id: "confront",
        description: "ปราบโจรเร่ร่อน 2 คน (พบได้ระหว่างเดินทาง) แล้วเก็บใบรับเงินสินบนจากตัวพวกมัน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "นำหลักฐานไปรายงานนายอำเภอหวู่ที่นครหลวง",
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
    description: "นักโทษคนหนึ่งถูกตัดสินอย่างไม่เป็นธรรม นายอำเภอหวู่ฝากหนังสือนิรโทษกรรมไปให้นักยุทธศาสตร์กงที่จินหลิง ผู้คุ้มครองพยานคนสำคัญ แล้วให้นำใบรับกลับมา",
    briefSummary: "ส่งหนังสือนิรโทษกรรมให้กงที่จินหลิง · นำใบรับกลับนครหลวง",
    type: "side",
    giverNpcId: "city_capital_magistrate_wu",
    stages: [
      {
        id: "receive_letter",
        description: "รับหนังสือนิรโทษกรรมจากนายอำเภอหวู่",
        autoAdvance: { t: "hasItem", itemId: "qst_amnesty_letter", count: 1 },
      },
      {
        id: "deliver_jinling",
        description: "ไปจินหลิง ส่งหนังสือให้นักยุทธศาสตร์กง แล้วรับใบรับกลับมา",
        autoAdvance: { t: "hasItem", itemId: "qst_amnesty_receipt", count: 1 },
      },
      {
        id: "report_back",
        description: "นำใบรับกลับไปรายงานนายอำเภอหวู่ที่นครหลวง",
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
  // city_capital_physician_lin — 3 quests
  // ═══════════════════════════════════════════════════════════════════

  // A local first errand: no inventory, mastery or combat gate.
  {
    id: "qc_capital_clinic_supplies",
    name: "เสบียงยาของคลินิก",
    description: "หมอหลินต้องการผู้ช่วยส่งคำขอเสบียงยาให้นายอำเภอหวู่ ทั้งสองอยู่ในนครหลวง",
    briefSummary: "แจ้งนายอำเภอหวู่เรื่องเสบียงยา แล้วกลับมารายงานหมอหลิน · ทำได้ในนครหลวง",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    stages: [
      {
        id: "deliver_request",
        description: "พบนายอำเภอหวู่ในนครหลวง เลือกทักทาย แล้วส่งคำขอเสบียงจากหมอหลิน",
      },
      {
        id: "report_to_lin",
        description: "กลับไปหาหมอหลินในนครหลวง ส่งมอบภารกิจเสบียงยาของคลินิกเพื่อรับรางวัล",
      },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "item", itemId: "herb", count: 3 },
      { t: "wExp", amount: 20 },
      { t: "npcRelationship", npcId: "city_capital_physician_lin", amount: 2 },
    ],
  },

  // 4. Fetch — auto-advance on item
  {
    id: "qc_capital_rare_herb",
    name: "บัวหิมะเพื่อผู้ป่วย",
    description: "หมอหลินแห่งนครหลวงต้องการบัวหิมะจากก้นหุบเขาตัดใจ มาปรุงยาให้ผู้ป่วยหนัก ต้องมีทักษะเก็บสมุนไพรระดับ 5 จึงเก็บได้",
    briefSummary: "เก็บบัวหิมะที่ก้นหุบเขาตัดใจ · เก็บสมุนไพรระดับ 5 · ส่งให้หมอหลินในนครหลวง",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    stages: [
      {
        id: "find_herb",
        description: "เก็บบัวหิมะที่ก้นหุบเขาตัดใจ — ต้องมีทักษะเก็บสมุนไพรระดับ 5",
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
    description: "ตำรับยาลับของหมอหลินถูกขโมยไปจากร้านในนครหลวง สืบรอยคนร้าย ชิงตำรับคืนมา แล้วนำกลับไปคืนหมอหลิน",
    briefSummary: "สืบรอยหลังร้าน · ชิงตำรับคืนจากหมอดูปลอม · นำตำรับคืนหมอหลิน",
    type: "side",
    giverNpcId: "city_capital_physician_lin",
    prereqs: { t: "npcRelationship", npcId: "city_capital_physician_lin", min: 5 },
    stages: [
      {
        id: "investigate",
        description: "สืบร่องรอยหลังร้านยาของหมอหลินในนครหลวง",
        objective: {
          spots: [
            { locationId: "city_capital", label: "สืบร่องรอยหลังคลินิก", text: "รอยเท้าเปื้อนผงยาพาไปถึงตรอกหลังตลาด — คนร้ายคือหมอดูปลอมที่ยังวนเวียนหาคนซื้อตำรับอยู่แถวนั้น" },
          ],
        },
      },
      {
        id: "find_thief",
        description: "ดักหมอดูปลอมในตรอกหลังตลาดนครหลวง แล้วชิงตำรับยาคืนมา",
        objective: {
          spots: [
            { locationId: "city_capital", label: "ดักหมอดูปลอมในตรอกหลังตลาด", sceneId: "qs_qc_capital_stolen_formula_alley" },
          ],
        },
      },
      {
        id: "return_formula",
        description: "นำตำรับยาลับกลับไปคืนหมอหลินที่คลินิก",
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
    description: "ช่างดูกู ช่างตีเหล็กแห่งซีเซี่ย ขาดแร่เหล็กเพราะโจรปล้นกองคาราวาน เขาต้องการแร่เหล็ก 10 ก้อนไปตีอาวุธที่ค้างอยู่",
    briefSummary: "หาแร่เหล็ก 10 ก้อนให้ช่างดูกูที่ซีเซี่ย",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    stages: [
      {
        id: "gather_ore",
        description: "หาแร่เหล็ก 10 ก้อน",
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
    description: "ช่างดูกูแห่งซีเซี่ยฝันอยากตีดาบในตำนานสักเล่มก่อนตาย ต้องการแร่เทพ 2 ก้อน แร่ที่มักอยู่ในถิ่นของสัตว์ดุร้าย",
    briefSummary: "ปราบเสือภูเขา 2 ตัว · หาแร่เทพ 2 ก้อนให้ช่างดูกู",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    prereqs: { t: "npcRelationship", npcId: "city_xixia_blacksmith_dugu", min: 5 },
    stages: [
      {
        id: "defeat_guardian",
        description: "ปราบเสือภูเขา 2 ตัวที่เฝ้าถิ่นแร่เทพ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 2 },
      },
      {
        id: "gather_mithril",
        description: "หาแร่เทพ 2 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 2 },
      },
      {
        id: "deliver_mithril",
        description: "นำแร่เทพไปส่งช่างดูกูที่ซีเซี่ย แล้วรับดาบ",
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
    description: "หัวหน้าโจรคนหนึ่งคอยดักปล้นกองคาราวานแร่เหล็กที่จะไปซีเซี่ย ช่างดูกูขอให้ปราบเขาจนต้องหนีไป",
    briefSummary: "ปราบหัวหน้าโจรที่ปล้นกองคาราวานแร่เหล็ก",
    type: "side",
    giverNpcId: "city_xixia_blacksmith_dugu",
    stages: [
      {
        id: "defeat_chief",
        description: "ปราบหัวหน้าโจร (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกช่างดูกูที่ซีเซี่ย",
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
    description: "บัณฑิตต้วนแห่งต้าหลี่ตามหาตำราเบื้องต้นฉบับเก่าจากวัดร้างที่สัตว์ป่ายึดไว้ ไล่สัตว์ป่าออกไป แล้วหาตำราเบื้องต้นมาให้เขา",
    briefSummary: "ปราบสัตว์ป่าดุร้าย 2 ตัว · หาตำราเบื้องต้นให้บัณฑิตต้วน",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "clear_beasts",
        description: "ปราบสัตว์ป่าดุร้าย 2 ตัวที่ยึดวัดร้าง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_beast", count: 2 },
      },
      {
        id: "find_scroll",
        description: "หาตำราเบื้องต้น 1 เล่ม — ฉบับในวัดเปื่อยจนอ่านไม่ออก ฉบับคัดลอกจากร้านค้าก็ใช้ได้",
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
    description: "บัณฑิตต้วนแห่งต้าหลี่กำลังทำแผนที่ประวัติศาสตร์ และอยากรู้สภาพของซูโจวในวันนี้ เดินทางไปซูโจวสักครั้ง แล้วกลับมาเล่าให้เขาฟัง",
    briefSummary: "ไปเยี่ยมซูโจวและกลับมารายงานบัณฑิตต้วน",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "visit_suzhou",
        description: "เดินทางไปซูโจว",
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

  // 11. Deliver — cross-NPC delivery (dali → suzhou → dali).
  {
    id: "qc_dali_missing_page",
    name: "หน้าหนังสือที่หายไป",
    description: "หนังสือประวัติศาสตร์ของบัณฑิตต้วนขาดหน้าไป พ่อค้าหนังสือลี่ที่ซูโจวเก็บหน้านั้นไว้ ไปรับมาแล้วนำกลับไปให้บัณฑิตต้วนที่ต้าหลี่",
    briefSummary: "ไปขอหน้าหนังสือคืนจากพ่อค้าหนังสือลี่ที่ซูโจว แล้วนำกลับต้าหลี่",
    type: "side",
    giverNpcId: "city_dali_scholar_duan",
    stages: [
      {
        id: "pickup_at_suzhou",
        description: "ไปซูโจว ขอหน้าหนังสือคืนจากพ่อค้าหนังสือลี่",
        autoAdvance: { t: "hasItem", itemId: "qst_dali_book_pages", count: 1 },
      },
      {
        id: "return_page",
        description: "นำหน้าหนังสือกลับให้บัณฑิตต้วนที่ต้าหลี่",
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
    description: "หมอยาไป๋แห่งต้าหลี่ต้องการโสม 5 หัวไปปรุงยาล็อตใหญ่ แต่ถิ่นโสมมีหมาป่าชุม ไล่หมาป่าก่อน แล้วหาโสมมาให้เขา",
    briefSummary: "ปราบหมาป่า 1 ตัว · หาโสม 5 หัวให้หมอยาไป๋",
    type: "side",
    giverNpcId: "city_dali_herbalist_bai",
    stages: [
      {
        id: "clear_area",
        description: "ปราบหมาป่า 1 ตัวในถิ่นที่เก็บโสม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_wolf", count: 1 },
      },
      {
        id: "gather_ginseng",
        description: "หาโสม 5 หัว",
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
        description: "ปราบงูเห่ายักษ์ที่กัดชาวบ้านแถวต้าหลี่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "viper_snake", count: 1 },
      },
      {
        id: "collect_venom",
        description: "หาพิษงูเห่า 1 ขวด (งูเห่ายักษ์มักทิ้งไว้เมื่อพ่ายแพ้)",
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
    description: "พ่อครัวซูต้องการปลามังกรสำหรับเมนูพิเศษที่ลูกค้าขาใหญ่จอง — มีเพียงเกาะมังกรเทพเท่านั้นที่จับได้",
    briefSummary: "หาปลามังกรจากเกาะมังกรเทพให้พ่อครัวซูในหยางโจว",
    type: "side",
    giverNpcId: "city_yangzhou_chef_su",
    stages: [
      {
        id: "find_fish",
        description: "หาปลามังกร 1 ตัว (จับได้ที่เกาะมังกรเทพ)",
        autoAdvance: { t: "hasItem", itemId: "fish_dragon", count: 1 },
      },
      {
        id: "deliver_fish",
        description: "นำปลามังกรไปให้พ่อครัวซูที่หยางโจว",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "item", itemId: "spicy_stew", count: 2 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "city_yangzhou_chef_su", amount: 10 },
    ],
  },

  // 15. Deliver — cross-city delivery (yangzhou → capital → yangzhou).
  // Stages mirror the user's "1 go 2 buy 3 bring back 4 reward" flow:
  // pickup auto-advances on the quest item, turn-in consumes it.
  {
    id: "qc_yangzhou_spice_delivery",
    name: "เครื่องเทศพิเศษจากนครหลวง",
    description: "พ่อครัวซูต้องการคนรับเครื่องเทศพิเศษจากพ่อค้าหวังในนครหลวงและนำมาส่งที่หยางโจว",
    briefSummary: "ไปคุยพ่อค้าหวังที่นครหลวงเพื่อรับเครื่องเทศ แล้วนำกลับมาส่งพ่อครัวซู",
    type: "side",
    giverNpcId: "city_yangzhou_chef_su",
    stages: [
      {
        id: "pickup_at_capital",
        description: "ไปนครหลวง รับเครื่องเทศพิเศษจากพ่อค้าหวัง",
        autoAdvance: { t: "hasItem", itemId: "qst_capital_spice", count: 1 },
      },
      {
        id: "return_delivery",
        description: "นำเครื่องเทศกลับมาส่งพ่อครัวซูที่หยางโจว",
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
    description: "โจรสลัดน้ำยึดท่าเรือทางเหนือของหยางโจวมาหลายเดือน ชาวประมงเฉินขอให้ปราบพวกมันสัก 3 คน ให้กลุ่มโจรถอยไป",
    briefSummary: "ปราบโจรสลัดสามคนเพื่อปลดปล่อยท่าเรือ",
    type: "side",
    giverNpcId: "city_yangzhou_fisherman_chen",
    stages: [
      {
        id: "defeat_pirates",
        description: "ปราบโจรสลัดน้ำ 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปบอกชาวประมงเฉินที่หยางโจว",
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
    description: "เรือสินค้าของชาวประมงเฉินจมตอนโจรสลัดบุก พร้อมแร่ทองแดงทั้งลำ ปราบโจรที่ยังเฝ้าซากเรือ แล้วหาแร่ทองแดงมาคืนเขา",
    briefSummary: "ปราบโจรสลัดน้ำ · หาแร่ทองแดง 5 ก้อนให้ชาวประมงเฉิน",
    type: "side",
    giverNpcId: "city_yangzhou_fisherman_chen",
    prereqs: { t: "questStatus", questId: "qc_yangzhou_river_pirates", status: "done" },
    stages: [
      {
        id: "defeat_guard",
        description: "ปราบโจรสลัดน้ำที่ยังเฝ้าซากเรืออยู่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
      {
        id: "collect_cargo",
        description: "หาแร่ทองแดง 5 ก้อน แทนสินค้าที่จมไปกับเรือ",
        autoAdvance: { t: "hasItem", itemId: "copper_ore", count: 5 },
      },
      {
        id: "return_cargo",
        description: "นำแร่ทองแดงไปคืนชาวประมงเฉินที่หยางโจว",
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

  // 18. Deliver — carry silk to capital, bring receipt back to suzhou.
  {
    id: "qc_suzhou_silk_shipment",
    name: "ส่งผ้าไหมสำหรับราชสำนัก",
    description: "ช่างทอเหมยต้องการคนส่งผ้าไหมล็อตสำคัญให้พ่อค้าหวังที่นครหลวง แล้วนำใบรับกลับมาให้ช่างทอเหมย",
    briefSummary: "ส่งผ้าไหมให้พ่อค้าหวังที่นครหลวง · นำใบรับกลับซูโจว",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "receive_silk",
        description: "รับผ้าไหมและใบสั่งงานจากช่างทอเหมย",
        autoAdvance: { t: "hasItem", itemId: "qst_capital_silk", count: 1 },
      },
      {
        id: "deliver_capital",
        description: "ไปนครหลวง ส่งผ้าไหมให้พ่อค้าหวัง แล้วรับใบรับกลับมา",
        autoAdvance: { t: "hasItem", itemId: "qst_capital_silk_receipt", count: 1 },
      },
      {
        id: "return_receipt",
        description: "นำใบรับกลับให้ช่างทอเหมยที่ซูโจว",
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
    description: "ช่างทอเหมยแห่งซูโจวต้องการเม็ดบัว 5 เม็ด ไปทำสีย้อมพิเศษที่ทำให้ผ้าไหมของนางไม่เหมือนใคร",
    briefSummary: "หาเม็ดบัว 5 เม็ดให้ช่างทอเหมยที่ซูโจว",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "gather_lotus",
        description: "หาเม็ดบัว 5 เม็ด",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 },
      },
      {
        id: "deliver_lotus",
        description: "นำเม็ดบัวไปให้ช่างทอเหมยที่ซูโจว",
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
    description: "กลุ่มช่างปลอมลอกลวดลายผ้าไหมของช่างทอเหมยไปขายถูก ๆ สืบที่ตลาดริมน้ำของซูโจว ปราบคนร้ายที่คุ้มกันพวกมัน แล้วกลับไปบอกนาง",
    briefSummary: "สืบที่ซ่องของกลุ่มช่างปลอมในซูโจวและรายงานช่างทอเหมย",
    type: "side",
    giverNpcId: "city_suzhou_weaver_mei",
    stages: [
      {
        id: "surveil_market",
        description: "สังเกตแผงผ้าในตลาดริมน้ำของซูโจว หาคนขายผ้าลอกลาย",
        objective: {
          spots: [
            { locationId: "city_suzhou", label: "สังเกตแผงผ้าริมน้ำ", text: "พ่อค้าแผงหนึ่งขายผ้าลายเดียวกับของช่างทอเหมย มีนักเลงคอยคุ้มกันอยู่ไม่ห่าง" },
          ],
        },
      },
      {
        id: "confront_guild",
        description: "ปราบคนร้าย 2 คนที่คุ้มกันกลุ่มช่างปลอม",
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
    description: "นักยุทธศาสตร์กงแห่งจินหลิงได้ข่าวว่ามีสายลับแทรกซึมเข้ามาในฉางอัน ไปเฝ้าดูประตูเมืองและตลาด แล้วกลับมาเล่าสิ่งที่เห็น",
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
        description: "เฝ้าสังเกตประตูเมืองและตลาดของฉางอัน",
        objective: {
          hours: 2,
          spots: [
            { locationId: "city_changan", label: "สังเกตประตูเมืองและตลาด", text: "คนแปลกหน้ากลุ่มหนึ่งผ่านประตูเมืองโดยไม่ถูกตรวจ แล้วแยกย้ายหายเข้าตลาด — ต้องรีบรายงานนักยุทธศาสตร์กง" },
          ],
        },
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

  // 22. Deliver — coded letter to scholar in dali, bring translation back.
  {
    id: "qc_jinling_coded_letter",
    name: "จดหมายรหัสลับ",
    description: "นักยุทธศาสตร์กงให้นำจดหมายรหัสลับไปให้บัณฑิตต้วนที่ต้าหลี่แปล แล้วนำผลการแปลกลับมา",
    briefSummary: "ส่งจดหมายรหัสลับให้บัณฑิตต้วนแปลที่ต้าหลี่ · นำคำแปลกลับจินหลิง",
    type: "side",
    giverNpcId: "city_jinling_strategist_kong",
    stages: [
      {
        id: "receive_letter",
        description: "รับจดหมายรหัสลับจากนักยุทธศาสตร์กง",
        autoAdvance: { t: "hasItem", itemId: "qst_dali_encrypted", count: 1 },
      },
      {
        id: "get_translation",
        description: "ไปต้าหลี่ ให้บัณฑิตต้วนแปลจดหมาย แล้วรับคำแปลกลับมา",
        autoAdvance: { t: "hasItem", itemId: "qst_dali_decoded", count: 1 },
      },
      {
        id: "return_result",
        description: "นำคำแปลกลับให้นักยุทธศาสตร์กงที่จินหลิง",
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
    description: "ศิษย์สำนักหนึ่งอยากแปรพักตร์ออกมาพร้อมข้อมูลสำคัญ แต่กลัวถูกตามล่า นักยุทธศาสตร์กงขอให้ไปรับเขาที่ฉางอัน แล้วพามาส่งที่จินหลิงอย่างปลอดภัย",
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
        description: "ปราบลูกศิษย์สำนัก 2 คนที่ไล่ตามผู้แปรพักตร์มา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_disciple", count: 2 },
      },
      {
        id: "escort_complete",
        description: "พาผู้แปรพักตร์กลับไปหานักยุทธศาสตร์กงที่จินหลิง",
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
    description: "เมื่อคืนมีคนแอบผ่านประตูเมืองฉางอันโดยไม่มีใบผ่านทาง ยามหยานขอให้ตามรอยว่าหนีไปไหน แล้วจับตัวมาให้ได้",
    briefSummary: "สืบหาผู้บุกรุกที่แอบผ่านประตูเมืองฉางอัน",
    type: "side",
    giverNpcId: "city_changan_guard_yan",
    stages: [
      {
        id: "investigate",
        description: "ตามรอยเท้าจากประตูเมืองฉางอันไปถึงตลาดตะวันออก",
        objective: {
          spots: [
            { locationId: "city_changan", label: "ตามรอยเท้าจากประตูเมือง", text: "รอยเท้าลากไปถึงตลาดตะวันออก ผู้บุกรุกยังวนเวียนอยู่แถวนอกเมือง" },
          ],
        },
      },
      {
        id: "confront",
        description: "ปราบขโมยน้อยผู้บุกรุกที่ยังวนอยู่นอกเมือง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "petty_thief", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกยามหยานที่ฉางอัน",
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
    description: "ทหารในหน่วยของยามหยานแห่งฉางอันหายไปสามวันแล้ว ค้นชายเมืองด้านใต้ ที่เขาเดินลาดตระเวนครั้งสุดท้าย แล้วช่วยเขาออกมา",
    briefSummary: "ตามหาทหารที่หายไปของยามหยาน",
    type: "side",
    giverNpcId: "city_changan_guard_yan",
    stages: [
      {
        id: "search",
        description: "ค้นชายเมืองด้านใต้ของฉางอันหาทหารที่หายไป",
        objective: {
          spots: [
            { locationId: "city_changan", label: "ค้นชายเมืองด้านใต้", text: "พบป้ายประจำตัวทหารตกอยู่หน้าโกดังร้าง — มีโจรปล้นทางซุ่มอยู่แถวนั้น" },
          ],
        },
      },
      {
        id: "defeat_captors",
        description: "ปราบโจรเส้นทาง 2 คนที่จับทหารขังไว้ในโกดัง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 2 },
      },
      {
        id: "rescue",
        description: "พาทหารกลับไปหายามหยานที่ฉางอัน",
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
        description: "สืบโกดังที่ซ่อนอาวุธเถื่อนในฉางอัน",
        objective: {
          spots: [
            { locationId: "city_changan", label: "สืบโกดังลักลอบขนอาวุธ", text: "ลังไม้ในโกดังซ่อนดาบไว้ใต้ฟาง อันธพาลกลุ่มหนึ่งคอยขนของออกไปยามค่ำ" },
          ],
        },
      },
      {
        id: "defeat_smugglers",
        description: "ปราบโจรเร่ร่อน 3 คนที่ขนอาวุธเถื่อน เพื่อเค้นว่าใครเป็นผู้รับ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 },
      },
      {
        id: "decide",
        description: "กลับไปหายามหยานที่ฉางอัน แล้วตัดสินใจว่าจะรายงานทางการหรือนิ่งเฉย",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "city_changan_guard_yan", amount: 10 },
    ],
  },
];
