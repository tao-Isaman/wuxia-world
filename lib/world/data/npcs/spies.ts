import type { NpcDef } from "../../types";

// Jinyiwei spies (สายลับเสื้อแพรกระจายตัว) scattered across the world.
// Each agent works under deep cover at a public location — capital
// informant, port watcher, southwest border ear, inn listening post,
// and a rural agent posing as a farmer. They're sparrable so the
// player can challenge their cover, and they offer side / bad quests
// that thread Jinyiwei work into the broader map.
export const NPCS_SPIES: readonly NpcDef[] = [
  // 1. Chief informant in the capital — front: noodle-shop owner.
  {
    id: "spy_capital_feng",
    name: "เฟิงเจ้าของร้านบะหมี่",
    description: "พ่อค้าบะหมี่ในตรอกหลังนครหลวง · จริง ๆ คือสายลับใหญ่ของกรมองครักษ์ผู้คุมข่าวในเมืองหลวง",
    locationIds: ["city_capital"],
    dialogSceneId: "npc_spy_capital_feng_talk",
    sparOpponentId: "spar_spy_feng",
    sparFameReward: 6,
    questIds: [
      "qst_spy_capital_seal_ledger",
      "qst_spy_capital_court_traitor",
      "qe_spy_capital_frame_merchant",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 3 },
    ],
    tags: ["spy", "jinyiwei", "informant"],
  },

  // 2. Port watcher in Yangzhou — front: dockhand.
  {
    id: "spy_yangzhou_xi",
    name: "ซีคนยกของท่าเรือ",
    description: "คนยกของผอม ๆ ที่ท่าเรือหยางโจว · จริง ๆ จดบัญชีเรือทุกลำที่เข้าออกให้กรมองครักษ์",
    locationIds: ["city_yangzhou"],
    dialogSceneId: "npc_spy_yangzhou_xi_talk",
    sparOpponentId: "spar_spy_xi",
    sparFameReward: 6,
    questIds: [
      "qst_spy_yangzhou_smuggler_ship",
      "qst_spy_yangzhou_silk_seal",
      "qe_spy_yangzhou_silence_witness",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "fish_eel", weight: 3 },
      { itemId: "leather", weight: 3 },
      { itemId: "ancient_coin", weight: 3 },
    ],
    tags: ["spy", "jinyiwei", "informant"],
  },

  // 3. Southwest border ear in Dali — front: herb gatherer.
  {
    id: "spy_dali_mei",
    name: "เหมยพรานป่า",
    description: "ผู้หญิงเก็บสมุนไพรริมเมืองต้าหลี่ · เธอจดทุกการเคลื่อนไหวของพรรคเบญจพิษให้กรมองครักษ์",
    locationIds: ["city_dali"],
    dialogSceneId: "npc_spy_dali_mei_talk",
    sparOpponentId: "spar_spy_mei",
    sparFameReward: 6,
    questIds: [
      "qst_spy_dali_poisoner_track",
      "qst_spy_dali_southern_envoy",
      "qe_spy_dali_steal_antidote",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "snake_skin", weight: 3 },
    ],
    tags: ["spy", "jinyiwei", "informant"],
  },

  // 4. Inn listening post at Yuelai — front: drink steward.
  {
    id: "spy_inn_zhou",
    name: "โจวพ่อค้าเหล้าในโรงเตี๊ยม",
    description: "พ่อค้าเหล้าในโรงเตี๊ยมยั่วไหล · จดเสียงคนดื่มเหล้าทุกคืนให้กรมองครักษ์",
    locationIds: ["inn_yuelai"],
    dialogSceneId: "npc_spy_inn_zhou_talk",
    sparOpponentId: "spar_spy_zhou",
    sparFameReward: 4,
    questIds: [
      "qst_spy_inn_drunk_confession",
      "qst_spy_inn_wandering_blade",
      "qe_spy_inn_intimidate_drunk",
    ],
    defenseTier: 1,
    stealLoot: [
      { itemId: "raw_meat", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "potion", weight: 2 },
    ],
    tags: ["spy", "jinyiwei", "informant"],
  },

  // 5. Rural agent in Qigu village — front: farmer.
  {
    id: "spy_village_si",
    name: "ซื่อชาวนาในชีกู่",
    description: "ชาวนาธรรมดาในหมู่บ้านชีกู่ · จริง ๆ ผู้คุมเครือข่ายสายลับชนบทของกรมองครักษ์",
    locationIds: ["village_qigu"],
    dialogSceneId: "npc_spy_village_si_talk",
    sparOpponentId: "spar_spy_si",
    sparFameReward: 4,
    questIds: [
      "qst_spy_village_missing_courier",
      "qst_spy_village_iron_caravan",
      "qe_spy_village_kidnap_witness",
    ],
    defenseTier: 1,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "raw_meat", weight: 3 },
      { itemId: "ancient_coin", weight: 3 },
    ],
    tags: ["spy", "jinyiwei", "informant"],
  },
];
