import type { NpcDef } from "../../types";

// NPCs anchored in wilderness — islands, terrain, caves, NPC homes, misc:
//   10 isles · 11 mountains/cliffs · 12 caves/valleys
//   11 NPC homes · 7 misc
//
// Owned by content agent D. Dialog scenes live in
// lib/world/data/scenes-content/wilderness.ts; quests in
// lib/world/data/quests/wilderness.ts.

export const NPCS_WILDERNESS: readonly NpcDef[] = [
  // ─── เกาะดอกท้อ (isle_taohua) ────────────────────────────────────────
  {
    id: "wld_taohua_hermit_huang",
    name: "ฮ่วงเอี้ยะซือ (ปรมาจารย์ฤาษี)",
    description: "ปรมาจารย์แห่งเกาะดอกท้อ ผู้อยู่อาศัยเพียงลำพังมาหลายสิบปี สติปัญญาเฉียบแหลมแต่อัธยาศัยหยาบคาย",
    locationIds: ["isle_taohua"],
    dialogSceneId: "npc_wld_taohua_hermit_huang_talk",
    questIds: [
      "qw_taohua_codex_fragments",
      "qw_taohua_peach_wine",
      "qw_taohua_duel_proof",
    ],
    tags: ["hermit", "master", "eccentric"],
  },

  // ─── เขาคุนหลุน (mt_kunlun) ─────────────────────────────────────────
  {
    id: "wld_kunlun_exile_qiu",
    name: "ชิวเฉียน (ฤๅษีเนรเทศ)",
    description: "อดีตผู้อาวุโสสำนักคุนหลุน ถูกเนรเทศจากสำนักเพราะเรื่องลึกลับที่ไม่มีใครกล้าพูดถึง ปัจจุบันอาศัยอยู่กลางเขาเพียงคนเดียว",
    locationIds: ["mt_kunlun"],
    dialogSceneId: "npc_wld_kunlun_exile_qiu_talk",
    questIds: [
      "qw_kunlun_exile_truth",
      "qw_kunlun_snow_lotus",
    ],
    sparOpponentId: "sect_elder",
    sparFameReward: 12,
    tags: ["exile", "master", "mysterious"],
  },

  // ─── หุบเขาตัดใจ (valley_jueqing) ───────────────────────────────────
  {
    id: "wld_jueqing_elder_lin",
    name: "หลินชัวซัน (ผู้เฒ่าตัดใจ)",
    description: "ผู้เฒ่าที่อาศัยอยู่ปากหุบเขาตัดใจมาสี่สิบปี รู้ความลับของดอกไม้วิเศษในหุบเขา แต่ไม่ยอมบอกใครง่าย ๆ",
    locationIds: ["valley_jueqing"],
    dialogSceneId: "npc_wld_jueqing_elder_lin_talk",
    questIds: [
      "qw_jueqing_bitter_flower",
      "qw_jueqing_ghost_hunt",
    ],
    tags: ["elder", "herbalist", "recluse"],
  },

  // ─── ถ้ำงูทอง (cave_jinshe) ──────────────────────────────────────────
  {
    id: "wld_jinshe_beasttamer_xu",
    name: "ซวีเหลิงชิง (ผู้ฝึกงู)",
    description: "หญิงหนุ่มผู้ฝึกงูพิษเป็นอาชีพ อาศัยอยู่หน้าถ้ำงูทองมาหลายปี มีงูพิษเป็นสัตว์เลี้ยงหลายสิบตัว",
    locationIds: ["cave_jinshe"],
    dialogSceneId: "npc_wld_jinshe_beasttamer_xu_talk",
    questIds: [
      "qw_jinshe_venom_rare",
      "qw_jinshe_lost_serpent",
    ],
    tags: ["beast_tamer", "herbalist", "mysterious"],
  },

  // ─── ทะเลทรายร้าง (desert_ruins) ────────────────────────────────────
  {
    id: "wld_desert_collector_mo",
    name: "โม่ฉิงเทียน (นักสะสมโบราณ)",
    description: "นักสะสมวัตถุโบราณผู้แก่ชรา ท่องเที่ยวตามซากปรักหักพังในทะเลทรายเพื่อค้นหาของล้ำค่า ตัวเล็กแต่ปัญญาหลักแหลม",
    locationIds: ["desert_ruins"],
    dialogSceneId: "npc_wld_desert_collector_mo_talk",
    questIds: [
      "qw_desert_ancient_map",
      "qw_desert_relic_return",
      "qw_desert_guardian_test",
    ],
    tags: ["collector", "scholar", "wanderer"],
  },

  // ─── ตลาดชาวเมี่ยว (market_miao) ────────────────────────────────────
  {
    id: "wld_miao_tribaleldr_abao",
    name: "อาเป้า (หัวหน้าเผ่าเมี่ยว)",
    description: "หัวหน้าเผ่าเมี่ยวผู้สุขุมรอบคอบ รู้ตำรายาสมุนไพรของชนเผ่าที่สืบทอดมาหลายร้อยปี ไม่ไว้วางใจคนภายนอกในทีแรก",
    locationIds: ["market_miao"],
    dialogSceneId: "npc_wld_miao_tribaleldr_abao_talk",
    questIds: [
      "qw_miao_tribal_remedy",
      "qw_miao_spirit_beast",
      "qw_miao_offering_cave",
    ],
    tags: ["tribal", "elder", "herbalist"],
  },

  // ─── ยอดเขามรณะ (cliff_motian) ───────────────────────────────────────
  {
    id: "wld_motian_ghost_liang",
    name: "เหลียงเก๋อ (วิญญาณนักรบ)",
    description: "วิญญาณนักรบโบราณที่ยังไม่อาจไปสู่สุขคติ ปรากฏตัวเพียงในยามพลบค่ำ บอกเล่าเรื่องราวของการต่อสู้ครั้งสุดท้ายที่เขาไม่สามารถลืมได้",
    locationIds: ["cliff_motian"],
    dialogSceneId: "npc_wld_motian_ghost_liang_talk",
    questIds: [
      "qw_motian_restless_soul",
      "qw_motian_sword_return",
    ],
    tags: ["ghost", "spirit", "warrior"],
    visibleIf: { t: "flag", flag: "motian_ghost_revealed" },
  },

  // ─── ถ้ำน้ำแข็งไหม (cave_bingcan) ───────────────────────────────────
  {
    id: "wld_bingcan_scholar_wei",
    name: "เว่ยชิงเหวิน (บัณฑิตถ้ำ)",
    description: "บัณฑิตแก่ผู้เลือกอยู่ในถ้ำน้ำแข็งแทนการเข้าสู่ราชสำนัก เขียนตำราความรู้โบราณและเก็บไหมน้ำแข็งเป็นงานอดิเรก",
    locationIds: ["cave_bingcan"],
    dialogSceneId: "npc_wld_bingcan_scholar_wei_talk",
    questIds: [
      "qw_bingcan_silk_scroll",
      "qw_bingcan_ice_fever",
    ],
    tags: ["scholar", "recluse"],
  },

  // ─── มังกรดำสระน้ำ (pool_heilong) ───────────────────────────────────
  {
    id: "wld_heilong_fisherman_tan",
    name: "ต่านเหลาตู (ชาวประมงแก่)",
    description: "ชาวประมงผู้อาวุโสที่ทำมาหากินริมสระน้ำมังกรดำมาทั้งชีวิต รู้ดีว่าสระนี้มีอะไรซ่อนอยู่ลึกกว่าที่ตาเห็น",
    locationIds: ["pool_heilong"],
    dialogSceneId: "npc_wld_heilong_fisherman_tan_talk",
    questIds: [
      "qw_heilong_dragon_pearl",
      "qw_heilong_missing_fisher",
      "qw_heilong_depths_secret",
    ],
    tags: ["fisherman", "elder", "witness"],
  },

  // ─── บ้านโฮ่งชีก๋ง (home_hong) ──────────────────────────────────────
  {
    id: "wld_hong_adventurer_luo",
    name: "หลัวเฟย์หาว (นักผจญภัย)",
    description: "นักผจญภัยหนุ่มที่มาสำรวจบริเวณบ้านโฮ่งชีก๋งหวังพบปรมาจารย์ ตอนนี้ติดอยู่เพราะพบปริศนาที่ยากเกินแก้คนเดียว",
    locationIds: ["home_hong"],
    dialogSceneId: "npc_wld_hong_adventurer_luo_talk",
    questIds: [
      "qw_hong_treasure_map",
      "qw_hong_beast_swarm",
    ],
    tags: ["adventurer", "young_warrior"],
  },
];
