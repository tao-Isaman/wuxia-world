import type { NpcDef } from "../../types";

// NPCs anchored at sects, temples, palaces, mansions:
//   17 sects (sect_shaolin … sect_wudu) + sect_xueyu
//   5 temples/palaces + 4 mansions + palace_royal
//
// Owned by content agent C. Dialog scenes live in
// lib/world/data/scenes-content/sects-temples.ts; quests in
// lib/world/data/quests/sects-temples.ts.
export const NPCS_SECTS_TEMPLES: readonly NpcDef[] = [
  // ─── เส้าหลิน ────────────────────────────────────────────────────────
  {
    id: "sect_shaolin_abbot_huiyuan",
    name: "เจ้าอาวาสฮุยหยวน",
    description: "เจ้าอาวาสวัดเส้าหลิน วัยสูงอายุแต่ยังดูแข็งแกร่ง สายตาแหลมคม ผู้รักษากฎเหล็กของสำนัก",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_abbot_huiyuan_talk",
    questIds: [
      "qst_shaolin_relic_theft",
      "qst_shaolin_disciple_gone",
      "qst_shaolin_proof_of_heart",
    ],
    tags: ["sect_master", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_elder_faming",
    name: "อาจารย์ฝาหมิง",
    description: "พระอาจารย์อาวุโสแห่งเส้าหลิน ผู้คุมการฝึกหัดของสาวก ท่าทางเข้มขรึมเงียบขรึม",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_elder_faming_talk",
    sparOpponentId: "wudang_disciple",
    sparFameReward: 8,
    questIds: ["qst_shaolin_iron_training"],
    tags: ["elder", "monk", "shaolin"],
  },

  // ─── อู่ตัง ────────────────────────────────────────────────────────────
  {
    id: "sect_wudang_master_qingxu",
    name: "อาจารย์ชิงซวี่",
    description: "อาจารย์ใหญ่แห่งอู่ตัง เชี่ยวชาญไทจี้และศิลปะแห่งความว่างเปล่า บุคลิกอบอุ่นแต่ลึกซึ้ง",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_master_qingxu_talk",
    questIds: [
      "qst_wudang_sacred_herb",
      "qst_wudang_traitor_disciple",
      "qst_wudang_mountain_seal",
    ],
    tags: ["sect_master", "taoist", "wudang"],
  },

  // ─── ง้อไบ๊ ────────────────────────────────────────────────────────────
  {
    id: "sect_emei_abbess_jingchan",
    name: "ท่านนิ้วห้วนจิงฉาน",
    description: "ท่านนิ้วชั้นสูงของง้อไบ๊ มารยาทงดงาม แต่ใจความจริงจังต่อกฎศีลและความยุติธรรม",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_abbess_jingchan_talk",
    questIds: [
      "qst_emei_kidnapped_novice",
      "qst_emei_poison_antidote",
    ],
    tags: ["sect_master", "nun", "emei"],
  },

  // ─── วิลล่ายาวัง (หมอยา) ──────────────────────────────────────────────
  {
    id: "villa_yaowang_doctor_shennong",
    name: "หมอเสินหนง",
    description: "หมอผีมือสูงแห่งวิลล่ายาวัง ผู้รู้สรรพวิชาสมุนไพรและยาพิษ เงียบขรึมแต่เมตตา",
    locationIds: ["villa_yaowang"],
    dialogSceneId: "npc_villa_yaowang_doctor_shennong_talk",
    questIds: [
      "qst_yaowang_rare_ingredient",
      "qst_yaowang_plague_village",
      "qst_yaowang_venom_antidote",
    ],
    tags: ["doctor", "herbalist", "yaowang"],
  },

  // ─── วัดตาหลุน ─────────────────────────────────────────────────────────
  {
    id: "temple_dalun_monk_kongxin",
    name: "พระกงซิน",
    description: "พระผู้รักษาพระธาตุโบราณแห่งวัดตาหลุน สงบนิ่งอยู่เสมอ แต่มีเรื่องหนักใจซ่อนอยู่",
    locationIds: ["temple_dalun"],
    dialogSceneId: "npc_temple_dalun_monk_kongxin_talk",
    questIds: [
      "qst_dalun_stolen_relic",
      "qst_dalun_pilgrim_mission",
    ],
    tags: ["monk", "temple", "dalun"],
  },

  // ─── คฤหาสน์เหยินซี ────────────────────────────────────────────────────
  {
    id: "villa_yanzi_lord_yanfeng",
    name: "เจ้าบ้านเหยินเฟิง",
    description: "เจ้าของคฤหาสน์เหยินซี ตระกูลขุนนางเก่า ใจโอบอ้อมอารีแต่มีศัตรูมาก ชอบผู้มีฝีมือ",
    locationIds: ["villa_yanzi"],
    dialogSceneId: "npc_villa_yanzi_lord_yanfeng_talk",
    questIds: [
      "qst_yanzi_rival_clan",
      "qst_yanzi_bodyguard_escort",
      "qst_yanzi_stolen_heirloom",
    ],
    tags: ["noble", "lord", "yanzi"],
  },

  // ─── พรรคสว่างมืด ──────────────────────────────────────────────────────
  {
    id: "sect_ming_elder_zhuying",
    name: "ผู้อาวุโสจูอิง",
    description: "ผู้อาวุโสลับแห่งพรรคสว่างมืด รู้ความลับมาก ใช้คนเป็น ไม่ค่อยเปิดเผยตัว",
    locationIds: ["sect_ming"],
    dialogSceneId: "npc_sect_ming_elder_zhuying_talk",
    questIds: [
      "qst_ming_spy_mission",
      "qst_ming_defector_choice",
    ],
    tags: ["elder", "ming_sect", "shadow"],
  },

  // ─── พรรคยาจก ──────────────────────────────────────────────────────────
  {
    id: "sect_beggars_chief_hongtian",
    name: "หัวหน้าหงเทียน",
    description: "หัวหน้าแห่งพรรคยาจก ผู้ถือไม้เท้าเก้าข้อ ดูเหมือนยาจกแต่รู้เรื่องราวทั่วยุทธภพ",
    locationIds: ["sect_beggars"],
    dialogSceneId: "npc_sect_beggars_chief_hongtian_talk",
    questIds: [
      "qst_beggars_spy_report",
      "qst_beggars_hungry_children",
    ],
    tags: ["chief", "beggars", "intelligence"],
  },

  // ─── วังหลวงจงหยาง ─────────────────────────────────────────────────────
  {
    id: "palace_zhongyang_envoy_liuying",
    name: "ทูตหลิวอิง",
    description: "ทูตพระราชสำนักประจำวังจงหยาง หน้าตาดีแต่ซ่อนเจตนาลึก ส่งข้อความระหว่างสำนักต่าง ๆ",
    locationIds: ["palace_zhongyang"],
    dialogSceneId: "npc_palace_zhongyang_envoy_liuying_talk",
    questIds: [
      "qst_zhongyang_imperial_letter",
      "qst_zhongyang_noble_intrigue",
    ],
    tags: ["envoy", "imperial", "zhongyang"],
  },
];
