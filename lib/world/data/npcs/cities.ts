import type { NpcDef } from "../../types";

// NPCs anchored at the 7 city locations:
//   city_capital · city_xixia · city_dali · city_yangzhou
//   city_suzhou  · city_jinling · city_changan
//
// Owned by content agent A. Each NPC must have a `dialogSceneId` that
// resolves to a scene in lib/world/data/scenes-content/cities.ts. Quest
// links use `questIds` referencing entries in lib/world/data/quests/cities.ts.
export const NPCS_CITIES: readonly NpcDef[] = [
  // ─── city_capital ──────────────────────────────────────────────────
  {
    id: "city_capital_magistrate_wu",
    name: "นายอำเภอหวู่",
    description: "นายอำเภอผู้กุมอำนาจในนครหลวง มีทั้งภาระราชการและปัญหาส่วนตัวที่ซ่อนอยู่",
    locationIds: ["city_capital"],
    dialogSceneId: "npc_city_capital_magistrate_wu_talk",
    questIds: [
      "qc_capital_lost_ledger",
      "qc_capital_corrupt_clerk",
      "qc_capital_royal_pardon",
    ],
    tags: ["official", "authority"],
  },
  {
    id: "city_capital_physician_lin",
    name: "หมอหลิน",
    description: "แพทย์ผู้เชี่ยวชาญสมุนไพร เปิดคลินิกเล็ก ๆ ในนครหลวง ตำรายาของท่านเป็นที่หมายปองของคนหลายกลุ่ม",
    locationIds: ["city_capital"],
    dialogSceneId: "npc_city_capital_physician_lin_talk",
    questIds: [
      "qc_capital_rare_herb",
      "qc_capital_stolen_formula",
    ],
    tags: ["healer", "scholar"],
  },

  // ─── city_xixia ────────────────────────────────────────────────────
  {
    id: "city_xixia_blacksmith_dugu",
    name: "ช่างดูกู",
    description: "ช่างตีเหล็กชั้นสูงแห่งซีเซี่ย แขนแกร่งดั่งเหล็กกล้า เขาตีอาวุธให้แก่นักรบทั่วยุทธภพมานับสิบปี",
    locationIds: ["city_xixia"],
    dialogSceneId: "npc_city_xixia_blacksmith_dugu_talk",
    questIds: [
      "qc_xixia_iron_supply",
      "qc_xixia_legendary_blade",
      "qc_xixia_bandit_ore",
    ],
    tags: ["craftsman", "forge"],
  },

  // ─── city_dali ─────────────────────────────────────────────────────
  {
    id: "city_dali_scholar_duan",
    name: "บัณฑิตต้วน",
    description: "ลูกหลานสกุลต้วนแห่งต้าหลี่ ผู้มีความรู้กว้างขวางและชอบเก็บบันทึกเรื่องราวในยุทธภพ",
    locationIds: ["city_dali"],
    dialogSceneId: "npc_city_dali_scholar_duan_talk",
    questIds: [
      "qc_dali_ancient_scroll",
      "qc_dali_history_route",
      "qc_dali_missing_page",
    ],
    tags: ["scholar", "historian"],
  },
  {
    id: "city_dali_herbalist_bai",
    name: "หมอยาไป๋",
    description: "หญิงสาวผู้เชี่ยวชาญสมุนไพรในต้าหลี่ ท่านมีตำรายาลับที่สืบทอดมาแต่บรรพบุรุษ",
    locationIds: ["city_dali"],
    dialogSceneId: "npc_city_dali_herbalist_bai_talk",
    questIds: [
      "qc_dali_herb_collection",
      "qc_dali_venom_beast",
    ],
    tags: ["healer", "herbalist"],
  },

  // ─── city_yangzhou ─────────────────────────────────────────────────
  {
    id: "city_yangzhou_chef_su",
    name: "พ่อครัวซู",
    description: "พ่อครัวชื่อดังแห่งหยางโจว ท่านขึ้นชื่อเรื่องอาหารจากปลาสด แต่ขาดแคลนวัตถุดิบพิเศษอยู่เสมอ",
    locationIds: ["city_yangzhou"],
    dialogSceneId: "npc_city_yangzhou_chef_su_talk",
    questIds: [
      "qc_yangzhou_rare_fish",
      "qc_yangzhou_spice_delivery",
    ],
    tags: ["chef", "merchant"],
  },
  {
    id: "city_yangzhou_fisherman_chen",
    name: "ชาวประมงเฉิน",
    description: "ชาวประมงสูงอายุแห่งหยางโจว รู้จักทุกซอกมุมของแม่น้ำ แต่ช่วงนี้โจรสลัดรบกวนหนัก",
    locationIds: ["city_yangzhou"],
    dialogSceneId: "npc_city_yangzhou_fisherman_chen_talk",
    questIds: [
      "qc_yangzhou_river_pirates",
      "qc_yangzhou_sunken_cargo",
    ],
    tags: ["fisherman", "local"],
  },

  // ─── city_suzhou ───────────────────────────────────────────────────
  {
    id: "city_suzhou_weaver_mei",
    name: "ช่างทอเหมย",
    description: "ช่างทอผ้าไหมชื่อดังแห่งซูโจว งานของท่านส่งถึงราชสำนัก แต่กลุ่มโจรเริ่มขัดขวางกิจการ",
    locationIds: ["city_suzhou"],
    dialogSceneId: "npc_city_suzhou_weaver_mei_talk",
    questIds: [
      "qc_suzhou_silk_shipment",
      "qc_suzhou_dye_ingredient",
      "qc_suzhou_copycat_guild",
    ],
    tags: ["craftsman", "merchant"],
  },

  // ─── city_jinling ──────────────────────────────────────────────────
  {
    id: "city_jinling_strategist_kong",
    name: "นักยุทธศาสตร์กง",
    description: "อดีตที่ปรึกษาการทหารผู้ปลีกวิเวกมาอยู่จินหลิง เขามีข้อมูลมากมายแต่ต้องการคนช่วยสอบสวนความจริง",
    locationIds: ["city_jinling"],
    dialogSceneId: "npc_city_jinling_strategist_kong_talk",
    questIds: [
      "qc_jinling_spy_network",
      "qc_jinling_coded_letter",
      "qc_jinling_defector",
    ],
    tags: ["scholar", "official"],
  },

  // ─── city_changan ──────────────────────────────────────────────────
  {
    id: "city_changan_guard_yan",
    name: "ยามหยาน",
    description: "นายทหารรักษาประตูเมืองแห่งฉางอัน ผู้ยึดมั่นในหน้าที่แต่กำลังเผชิญปัญหาที่ใหญ่กว่าที่รับมือได้คนเดียว",
    locationIds: ["city_changan"],
    dialogSceneId: "npc_city_changan_guard_yan_talk",
    questIds: [
      "qc_changan_gate_intruder",
      "qc_changan_missing_soldier",
      "qc_changan_weapon_smuggle",
    ],
    tags: ["soldier", "authority"],
  },
];
