import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_TAISHAN: readonly NpcDef[] = [
  {
    id: "sect_taishan_master_tianmen",
    name: "เจ้าสำนักเทียนเหมินเต้าเหริน",
    description: "เจ้าสำนักไท่ซาน · นักพรตเต๋าผู้รับแสงอรุณบนยอดเขาบูรพา · เพลงกระบี่สุริยอุทัยของเขาขึ้นชื่อว่าตวัดดาบครั้งใดไม่เคยพลาด · พูดน้อย ตรงไปตรงมา · รับศิษย์ที่ใจสะอาดและฝีมือมั่นคง",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_master_tianmen_talk",
    sparOpponentId: "spar_taishan_master_tianmen",
    sparFameReward: 12,
    questIds: [
      "qst_taishan_disciple_intro",
      "qst_taishan_sect_patrol",
      "qst_taishan_sect_jade",
      "qst_taishan_sect_dawn_offering",
      "qst_taishan_art_sun",
      "qst_taishan_redemption",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "jade", weight: 5 },
      { itemId: "iron_ore", weight: 3 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_hard", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "swordsman", "taishan"],
  },

  {
    id: "sect_taishan_vice_yuyangzi",
    name: "รองเจ้าสำนักอวี้หยางจื่อ",
    description: "รองเจ้าสำนักไท่ซาน · นักพรตเต๋าวัยกลาง · กระบี่ของท่านตรงไปตรงมา ไม่มีลีลาฟุ่มเฟือย · เป็นมือขวาของเทียนเหมินเต้าเหรินมาเกือบสองสิบปี",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_vice_yuyangzi_talk",
    sparOpponentId: "spar_taishan_yuyangzi",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "jade", weight: 4 },
      { itemId: "iron_ore", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "swordsman", "taishan"],
  },

  {
    id: "sect_taishan_elder_chiyangzi",
    name: "อาจารย์อาวุโสฉื่อหยางจื่อ",
    description: "อาจารย์อาวุโสประจำหอวิชาของไท่ซาน · เก่งกาจในเพลงกระบี่ทะลวงอรุณ · ใบหน้าหยาบกร้านราวกับหินภูเขาบูรพา แต่กระบี่คมเหมือนแสงแรกของฟ้า",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_elder_chiyangzi_talk",
    sparOpponentId: "spar_taishan_chiyangzi",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 2 },
    ],
    tags: ["elder", "swordsman", "taishan"],
  },

  {
    id: "sect_taishan_disciple_kunwu",
    name: "ศิษย์คุนหวู่",
    description: "ลูกศิษย์ดาบไท่ซานวัยกลาง · ใจกล้า · ใช้กระบี่สองมือเป็นอาวุธคู่ใจ · ฝึกซ้อมท่ากระบี่สุริยอุทัยทุกเช้าก่อนพระอาทิตย์ขึ้น · ตั้งเป้าจะเป็นผู้สืบทอดวิชาของอาจารย์ใหญ่",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_disciple_kunwu_talk",
    sparOpponentId: "spar_taishan_disciple",
    sparFameReward: 5,
    tags: ["disciple", "swordsman", "taishan", "sparring"],
  },

  {
    id: "sect_taishan_disciple2_jingyang",
    name: "ศิษย์จิ้งหยาง",
    description: "ศิษย์ไท่ซานวัยหนุ่ม · เฝ้าประตูสำนักด้านบูรพา · กระตือรือร้นและสุภาพ · ภาคภูมิใจในชื่อสำนัก เคยเอ่ยว่าหากมีใครดูหมิ่นไท่ซาน เขาจะตวัดกระบี่ไม่ยั้ง",
    locationIds: ["sect_taishan"],
    dialogSceneId: "npc_sect_taishan_disciple2_jingyang_talk",
    sparOpponentId: "spar_taishan_jingyang",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "taishan"],
  },
];
