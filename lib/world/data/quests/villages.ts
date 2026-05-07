import type { QuestDef } from "../../types";

// Side quests owned by content agent B — anchored to NPCs in
// lib/world/data/npcs/villages.ts. Dialog scene references resolve in
// lib/world/data/scenes-content/villages.ts.

export const QUESTS_VILLAGES: readonly QuestDef[] = [
  // ══════════════════════════════════════════════════════════════════
  // village_qigu — ลาวหนาน (farmer)
  // ══════════════════════════════════════════════════════════════════

  // fetch
  {
    id: "qv_qigu_missing_seed",
    name: "สมุนไพรทดแทนเมล็ดพันธุ์",
    description: "ชาวนาลาวหนานสูญเสียเมล็ดพันธุ์ทั้งหมดให้แก่หนูป่า เขาขอให้หาสมุนไพรพันธุ์ดีมาให้ห้าหน่วยเพื่อปลูกแทน",
    briefSummary: "เก็บสมุนไพร 5 หน่วยและนำกลับมาให้ลาวหนาน",
    type: "side",
    giverNpcId: "vil_qigu_farmer_lao",
    stages: [
      {
        id: "collect_seed",
        description: "เก็บสมุนไพรพันธุ์ดี 5 หน่วยจากป่ารอบหมู่บ้าน",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 5 },
      },
      {
        id: "return_seed",
        description: "นำสมุนไพรกลับมาให้ลาวหนาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "item", itemId: "herb", count: 2 },
      { t: "npcRelationship", npcId: "vil_qigu_farmer_lao", amount: 10 },
    ],
  },

  // defeat
  {
    id: "qv_qigu_wolf_menace",
    name: "ภัยหมาป่า",
    description: "ฝูงหมาป่าทำลายนาข้าวของชาวบ้าน ลาวหนานต้องการให้ใครสักคนช่วยกำจัดออกไป",
    briefSummary: "ปราบหมาป่า 3 ตัวบริเวณโกดังเก่า",
    type: "side",
    giverNpcId: "vil_qigu_farmer_lao",
    stages: [
      {
        id: "defeat_wolves",
        description: "ปราบหมาป่า 3 ตัว",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_wolf", count: 3 },
      },
      {
        id: "report_back",
        description: "รายงานผลให้ลาวหนาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "fur_pelt", count: 1 },
      { t: "npcRelationship", npcId: "vil_qigu_farmer_lao", amount: 15 },
      { t: "trait", trait: "fame", amount: 1 },
    ],
  },

  // investigation / dialog
  {
    id: "qv_qigu_ancestor_tablet",
    name: "แผ่นบรรพบุรุษที่สาบสูญ",
    description: "แผ่นบรรพบุรุษของตระกูลลาวหนานถูกขโมยโดยโจรเร่ร่อน ต้องนำกลับมาเพื่อปลอบใจชายแก่",
    briefSummary: "สืบหาและนำแผ่นบรรพบุรุษกลับคืน",
    type: "side",
    giverNpcId: "vil_qigu_farmer_lao",
    stages: [
      {
        id: "find_tablet",
        description: "ปราบโจรและนำแผ่นบรรพบุรุษกลับ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 1 },
      },
      {
        id: "return_tablet",
        description: "นำแผ่นกลับให้ลาวหนาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "ancient_coin", count: 1 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "vil_qigu_farmer_lao", amount: 20 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // village_qigu — นางเหมย (herbalist)
  // ══════════════════════════════════════════════════════════════════

  // fetch
  {
    id: "qv_qigu_rare_herb",
    name: "บัวหิมะเพื่อผู้ป่วย",
    description: "นางเหมยต้องการบัวหิมะเพื่อรักษาผู้ป่วยในหมู่บ้าน แต่ไม่มีเวลาออกไปเองได้ — บัวหิมะหาได้ที่ก้นหุบเขาตัดใจเท่านั้น",
    briefSummary: "นำบัวหิมะ 1 ชิ้นจากก้นหุบเขาตัดใจมาให้นางเหมย",
    type: "side",
    giverNpcId: "vil_qigu_herbalist_mei",
    stages: [
      {
        id: "get_herb",
        description: "เดินทางลงไปยังก้นหุบเขาตัดใจและเก็บบัวหิมะ",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      {
        id: "return_herb",
        description: "ส่งบัวหิมะให้นางเหมย",
      },
    ],
    rewards: [
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "vil_qigu_herbalist_mei", amount: 15 },
    ],
  },

  // investigation + combat
  {
    id: "qv_qigu_poisoned_well",
    name: "บ่อน้ำถูกวางยา",
    description: "บ่อน้ำกลางหมู่บ้านถูกวางยาพิษ นางเหมยต้องการผู้ช่วยสืบหาคนร้ายและกำจัดออก",
    briefSummary: "สืบหาและปราบผู้วางยาพิษในบ่อน้ำ",
    type: "side",
    giverNpcId: "vil_qigu_herbalist_mei",
    stages: [
      {
        id: "investigate",
        description: "สืบสวนสอดสวนรอยเท้าใกล้บ่อน้ำ",
      },
      {
        id: "confront",
        description: "เผชิญหน้ากับผู้ต้องสงสัย",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "item", itemId: "ginseng", count: 2 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "vil_qigu_herbalist_mei", amount: 20 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // village_meihua — เฉินเยว่ (musician)
  // ══════════════════════════════════════════════════════════════════

  // fetch
  {
    id: "qv_meihua_lost_score",
    name: "ตำราเพลงที่หายไป",
    description: "ตำราเพลงโบราณของเฉินเยว่หายไปจากสำนักดนตรี น่าจะถูกพ่อค้าเร่นำไปขาย",
    briefSummary: "ตามหาตำราเพลงโบราณที่หายไปของเฉินเยว่",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "search_book",
        description: "หาตำราเพลงโบราณ",
        autoAdvance: { t: "hasItem", itemId: "song_basic", count: 1 },
      },
      {
        id: "return_book",
        description: "ส่งคืนให้เฉินเยว่",
      },
    ],
    rewards: [
      { t: "item", itemId: "song_basic", count: 1 },
      { t: "wExp", amount: 20 },
      { t: "npcRelationship", npcId: "vil_meihua_musician_chen", amount: 10 },
    ],
  },

  // deliver
  {
    id: "qv_meihua_music_duel",
    name: "ดวลดนตรี",
    description: "เฉินเยว่ได้รับคำท้าจากนักดนตรีคู่แข่ง ต้องการผู้ช่วยนำสารและเพลงไปพิสูจน์",
    briefSummary: "นำจดหมายท้าดวลดนตรีและกลับมาพร้อมคำตอบ",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "deliver_letter",
        description: "เดินทางไปยังหมู่บ้านใกล้เคียงและส่งสาร",
        autoAdvance: { t: "visitedLocation", locationId: "village_hengshan" },
      },
      {
        id: "return_reply",
        description: "นำคำตอบกลับมาให้เฉินเยว่",
      },
    ],
    rewards: [
      { t: "item", itemId: "song_inter", count: 1 },
      { t: "gold", amount: 60 },
      { t: "npcRelationship", npcId: "vil_meihua_musician_chen", amount: 15 },
    ],
  },

  // fetch (simple) — uses lotus seeds as festival ornaments paired
  // with the plum bloom (lotus seeds → bead strings on the altar).
  {
    id: "qv_meihua_plum_festival",
    name: "เครื่องประดับเทศกาลดอกเหมย",
    description: "เฉินเยว่ต้องการเม็ดบัวร้อยพวงประดับแท่นบูชาเทศกาลดอกเหมยประจำปี",
    briefSummary: "เก็บเม็ดบัว 5 หน่วยสำหรับเทศกาลดอกเหมยก่อนรุ่งสาง",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "gather_plum",
        description: "เก็บเม็ดบัว 5 หน่วยจากบ่อน้ำ / ป่ารอบหมู่บ้าน",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 },
      },
      {
        id: "deliver_plum",
        description: "ส่งเม็ดบัวให้เฉินเยว่ตกแต่งแท่นบูชา",
      },
    ],
    rewards: [
      { t: "gold", amount: 50 },
      { t: "item", itemId: "moon_cake", count: 3 },
      { t: "npcRelationship", npcId: "vil_meihua_musician_chen", amount: 8 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // village_meihua — เปาเหล็กก้าน (hunter)
  // ══════════════════════════════════════════════════════════════════

  // defeat
  {
    id: "qv_meihua_boar_hunt",
    name: "ล่าหมูป่าดุ",
    description: "หมูป่าดุร้ายทำลายสวนชาวบ้านหลายหลัง เปาเหล็กก้านเจ็บเข่าและต้องการผู้ช่วย",
    briefSummary: "ล่าหมูป่าดุ 2 ตัวในป่าทางเหนือ",
    type: "side",
    giverNpcId: "vil_meihua_hunter_bao",
    stages: [
      {
        id: "hunt_boars",
        description: "ปราบหมูป่า 2 ตัว",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_boar", count: 2 },
      },
      {
        id: "report_back",
        description: "รายงานผลให้เปาเหล็กก้าน",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "cooked_meat", count: 2 },
      { t: "npcRelationship", npcId: "vil_meihua_hunter_bao", amount: 12 },
    ],
  },

  // visit + optional combat
  {
    id: "qv_meihua_tiger_track",
    name: "รอยเสือภูเขา",
    description: "เปาเหล็กก้านเห็นรอยเสือภูเขาขนาดใหญ่ผิดปกติ ต้องการให้ไปยืนยันที่ถ้ำ",
    briefSummary: "สำรวจถ้ำเพื่อยืนยันรอยเสือและกลับมารายงาน",
    type: "side",
    giverNpcId: "vil_meihua_hunter_bao",
    stages: [
      {
        id: "visit_cave",
        description: "เดินทางไปยังถ้ำเหนือเขา",
        autoAdvance: { t: "visitedLocation", locationId: "cave_zhizhu" },
      },
      {
        id: "report_back",
        description: "กลับมารายงานเปาเหล็กก้าน",
      },
    ],
    rewards: [
      { t: "item", itemId: "tiger_claw", count: 1 },
      { t: "gold", amount: 80 },
      { t: "npcRelationship", npcId: "vil_meihua_hunter_bao", amount: 15 },
      { t: "trait", trait: "fame", amount: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // village_hengshan — ผู้อาวุโสอู๋ (elder)
  // ══════════════════════════════════════════════════════════════════

  // visit / deliver
  {
    id: "qv_hengshan_song_scroll",
    name: "ม้วนเพลงโบราณ",
    description: "ม้วนเพลงโบราณของหมู่บ้านฮิงซานอยู่ที่สำนักเฮิงซาน ผู้อาวุโสอู๋ต้องการให้ขอคืนมา",
    briefSummary: "ไปสำนักเฮิงซานเพื่อขอม้วนเพลงกลับคืน",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "visit_sect",
        description: "เดินทางไปยังสำนักเฮิงซาน",
        autoAdvance: { t: "visitedLocation", locationId: "sect_hengshan_south" },
      },
      {
        id: "return_scroll",
        description: "นำม้วนเพลงกลับมาให้ผู้อาวุโสอู๋",
      },
    ],
    rewards: [
      { t: "gold", amount: 90 },
      { t: "item", itemId: "song_inter", count: 1 },
      { t: "trait", trait: "humility", amount: 1 },
      { t: "npcRelationship", npcId: "vil_hengshan_elder_wu", amount: 20 },
    ],
  },

  // moral / dialog
  {
    id: "qv_hengshan_dispute_land",
    name: "ข้อพิพาทที่ดิน",
    description: "สองครอบครัวในหมู่บ้านฮิงซานทะเลาะกันเรื่องเขตที่ดิน ผู้อาวุโสอู๋ต้องการคนกลางที่เป็นกลาง",
    briefSummary: "ทำหน้าที่คนกลางไกล่เกลี่ยข้อพิพาทที่ดิน",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "hear_both_sides",
        description: "ฟังทั้งสองฝ่ายและตัดสินใจ",
      },
      {
        id: "resolve",
        description: "แจ้งผลการไกล่เกลี่ยให้ผู้อาวุโสอู๋รับรู้",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 25 },
      { t: "npcRelationship", npcId: "vil_hengshan_elder_wu", amount: 15 },
    ],
  },

  // deliver / fetch
  {
    id: "qv_hengshan_winter_aid",
    name: "ช่วยเหลือฤดูหนาว",
    description: "ฤดูหนาวมาเร็ว ผู้สูงอายุในหมู่บ้านฮิงซานขาดแคลนอาหารและยา ผู้อาวุโสอู๋ขอให้ช่วยส่งของ",
    briefSummary: "ส่งอาหารและยาให้ครอบครัวผู้สูงอายุสามหลัง",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "deliver_aid",
        description: "ส่งอาหารและยาให้ครบสามครอบครัว",
        autoAdvance: {
          t: "and",
          all: [
            { t: "not", of: { t: "hasItem", itemId: "rice_dish", count: 1 } },
            { t: "not", of: { t: "hasItem", itemId: "potion", count: 1 } },
          ],
        },
      },
      {
        id: "report_complete",
        description: "รายงานผลให้ผู้อาวุโสอู๋",
      },
    ],
    rewards: [
      { t: "gold", amount: 60 },
      { t: "item", itemId: "ginseng", count: 1 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "vil_hengshan_elder_wu", amount: 18 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // village_wuxia — เติ้งลองหาง (fisherman)
  // ══════════════════════════════════════════════════════════════════

  // investigation + visit
  {
    id: "qv_wuxia_missing_boat",
    name: "เรือหายและลูกชายหาย",
    description: "ลูกชายของเติ้งลองหางนำเรือออกไปและหายตัวสามวัน ต้องการความช่วยเหลือในการตามหา",
    briefSummary: "ตามหาน้อยเติ้งที่หายไปพร้อมเรือ",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    stages: [
      {
        id: "search_river",
        description: "ค้นหาน้อยเติ้งตามแม่น้ำ",
        autoAdvance: { t: "visitedLocation", locationId: "isle_wuming" },
      },
      {
        id: "return_boy",
        description: "พาน้อยเติ้งกลับบ้านอย่างปลอดภัย",
      },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "item", itemId: "fish_eel", count: 3 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "vil_wuxia_fisherman_deng", amount: 20 },
    ],
  },

  // investigation / moral
  {
    id: "qv_wuxia_river_ghost",
    name: "เสียงประหลาดจากแม่น้ำ",
    description: "เสียงร้องประหลาดยามกลางคืนทำให้ชาวบ้านกลัว เติ้งลองหางเชื่อว่าเป็นฝีมือมนุษย์",
    briefSummary: "สืบหาแหล่งกำเนิดของเสียงประหลาดในแม่น้ำ",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    stages: [
      {
        id: "investigate_sound",
        description: "ค้นหาแหล่งเสียงประหลาดในยามค่ำ",
        autoAdvance: { t: "flag", flag: "river_ghost_discovered" },
      },
      {
        id: "resolve",
        description: "จัดการกับปัญหาและรายงานผล",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 20 },
      { t: "npcRelationship", npcId: "vil_wuxia_fisherman_deng", amount: 12 },
    ],
  },

  // combat / moral
  {
    id: "qv_wuxia_pirate_cache",
    name: "สมบัติโจรสลัด",
    description: "น้อยเติ้งเห็นโจรสลัดฝังสมบัติไว้ที่หาดทราย เติ้งลองหางต้องการให้ไปเอามาก่อนโจรจะกลับ",
    briefSummary: "ค้นหาและยึดสมบัติที่โจรสลัดฝังไว้",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    prereqs: { t: "questStatus", questId: "qv_wuxia_missing_boat", status: "done" },
    stages: [
      {
        id: "find_cache",
        description: "ค้นหาสมบัติใต้ต้นโพธิ์สองต้น",
        autoAdvance: { t: "visitedLocation", locationId: "isle_yuanyang" },
      },
      {
        id: "defeat_pirates",
        description: "ปราบโจรสลัดที่ปกป้องสมบัติ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "item", itemId: "jade", count: 1 },
      { t: "npcRelationship", npcId: "vil_wuxia_fisherman_deng", amount: 15 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // inn_yuelai — นางสาวซิ่ว (server / gossip)
  // ══════════════════════════════════════════════════════════════════

  // deliver
  {
    id: "qv_inn_lost_satchel",
    name: "กระเป๋าที่ลืมไว้",
    description: "แขกของโรงเตี๊ยมลืมกระเป๋าสำคัญไว้ นางสาวซิ่วต้องการให้ช่วยนำไปส่งที่โรงเตี๊ยมถัดไป",
    briefSummary: "นำกระเป๋าที่ลืมไว้ไปส่งให้แขกที่โรงเตี๊ยมเกาเซิ่ง",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    turnInNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "travel_to_gaosheng",
        description: "เดินทางพร้อมกระเป๋าไปยังโรงเตี๊ยมเกาเซิ่ง",
        autoAdvance: { t: "visitedLocation", locationId: "inn_gaosheng" },
      },
      {
        id: "deliver_satchel",
        description: "ส่งกระเป๋าให้แขกที่โรงเตี๊ยมเกาเซิ่ง",
      },
    ],
    rewards: [
      { t: "gold", amount: 70 },
      { t: "trait", trait: "good", amount: 1 },
      { t: "npcRelationship", npcId: "inn_yuelai_server_xiu", amount: 10 },
    ],
  },

  // investigation + combat
  {
    id: "qv_inn_spy_guest",
    name: "แขกน่าสงสัย",
    description: "นางสาวซิ่วสังเกตเห็นแขกที่ถามคำถามประหลาดเกี่ยวกับสำนักต่าง ๆ เชื่อว่าเขาเป็นสายลับ",
    briefSummary: "สืบสวนตัวตนของแขกประหลาดในโรงเตี๊ยม",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    stages: [
      {
        id: "observe_guest",
        description: "สังเกตพฤติกรรมแขกห้อง 3",
      },
      {
        id: "confront",
        description: "เผชิญหน้ากับแขกประหลาด",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "item", itemId: "rice_dish", count: 1 },
      { t: "npcRelationship", npcId: "inn_yuelai_server_xiu", amount: 15 },
    ],
  },

  // combat / moral
  {
    id: "qv_inn_debt_collector",
    name: "นักเลงเรียกหนี้",
    description: "นักเลงมาคุกคามนางสาวซิ่วเรื่องหนี้ของแขกเก่า ต้องการคนช่วยจัดการ",
    briefSummary: "ไล่นักเลงออกจากโรงเตี๊ยมด้วยวิธีที่เหมาะสม",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    stages: [
      {
        id: "deal_with_collector",
        description: "จัดการกับนักเลงเรียกหนี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "spicy_stew", count: 1 },
      { t: "npcRelationship", npcId: "inn_yuelai_server_xiu", amount: 12 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // inn_gaosheng — เฉาอ้วน (keeper / chef)
  // ══════════════════════════════════════════════════════════════════

  // fetch
  {
    id: "qv_inn_special_ingredient",
    name: "วัตถุดิบพิเศษ",
    description: "เฉาอ้วนต้องการปลาไหลสดจากแม่น้ำวูเซี่ยสำหรับลูกค้าสำคัญ แต่ตลาดหาไม่ได้",
    briefSummary: "หาปลาไหลสด 3 ตัวจากแม่น้ำวูเซี่ย",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "fish_eels",
        description: "หาปลาไหลสด 3 ตัว",
        autoAdvance: { t: "hasItem", itemId: "fish_eel", count: 3 },
      },
      {
        id: "deliver_eels",
        description: "ส่งปลาไหลให้เฉาอ้วน",
      },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "item", itemId: "spicy_stew", count: 2 },
      { t: "npcRelationship", npcId: "inn_gaosheng_keeper_fat", amount: 10 },
    ],
  },

  // moral / investigation
  {
    id: "qv_inn_rival_inn",
    name: "โรงเตี๊ยมคู่แข่ง",
    description: "โรงเตี๊ยมใหม่เปิดและแย่งลูกค้าเฉาอ้วน เขาต้องการข้อมูลเกี่ยวกับเมนูพิเศษของคู่แข่ง",
    briefSummary: "ไปสำรวจโรงเตี๊ยมคู่แข่งและกลับมารายงาน",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "scout_rival",
        description: "ไปสำรวจโรงเตี๊ยมคู่แข่ง",
        autoAdvance: { t: "visitedLocation", locationId: "inn_youjian" },
      },
      {
        id: "report_back",
        description: "รายงานสิ่งที่พบให้เฉาอ้วน",
      },
    ],
    rewards: [
      { t: "gold", amount: 90 },
      { t: "npcRelationship", npcId: "inn_gaosheng_keeper_fat", amount: 10 },
    ],
  },

  // dialog / moral
  {
    id: "qv_inn_drunk_warrior",
    name: "นักรบที่เศร้าโศก",
    description: "นักรบผู้สูญเสียสำนักนั่งดื่มในโรงเตี๊ยม เฉาอ้วนเป็นห่วงและต้องการให้ช่วยไปคุย",
    briefSummary: "คุยกับนักรบที่กำลังเศร้าโศกและช่วยเขาหาความหมาย",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "talk_warrior",
        description: "ไปพูดคุยกับนักรบผู้นั้น",
      },
      {
        id: "report_back",
        description: "บอกผลให้เฉาอ้วนรู้",
      },
    ],
    rewards: [
      { t: "item", itemId: "rice_dish", count: 2 },
      { t: "gold", amount: 50 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "inn_gaosheng_keeper_fat", amount: 15 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // inn_heluo — โปผู้เล่าเรื่อง (storyteller)
  // ══════════════════════════════════════════════════════════════════

  // visit / investigation
  {
    id: "qv_inn_legend_verify",
    name: "ตำนานถ้ำโบราณ",
    description: "โปผู้เล่าเรื่องได้ยินว่ามีถ้ำโบราณพร้อมภาพสลักเรื่องยุทธจักรในอดีต ต้องการให้ช่วยยืนยัน",
    briefSummary: "ค้นหาถ้ำโบราณและนำหลักฐานกลับมาให้โป",
    type: "side",
    giverNpcId: "inn_heluo_storyteller_po",
    stages: [
      {
        id: "find_cave",
        description: "ค้นหาถ้ำโบราณตามที่โปบอก",
        autoAdvance: { t: "visitedLocation", locationId: "cave_tangshi" },
      },
      {
        id: "report_findings",
        description: "กลับมาเล่าให้โปฟัง",
      },
    ],
    rewards: [
      { t: "item", itemId: "ancient_coin", count: 1 },
      { t: "item", itemId: "book_basic", count: 1 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "inn_heluo_storyteller_po", amount: 15 },
    ],
  },

  // moral / investigation
  {
    id: "qv_inn_missing_traveler",
    name: "ผู้เดินทางที่หายไป",
    description: "ผู้หญิงคนหนึ่งพักที่โรงเตี๊ยมแล้วหายตัวไปอย่างลึกลับ โปผู้เล่าเรื่องเป็นห่วงมาก",
    briefSummary: "สืบหาผู้หญิงที่หายตัวจากโรงเตี๊ยมเฮ่อลั่ว",
    type: "side",
    giverNpcId: "inn_heluo_storyteller_po",
    stages: [
      {
        id: "search_area",
        description: "สืบหาร่องรอยของผู้หญิงที่หายไป",
      },
      {
        id: "resolve_situation",
        description: "จัดการสถานการณ์และรายงานให้โป",
      },
    ],
    rewards: [
      { t: "item", itemId: "jade", count: 1 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "inn_heluo_storyteller_po", amount: 20 },
    ],
  },
];
