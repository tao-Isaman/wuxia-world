import type { QuestDef } from "../../types";

// Side quests owned by content agent D — anchored to NPCs in the
// wilderness (islands, mountains, caves, homes, misc). Pairs with
// lib/world/data/npcs/wilderness.ts and
// lib/world/data/scenes-content/wilderness.ts.
export const QUESTS_WILDERNESS: readonly QuestDef[] = [
  // ─── หวงชิงเฉวียน (isle_taohua) ─────────────────────────────────────

  // 1. Fetch — 3 codex fragments scattered on the island
  {
    id: "qw_taohua_codex_fragments",
    name: "แผ่นตำราหายของปรมาจารย์",
    description: "ปรมาจารย์หวงชิงเฉวียนแห่งเกาะดอกท้อทำตำรากระบี่ปลิวหายไปกับพายุ ค้นหาแผ่นตำรา 3 แผ่นที่ตกอยู่ทั่วเกาะ แล้วนำกลับไปคืนเขา",
    briefSummary: "หาแผ่นตำราที่กระจัดกระจายบนเกาะดอกท้อ",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    prereqs: { t: "visitedLocation", locationId: "isle_taohua" },
    stages: [
      {
        id: "collect",
        description: "หาแผ่นตำรา 3 ชิ้นบนเกาะดอกท้อ (พบได้ตามต้นท้อและชายหาด)",
        // Three 🔍 spots on the island; the pages are found, not bought.
        objective: {
          spots: [
            { locationId: "isle_taohua", label: "ค้นใต้ดงต้นท้อ", text: "ใต้กองกลีบท้อที่ร่วงหลังพายุ มีแผ่นตำรากระบี่แผ่นแรกติดอยู่กับรากไม้" },
            { locationId: "isle_taohua", label: "ค้นตามชายหาด", text: "คลื่นซัดแผ่นตำราแผ่นที่สองมาติดโขดหินริมหาด หมึกยังพออ่านออก" },
            { locationId: "isle_taohua", label: "ค้นโขดหินริมทะเล", text: "แผ่นสุดท้ายถูกลมพัดไปติดซอกหิน — ครบสามแผ่นแล้ว นำกลับไปคืนปรมาจารย์" },
          ],
        },
      },
      { id: "return", description: "นำแผ่นตำราทั้งสามกลับไปคืนหวงชิงเฉวียนบนเกาะดอกท้อ" },
    ],
    rewards: [
      { t: "wExp", amount: 60 },
      { t: "gold", amount: 150 },
      { t: "learnSkill", skillId: "nc9" },
      { t: "npcRelationship", npcId: "wld_taohua_hermit_huang", amount: 15 },
    ],
  },

  // 2. Deliver — bring moon-cakes from market_miao for the hermit's
  // mid-autumn offering (rebalanced from "peach wine" to match the
  // existing world-item economy).
  {
    id: "qw_taohua_peach_wine",
    name: "ขนมไหว้พระจันทร์สำหรับฤๅษี",
    description: "ปรมาจารย์หวงชิงเฉวียนอยากได้ขนมไหว้พระจันทร์จากตลาดชาวเมี่ยวไว้ไหว้จันทร์กลางฤดูใบไม้ร่วง ไปซื้อที่ตลาดนั้นแล้วนำมาให้เขา",
    briefSummary: "นำขนมไหว้พระจันทร์จากตลาดเมี่ยวมาให้หวงชิงเฉวียน",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    stages: [
      {
        id: "buy",
        description: "ไปตลาดชาวเมี่ยว แล้วซื้อขนมไหว้พระจันทร์ 1 ชิ้น",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "market_miao" },
            { t: "hasItem", itemId: "moon_cake", count: 1 },
          ],
        },
      },
      { id: "deliver", description: "นำขนมไหว้พระจันทร์กลับไปให้หวงชิงเฉวียนที่เกาะดอกท้อ" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "wld_taohua_hermit_huang", amount: 10 },
    ],
  },

  // 3. Defeat — beat the fake disciple
  {
    id: "qw_taohua_duel_proof",
    name: "พิสูจน์ฝีมือต่อหน้าผู้แอบอ้าง",
    description: "มีกระบี่พเนจรคนหนึ่งเที่ยวอ้างตัวว่าเป็นศิษย์ของหวงชิงเฉวียน แล้วก่อเรื่องไปทั่ว ปราบเขาให้ได้ แล้วบอกให้เลิกอ้างชื่อปรมาจารย์",
    briefSummary: "ปราบกระบี่พเนจรที่แอบอ้างชื่อปรมาจารย์",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    prereqs: { t: "npcRelationship", npcId: "wld_taohua_hermit_huang", min: 10 },
    stages: [
      {
        id: "find_and_beat",
        description: "ปราบกระบี่พเนจรที่แอบอ้างชื่อปรมาจารย์ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wandering_swordsman", count: 1 },
      },
      { id: "report", description: "กลับไปรายงานหวงชิงเฉวียนที่เกาะดอกท้อ" },
    ],
    rewards: [
      { t: "wExp", amount: 80 },
      { t: "gold", amount: 300 },
      { t: "learnArt", artId: "t0_sevenstar", level: 1 },
      { t: "npcRelationship", npcId: "wld_taohua_hermit_huang", amount: 20 },
    ],
  },

  // ─── ชิวเฉียน (mt_kunlun) ────────────────────────────────────────────

  // 4. Investigation — find hidden evidence clearing the exile
  {
    id: "qw_kunlun_exile_truth",
    name: "ความจริงของฤๅษีเนรเทศ",
    description: "ชิวเฉียน ฤๅษีที่ถูกเนรเทศมาอยู่บนเขาคุนหลุน ถูกใส่ความว่าขโมยคัมภีร์ของสำนัก หลักฐานที่ล้างมลทินได้อยู่กับบัณฑิตเว่ยชิงเหวินในถ้ำน้ำแข็งไหม",
    briefSummary: "หาหลักฐานพิสูจน์ความบริสุทธิ์ของฤๅษีเนรเทศ",
    type: "side",
    giverNpcId: "wld_kunlun_exile_qiu",
    stages: [
      {
        id: "travel_cave",
        description: "เดินทางไปถ้ำน้ำแข็งไหมเพื่อหาหลักฐาน",
        autoAdvance: { t: "visitedLocation", locationId: "cave_bingcan" },
      },
      {
        id: "find_evidence",
        description: "คุยกับบัณฑิตเว่ยชิงเหวินในถ้ำน้ำแข็งไหม ขอม้วนหนังสือที่พิสูจน์ความบริสุทธิ์ของชิวเฉียน",
        // Quest-specific scroll only obtainable from เว่ยชิงเหวิน at
        // cave_bingcan via the dialog branch that gates on this quest's
        // active status. Was previously `book_inter` (generic ตำราขั้นกลาง)
        // — that let the player buy a 300🟡 city book and skip the cave
        // entirely, which broke the narrative.
        autoAdvance: { t: "hasItem", itemId: "qst_kunlun_evidence", count: 1 },
      },
      { id: "return", description: "นำม้วนหนังสือหลักฐานกลับไปให้ชิวเฉียนที่เขาคุนหลุน" },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 800 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "wld_kunlun_exile_qiu", amount: 25 },
    ],
  },

  // 5. Defeat — fight snow_demon on immortal peak to get snow lotus
  {
    id: "qw_kunlun_snow_lotus",
    name: "บัวหิมะยอดนิรันดร์",
    description: "ชิวเฉียนป่วยมานานและต้องการบัวหิมะจากยอดนิรันดร์คุนหลุน แต่มีปีศาจหิมะเฝ้าอยู่ ขึ้นไปปราบมัน เก็บบัวหิมะ แล้วนำกลับมา",
    briefSummary: "ปราบปีศาจหิมะและเก็บบัวหิมะจากยอดนิรันดร์คุนหลุน",
    type: "side",
    giverNpcId: "wld_kunlun_exile_qiu",
    prereqs: { t: "visitedLocation", locationId: "mt_kunlun" },
    stages: [
      {
        id: "climb",
        description: "ปีนขึ้นไปยอดนิรันดร์คุนหลุน (ทางขึ้นอยู่บนเขาคุนหลุน)",
        autoAdvance: { t: "visitedLocation", locationId: "mt_kunlun_immortal" },
      },
      {
        id: "defeat_demon",
        description: "ปราบปีศาจหิมะ 1 ตัว ผู้เฝ้าบัวหิมะ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "snow_demon", count: 1 },
      },
      {
        id: "collect_lotus",
        description: "เก็บบัวหิมะ 1 ดอก (ต้องมีทักษะเก็บสมุนไพรระดับ 5)",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      { id: "deliver", description: "นำบัวหิมะกลับไปให้ชิวเฉียนที่เขาคุนหลุน" },
    ],
    rewards: [
      { t: "wExp", amount: 120 },
      { t: "gold", amount: 500 },
      { t: "item", itemId: "potion_big", count: 2 },
    ],
  },

  // ─── หลินชัวซัน (valley_jueqing) ────────────────────────────────────

  // 6. Fetch — gather bitter lotus seeds from valley bottom (used as
  // a poison antidote ingredient — the lotus pods at the valley
  // bottom carry an unusual bitterness, distinct from regular lotus).
  {
    id: "qw_jueqing_bitter_flower",
    name: "เม็ดบัวขมก้นหุบเขาตัดใจ",
    description: "หลินชัวซัน ผู้เฒ่าแห่งหุบเขาตัดใจ ต้องการเม็ดบัวรสขมจากก้นหุบเขา 3 เม็ด ไปปรุงยาแก้พิษ ลงไปเก็บแล้วนำกลับมาให้เขา",
    briefSummary: "เก็บเม็ดบัว 3 เม็ดจากก้นหุบเขาตัดใจ",
    type: "side",
    giverNpcId: "wld_jueqing_elder_lin",
    stages: [
      {
        id: "descend",
        description: "ลงไปยังก้นหุบเขาตัดใจ",
        autoAdvance: { t: "visitedLocation", locationId: "valley_jueqing_bottom" },
      },
      {
        id: "gather",
        description: "เก็บเม็ดบัว 3 เม็ดที่ก้นหุบเขาตัดใจ",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 3 },
      },
      { id: "return", description: "นำเม็ดบัวขึ้นไปให้หลินชัวซันที่หุบเขาตัดใจ" },
    ],
    rewards: [
      { t: "gold", amount: 180 },
      { t: "wExp", amount: 50 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "npcRelationship", npcId: "wld_jueqing_elder_lin", amount: 15 },
    ],
  },

  // 7. Investigation / Moral — investigate ghost sounds in the valley
  {
    id: "qw_jueqing_ghost_hunt",
    name: "เสียงลึกลับในหุบเขา",
    description: "ทุกคืนมีเสียงร้องโหยหวนดังขึ้นจากก้นหุบเขาตัดใจ จนชาวบ้านไม่กล้าลงไปเก็บสมุนไพร หลินชัวซันขอให้ลงไปสืบว่าเป็นเสียงอะไร",
    briefSummary: "สืบสวนเสียงลึกลับในหุบเขาตัดใจ",
    type: "side",
    giverNpcId: "wld_jueqing_elder_lin",
    prereqs: { t: "npcRelationship", npcId: "wld_jueqing_elder_lin", min: 10 },
    stages: [
      {
        id: "investigate",
        description: "ลงไปสืบสวนในก้นหุบเขายามค่ำ",
        objective: {
          spots: [
            { locationId: "valley_jueqing", label: "ลงสืบก้นหุบเขายามค่ำ", sceneId: "qs_qw_jueqing_ghost_hunt_investigate" },
          ],
        },
      },
      { id: "report", description: "กลับไปเล่าสิ่งที่พบให้หลินชัวซันที่หุบเขาตัดใจฟัง" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 60 },
      { t: "item", itemId: "potion_mid", count: 3 },
    ],
  },

  // ─── ซวีเหลิงชิง (cave_jinshe) ──────────────────────────────────────

  // 8. Defeat — kill giant centipede for rare venom (only available
  // in the deep cave network at cave_treasure, where the level-5
  // venom_centipede node sits per RARE_SPOTS in world-map.ts).
  {
    id: "qw_jinshe_venom_rare",
    name: "พิษตะขาบยักษ์แห่งคลังสมบัติลับ",
    description: "ซวีเหลิงชิง ผู้ฝึกงูแห่งถ้ำงูทอง ต้องการพิษตะขาบจากคลังสมบัติลับ ส่วนที่ลึกที่สุดของเขาวงกตถ้ำ — มีแต่ตะขาบที่นั่นที่พิษเข้มข้นพอ",
    briefSummary: "เก็บพิษตะขาบยักษ์จากคลังสมบัติลับมาให้ซวีเหลิงชิง",
    type: "side",
    giverNpcId: "wld_jinshe_beasttamer_xu",
    stages: [
      {
        id: "hunt",
        description: "ลงไปในคลังสมบัติลับ แล้วเก็บพิษตะขาบ 1 ขวด",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 1 },
      },
      { id: "deliver", description: "นำพิษตะขาบกลับไปให้ซวีเหลิงชิงที่ถ้ำงูทอง" },
    ],
    rewards: [
      { t: "gold", amount: 350 },
      { t: "wExp", amount: 80 },
      { t: "item", itemId: "potion_big", count: 1 },
      { t: "npcRelationship", npcId: "wld_jinshe_beasttamer_xu", amount: 20 },
    ],
  },

  // 9. Fetch / Visit — find the lost golden snake deep in the cave
  // network. Stage 2 keys off the unique qst_jinshe_golden_snake item
  // — the snake is handed back to the player by ซวีเหลิงชิง himself
  // through a quest-gated dialog branch the next time the player
  // talks with him at cave_jinshe AFTER visiting the deeper cave_bingcan.
  // Was previously `snake_skin` (generic drop from beast hunting),
  // which let the player satisfy "found the pet" with a random hide.
  {
    id: "qw_jinshe_lost_serpent",
    name: "งูทองหาย",
    description: "งูทองสัตว์เลี้ยงของซวีเหลิงชิงเลื้อยหายเข้าไปในเขาวงกตถ้ำ ตามรอยมันไปถึงถ้ำน้ำแข็งไหม บัณฑิตเว่ยชิงเหวินที่อยู่ในถ้ำนั้นอาจเห็นมัน",
    briefSummary: "ตามหางูทองให้ถึงถ้ำน้ำแข็งไหม แล้วนำกลับซวีเหลิงชิง",
    type: "side",
    giverNpcId: "wld_jinshe_beasttamer_xu",
    stages: [
      {
        id: "search",
        description: "ตามรอยงูทองให้ลึกถึงถ้ำน้ำแข็งไหม",
        autoAdvance: { t: "visitedLocation", locationId: "cave_bingcan" },
      },
      {
        id: "found",
        description: "ถามบัณฑิตเว่ยชิงเหวินในถ้ำน้ำแข็งไหมเรื่องงูทอง แล้วรับมันกลับมา",
        autoAdvance: { t: "hasItem", itemId: "qst_jinshe_golden_snake", count: 1 },
      },
      { id: "return", description: "นำงูทองกลับไปคืนซวีเหลิงชิงที่ถ้ำงูทอง" },
    ],
    rewards: [
      { t: "gold", amount: 180 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "wld_jinshe_beasttamer_xu", amount: 15 },
    ],
  },

  // ─── โม่ฉิงเทียน (desert_ruins) ─────────────────────────────────────

  // 10. Investigation — decode inscription at miao market
  {
    id: "qw_desert_ancient_map",
    name: "แผ่นจารึกโบราณทะเลทราย",
    description: "โม่ฉิงเทียน นักสะสมของโบราณในทะเลทรายร้าง พบแผ่นจารึกภาษาเผ่าโบราณที่อ่านไม่ออก นำไปให้อาเป้า หัวหน้าเผ่าที่ตลาดชาวเมี่ยว ช่วยแปล",
    briefSummary: "นำจารึกไปแปลที่ตลาดเมี่ยว",
    type: "side",
    giverNpcId: "wld_desert_collector_mo",
    stages: [
      {
        id: "go_miao",
        description: "ไปตลาดชาวเมี่ยว ให้อาเป้าหัวหน้าเผ่าแปลจารึก",
        objective: {
          spots: [
            { locationId: "market_miao", label: "ให้หัวหน้าเผ่าอาเป้าแปลจารึก", npcId: "wld_miao_tribaleldr_abao", sceneId: "qs_qw_desert_ancient_map_decoded" },
          ],
        },
      },
      { id: "report", description: "นำคำแปลกลับไปบอกโม่ฉิงเทียนที่ทะเลทรายร้าง" },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "wld_desert_collector_mo", amount: 15 },
    ],
  },

  // 11. Deliver — return ancient coin to rightful family in yangzhou
  {
    id: "qw_desert_relic_return",
    name: "คืนของโบราณให้เจ้าของ",
    description: "โม่ฉิงเทียนพบเหรียญโบราณของตระกูลจ้าว เชื้อพระวงศ์ราชวงศ์ซ่งเก่าแห่งหยางโจว เขาฝากเจ้านำไปคืน — ไปหยางโจว แล้วมอบเหรียญแก่ผู้เฝ้าศาลบรรพชนของตระกูลนั้น",
    briefSummary: "นำเหรียญโบราณไปคืนศาลบรรพชนตระกูลจ้าวที่หยางโจว",
    type: "side",
    giverNpcId: "wld_desert_collector_mo",
    prereqs: { t: "visitedLocation", locationId: "desert_ruins" },
    stages: [
      {
        id: "travel",
        description: "ไปหยางโจว แล้วมอบเหรียญโบราณแก่ผู้เฝ้าศาลบรรพชนตระกูลจ้าวริมคลอง",
        objective: {
          spots: [
            { locationId: "city_yangzhou", label: "มอบเหรียญที่ศาลบรรพชนตระกูลจ้าว", sceneId: "qs_qw_desert_relic_return_shrine" },
          ],
        },
      },
      { id: "confirm", description: "กลับไปบอกโม่ฉิงเทียนที่ทะเลทรายร้างว่าเหรียญถึงหยางโจวแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "trait", trait: "humility", amount: 3 },
    ],
  },

  // 12. Defeat / Exploration — test the guardian in ruins
  {
    id: "qw_desert_guardian_test",
    name: "ทดสอบผู้พิทักษ์สมบัติ",
    description: "โม่ฉิงเทียนอยากรู้ว่าผู้พิทักษ์สมบัติในซากเมืองกลางทะเลทรายร้างยังเฝ้าอยู่หรือไม่ เข้าไปดู สู้กับผู้พิทักษ์ แล้วกลับมาเล่าให้เขาฟัง",
    briefSummary: "เข้าไปทดสอบผู้พิทักษ์ในซากเมืองกลางทะเลทราย",
    type: "side",
    giverNpcId: "wld_desert_collector_mo",
    prereqs: {
      t: "and",
      all: [
        { t: "npcRelationship", npcId: "wld_desert_collector_mo", min: 10 },
        { t: "visitedLocation", locationId: "desert_ruins" },
      ],
    },
    stages: [
      {
        id: "enter_ruins",
        description: "เข้าไปในซากเมืองที่ทะเลทรายร้าง ตามหาผู้พิทักษ์สมบัติ",
        objective: {
          spots: [
            { locationId: "desert_ruins", label: "เข้าไปในซากปรักหักพัง", sceneId: "qs_qw_desert_guardian_test_battle" },
          ],
        },
      },
      {
        id: "defeat",
        description: "ปราบนักรบทะเลทรายผู้พิทักษ์สมบัติ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "desert_marauder", count: 1 },
      },
      { id: "report", description: "กลับไปเล่าผลให้โม่ฉิงเทียนฟัง" },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 90 },
      { t: "item", itemId: "jade", count: 1 },
    ],
  },

  // ─── อาเป้า (market_miao) ────────────────────────────────────────────

  // 13. Fetch — gather rare herbs from cave_bingcan
  {
    id: "qw_miao_tribal_remedy",
    name: "ยารักษาของเผ่าเมี่ยว",
    description: "คนในเผ่าเมี่ยวล้มป่วยด้วยโรคที่ยาของเผ่ารักษาไม่หาย อาเป้าหัวหน้าเผ่าต้องการสมุนไพรหายาก 3 กำ และขอให้เจ้าไปถึงถ้ำน้ำแข็งไหม ที่สมุนไพรเย็นพอจะใช้ได้",
    briefSummary: "ไปถ้ำน้ำแข็งไหม หาสมุนไพรหายาก 3 กำให้อาเป้า",
    type: "side",
    giverNpcId: "wld_miao_tribaleldr_abao",
    stages: [
      {
        id: "gather_cave",
        description: "ไปให้ถึงถ้ำน้ำแข็งไหม และมีสมุนไพรหายาก 3 กำติดตัว",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "cave_bingcan" },
            { t: "hasItem", itemId: "herb", count: 3 },
          ],
        },
      },
      { id: "deliver", description: "นำสมุนไพรกลับไปให้อาเป้าที่ตลาดชาวเมี่ยว" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "good", amount: 8 },
      { t: "npcRelationship", npcId: "wld_miao_tribaleldr_abao", amount: 20 },
    ],
  },

  // 14. Defeat / Moral — find and free the spirit beast
  {
    id: "qw_miao_spirit_beast",
    name: "สัตว์ศักดิ์สิทธิ์ของเผ่า",
    description: "สัตว์ศักดิ์สิทธิ์ของเผ่าเมี่ยวหายไปจากป่า อาเป้าเชื่อว่ามันถูกพรานดักจับ ค้นป่าหลังตลาดชาวเมี่ยว แล้วปล่อยมันกลับสู่ป่า",
    briefSummary: "ตามหาและปล่อยสัตว์ศักดิ์สิทธิ์",
    type: "side",
    giverNpcId: "wld_miao_tribaleldr_abao",
    prereqs: { t: "npcRelationship", npcId: "wld_miao_tribaleldr_abao", min: 15 },
    stages: [
      {
        id: "search",
        description: "ค้นป่าหลังตลาดชาวเมี่ยว หากรงที่พรานขังสัตว์ศักดิ์สิทธิ์ไว้ แล้วปล่อยมันกลับสู่ป่า",
        objective: {
          spots: [
            { locationId: "market_miao", label: "ค้นป่าหลังตลาดเมี่ยว", sceneId: "qs_qw_miao_spirit_beast_found" },
          ],
        },
      },
      { id: "report", description: "กลับไปบอกอาเป้าว่าสัตว์ศักดิ์สิทธิ์เป็นอิสระแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 100 },
      { t: "learnSkill", skillId: "pn" },
      { t: "npcRelationship", npcId: "wld_miao_tribaleldr_abao", amount: 25 },
    ],
  },

  // 15. Visit / Defeat — deliver tribe's ritual offering to cave_tangshi
  {
    id: "qw_miao_offering_cave",
    name: "ของถวายในถ้ำบทกวี",
    description: "อาเป้าฝากของถวายประจำปีของเผ่าเมี่ยวให้นำไปวางบนแท่นหินในถ้ำบทกวีถัง เพราะเด็กในเผ่าไม่กล้าเข้าไป",
    briefSummary: "นำของถวายไปวางที่ถ้ำบทกวีถัง",
    type: "side",
    giverNpcId: "wld_miao_tribaleldr_abao",
    stages: [
      {
        id: "travel",
        description: "เดินทางไปถ้ำบทกวีถัง",
        autoAdvance: { t: "visitedLocation", locationId: "cave_tangshi" },
      },
      {
        id: "place_offering",
        description: "วางเม็ดบัวถวายบนแท่นหินในถ้ำบทกวีถัง (ระวังตะขาบยักษ์)",
        objective: {
          spots: [
            { locationId: "cave_tangshi", label: "วางของถวายบนแท่นหิน", sceneId: "qs_qw_miao_offering_cave_arrived" },
          ],
        },
      },
      { id: "return", description: "กลับไปบอกอาเป้าที่ตลาดชาวเมี่ยวว่าวางของถวายแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 5 },
    ],
  },

  // ─── เหลียงเก๋อ (cliff_motian) ───────────────────────────────────────

  // 16. Moral — retrieve ghost's sword from cave_treasure, choose fate
  {
    id: "qw_motian_restless_soul",
    name: "วิญญาณไม่สงบยอดเขามรณะ",
    description: "เหลียงเก๋อ วิญญาณนักรบที่ตายบนยอดเขามรณะ ฝากด้ามดาบขึ้นสนิมไว้กับเจ้า นำมันเข้าไปในคลังสมบัติลับ ที่ใบดาบของเขาซ่อนอยู่ แล้วนำดาบที่สมบูรณ์กลับมา — จะคืนให้เขาตามสัญญาเพื่อให้ไปสู่สุคติ หรือเก็บดาบทรงพลังนั้นไว้เอง ก็สุดแต่ใจเจ้า",
    briefSummary: "นำด้ามดาบไปที่คลังสมบัติลับ แล้วเลือกว่าจะคืนดาบให้เหลียงเก๋อหรือเก็บไว้",
    type: "side",
    giverNpcId: "wld_motian_ghost_liang",
    prereqs: { t: "flag", flag: "motian_ghost_revealed" },
    stages: [
      {
        id: "find_sword",
        description: "ถือด้ามดาบเข้าไปในคลังสมบัติลับ — ใบดาบกับด้ามจะกลับมาเป็นหนึ่งเดียว",
        // Was previously `hasItem jade × 1` — generic valuable that
        // dropped from various sources, letting the player skip the
        // cave entirely. Now keys off the unique sword item, which
        // only spawns into the bag via the cave_treasure onEnter
        // effect (see scenes-content/wilderness.ts).
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "cave_treasure" },
            { t: "hasItem", itemId: "qst_motian_ancient_sword", count: 1 },
          ],
        },
      },
      { id: "decide", description: "นำดาบโบราณกลับไปหาเหลียงเก๋อที่ยอดเขามรณะ แล้วตัดสินใจ: คืนดาบตามสัญญา หรือเก็บไว้เอง" },
    ],
    rewards: [
      { t: "wExp", amount: 120 },
      { t: "gold", amount: 350 },
    ],
  },

  // 17. Fetch — gather bitter flowers from jueqing as ritual alternative
  {
    id: "qw_motian_sword_return",
    name: "ดอกขมพิธีกรรม",
    description: "ถ้าไม่อยากเข้าคลังสมบัติลับ วิญญาณเหลียงเก๋อมีอีกทาง — เม็ดบัวขมจากก้นหุบเขาตัดใจ 3 เม็ด ใช้ทำพิธีปลดปล่อยเขาได้เช่นกัน",
    briefSummary: "นำเม็ดบัวจากก้นหุบเขาตัดใจมาให้วิญญาณเหลียงเก๋อ",
    type: "side",
    giverNpcId: "wld_motian_ghost_liang",
    prereqs: {
      t: "and",
      all: [
        { t: "flag", flag: "motian_ghost_revealed" },
        { t: "not", of: { t: "questStatus", questId: "qw_motian_restless_soul", status: "active" } },
      ],
    },
    stages: [
      {
        id: "gather",
        description: "ลงไปก้นหุบเขาตัดใจ แล้วเก็บเม็ดบัว 3 เม็ด",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "valley_jueqing_bottom" },
            { t: "hasItem", itemId: "lotus_seed", count: 3 },
          ],
        },
      },
      { id: "return", description: "นำเม็ดบัวไปให้วิญญาณเหลียงเก๋อที่ยอดเขามรณะ" },
    ],
    rewards: [
      { t: "wExp", amount: 90 },
      { t: "gold", amount: 200 },
      { t: "trait", trait: "good", amount: 8 },
    ],
  },

  // ─── เว่ยชิงเหวิน (cave_bingcan) ─────────────────────────────────────

  // 18. Defeat — battle centipede to get ice silk deep in the cave
  {
    id: "qw_bingcan_silk_scroll",
    name: "ไหมน้ำแข็งลึกถ้ำ",
    description: "บัณฑิตเว่ยชิงเหวินต้องการไหมน้ำแข็งจากส่วนลึกของถ้ำน้ำแข็งไหมมาเย็บปกตำรา แต่มีตะขาบยักษ์เฝ้าอยู่ ปราบมันแล้วไหมจะเป็นของเจ้า",
    briefSummary: "เก็บไหมน้ำแข็งจากลึกในถ้ำน้ำแข็งไหม",
    type: "side",
    giverNpcId: "wld_bingcan_scholar_wei",
    stages: [
      {
        id: "enter_deep",
        description: "ไปถ้ำน้ำแข็งไหม",
        autoAdvance: { t: "visitedLocation", locationId: "cave_bingcan" },
      },
      {
        id: "collect_silk",
        description: "ปราบตะขาบยักษ์ที่เฝ้าไหมน้ำแข็ง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "giant_centipede", count: 1 },
      },
      { id: "deliver", description: "นำไหมน้ำแข็งไปให้บัณฑิตเว่ยชิงเหวินในถ้ำน้ำแข็งไหม" },
    ],
    rewards: [
      { t: "gold", amount: 280 },
      { t: "wExp", amount: 80 },
      { t: "item", itemId: "book_advanced", count: 1 },
      { t: "npcRelationship", npcId: "wld_bingcan_scholar_wei", amount: 20 },
    ],
  },

  // 19. Fetch — get the rare snow-ginseng from kunlun immortal peak.
  // Stage now keys off the unique `qst_kunlun_snow_ginseng` item which
  // only drops from the herb_kunlun_ginseng node attached to
  // mt_kunlun_immortal — so common ginseng bought in town no longer
  // satisfies the quest. The cave trip is mechanically required, not
  // just a flavor instruction.
  {
    id: "qw_bingcan_ice_fever",
    name: "โสมรักษาไข้น้ำแข็ง",
    description: "บัณฑิตเว่ยชิงเหวินเห็นว่าเจ้าเป็นไข้น้ำแข็งโดยไม่รู้ตัว ยาแก้ต้องใช้โสมหิมะที่งอกบนยอดนิรันดร์คุนหลุนเท่านั้น",
    briefSummary: "เก็บโสมหิมะจากยอดนิรันดร์คุนหลุนแล้วนำกลับให้บัณฑิตเว่ย",
    type: "side",
    giverNpcId: "wld_bingcan_scholar_wei",
    stages: [
      {
        id: "gather",
        description: "ขึ้นไปยอดนิรันดร์คุนหลุน แล้วเก็บโสมหิมะคุนหลุน 1 ราก (ต้องมีทักษะเก็บสมุนไพรระดับ 5)",
        autoAdvance: { t: "hasItem", itemId: "qst_kunlun_snow_ginseng", count: 1 },
      },
      { id: "deliver", description: "ส่งโสมหิมะให้เว่ยชิงเหวินที่ถ้ำน้ำแข็งไหม" },
    ],
    rewards: [
      { t: "gold", amount: 220 },
      { t: "wExp", amount: 60 },
      { t: "item", itemId: "potion_mid", count: 3 },
    ],
  },

  // ─── ต่านเหลาตู (pool_heilong) ───────────────────────────────────────

  // 20. Moral / Exploration — dive to pool bottom, find secret
  {
    id: "qw_heilong_dragon_pearl",
    name: "ความลับก้นสระมังกรดำ",
    description: "ต่านเหลาตู ชาวประมงแก่ที่มังกรดำสระน้ำ ได้ยินข่าวลือว่าก้นสระมีมังกรกับไข่มุกวิเศษ เขาขอให้เจ้าดำลงไปดูว่าข้างล่างมีอะไรจริง ๆ",
    briefSummary: "สำรวจก้นสระมังกรดำ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    stages: [
      {
        id: "dive",
        description: "ดำลงไปสำรวจก้นสระมังกรดำ",
        objective: {
          spots: [
            { locationId: "pool_heilong", label: "ดำลงสำรวจก้นสระ", sceneId: "qs_qw_heilong_dragon_pearl_deep" },
          ],
        },
      },
      { id: "decide", description: "ขึ้นจากสระ แล้วตัดสินใจว่าจะบอกต่านเหลาตูว่าเห็นอะไร" },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 300 },
    ],
  },

  // 21. Defeat — rescue kidnapped fisherman from river pirates
  {
    id: "qw_heilong_missing_fisher",
    name: "ชาวประมงที่หายตัวไป",
    description: "ชาวประมงคนหนึ่งหายไปเมื่อคืน ต่านเหลาตูสงสัยว่าถูกโจรสลัดน้ำที่ซ่อนตัวแถวสระลักพาตัวไป ช่วยค้นหาและพาเขากลับมา",
    briefSummary: "ช่วยเหลือชาวประมงที่ถูกโจรสลัดจับ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    stages: [
      {
        id: "search",
        description: "ค้นหาชาวประมงรอบมังกรดำสระน้ำ",
        objective: {
          spots: [
            { locationId: "pool_heilong", label: "ค้นหารอบสระมังกรดำ", sceneId: "qs_qw_heilong_missing_fisher_found" },
          ],
        },
      },
      {
        id: "rescue",
        description: "ปราบโจรสลัดน้ำที่จับตัวชาวประมงไว้",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
      { id: "return", description: "พาชาวประมงกลับไปหาต่านเหลาตู" },
    ],
    rewards: [
      { t: "gold", amount: 230 },
      { t: "wExp", amount: 70 },
      { t: "item", itemId: "fish_eel", count: 2 },
      { t: "npcRelationship", npcId: "wld_heilong_fisherman_tan", amount: 20 },
    ],
  },

  // 22. Visit / Exploration — investigate moonlit red glow from pool depths
  {
    id: "qw_heilong_depths_secret",
    name: "แสงแดงจากก้นสระ",
    description: "ชาวบ้านเห็นแสงสีแดงโผล่จากมังกรดำสระน้ำทุกคืนเพ็ญ ต่านเหลาตูขอให้ดำลงไปดูต้นตอ แล้วนำตัวอย่างกลับมาให้เขาดู",
    briefSummary: "สืบสวนแสงลึกลับจากก้นสระมังกรดำ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    prereqs: { t: "npcRelationship", npcId: "wld_heilong_fisherman_tan", min: 15 },
    stages: [
      {
        id: "wait_fullmoon",
        description: "รอคืนเพ็ญที่มังกรดำสระน้ำ แล้วดำลงไปตามแสง",
        objective: {
          spots: [
            { locationId: "pool_heilong", label: "ดำตามแสงสีแดงในคืนเพ็ญ", sceneId: "qs_qw_heilong_depths_secret_investigate" },
          ],
        },
      },
      {
        id: "collect_ore",
        description: "ถือแร่เทพที่เรืองแสงใต้สระไว้ 1 ก้อน (ถ้าทำหาย ขุดใหม่ได้จากสายแร่หายาก เช่นบนยอดนิรันดร์คุนหลุน)",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      { id: "report", description: "นำแร่เทพไปให้ต่านเหลาตูดู" },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 110 },
      { t: "item", itemId: "ginseng", count: 2 },
    ],
  },

  // ─── หลัวเฟย์หาว (home_hong) ─────────────────────────────────────────

  // 23. Defeat / Exploration — clear bears to reach the treasure cache
  {
    id: "qw_hong_treasure_map",
    name: "แผนที่สมบัติโฮ่งชีก๋ง",
    description: "หลัวเฟย์หาว นักผจญภัยหนุ่ม พบแผนที่สมบัติของโฮ่งชีก๋งในบ้านของท่าน แต่ทางไปถ้ำสมบัติมีหมีสีน้ำตาลขวางอยู่ ปราบหมี แล้วเข้าไปดูว่าสมบัติคืออะไร",
    briefSummary: "ปราบหมีสีน้ำตาล แล้วค้นถ้ำสมบัติของโฮ่งชีก๋ง",
    type: "side",
    giverNpcId: "wld_hong_adventurer_luo",
    stages: [
      {
        id: "clear_bears",
        description: "ปราบหมีสีน้ำตาลที่ขวางทางไปถ้ำสมบัติหลังบ้านโฮ่งชีก๋ง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "brown_bear", count: 1 },
        objective: {
          spots: [
            { locationId: "home_hong", label: "ตามแผนที่ไปทางเข้าถ้ำสมบัติ", sceneId: "qs_qw_hong_treasure_map_battle" },
          ],
        },
      },
      {
        id: "find_cache",
        description: "ค้นถ้ำสมบัติตามแผนที่ที่บ้านโฮ่งชีก๋ง",
        objective: {
          spots: [
            { locationId: "home_hong", label: "ค้นถ้ำสมบัติตามแผนที่", sceneId: "qs_qw_hong_treasure_map_clear" },
          ],
        },
      },
      { id: "report", description: "กลับไปเล่าให้หลัวเฟย์หาวฟังว่าสมบัติคืออะไร" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 80 },
      { t: "item", itemId: "ancient_coin", count: 2 },
    ],
  },

  // 24. Defeat — drive wolf pack away from hong's residence
  {
    id: "qw_hong_beast_swarm",
    name: "ฝูงหมาป่าบุกบ้านโฮ่งชีก๋ง",
    description: "ฝูงหมาป่าบุกเข้ามาใกล้บ้านโฮ่งชีก๋งจนคนเฝ้าบ้านหนีหมด หลัวเฟย์หาวขอให้ปราบสัก 2 ตัวเพื่อขู่ฝูงให้ถอยไป",
    briefSummary: "ปราบหมาป่า 2 ตัวรอบบ้านโฮ่งชีก๋ง",
    type: "side",
    giverNpcId: "wld_hong_adventurer_luo",
    stages: [
      {
        id: "hunt_wolves",
        description: "ปราบหมาป่า 2 ตัวรอบบ้านโฮ่งชีก๋ง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_wolf", count: 2 },
      },
      { id: "report", description: "กลับไปบอกหลัวเฟย์หาวว่าฝูงหมาป่าถอยไปแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 180 },
      { t: "wExp", amount: 55 },
      { t: "item", itemId: "fur_pelt", count: 2 },
      { t: "npcRelationship", npcId: "wld_hong_adventurer_luo", amount: 15 },
    ],
  },

  // 25. Investigation — talk to hong's ghost in cave (bonus quest requiring motian ghost flag)
  {
    id: "qw_hong_legend_verify",
    name: "ตำนานโฮ่งชีก๋ง",
    description: "หลัวเฟย์หาวได้ยินตำนานว่าโฮ่งชีก๋งทิ้งข้อความสำคัญไว้ก่อนตาย ไปถามวิญญาณเหลียงเก๋อที่ยอดเขามรณะว่าจริงหรือไม่",
    briefSummary: "ยืนยันตำนานโฮ่งชีก๋งกับวิญญาณเหลียงเก๋อ",
    type: "side",
    giverNpcId: "wld_hong_adventurer_luo",
    prereqs: {
      t: "and",
      all: [
        { t: "flag", flag: "motian_ghost_revealed" },
        { t: "npcRelationship", npcId: "wld_hong_adventurer_luo", min: 15 },
      ],
    },
    stages: [
      {
        id: "visit_motian",
        description: "ไปถามวิญญาณที่ยอดเขามรณะเรื่องตำนานโฮ่งชีก๋ง",
        autoAdvance: { t: "visitedLocation", locationId: "cliff_motian" },
      },
      { id: "report", description: "นำคำตอบของวิญญาณกลับไปบอกหลัวเฟย์หาวที่บ้านโฮ่งชีก๋ง" },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 90 },
      { t: "skillExp", skillId: "basic_punch", amount: 100 },
      { t: "npcRelationship", npcId: "wld_hong_adventurer_luo", amount: 20 },
    ],
  },
];
