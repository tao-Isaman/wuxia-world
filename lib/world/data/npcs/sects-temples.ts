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
    description: "เจ้าอาวาสวัดเส้าหลิน วัยสูงอายุแต่ดวงตาเปล่งประกายเฉียบคม ฝีมือสุดยอดของยุทธจักรเทียบเท่าตำนาน · ผู้รวมหมัด-ดาบ-พลอง-เซน-อรหันต์เข้าเป็นหนึ่ง · ผู้รักษากฎเหล็กของสำนัก",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_abbot_huiyuan_talk",
    sparOpponentId: "spar_shaolin_abbot_huiyuan",
    sparFameReward: 18,
    questIds: [
      "qst_shaolin_disciple_intro",
      "qst_shaolin_relic_theft",
      "qst_shaolin_disciple_gone",
      "qst_shaolin_proof_of_heart",
      "qst_shaolin_sect_patrol",
      "qst_shaolin_sect_herb_run",
      "qst_shaolin_sect_meditation",
      "qst_shaolin_art_zen_finger",
      "qst_shaolin_art_legendary",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 5 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_elder_faming",
    name: "อาจารย์ฝาหมิง",
    description: "พระอาจารย์อาวุโสแห่งเส้าหลิน ผู้คุมการฝึกหัดของสาวก ท่าทางเข้มขรึมเงียบขรึม",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_elder_faming_talk",
    sparOpponentId: "spar_shaolin_faming",
    sparFameReward: 8,
    questIds: ["qst_shaolin_iron_training"],
    tags: ["elder", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_disciple_xuanji",
    name: "ศิษย์เซวียนจี้",
    description: "ศิษย์ผู้เฝ้าประตูวัดเส้าหลิน อ่อนน้อมและกระตือรือร้น คอยรับแขกที่มาเยือน",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_xuanji",
    sparFameReward: 4,
    tags: ["disciple", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_head_disciple_yuanquan",
    name: "หัวหน้าศิษย์หยวนเฉวียน",
    description: "หัวหน้ารุ่นพี่ของศิษย์เส้าหลิน ฝีมือครบครันทั้งหมัดและดาบอรหันต์ เคร่งระเบียบแต่ใจดีต่อผู้เริ่มต้น",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_yuanquan",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "ginseng", weight: 1 },
    ],
    tags: ["head_disciple", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_zen_master_xianren",
    name: "หลวงพ่อเซียนเหริน",
    description: "พระอาจารย์อาวุโสสายเซน เชี่ยวชาญเอกนิ้วเซนและกระบี่วิธีเซน พลังภายในล้ำลึก พูดน้อยแต่ทุกประโยคเปี่ยมด้วยปัญญา",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_xianren",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["elder", "monk", "shaolin", "zen"],
  },
  {
    id: "sect_shaolin_staff_master_juti",
    name: "หลวงพ่อจูตี้",
    description: "ปรมาจารย์พลองของเส้าหลิน ผู้สืบทอดตำราไม้เท้าสัจธรรม ร่างกายแข็งแกร่งดุจหินผา",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_juti",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "wood_hard", weight: 5 },
      { itemId: "iron_ore", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["elder", "monk", "shaolin", "staff_master"],
  },
  {
    id: "sect_shaolin_dharma_guardian_huimiao",
    name: "หลวงพี่ใหญ่ฮุยเหมียว",
    description: "ผู้พิทักษ์พระธรรมของเส้าหลิน ฝีมือหมัดทรงพลังที่สุดของวัด ร่างกายเปลี่ยนเส้นเอ็นแข็งแกร่งเหนือมนุษย์",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_huimiao",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 1 },
    ],
    tags: ["guardian", "monk", "shaolin"],
  },
  {
    id: "sect_shaolin_vice_abbot_luohan",
    name: "รองเจ้าอาวาสลั่วฮั่น",
    description: "รองเจ้าอาวาสเส้าหลิน เคียงข้างเจ้าอาวาสฮุยหยวนมานานนับสิบปี ฝีมือสูงสุดเป็นรองเพียงเจ้าอาวาส รวบรวมหมัด-ดาบ-พลองเข้าเป็นหนึ่ง",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_luohan",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 5 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["vice_abbot", "monk", "shaolin"],
  },

  // ─── หัวซาน ───────────────────────────────────────────────────────────
  // Smaller than Shaolin / Wudang — leadership caps at T3 (master + vice
  // are formidable but not legendary). Sword-only sect with a yin /
  // external / hard combat identity (the "purple cloud" line).
  {
    id: "sect_huashan_master_yiqing",
    name: "อาจารย์ใหญ่อี้ชิง",
    description: "อาจารย์ใหญ่แห่งหัวซาน · ผู้สืบทอดเพลงกระบี่เมฆาม่วง · ใจรักดาบจนอุทิศชีวิตให้สำนัก · บุคลิกเปิดเผย รับศิษย์ทุกคนที่ใจรักดาบ",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_master_yiqing_talk",
    sparOpponentId: "spar_huashan_master_yiqing",
    sparFameReward: 12,
    questIds: [
      "qst_huashan_disciple_intro",
      "qst_huashan_sect_patrol",
      "qst_huashan_sect_iron",
      "qst_huashan_art_purplecloud",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 5 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "swordsman", "huashan"],
  },
  {
    id: "sect_huashan_vice_master_zifeng",
    name: "รองอาจารย์จื่อเฟิง",
    description: "รองอาจารย์ของหัวซาน · เคียงข้างอาจารย์อี้ชิงนับสิบปี · ฝีมือกระบี่หนักแน่น สมาธิเที่ยงตรง",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_vice_master_zifeng_talk",
    sparOpponentId: "spar_huashan_zifeng",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "swordsman", "huashan"],
  },
  {
    id: "sect_huashan_sword_elder_qingsong",
    name: "อาจารย์ดาบชิงซ่ง",
    description: "ปรมาจารย์กระบี่อาวุโสของหัวซาน · เก่งทั้งเพลงเมฆาล่องลอยและกระบี่เมฆาม่วง · พูดน้อยแต่ดาบเฉียบขาด",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_sword_elder_qingsong_talk",
    sparOpponentId: "spar_huashan_qingsong",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "swordsman", "huashan"],
  },
  {
    id: "sect_huashan_head_disciple_zhongming",
    name: "หัวหน้าศิษย์จงหมิง",
    description: "หัวหน้ารุ่นพี่ของศิษย์หัวซาน · กระบี่เมฆาล่องลอยเชี่ยวชาญ · เคร่งระเบียบและตรงไปตรงมา",
    locationIds: ["sect_huashan"],
    sparOpponentId: "spar_huashan_zhongming",
    sparFameReward: 6,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 2 },
    ],
    tags: ["head_disciple", "swordsman", "huashan"],
  },
  {
    id: "sect_huashan_disciple_xiaoyun",
    name: "ศิษย์เสี่ยวอวิ๋น",
    description: "ศิษย์หัวซานผู้เฝ้าประตูสำนัก · กระตือรือร้นและอ่อนน้อม · คอยรับแขกที่มาเยือนเขา",
    locationIds: ["sect_huashan"],
    sparOpponentId: "spar_huashan_xiaoyun",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "huashan"],
  },

  // ─── อู่ตัง ────────────────────────────────────────────────────────────
  {
    id: "sect_wudang_master_qingxu",
    name: "อาจารย์ชิงซวี่",
    description: "อาจารย์ใหญ่แห่งอู่ตัง · ผู้สืบทอดไทจี้และจื่อเสียจนเป็นหนึ่งเดียว · ผสานหยินหยางและสะท้อนพลังในเพลงกระบี่เดียว · บุคลิกอบอุ่นแต่ฝีมือเทียบเท่าตำนานยุทธจักร",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_master_qingxu_talk",
    sparOpponentId: "spar_wudang_master_qingxu",
    sparFameReward: 18,
    questIds: [
      "qst_wudang_disciple_intro",
      "qst_wudang_sacred_herb",
      "qst_wudang_traitor_disciple",
      "qst_wudang_mountain_seal",
      "qst_wudang_sect_patrol",
      "qst_wudang_sect_herb_run",
      "qst_wudang_art_yinyang",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 5 },
      { itemId: "snow_lotus", weight: 2 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "taoist", "wudang"],
  },
  {
    id: "sect_wudang_vice_master_xuancheng",
    name: "รองอาจารย์เสวียนเฉิง",
    description: "รองอาจารย์ของอู่ตัง · เคียงข้างอาจารย์ชิงซวี่นานนับสิบปี · ฝีมือกระบี่ไหลลื่นและจิตใจเที่ยงตรง",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_vice_master_xuancheng_talk",
    sparOpponentId: "spar_wudang_xuancheng",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
    ],
    tags: ["vice_master", "taoist", "wudang"],
  },
  {
    id: "sect_wudang_sword_elder_lingyu",
    name: "อาจารย์ดาบหลิงอวี้",
    description: "ปรมาจารย์กระบี่อู่ตัง · ผู้สืบทอดเพลงกระบี่เคลื่อนเมฆาและกระบี่เหนือฟ้า · เก่งทั้งสอนและฟัน",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_sword_elder_lingyu_talk",
    sparOpponentId: "spar_wudang_lingyu",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "iron_ore", weight: 2 },
    ],
    tags: ["elder", "taoist", "wudang", "swordsman"],
  },
  {
    id: "sect_wudang_inner_elder_baochun",
    name: "อาจารย์ปราณเป่าชุน",
    description: "ปรมาจารย์ปราณภายในของอู่ตัง · ผู้คุมการฝึกสมาธิและการหายใจ · พูดน้อยแต่ใจกว้าง",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_baochun",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 1 },
    ],
    tags: ["elder", "taoist", "wudang", "internal"],
  },
  {
    id: "sect_wudang_head_disciple_zhirong",
    name: "หัวหน้าศิษย์จื้อหรง",
    description: "หัวหน้ารุ่นพี่ของศิษย์อู่ตัง · ฝีมือกระบี่ไทเก๊กเจนจัด · เคร่งระเบียบแต่ใจดีต่อรุ่นน้อง",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_zhirong",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "ginseng", weight: 1 },
    ],
    tags: ["head_disciple", "taoist", "wudang"],
  },
  {
    id: "sect_wudang_disciple_yujian",
    name: "ศิษย์อวี่เจี้ยน",
    description: "ศิษย์อู่ตังหนุ่มผู้ฝึกกระบี่หยินหยาง · มือเร็วและฝึกซ้อมไม่หยุด",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_yujian",
    sparFameReward: 5,
    tags: ["disciple", "taoist", "wudang", "sparring"],
  },
  {
    id: "sect_wudang_disciple_qingxin",
    name: "ศิษย์ชิงซิน",
    description: "ศิษย์อู่ตังผู้เฝ้าประตูสำนัก · อ่อนน้อมและเปี่ยมใจเมตตา · คอยรับแขกที่ขึ้นเขามา",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_qingxin",
    sparFameReward: 4,
    tags: ["disciple", "taoist", "wudang"],
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
    defenseTier: 3,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 3 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "snow_lotus", weight: 1 },
      { itemId: "potion_mid", weight: 2 },
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
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 4 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "snow_lotus", weight: 2 },
      { itemId: "potion_big", weight: 2 },
      { itemId: "viper_venom", weight: 2 },
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
    defenseTier: 2,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "ginseng", weight: 3 },
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
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
    defenseTier: 3,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "gold_ore", weight: 3 },
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade_amulet", weight: 1 },
      { itemId: "silver_ring", weight: 2 },
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
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "viper_venom", weight: 3 },
      { itemId: "iron_blade", weight: 2 },
      { itemId: "scorpion_venom", weight: 2 },
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
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "gold_ore", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "paper", weight: 4 },
      { itemId: "silver_ring", weight: 1 },
    ],
    tags: ["envoy", "imperial", "zhongyang"],
  },

  // ─── Sect sparring partners (T1-T3) ─────────────────────────────────
  // One sparring NPC per sect that didn't already have one. Each fights
  // with their sect's signature move skills + sect inner art so a player
  // touring the sects gets to feel each style. Pair with the matching
  // `spar_<sect>_<role>` entries in lib/world/data/opponents.ts.
  // Tier distribution (rough): T1×4 (early), T2×8 (mid), T3×5 (late).

  // ─── ไท่ซาน (T1) ────────────────────────────────────────────────────
  {
    id: "sect_taishan_disciple_kunwu",
    name: "ศิษย์คุนหวู่",
    description: "ลูกศิษย์ดาบไท่ซานวัยกลาง ใจกล้า ใช้ดาบยาวสองมือเป็นอาวุธคู่หู",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_disciple_kunwu_talk",
    sparOpponentId: "spar_taishan_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "taishan", "sparring"],
  },

  // ─── เฮิงซานใต้ (T1) ────────────────────────────────────────────────
  {
    id: "sect_hengshan_south_disciple_yuepan",
    name: "ศิษย์เยว่ผาน",
    description: "ลูกศิษย์เฮิงซานใต้ผู้ชำนาญลีลากระบี่ห้ายอด เคลื่อนไหวเหมือนระบำ",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_disciple_yuepan_talk",
    sparOpponentId: "spar_hengshan_south_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "hengshan", "sparring"],
  },

  // ─── เฮิงซานเหนือ (T1) ──────────────────────────────────────────────
  {
    id: "sect_hengshan_north_nun_jingxin",
    name: "นักพรตจิงซิน",
    description: "ภิกษุณีเฮิงซานเหนือผู้ฝึกดาบในขลุ่ย เสียงดนตรีกับฝีมือเป็นหนึ่งเดียว",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_nun_jingxin_talk",
    sparOpponentId: "spar_hengshan_north_nun",
    sparFameReward: 3,
    tags: ["nun", "musician", "hengshan", "sparring"],
  },

  // ─── ซงซาน (T1) ─────────────────────────────────────────────────────
  {
    id: "sect_songshan_disciple_lifeng",
    name: "ศิษย์หลี่เฟิง",
    description: "เด็กหนุ่มแห่งซงซาน ฝึกฝีมือด้วยใจเด็ดเดี่ยว มาท้าประลองกับผู้แสวงหา",
    locationIds: ["sect_songshan"],
    dialogSceneId: "npc_sect_songshan_disciple_lifeng_talk",
    sparOpponentId: "spar_songshan_disciple",
    sparFameReward: 3,
    tags: ["disciple", "swordsman", "songshan", "sparring"],
  },

  // ─── อู่ตัง (T2) ────────────────────────────────────────────────────
  {
    id: "sect_wudang_disciple_qingfeng",
    name: "สาวกชิงเฟิง",
    description: "ศิษย์อู่ตังที่ฝึกไทจี้กับสะท้อนพลังจนเป็นหนึ่งเดียว ใช้กระบี่อย่างสงบนิ่ง",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_disciple_qingfeng_talk",
    sparOpponentId: "spar_wudang_disciple",
    sparFameReward: 5,
    tags: ["disciple", "taoist", "wudang", "sparring"],
  },

  // ─── ง้อไบ๊ (T2) ────────────────────────────────────────────────────
  {
    id: "sect_emei_nun_qingyu",
    name: "นักพรตชิงอวี้",
    description: "ภิกษุณีง้อไบ๊ผู้ฝึกกระบี่น้ำกับดาบน้ำค้าง ใจเย็นและมือเร็ว",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_nun_qingyu_talk",
    sparOpponentId: "spar_emei_nun",
    sparFameReward: 5,
    tags: ["nun", "swordswoman", "emei", "sparring"],
  },

  // ─── หัวซาน (T2) ────────────────────────────────────────────────────
  {
    id: "sect_huashan_disciple_jianyi",
    name: "ศิษย์เจี้ยนอี้",
    description: "ศิษย์ดาบหัวซาน ทะเยอทะยาน เชื่อในการฝึกซ้อมจนเลือดสาด",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_disciple_jianyi_talk",
    sparOpponentId: "spar_huashan_disciple",
    sparFameReward: 5,
    tags: ["disciple", "swordsman", "huashan", "sparring"],
  },

  // ─── ลิ่งจิ้วกง (T2) ───────────────────────────────────────────────
  {
    id: "sect_lingjiu_lady_zixia",
    name: "หญิงสาวจื่อเสีย",
    description: "หญิงนักรบลิ่งจิ้วกง เคลื่อนไหวรวดเร็ว ใช้เข็มและดาบลมประกอบกัน",
    locationIds: ["sect_lingjiu"],
    dialogSceneId: "npc_sect_lingjiu_lady_zixia_talk",
    sparOpponentId: "spar_lingjiu_lady",
    sparFameReward: 6,
    tags: ["lady_warrior", "lingjiu", "sparring"],
  },

  // ─── พรรคยาจก (T2) ─────────────────────────────────────────────────
  {
    id: "sect_beggars_brawler_jiu",
    name: "ยาจกจิ๊ว",
    description: "ยาจกแก่ผู้ฝึกหมัดเมาเป็นชีวิตจิตใจ ขวดเหล้าไม่เคยห่างมือ",
    locationIds: ["sect_beggars"],
    dialogSceneId: "npc_sect_beggars_brawler_jiu_talk",
    sparOpponentId: "spar_beggars_brawler",
    sparFameReward: 6,
    tags: ["beggar", "drunken_fist", "beggars", "sparring"],
  },

  // ─── สำนักดาวดึงส์ (T2) ────────────────────────────────────────────
  {
    id: "sect_xingxiu_disciple_dushou",
    name: "ศิษย์ตู๋โซ่ว",
    description: "ลูกศิษย์ดาวดึงส์ผู้คลั่งพิษ เข็มกับการตีจุดเป็นเครื่องมือสองชิ้นโปรด",
    locationIds: ["sect_xingxiu"],
    dialogSceneId: "npc_sect_xingxiu_disciple_dushou_talk",
    sparOpponentId: "spar_xingxiu_disciple",
    sparFameReward: 6,
    tags: ["disciple", "venom", "xingxiu", "sparring"],
  },

  // ─── พรรคเบญจพิษ (T2) ──────────────────────────────────────────────
  {
    id: "sect_wudu_miao_aman",
    name: "หมอพิษอาหมาน",
    description: "ชาวเมี่ยวพิษห้าธาตุ พกงูพิษไว้ในย่าม ฝีมือเย็นแต่ลึก",
    locationIds: ["sect_wudu"],
    dialogSceneId: "npc_sect_wudu_miao_aman_talk",
    sparOpponentId: "spar_wudu_miao",
    sparFameReward: 6,
    tags: ["miao", "venom", "wudu", "sparring"],
  },

  // ─── ฉวนเจิน (T2) ──────────────────────────────────────────────────
  {
    id: "sect_quanzhen_disciple_chongxu",
    name: "สาวกชงซวี",
    description: "ศิษย์ฉวนเจินที่กระบี่ทั้งสามทิศ ปราณภายในหนาแน่นและมั่นคง",
    locationIds: ["sect_quanzhen"],
    dialogSceneId: "npc_sect_quanzhen_disciple_chongxu_talk",
    sparOpponentId: "spar_quanzhen_disciple",
    sparFameReward: 6,
    tags: ["disciple", "taoist", "quanzhen", "sparring"],
  },

  // ─── กู่มู่ (T3) ───────────────────────────────────────────────────
  {
    id: "sect_gumu_disciple_lengyue",
    name: "ศิษย์เลิ่งเยว่",
    description: "สาวกสุสานโบราณ ใช้กระบี่เย็นและคัมภีร์สาวหยกเป็นทางออกของฝีมือ",
    locationIds: ["sect_gumu"],
    dialogSceneId: "npc_sect_gumu_disciple_lengyue_talk",
    sparOpponentId: "spar_gumu_disciple",
    sparFameReward: 8,
    tags: ["disciple", "swordswoman", "gumu", "sparring"],
  },

  // ─── พรรคสราญรมย์ (T3) ─────────────────────────────────────────────
  {
    id: "sect_xiaoyao_master_yunxiao",
    name: "ปรมาจารย์ยุนเซียว",
    description: "อาจารย์เซียวหยาวผู้ฝึกฝ่ามือสราญรมย์และกระบี่ขลุ่ยหยกเป็นเลิศ",
    locationIds: ["sect_xiaoyao"],
    dialogSceneId: "npc_sect_xiaoyao_master_yunxiao_talk",
    sparOpponentId: "spar_xiaoyao_master",
    sparFameReward: 10,
    tags: ["master", "xiaoyao", "sparring"],
  },

  // ─── พรรคสว่างมืด (T3) ────────────────────────────────────────────
  {
    id: "sect_ming_envoy_huozhi",
    name: "ผู้แทนหั่วจี้",
    description: "ผู้แทนพรรคมิ่งผู้ใช้กรงเล็บเพลิงและหมัดเมา เร่าร้อนแต่ไม่ประมาท",
    locationIds: ["sect_ming"],
    dialogSceneId: "npc_sect_ming_envoy_huozhi_talk",
    sparOpponentId: "spar_ming_envoy",
    sparFameReward: 9,
    tags: ["envoy", "ming_sect", "sparring"],
  },

  // ─── สำนักดาบโลหิต (T3) ───────────────────────────────────────────
  {
    id: "sect_xuedao_blade_xuelang",
    name: "ดาบเลือดเซียะลาง",
    description: "ดาบโลหิตผู้กระหายการต่อสู้ ดวงตาแดงทุกครั้งที่ดึงดาบยาวสีเลือดออกจากฝัก",
    locationIds: ["sect_xuedao"],
    dialogSceneId: "npc_sect_xuedao_blade_xuelang_talk",
    sparOpponentId: "spar_xuedao_blade",
    sparFameReward: 11,
    tags: ["blade", "evil_sect", "xuedao", "sparring"],
  },

  // ─── สำนักดาบโลหิต (สำนักใหม่) (T3) ───────────────────────────────
  {
    id: "sect_xueyu_master_chiying",
    name: "จอมยุทธฉือยิง",
    description: "เจ้าสำนักดาบโลหิตเลือดเย็น ฝีมือใกล้เคียงดาบราชาแต่อยู่ฝ่ายอธรรม",
    locationIds: ["sect_xueyu"],
    dialogSceneId: "npc_sect_xueyu_master_chiying_talk",
    sparOpponentId: "spar_xueyu_master",
    sparFameReward: 12,
    tags: ["master", "evil_sect", "xueyu", "sparring"],
  },

  // ─── องครักษ์เสื้อแพร / Jinyiwei (3 NPCs) ────────────────────────────
  // Government-aligned sect: a leader who answers to the throne, and two
  // enforcers (saber and chain). All three are sparring-only — quests
  // for this lineage are dispensed by the scattered spies (npcs/spies.ts).
  // The leader is T4 ("very strong") and drops the t4 skill / art manuals.
  {
    id: "sect_jinyiwei_leader_zhao",
    name: "ผู้บัญชาการจ้าวฝู่",
    description: "ผู้บัญชาการกรมองครักษ์เสื้อแพร · มือขวาขององค์จักรพรรดิ · ดวงตาคมราวดาบ พูดน้อยแต่หนัก",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_leader_zhao_talk",
    sparOpponentId: "spar_jinyiwei_leader",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 5 },
      { itemId: "jade", weight: 3 },
      { itemId: "jade_amulet", weight: 2 },
      { itemId: "potion_big", weight: 3 },
      { itemId: "man_jy_blade_king", weight: 1 },
    ],
    tags: ["sect_master", "imperial", "jinyiwei"],
  },
  {
    id: "sect_jinyiwei_soldier_qin",
    name: "องครักษ์ฉิน",
    description: "องครักษ์ระดับสูงประจำกรม · ดาบโค้งเสมอเอว ผู้คุมการสอนรุ่นน้อง",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_soldier_qin_talk",
    sparOpponentId: "spar_jinyiwei_qin",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_blade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "man_jy_blade", weight: 1 },
    ],
    tags: ["soldier", "imperial", "jinyiwei", "blade"],
  },
  {
    id: "sect_jinyiwei_soldier_lu",
    name: "องครักษ์ลู่",
    description: "องครักษ์ผู้เชี่ยวชาญโซ่และกรงเล็บ · เคยจับโจรชายแดนได้ทั้งกองคนเดียว",
    locationIds: ["sect_jinyiwei"],
    dialogSceneId: "npc_sect_jinyiwei_soldier_lu_talk",
    sparOpponentId: "spar_jinyiwei_lu",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ingot", weight: 4 },
      { itemId: "leather", weight: 3 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "man_jy_chain", weight: 1 },
      { itemId: "man_jy_chainmaster", weight: 1 },
    ],
    tags: ["soldier", "imperial", "jinyiwei", "chain"],
  },
];
