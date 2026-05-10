import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_BEGGARS: readonly NpcDef[] = [
  {
    id: "sect_beggars_chief_hongtian",
    name: "หัวหน้าหงเทียน",
    description: "หัวหน้าแห่งพรรคยาจก · ผู้ถือไม้เท้าเก้าข้อ · ฝีมือเทียบเท่าตำนานยุทธจักร · ดูเหมือนยาจกแต่รู้เรื่องราวทั่วยุทธภพ ผู้สืบทอด ๑๘ ฝ่ามือมังกรและเพลงไม้เท้าตีสุข",
    locationIds: ["sect_beggars"],
    dialogSceneId: "npc_sect_beggars_chief_hongtian_talk",
    sparOpponentId: "spar_beggars_chief_hongtian",
    sparFameReward: 18,
    questIds: [
      "qst_beggars_disciple_intro",
      "qst_beggars_spy_report",
      "qst_beggars_hungry_children",
      "qst_beggars_sect_patrol",
      "qst_beggars_sect_alms",
      "qst_beggars_art_thousandcrowd",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "rice_dish", weight: 5 },
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["chief", "beggars", "intelligence"],
  },

  {
    id: "sect_beggars_vice_chief_lifang",
    name: "รองหัวหน้าหลี่ฟาง",
    description: "รองหัวหน้าพรรคยาจก · เคียงข้างหัวหน้าหงเทียนนับสิบปี · ไม้เท้าและฝ่ามือเชี่ยวชาญพอ ๆ กัน",
    locationIds: ["sect_beggars"],
    dialogSceneId: "npc_sect_beggars_vice_chief_lifang_talk",
    sparOpponentId: "spar_beggars_lifang",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "rice_dish", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "wood_hard", weight: 2 },
    ],
    tags: ["vice_chief", "beggars"],
  },

  {
    id: "sect_beggars_staff_elder_qicheng",
    name: "อาจารย์ไม้เท้าฉีเฉิง",
    description: "ปรมาจารย์ไม้เท้าของพรรคยาจก · ผู้สืบทอดเพลงไม้เท้าตีสุขและไม้เท้าพเนจร · พูดน้อยแต่ตีหนัก",
    locationIds: ["sect_beggars"],
    dialogSceneId: "npc_sect_beggars_staff_elder_qicheng_talk",
    sparOpponentId: "spar_beggars_qicheng",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "wood_hard", weight: 4 },
      { itemId: "rice_dish", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["elder", "beggars", "staff_master"],
  },

  {
    id: "sect_beggars_fist_elder_wudao",
    name: "อาจารย์หมัดอู่เต้า",
    description: "ปรมาจารย์ฝ่ามือของพรรคยาจก · เชี่ยวชาญฝ่ามือจับมังกรและ ๑๘ ฝ่ามือมังกร · ใจบุญต่อคนยาก",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_wudao",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "rice_dish", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "beggars", "fist_master"],
  },

  {
    id: "sect_beggars_intel_elder_yunsi",
    name: "อาจารย์ข่าวสารยุนซือ",
    description: "ปรมาจารย์ข่าวกรองของพรรคยาจก · รู้ข้อมูลทุกตรอกซอกซอยทั่วยุทธภพ · ดูบุคลิกซ่อนเร้นแต่ใจกว้าง",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_yunsi",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "paper", weight: 5 },
      { itemId: "ink", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
    ],
    tags: ["elder", "beggars", "intelligence"],
  },

  {
    id: "sect_beggars_head_disciple_renhua",
    name: "หัวหน้าศิษย์เหรินฮัว",
    description: "หัวหน้ารุ่นพี่ของศิษย์พรรคยาจก · ไม้เท้าล่องลอยและเพลงหมัดอสรพิษเชี่ยวชาญ · นำคำสั่งจากหัวหน้าไปสู่ศิษย์รุ่นน้อง",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_renhua",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "rice_dish", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["head_disciple", "beggars"],
  },

  {
    id: "sect_beggars_disciple_dawei",
    name: "ศิษย์ต้าเหว่ย",
    description: "ศิษย์พรรคยาจกผู้ฝึกไม้เท้าอสรพิษ · มาจากเขตเหนือ · นิสัยหนักแน่นและขยัน",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_dawei",
    sparFameReward: 5,
    tags: ["disciple", "beggars"],
  },

  {
    id: "sect_beggars_disciple_xiaohu",
    name: "ศิษย์เสี่ยวฮู",
    description: "ศิษย์พรรคยาจกหนุ่มสาวผู้ฝึกเพลงหมัดล่องลอย · มาจากเขตใต้ · สดใสและคล่องแคล่ว",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_xiaohu",
    sparFameReward: 5,
    tags: ["disciple", "beggars"],
  },

  {
    id: "sect_beggars_junior_xiaomao",
    name: "ศิษย์เสี่ยวเหมา",
    description: "ศิษย์รุ่นเยาว์ของพรรคยาจก · เพิ่งเริ่มฝึกประกาศิตและไม้เท้าขอทาน · ใจร้อนแต่ตั้งใจ",
    locationIds: ["sect_beggars"],
    sparOpponentId: "spar_beggars_xiaomao",
    sparFameReward: 3,
    tags: ["disciple", "beggars"],
  },

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
];
