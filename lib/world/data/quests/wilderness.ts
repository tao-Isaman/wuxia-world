import type { QuestDef } from "../../types";

// Side quests owned by content agent D — anchored to NPCs in the
// wilderness (islands, mountains, caves, homes, misc). Pairs with
// lib/world/data/npcs/wilderness.ts and
// lib/world/data/scenes-content/wilderness.ts.
export const QUESTS_WILDERNESS: readonly QuestDef[] = [
  // ─── ฮ่วงเอี้ยะซือ (isle_taohua) ─────────────────────────────────────

  // 1. Fetch — 3 codex fragments scattered on the island
  {
    id: "qw_taohua_codex_fragments",
    name: "แผ่นตำราหายของปรมาจารย์",
    description: "ปรมาจารย์ฮ่วงเอี้ยะซือต้องการชิ้นส่วนตำรากระบี่ 3 ชิ้นที่กระจัดกระจายหลังพายุ",
    briefSummary: "หาแผ่นตำราที่กระจัดกระจายบนเกาะดอกท้อ",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    prereqs: { t: "visitedLocation", locationId: "isle_taohua" },
    stages: [
      {
        id: "collect",
        description: "หาแผ่นตำรา 3 ชิ้นบนเกาะดอกท้อ (พบได้ตามต้นท้อและชายหาด)",
        autoAdvance: { t: "hasItem", itemId: "book_advanced", count: 1 },
      },
      { id: "return", description: "คืนตำราให้ฮ่วงเอี้ยะซือ" },
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
    description: "ปรมาจารย์ต้องการขนมไหว้พระจันทร์จากตลาดชาวเมี่ยวเพื่อพิธีไหว้กลางฤดูใบไม้ร่วง",
    briefSummary: "นำขนมไหว้พระจันทร์จากตลาดเมี่ยวมาให้ฮ่วงเอี้ยะซือ",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    stages: [
      {
        id: "buy",
        description: "ไปซื้อขนมไหว้พระจันทร์ที่ตลาดชาวเมี่ยว",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "market_miao" },
            { t: "hasItem", itemId: "moon_cake", count: 1 },
          ],
        },
      },
      { id: "deliver", description: "นำขนมไหว้พระจันทร์มาส่งให้ฮ่วงเอี้ยะซือ" },
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
    description: "นักรบปลอมอ้างตัวว่าเป็นศิษย์ฮ่วงเอี้ยะซือ ต้องปราบและบอกให้หยุดอ้างชื่อ",
    briefSummary: "ปราบนักรบที่แอบอ้างชื่อปรมาจารย์",
    type: "side",
    giverNpcId: "wld_taohua_hermit_huang",
    prereqs: { t: "npcRelationship", npcId: "wld_taohua_hermit_huang", min: 10 },
    stages: [
      {
        id: "find_and_beat",
        description: "ค้นหาและปราบนักรบที่แอบอ้างชื่อปรมาจารย์",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wandering_swordsman", count: 1 },
      },
      { id: "report", description: "กลับมารายงานผลให้ฮ่วงเอี้ยะซือ" },
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
    description: "ชิวเฉียนถูกกล่าวหาอย่างไม่เป็นธรรม ต้องหาหลักฐานที่ซ่อนในถ้ำน้ำแข็งไหม",
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
        description: "พบบัณฑิตเว่ยชิงเหวินในถ้ำ — ขอม้วนหนังสือพิสูจน์ความจริง",
        // Quest-specific scroll only obtainable from เว่ยชิงเหวิน at
        // cave_bingcan via the dialog branch that gates on this quest's
        // active status. Was previously `book_inter` (generic ตำราขั้นกลาง)
        // — that let the player buy a 300🟡 city book and skip the cave
        // entirely, which broke the narrative.
        autoAdvance: { t: "hasItem", itemId: "qst_kunlun_evidence", count: 1 },
      },
      { id: "return", description: "นำหลักฐานกลับให้ชิวเฉียน" },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 400 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "learnSkill", skillId: "cs" },
      { t: "npcRelationship", npcId: "wld_kunlun_exile_qiu", amount: 25 },
    ],
  },

  // 5. Defeat — fight snow_demon on immortal peak to get snow lotus
  {
    id: "qw_kunlun_snow_lotus",
    name: "บัวหิมะยอดนิรันดร์",
    description: "ชิวเฉียนต้องการบัวหิมะจากยอดคุนหลุนนิรันดร์ แต่ปีศาจหิมะพิทักษ์อยู่",
    briefSummary: "ปราบปีศาจหิมะและเก็บบัวหิมะจากยอดคุนหลุนนิรันดร์",
    type: "side",
    giverNpcId: "wld_kunlun_exile_qiu",
    prereqs: { t: "visitedLocation", locationId: "mt_kunlun" },
    stages: [
      {
        id: "climb",
        description: "ขึ้นสู่นิรันดร์คุนหลุน",
        autoAdvance: { t: "visitedLocation", locationId: "mt_kunlun_immortal" },
      },
      {
        id: "defeat_demon",
        description: "ปราบปีศาจหิมะที่พิทักษ์บัวหิมะ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "snow_demon", count: 1 },
      },
      {
        id: "collect_lotus",
        description: "เก็บบัวหิมะและนำกลับมา",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      { id: "deliver", description: "ส่งบัวหิมะให้ชิวเฉียน" },
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
    description: "หลินชัวซันต้องการเม็ดบัวรสขมจากก้นหุบเขาตัดใจสามหน่วยเพื่อทำยาแก้พิษ",
    briefSummary: "เก็บเม็ดบัวรสขมสามหน่วยจากก้นหุบเขาตัดใจ",
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
        description: "เก็บเม็ดบัวรสขมสามหน่วย",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 3 },
      },
      { id: "return", description: "นำเม็ดบัวกลับมาให้หลินชัวซัน" },
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
    description: "มีเสียงประหลาดในหุบเขาตัดใจทุกคืน สืบหาต้นตอและหาทางแก้ไข",
    briefSummary: "สืบสวนเสียงลึกลับในหุบเขาตัดใจ",
    type: "side",
    giverNpcId: "wld_jueqing_elder_lin",
    prereqs: { t: "npcRelationship", npcId: "wld_jueqing_elder_lin", min: 10 },
    stages: [
      {
        id: "investigate",
        description: "ลงไปสืบสวนในก้นหุบเขายามค่ำ",
        autoAdvance: { t: "flag", flag: "jueqing_ghost_clue" },
      },
      { id: "report", description: "นำข้อมูลกลับมารายงานหลินชัวซัน" },
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
    description: "ซวีเหลิงชิงต้องการพิษตะขาบยักษ์จากคลังสมบัติลับที่ลึกที่สุดในเขาวงกตถ้ำ — มีเพียงตะขาบพิทักษ์ที่นั่นเท่านั้นที่มีพิษเข้มข้นพอ",
    briefSummary: "เก็บพิษตะขาบยักษ์จากคลังสมบัติลับมาให้ซวีเหลิงชิง",
    type: "side",
    giverNpcId: "wld_jinshe_beasttamer_xu",
    stages: [
      {
        id: "hunt",
        description: "ลึกเข้าไปในคลังสมบัติลับและเก็บพิษตะขาบยักษ์",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 1 },
      },
      { id: "deliver", description: "ส่งพิษตะขาบให้ซวีเหลิงชิง" },
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
    description: "งูทองสัตว์เลี้ยงของซวีเหลิงชิงหายเข้าไปในเขาวงกตถ้ำ ช่วยตามหาให้ลึกถึงถ้ำน้ำแข็งไหม",
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
        description: "พบงูทองและรับกลับมาอย่างปลอดภัย",
        autoAdvance: { t: "hasItem", itemId: "qst_jinshe_golden_snake", count: 1 },
      },
      { id: "return", description: "คืนงูทองให้ซวีเหลิงชิง" },
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
    description: "โม่ฉิงเทียนพบแผ่นจารึกที่อ่านไม่ออก ต้องนำไปให้ชาวเมี่ยวช่วยแปล",
    briefSummary: "นำจารึกไปแปลที่ตลาดเมี่ยว",
    type: "side",
    giverNpcId: "wld_desert_collector_mo",
    stages: [
      {
        id: "go_miao",
        description: "นำจารึกไปให้หัวหน้าเผ่าเมี่ยวแปล",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "market_miao" },
            { t: "flag", flag: "desert_map_decoded" },
          ],
        },
      },
      { id: "report", description: "นำผลการแปลกลับมาให้โม่ฉิงเทียน" },
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
    description: "โม่ฉิงเทียนพบเหรียญโบราณของตระกูลราชสกุลในหยางโจว ต้องนำคืน",
    briefSummary: "คืนเหรียญโบราณให้ตระกูลเจ้าของ",
    type: "side",
    giverNpcId: "wld_desert_collector_mo",
    prereqs: { t: "visitedLocation", locationId: "desert_ruins" },
    stages: [
      {
        id: "travel",
        description: "นำเหรียญโบราณไปคืนที่หยางโจว",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "city_yangzhou" },
            { t: "not", of: { t: "hasItem", itemId: "ancient_coin", count: 1 } },
          ],
        },
      },
      { id: "confirm", description: "กลับมายืนยันกับโม่ฉิงเทียน" },
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
    description: "โม่ฉิงเทียนต้องการรู้ว่าผู้พิทักษ์สมบัติในซากปรักหักพังยังแข็งแกร่งแค่ไหน",
    briefSummary: "เข้าไปทดสอบผู้พิทักษ์ในซากปรักหักพัง",
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
        description: "เข้าไปในซากปรักหักพังและพบผู้พิทักษ์",
        autoAdvance: { t: "flag", flag: "desert_guardian_found" },
      },
      {
        id: "defeat",
        description: "สู้กับผู้พิทักษ์",
        autoAdvance: { t: "defeatedOpponent", opponentId: "desert_marauder", count: 1 },
      },
      { id: "report", description: "กลับมารายงานโม่ฉิงเทียน" },
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
    description: "คนในเผ่าล้มป่วย ต้องการสมุนไพรหายากจากถ้ำน้ำแข็งไหมสามชนิด",
    briefSummary: "เก็บสมุนไพรจากถ้ำน้ำแข็งไหมเพื่อรักษาคนป่วย",
    type: "side",
    giverNpcId: "wld_miao_tribaleldr_abao",
    stages: [
      {
        id: "gather_cave",
        description: "ไปยังถ้ำน้ำแข็งไหมและเก็บสมุนไพร",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "cave_bingcan" },
            { t: "hasItem", itemId: "herb", count: 3 },
          ],
        },
      },
      { id: "deliver", description: "นำสมุนไพรส่งให้หัวหน้าเผ่า" },
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
    description: "สัตว์ศักดิ์สิทธิ์ของเผ่าเมี่ยวถูกดักจับ ต้องหาและปล่อยมัน",
    briefSummary: "ตามหาและปล่อยสัตว์ศักดิ์สิทธิ์",
    type: "side",
    giverNpcId: "wld_miao_tribaleldr_abao",
    prereqs: { t: "npcRelationship", npcId: "wld_miao_tribaleldr_abao", min: 15 },
    stages: [
      {
        id: "search",
        description: "ค้นหาสัตว์ศักดิ์สิทธิ์ในป่าแถวตลาดเมี่ยว",
        autoAdvance: { t: "flag", flag: "miao_beast_found" },
      },
      {
        id: "free",
        description: "ปล่อยสัตว์ศักดิ์สิทธิ์จากกรง",
        autoAdvance: { t: "flag", flag: "miao_beast_freed" },
      },
      { id: "report", description: "กลับมารายงานหัวหน้าเผ่า" },
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
    description: "นำของถวายประจำปีของเผ่าเมี่ยวไปวางที่ถ้ำบทกวีถัง",
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
        description: "วางของถวายที่แท่นหินในถ้ำ",
        autoAdvance: { t: "flag", flag: "miao_offering_placed" },
      },
      { id: "return", description: "กลับมารายงานหัวหน้าเผ่า" },
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
    description: "วิญญาณนักรบโบราณต้องการดาบคืน ดาบอยู่ที่คลังสมบัติลับ และเจ้าต้องเลือกว่าจะคืนหรือเก็บไว้",
    briefSummary: "หาดาบของวิญญาณและตัดสินใจเรื่องชะตากรรมของมัน",
    type: "side",
    giverNpcId: "wld_motian_ghost_liang",
    prereqs: { t: "flag", flag: "motian_ghost_revealed" },
    stages: [
      {
        id: "find_sword",
        description: "ไปยังคลังสมบัติลับและหาดาบโบราณ — ดาบมีพลังของวิญญาณห่อหุ้มอยู่",
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
      { id: "decide", description: "กลับไปหาวิญญาณและตัดสินใจ" },
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
    description: "วิญญาณเหลียงเก๋อต้องการดอกไม้ขมห้าดอกจากหุบเขาตัดใจเพื่อทำพิธีกรรมปลดปล่อยตัวเอง",
    briefSummary: "นำดอกไม้ขมจากหุบเขาตัดใจมาให้วิญญาณ",
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
        description: "เก็บดอกไม้ขมห้าดอกจากหุบเขาตัดใจ",
        autoAdvance: {
          t: "and",
          all: [
            { t: "visitedLocation", locationId: "valley_jueqing_bottom" },
            { t: "hasItem", itemId: "lotus_seed", count: 3 },
          ],
        },
      },
      { id: "return", description: "นำดอกไม้ขมมาให้วิญญาณที่ยอดเขามรณะ" },
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
    description: "บัณฑิตเว่ยชิงเหวินต้องการไหมน้ำแข็งจากส่วนลึกของถ้ำ มีตะขาบพิทักษ์อยู่",
    briefSummary: "เก็บไหมน้ำแข็งจากลึกในถ้ำน้ำแข็งไหม",
    type: "side",
    giverNpcId: "wld_bingcan_scholar_wei",
    stages: [
      {
        id: "enter_deep",
        description: "เข้าไปส่วนลึกของถ้ำน้ำแข็งไหม",
        autoAdvance: { t: "visitedLocation", locationId: "cave_bingcan" },
      },
      {
        id: "collect_silk",
        description: "ปราบตะขาบและเก็บไหมน้ำแข็ง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "giant_centipede", count: 1 },
      },
      { id: "deliver", description: "ส่งไหมน้ำแข็งให้เว่ยชิงเหวิน" },
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
    description: "บัณฑิตสังเกตอาการผิดปกติของเจ้า ต้องการโสมหิมะที่งอกบนยอดนิรันดร์คุนหลุนเท่านั้นมาผสมยา",
    briefSummary: "เก็บโสมหิมะจากยอดนิรันดร์คุนหลุนแล้วนำกลับให้บัณฑิตเว่ย",
    type: "side",
    giverNpcId: "wld_bingcan_scholar_wei",
    stages: [
      {
        id: "gather",
        description: "ขึ้นไปนิรันดร์คุนหลุนและเก็บโสมหิมะ (ต้องการมาสเตอร์รี่เก็บสมุนไพรขั้นสูง)",
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
    description: "ดำลงไปสำรวจก้นสระมังกรดำและค้นพบความจริงที่ซ่อนอยู่",
    briefSummary: "สำรวจก้นสระมังกรดำ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    stages: [
      {
        id: "dive",
        description: "ดำลงไปสำรวจก้นสระมังกรดำ",
        autoAdvance: { t: "flag", flag: "heilong_depths_visited" },
      },
      { id: "decide", description: "กลับขึ้นมาและบอกความจริงแก่ต่านเหลาตู" },
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
    description: "ชาวประมงหายตัวไป ต่านเหลาตูสงสัยว่าถูกโจรสลัดลักพาตัว",
    briefSummary: "ช่วยเหลือชาวประมงที่ถูกโจรสลัดจับ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    stages: [
      {
        id: "search",
        description: "ค้นหาชาวประมงรอบสระมังกรดำ",
        autoAdvance: { t: "flag", flag: "heilong_fisher_found" },
      },
      {
        id: "rescue",
        description: "ปราบโจรสลัดและปล่อยชาวประมง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
      { id: "return", description: "พาชาวประมงกลับมาให้ต่านเหลาตู" },
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
    description: "สำรวจสระในคืนเพ็ญเพื่อค้นพบต้นตอของแสงสีแดงลึกลับ",
    briefSummary: "สืบสวนแสงลึกลับจากก้นสระมังกรดำ",
    type: "side",
    giverNpcId: "wld_heilong_fisherman_tan",
    prereqs: { t: "npcRelationship", npcId: "wld_heilong_fisherman_tan", min: 15 },
    stages: [
      {
        id: "wait_fullmoon",
        description: "รอวันเพ็ญและดำลงไปตามแสง",
        autoAdvance: { t: "flag", flag: "heilong_red_found" },
      },
      {
        id: "collect_ore",
        description: "เก็บตัวอย่างแร่เรืองแสงกลับมา",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      { id: "report", description: "รายงานให้ต่านเหลาตู" },
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
    description: "หลัวเฟย์หาวพบแผนที่สมบัติในบ้านโฮ่งชีก๋ง แต่ต้องผ่านหมีป่าและค้นพบความจริงว่าสมบัติคืออะไร",
    briefSummary: "ปราบหมีป่าและค้นพบสมบัติที่แท้จริง",
    type: "side",
    giverNpcId: "wld_hong_adventurer_luo",
    stages: [
      {
        id: "clear_bears",
        description: "ปราบหมีสีน้ำตาลที่ขวางทางเข้าถ้ำสมบัติ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "brown_bear", count: 1 },
      },
      {
        id: "find_cache",
        description: "เข้าไปในถ้ำและค้นพบความจริงของสมบัติ",
        autoAdvance: { t: "flag", flag: "hong_treasure_truth_found" },
      },
      { id: "report", description: "กลับมารายงานหลัวเฟย์หาว" },
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
    description: "ฝูงหมาป่าบุกเข้ามาใกล้บ้านโฮ่งชีก๋ง ต้องปราบสักสองสามตัวเพื่อขู่ฝูงออกไป",
    briefSummary: "ปราบหมาป่าเพื่อขู่ฝูงออกไปจากบ้านโฮ่งชีก๋ง",
    type: "side",
    giverNpcId: "wld_hong_adventurer_luo",
    stages: [
      {
        id: "hunt_wolves",
        description: "ปราบหมาป่าสักสองสามตัวรอบบ้านโฮ่งชีก๋ง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wild_wolf", count: 2 },
      },
      { id: "report", description: "รายงานให้หลัวเฟย์หาว" },
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
    description: "หลัวเฟย์หาวได้ยินตำนานว่าโฮ่งชีก๋งทิ้งข้อความสำคัญไว้ก่อนตาย ต้องไปยืนยันกับวิญญาณที่ยอดเขามรณะ",
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
      { id: "report", description: "นำข้อมูลกลับมารายงานหลัวเฟย์หาว" },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 90 },
      { t: "skillExp", skillId: "basic_punch", amount: 100 },
      { t: "npcRelationship", npcId: "wld_hong_adventurer_luo", amount: 20 },
    ],
  },
];
