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
    description: "หนูป่ากินเมล็ดข้าวของลาวหนาน ชาวนาแก่แห่งหมู่บ้านชีกู่ จนหมดยุ้ง ปีนี้เขาจะปลูกสมุนไพรขายแทน และขอสมุนไพรหายาก 5 กำมาเพาะเป็นต้นพันธุ์",
    briefSummary: "หาสมุนไพรหายาก 5 กำให้ลาวหนานที่หมู่บ้านชีกู่",
    type: "side",
    giverNpcId: "vil_qigu_farmer_lao",
    stages: [
      {
        id: "collect_seed",
        description: "หาสมุนไพรหายาก 5 กำ",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 5 },
      },
      {
        id: "return_seed",
        description: "นำสมุนไพรกลับไปให้ลาวหนานที่หมู่บ้านชีกู่",
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
    description: "ฝูงหมาป่าบุกทำลายนาข้าวของหมู่บ้านชีกู่ ลาวหนานขอให้ปราบสัก 3 ตัว ฝูงจะได้ถอยไป",
    briefSummary: "ปราบหมาป่า 3 ตัว แล้วกลับไปบอกลาวหนาน",
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
        description: "กลับไปบอกลาวหนานที่หมู่บ้านชีกู่",
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
    description: "ป้ายบรรพบุรุษของตระกูลลาวหนานถูกโจรเส้นทางขโมยไป ปราบโจรให้ได้แล้วนำป้ายกลับมาคืนชาวนาแก่",
    briefSummary: "ปราบโจรเส้นทาง แล้วนำป้ายบรรพบุรุษคืนลาวหนาน",
    type: "side",
    giverNpcId: "vil_qigu_farmer_lao",
    stages: [
      {
        id: "find_tablet",
        description: "ปราบโจรเส้นทางที่ขโมยป้ายบรรพบุรุษไป (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 1 },
      },
      {
        id: "return_tablet",
        description: "นำป้ายบรรพบุรุษกลับไปคืนลาวหนานที่หมู่บ้านชีกู่",
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
        description: "ลงไปก้นหุบเขาตัดใจ แล้วเก็บบัวหิมะ 1 ดอก (ต้องมีทักษะเก็บสมุนไพรระดับ 5)",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      {
        id: "return_herb",
        description: "นำบัวหิมะไปให้นางเหมยที่หมู่บ้านชีกู่",
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
    description: "บ่อน้ำกลางหมู่บ้านชีกู่ถูกวางยาพิษ คนป่วยแล้วสามราย นางเหมยหมอสมุนไพรขอให้สืบรอยเท้าแปลก ๆ ข้างบ่อ แล้วกลับไปบอกนางว่าพบอะไร",
    briefSummary: "สืบรอยเท้าข้างบ่อ แล้วกลับไปบอกนางเหมย",
    type: "side",
    giverNpcId: "vil_qigu_herbalist_mei",
    stages: [
      {
        id: "investigate",
        description: "ตรวจรอยเท้าข้างบ่อน้ำกลางหมู่บ้านชีกู่",
        objective: {
          spots: [
            { locationId: "village_qigu", label: "ตรวจรอยเท้าข้างบ่อน้ำ", sceneId: "qs_qv_qigu_poisoned_well_investigate" },
          ],
        },
      },
      {
        id: "confront",
        description: "กลับไปบอกนางเหมยเรื่องรอยเท้าเปื้อนผงสีเขียว",
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
    description: "ตำราเพลงของเฉินเยว่ นักดนตรีแห่งหมู่บ้านดอกเหมย หายไป เขาสงสัยว่าพ่อค้าเร่เอาไปขายต่อ หาตำราเพลงพื้นฐานมาให้เขาสักเล่ม",
    briefSummary: "หาตำราเพลงพื้นฐาน 1 เล่มให้เฉินเยว่",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "search_book",
        description: "หาตำราเพลงพื้นฐาน 1 เล่ม (พ่อค้าเร่อาจขายต่อให้ร้านค้าไปแล้ว)",
        autoAdvance: { t: "hasItem", itemId: "song_basic", count: 1 },
      },
      {
        id: "return_book",
        description: "นำตำราเพลงไปคืนเฉินเยว่ที่หมู่บ้านดอกเหมย",
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
    description: "นักดนตรีที่หมู่บ้านฮิงซานท้าว่าเพลงของเฉินเยว่ไม่สมบูรณ์ เฉินเยว่ฝากเพลงตอบไปให้เขาฟัง นำสารไปส่งที่หมู่บ้านฮิงซาน แล้วนำคำตอบกลับมา",
    briefSummary: "ส่งสารไปหมู่บ้านฮิงซาน แล้วกลับมาบอกเฉินเยว่",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "deliver_letter",
        description: "นำสารของเฉินเยว่ไปมอบให้นักดนตรีผู้ท้าที่หมู่บ้านฮิงซาน",
        objective: {
          spots: [
            { locationId: "village_hengshan", label: "มอบสารเพลงให้นักดนตรีผู้ท้า", sceneId: "qs_qv_meihua_music_duel_deliver" },
          ],
        },
      },
      {
        id: "return_reply",
        description: "นำคำตอบกลับไปให้เฉินเยว่ที่หมู่บ้านดอกเหมย",
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
    description: "เฉินเยว่ต้องการเม็ดบัว 5 เม็ดมาร้อยเป็นพวงประดับแท่นบูชาในเทศกาลดอกเหมยประจำปี",
    briefSummary: "หาเม็ดบัว 5 เม็ดให้เฉินเยว่",
    type: "side",
    giverNpcId: "vil_meihua_musician_chen",
    stages: [
      {
        id: "gather_plum",
        description: "หาเม็ดบัว 5 เม็ด",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 },
      },
      {
        id: "deliver_plum",
        description: "นำเม็ดบัวไปให้เฉินเยว่ที่หมู่บ้านดอกเหมย",
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
    description: "หมูป่าดุร้ายทำลายสวนชาวบ้านในหมู่บ้านดอกเหมยหลายหลัง เปาเหล็กก้าน นายพรานของหมู่บ้าน เจ็บเข่าออกล่าไม่ไหว เขาขอให้ปราบแทนสัก 2 ตัว",
    briefSummary: "ปราบหมูป่า 2 ตัว แล้วกลับไปบอกเปาเหล็กก้าน",
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
        description: "กลับไปบอกเปาเหล็กก้านที่หมู่บ้านดอกเหมย",
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
    description: "เปาเหล็กก้านเห็นรอยเสือภูเขาขนาดใหญ่ผิดปกติมุ่งไปทางถ้ำแมงมุม เขาขอให้ไปดูว่ามีเสืออยู่จริงไหม แล้วกลับมาบอก",
    briefSummary: "ไปดูที่ถ้ำแมงมุม แล้วกลับมาบอกเปาเหล็กก้าน",
    type: "side",
    giverNpcId: "vil_meihua_hunter_bao",
    stages: [
      {
        id: "visit_cave",
        description: "ไปถ้ำแมงมุม แล้วตามรอยเสือดูว่ามีเสือภูเขาอยู่จริงไหม",
        objective: {
          spots: [
            { locationId: "cave_zhizhu", label: "ตามรอยเสือหน้าถ้ำ", sceneId: "qs_qv_meihua_tiger_track_found" },
          ],
        },
      },
      {
        id: "report_back",
        description: "กลับไปบอกเปาเหล็กก้านที่หมู่บ้านดอกเหมยว่าเห็นอะไร",
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
    description: "ม้วนเพลงโบราณของหมู่บ้านฮิงซานไปอยู่ที่สำนักเขาเฮิงซาน ผู้อาวุโสอู๋อยากได้คืนมาสอนเด็ก ๆ ขึ้นไปขอที่สำนัก แล้วนำกลับมาให้เขา",
    briefSummary: "ไปสำนักเฮิงซาน แล้วนำม้วนเพลงกลับมาให้ผู้อาวุโสอู๋",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "visit_sect",
        description: "เดินทางไปสำนักเฮิงซาน",
        autoAdvance: { t: "visitedLocation", locationId: "sect_hengshan_south" },
      },
      {
        id: "return_scroll",
        description: "นำม้วนเพลงกลับไปให้ผู้อาวุโสอู๋ที่หมู่บ้านฮิงซาน",
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
    description: "สองครอบครัวในหมู่บ้านฮิงซานทะเลาะกันเรื่องเขตที่ดินจนเกือบชกกัน ผู้อาวุโสอู๋อยากให้คนนอกที่ไม่เข้าข้างใครไปฟังทั้งสองฝ่าย แล้วช่วยตัดสิน",
    briefSummary: "ทำหน้าที่คนกลางไกล่เกลี่ยข้อพิพาทที่ดิน",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "hear_both_sides",
        description: "ฟังความทั้งสองครอบครัวในหมู่บ้านฮิงซาน แล้วตัดสิน",
        objective: {
          spots: [
            { locationId: "village_hengshan", label: "ฟังความสองครอบครัว", sceneId: "qs_qv_hengshan_dispute_land_mediate" },
          ],
        },
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
    description: "ฤดูหนาวมาเร็ว ผู้สูงอายุในหมู่บ้านฮิงซานขาดอาหารและยา ผู้อาวุโสอู๋ฝากข้าวหมูแดง 3 จานกับยาเลือดเล็ก 3 ขวดไปส่งให้ยายหลี่กับตาเฉินที่กระท่อมท้ายหมู่บ้าน",
    briefSummary: "ส่งข้าวหมูแดงและยาเลือดเล็กให้ยายหลี่กับตาเฉิน แล้วกลับไปบอกผู้อาวุโสอู๋",
    type: "side",
    giverNpcId: "vil_hengshan_elder_wu",
    stages: [
      {
        id: "deliver_aid",
        description: "นำข้าวหมูแดง 3 จานกับยาเลือดเล็ก 3 ขวดไปส่งให้ยายหลี่กับตาเฉินที่กระท่อมท้ายหมู่บ้านฮิงซาน (ถ้าของหายไป ซื้อหาเพิ่มให้ครบ)",
        objective: {
          spots: [
            { locationId: "village_hengshan", label: "ส่งของที่กระท่อมยายหลี่กับตาเฉิน", sceneId: "qs_qv_hengshan_winter_aid_deliver" },
          ],
        },
      },
      {
        id: "report_complete",
        description: "กลับไปบอกผู้อาวุโสอู๋ที่หมู่บ้านฮิงซาน",
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
    description: "น้อยเติ้ง ลูกชายวัยสิบห้าของเติ้งลองหาง ชาวประมงแห่งหมู่บ้านอวู่เซี่ย พายเรือออกไปแล้วหายไปสามวัน เรือน่าจะเกยตื้นที่เกาะไร้ชื่อกลางแม่น้ำ",
    briefSummary: "ไปเกาะไร้ชื่อ ตามหาน้อยเติ้ง แล้วพากลับบ้าน",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    stages: [
      {
        id: "search_river",
        description: "เดินทางไปเกาะไร้ชื่อ ตามหาน้อยเติ้ง",
        objective: {
          spots: [
            { locationId: "isle_wuming", label: "ตามหาน้อยเติ้งตามชายเกาะ", sceneId: "qs_qv_wuxia_missing_boat_found" },
          ],
        },
      },
      {
        id: "return_boy",
        description: "พาน้อยเติ้งกลับไปหาเติ้งลองหางที่หมู่บ้านอวู่เซี่ย",
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
    description: "ทุกคืนมีเสียงร้องประหลาดดังมาจากแม่น้ำ ชาวหมู่บ้านอวู่เซี่ยกลัวว่าเป็นผี แต่เติ้งลองหางเชื่อว่าเป็นฝีมือคน ซุ่มฟังริมแม่น้ำยามค่ำ แล้วกลับไปบอกเขา",
    briefSummary: "สืบหาแหล่งกำเนิดของเสียงประหลาดในแม่น้ำ",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    stages: [
      {
        id: "investigate_sound",
        description: "ซุ่มฟังเสียงริมแม่น้ำของหมู่บ้านอวู่เซี่ยยามค่ำ",
        objective: {
          spots: [
            { locationId: "village_wuxia", label: "ซุ่มฟังเสียงริมแม่น้ำยามค่ำ", sceneId: "qs_qv_wuxia_river_ghost_discover" },
          ],
        },
      },
      {
        id: "resolve",
        description: "กลับไปบอกเติ้งลองหางว่าเสียงนั้นมาจากไหน",
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
    description: "ตอนติดเกาะ น้อยเติ้งเห็นโจรสลัดฝังสมบัติไว้ที่หาดทรายของเกาะยกซาน ใต้ต้นโพธิ์สองต้น เติ้งลองหางอยากให้ไปเอามาก่อนโจรจะกลับมา",
    briefSummary: "ไปเกาะยกซาน ปราบโจรสลัดน้ำที่เฝ้าสมบัติ แล้วนำกล่องกลับมา",
    type: "side",
    giverNpcId: "vil_wuxia_fisherman_deng",
    prereqs: { t: "questStatus", questId: "qv_wuxia_missing_boat", status: "done" },
    stages: [
      {
        id: "find_cache",
        description: "ไปเกาะยกซาน (นกกระยาง) ขุดสมบัติใต้ต้นโพธิ์สองต้น — โจรสลัดน้ำยังเฝ้าอยู่",
        objective: {
          spots: [
            { locationId: "isle_yuanyang", label: "ขุดใต้ต้นโพธิ์สองต้น", sceneId: "qs_qv_wuxia_pirate_cache_fight" },
          ],
        },
      },
      {
        id: "return_cache",
        description: "แบกกล่องสมบัติกลับไปหาเติ้งลองหางที่หมู่บ้านอวู่เซี่ย",
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
    description: "แขกของโรงเตี๊ยมยั่วไหลลืมกระเป๋าเอกสารไว้พร้อมกุญแจ นางสาวซิ่วฝากให้นำไปส่งเขาที่โรงเตี๊ยมเกาเซิ่ง ที่เขากำลังมุ่งหน้าไป",
    briefSummary: "นำกระเป๋ากับกุญแจไปส่งแขกที่โรงเตี๊ยมเกาเซิ่ง",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    turnInNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "travel_to_gaosheng",
        description: "เดินทางพร้อมกระเป๋าไปโรงเตี๊ยมเกาเซิ่ง",
        autoAdvance: { t: "visitedLocation", locationId: "inn_gaosheng" },
      },
      {
        id: "deliver_satchel",
        description: "ถามเฉาอ้วนเจ้าของโรงเตี๊ยมเกาเซิ่งหาแขกคนนั้น แล้วส่งกระเป๋าคืน",
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
    description: "แขกห้อง 3 ของโรงเตี๊ยมยั่วไหลเอาแต่ถามที่ตั้งสำนักต่าง ๆ นางสาวซิ่วสงสัยว่าเขาเป็นสายลับ แอบดูเขาแล้วจัดการให้เรียบร้อย",
    briefSummary: "แอบดูแขกห้อง 3 ที่โรงเตี๊ยมยั่วไหล",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    stages: [
      {
        id: "observe_guest",
        description: "แอบดูแขกห้อง 3 ในโรงเตี๊ยมยั่วไหล",
        objective: {
          spots: [
            { locationId: "inn_yuelai", label: "สังเกตแขกห้อง 3", sceneId: "qs_qv_inn_spy_guest_confront" },
          ],
        },
      },
      {
        id: "confront",
        description: "กลับไปบอกนางสาวซิ่วว่าจัดการแขกห้อง 3 แล้ว",
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
    description: "นักเลงคนหนึ่งมาทวงหนี้ของแขกเก่ากับนางสาวซิ่วที่โรงเตี๊ยมยั่วไหล ช่วยไล่เขาไป จะพูดดี ๆ หรือสู้ก็ได้",
    briefSummary: "ไล่นักเลงทวงหนี้ออกจากโรงเตี๊ยมยั่วไหล",
    type: "side",
    giverNpcId: "inn_yuelai_server_xiu",
    stages: [
      {
        id: "deal_with_collector",
        description: "ไล่นักเลงทวงหนี้ แล้วบอกนางสาวซิ่วที่โรงเตี๊ยมยั่วไหล",
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
    description: "เฉาอ้วน เจ้าของโรงเตี๊ยมเกาเซิ่ง ต้องการปลาไหลสด 3 ตัวทำเมนูให้ลูกค้าสำคัญ แต่ตลาดหาไม่ได้",
    briefSummary: "หาปลาไหล 3 ตัวให้เฉาอ้วน",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "fish_eels",
        description: "หาปลาไหล 3 ตัว",
        autoAdvance: { t: "hasItem", itemId: "fish_eel", count: 3 },
      },
      {
        id: "deliver_eels",
        description: "นำปลาไหลไปให้เฉาอ้วนที่โรงเตี๊ยมเกาเซิ่ง",
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
    description: "โรงเตี๊ยมมีหว่างแย่งลูกค้าของเฉาอ้วนไปมาก เขาอยากรู้ว่าคู่แข่งมีเมนูเด็ดอะไร ไปลองดูแล้วกลับมาเล่า",
    briefSummary: "ไปโรงเตี๊ยมมีหว่าง แล้วกลับมาเล่าให้เฉาอ้วนฟัง",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "scout_rival",
        description: "ไปลองอาหารที่โรงเตี๊ยมมีหว่าง",
        objective: {
          spots: [
            { locationId: "inn_youjian", label: "สั่งอาหารชิมและแอบดูครัว", sceneId: "qs_qv_inn_rival_inn_report" },
          ],
        },
      },
      {
        id: "report_back",
        description: "กลับไปเล่าให้เฉาอ้วนที่โรงเตี๊ยมเกาเซิ่งฟัง",
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
    description: "นักรบที่สำนักล่มสลายนั่งดื่มเหล้าอยู่ในโรงเตี๊ยมเกาเซิ่งมาหลายชั่วยาม เฉาอ้วนเป็นห่วงและขอให้ไปคุยกับเขา",
    briefSummary: "คุยกับนักรบที่กำลังเศร้าโศกและช่วยเขาหาความหมาย",
    type: "side",
    giverNpcId: "inn_gaosheng_keeper_fat",
    stages: [
      {
        id: "talk_warrior",
        description: "ไปนั่งคุยกับนักรบผู้เศร้าโศกในโรงเตี๊ยมเกาเซิ่ง",
        objective: {
          spots: [
            { locationId: "inn_gaosheng", label: "คุยกับนักรบผู้เศร้าโศก", sceneId: "qs_qv_inn_drunk_warrior_talk" },
          ],
        },
      },
      {
        id: "report_back",
        description: "กลับไปบอกเฉาอ้วนว่านักรบเป็นอย่างไรบ้าง",
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
    description: "โปผู้เล่าเรื่องได้ยินว่าถ้ำบทกวีถังมีภาพสลักเรื่องยุทธภพสมัยก่อน เขาอยากรู้ว่าจริงไหม ไปดูแล้วกลับมาเล่าให้ฟัง",
    briefSummary: "ไปถ้ำบทกวีถัง แล้วกลับมาเล่าให้โปฟัง",
    type: "side",
    giverNpcId: "inn_heluo_storyteller_po",
    stages: [
      {
        id: "find_cave",
        description: "เดินทางไปถ้ำบทกวีถัง แล้วดูภาพสลักบนผนังถ้ำ",
        objective: {
          spots: [
            { locationId: "cave_tangshi", label: "ส่องดูภาพสลักบนผนังถ้ำ", sceneId: "qs_qv_inn_legend_verify_report" },
          ],
        },
      },
      {
        id: "report_findings",
        description: "กลับไปเล่าให้โปผู้เล่าเรื่องที่โรงเตี๊ยมเฮ่อลั่วฟัง",
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
        description: "สืบร่องรอยของผู้หญิงที่หายไปจากโรงเตี๊ยมเฮ่อลั่ว",
        objective: {
          spots: [
            { locationId: "inn_heluo", label: "สืบร่องรอยหญิงที่หายไป", sceneId: "qs_qv_inn_missing_traveler_found" },
          ],
        },
      },
      {
        id: "resolve_situation",
        description: "กลับไปบอกโปผู้เล่าเรื่อง",
      },
    ],
    rewards: [
      { t: "item", itemId: "jade", count: 1 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "inn_heluo_storyteller_po", amount: 20 },
    ],
  },
];
