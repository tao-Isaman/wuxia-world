import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_MING: readonly NpcDef[] = [
  {
    id: "sect_sunmoon_chief_dongfang",
    name: "เจ้าสำนักต่งฟางปู้ป้าย",
    description: "เจ้าสำนักพรรคตะวันจันทรา · ผู้สืบทอดเฉียนคุนต้าหนัวอีและพลังสุริยันจันทรา · ฝีมือเทียบเท่าตำนานยุทธจักร · ใจเด็ดเดี่ยวและคิดล้ำลึก",
    locationIds: ["sect_ming"],
    dialogSceneId: "npc_sect_sunmoon_chief_dongfang_talk",
    sparOpponentId: "spar_sunmoon_chief_dongfang",
    sparFameReward: 18,
    questIds: [
      "qst_sunmoon_disciple_intro",
      "qst_sunmoon_sect_patrol",
      "qst_sunmoon_sect_scripture",
      "qst_sunmoon_art_qiankun",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 5 },
      { itemId: "jade", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "sunmoon"],
  },

  {
    id: "sect_sunmoon_vice_renwoxing",
    name: "รองเจ้าสำนักเหรินหวัวสิง",
    description: "รองเจ้าสำนักของพรรคตะวันจันทรา · ฝึกพลังดูดดาวจนเชี่ยวชาญ · นิสัยรุนแรงแต่ภักดี",
    locationIds: ["sect_ming"],
    dialogSceneId: "npc_sect_sunmoon_vice_renwoxing_talk",
    sparOpponentId: "spar_sunmoon_renwoxing",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "viper_venom", weight: 2 },
    ],
    tags: ["vice_master", "sunmoon"],
  },

  {
    id: "sect_sunmoon_sun_elder_zuolengchan",
    name: "ผู้อาวุโสตะวันจั่วเหลิงฉัน",
    description: "ผู้อาวุโสฝ่ายตะวัน (yang) ของพรรค · เชี่ยวชาญพลังกายสุริยันและเพลิงตะวัน · พูดกระชับและเด็ดขาด",
    locationIds: ["sect_ming"],
    dialogSceneId: "npc_sect_sunmoon_sun_elder_zuolengchan_talk",
    sparOpponentId: "spar_sunmoon_zuolengchan",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "potion_big", weight: 2 },
    ],
    tags: ["elder", "sunmoon", "yang"],
  },

  {
    id: "sect_sunmoon_moon_elder_xianggwentian",
    name: "ผู้อาวุโสจันทราเสี่ยงเหวินเทียน",
    description: "ผู้อาวุโสฝ่ายจันทรา (yin) ของพรรค · เชี่ยวชาญพลังกายจันทราและร้อยจันทรา · เงียบขรึมและลึกซึ้ง",
    locationIds: ["sect_ming"],
    sparOpponentId: "spar_sunmoon_xianggwentian",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "potion_big", weight: 2 },
    ],
    tags: ["elder", "sunmoon", "yin"],
  },

  {
    id: "sect_sunmoon_balance_elder_qudongfeng",
    name: "ผู้อาวุโสสมดุลฉวี่ตงเฟิง",
    description: "ผู้อาวุโสฝ่ายสมดุล · เชี่ยวชาญพลังสองขั้วผสานและพลังสุริยันจันทรา · ใจเที่ยงตรงและผ่อนปรน",
    locationIds: ["sect_ming"],
    sparOpponentId: "spar_sunmoon_qudongfeng",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 4 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["elder", "sunmoon", "balance"],
  },

  {
    id: "sect_sunmoon_head_disciple_yilin",
    name: "หัวหน้าศิษย์อี้หลิน",
    description: "หัวหน้ารุ่นพี่ของศิษย์พรรค · เชี่ยวชาญพลังกายสุริยันและเพลิงตะวัน · นำคำสั่งจากเจ้าสำนัก",
    locationIds: ["sect_ming"],
    sparOpponentId: "spar_sunmoon_yilin",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["head_disciple", "sunmoon"],
  },

  {
    id: "sect_sunmoon_disciple_lanfenghuang",
    name: "ศิษย์หลานเฟิงหวง",
    description: "ศิษย์รุ่นใหม่ของพรรคตะวันจันทรา · ฝึกพลังเพลิงตะวันและเพลิงปรากฏการณ์ · ใจร้อนแต่ขยัน",
    locationIds: ["sect_ming"],
    sparOpponentId: "spar_sunmoon_lanfenghuang",
    sparFameReward: 5,
    tags: ["disciple", "sunmoon"],
  },

  {
    id: "sect_sunmoon_junior_xiaoyu",
    name: "ศิษย์เสี่ยวอวี้",
    description: "ศิษย์รุ่นเยาว์ · เพิ่งเริ่มฝึกพลังสองขั้ว · สดใสและกระตือรือร้น",
    locationIds: ["sect_ming"],
    sparOpponentId: "spar_sunmoon_xiaoyu",
    sparFameReward: 3,
    tags: ["disciple", "sunmoon"],
  },

  {
    id: "sect_ming_elder_zhuying",
    name: "ผู้อาวุโสจูอิง",
    description: "ผู้อาวุโสลับของพรรค · รู้ความลับมาก ใช้คนเป็น ไม่ค่อยเปิดเผยตัว",
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
    tags: ["elder", "sunmoon", "shadow"],
  },

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
];
