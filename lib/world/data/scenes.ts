import type { Scene } from "../types";
import { WORLD_MAP_SCENES } from "./world-map";
import { SCENES_CITIES } from "./scenes-content/cities";
import { SCENES_VILLAGES } from "./scenes-content/villages";
import { SCENES_SECTS_TEMPLES } from "./scenes-content/sects-temples";
import { SCENES_WILDERNESS } from "./scenes-content/wilderness";
import { SCENES_EVIL } from "./scenes-content/evil";
import { SCENES_SPIES } from "./scenes-content/spies";
import { STORY_SCENES } from "../story/registry";
import { PLACE_SCENES } from "./places";

// Scene table — three kinds (dialog / location / route) discriminated by `kind`.
//
// Sceneflow at a glance:
//   start (dialog) → village (location)
//   village.npcs:    elder → elder_talk dialog → exit back to village
//   village.routes:  tavern_road → tavern (location)
//   tavern.npcs:     bartender → bartender_chat (lore-only dialog)
//                    thug → tavern_brawl dialog → triggerBattle → victory/defeat
//   tavern.routes:   back_road → village
//   victory dialog → ending_good dialog → exit to last location
//
// Authoring rule: every `next`, `routeSceneId`, `dialogSceneId`, `locationId`,
// and route `back` must reference a scene id in this table. validateAndRepair
// resets an unknown current scene to "home_player" on save load.
// Core (tutorial) scenes. The full SCENES array below appends WORLD_MAP_SCENES
// (every world location plus its hub + category routes — see
// docs/reference/locations.md).
const CORE_SCENES: readonly Scene[] = [
  // ─── Opening ─────────────────────────────────────────────────────────
  {
    kind: "dialog",
    id: "start",
    lines: [
      { t: "narration", text: "ลมหนาวพัดผ่านเส้นทางขรุขระสู่หมู่บ้านเล็ก ๆ บนเชิงเขา" },
      { t: "narration", text: "เจ้าเดินทางมาจากแดนไกลเพื่อพิสูจน์ฝีมือในยุทธภพ" },
    ],
    choices: [
      { text: "เข้าสู่หมู่บ้าน → (ทำตามเรื่องราว)", next: "village" },
      { text: "🗺 ข้ามไปสำรวจยุทธภพเลย", next: "world_journey" },
    ],
  },

  // ─── Locations ───────────────────────────────────────────────────────
  {
    kind: "location",
    id: "village",
    name: "หมู่บ้านบนเชิงเขา",
    description: "หมู่บ้านเล็ก ๆ ที่ตั้งอยู่บนเชิงเขา ผู้คนต่างทำมาหากินอย่างสงบ ลมหนาวจากยอดเขาพัดผ่านอย่างอ่อนโยน",
    npcs: [
      {
        id: "elder",
        name: "ผู้อาวุโส",
        hint: "ชายชราที่ดูจะมีเรื่องจะให้ช่วย",
        dialogSceneId: "elder_talk",
        visibleIf: { t: "not", of: { t: "flag", flag: "got_elder_briefing" } },
      },
      {
        id: "elder_post",
        name: "ผู้อาวุโส (ทักทายสั้น ๆ)",
        hint: "ทักทายเฉย ๆ",
        dialogSceneId: "elder_followup",
        visibleIf: { t: "flag", flag: "got_elder_briefing" },
      },
    ],
    routes: [
      {
        routeSceneId: "tavern_road",
        label: "ทางใต้สู่โรงเตี๊ยม",
        hint: "เส้นทางลัดเลาะไปยังโรงเตี๊ยมในหมู่บ้าน",
      },
      {
        // Two-way link with home_player (the reverse is appended to the
        // home leaf in world-map.ts). The old village_to_world connector led
        // to the retired random-teleport hub and left this area orphaned.
        routeSceneId: "route_village__to__home_player",
        label: "ทางลงเขาสู่บ้าน",
        hint: "เส้นทางกลับบ้านของเจ้าและออกสู่ยุทธภพ",
      },
    ],
  },

  {
    kind: "location",
    id: "tavern",
    name: "โรงเตี๊ยมเก่า",
    description: "โรงเตี๊ยมไม้เก่า ๆ ภายในมีกลิ่นเหล้าและควันเตา ลูกค้าน้อย เสียงพูดคุยอู้อี้",
    npcs: [
      {
        id: "bartender",
        name: "เจ้าของร้าน",
        hint: "ชายอ้วนกำลังเช็ดถ้วย",
        dialogSceneId: "bartender_chat",
      },
      {
        id: "thug",
        name: "โจรหน้าใหม่",
        hint: "กำลังคุกคามเจ้าของร้านอยู่",
        dialogSceneId: "tavern_brawl",
        // Only show while the briefing-quest is active (so player has motive)
        // and not yet completed.
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "first_steps", status: "active" },
            { t: "not", of: { t: "flag", flag: "saved_tavern" } },
          ],
        },
      },
    ],
    routes: [
      {
        routeSceneId: "back_road",
        label: "ทางเหนือกลับหมู่บ้าน",
        hint: "เส้นทางย้อนกลับไปยังหมู่บ้าน",
      },
    ],
  },

  // ─── Routes ──────────────────────────────────────────────────────────
  {
    kind: "route",
    id: "tavern_road",
    label: "ทางใต้สู่โรงเตี๊ยม",
    description: "เส้นทางคดเคี้ยวไม่ไกลนัก ผ่านทุ่งโล่งและกระท่อมเล็ก ๆ ก่อนถึงโรงเตี๊ยม",
    destinations: [
      { locationId: "tavern", label: "โรงเตี๊ยมเก่า", hint: "เดินทางต่อ" },
    ],
  },

  {
    kind: "route",
    id: "back_road",
    label: "ทางเหนือกลับหมู่บ้าน",
    description: "เส้นทางเดิมที่เจ้าเคยผ่านมา",
    destinations: [
      { locationId: "village", label: "หมู่บ้านบนเชิงเขา", hint: "กลับไปยังหมู่บ้าน" },
    ],
  },

  // ─── Dialog scenes ───────────────────────────────────────────────────
  {
    kind: "dialog",
    id: "elder_talk",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เจ้ามาถึงสักที ข้ามีเรื่องจะให้เจ้าช่วย" },
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "ช่วงนี้มีโจรชุกชุมแถวโรงเตี๊ยม ไปจัดการให้ทีเถิด" },
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เอาขวดยาฟื้นเลือดไปด้วย เผื่อยามฉุกเฉิน" },
    ],
    choices: [
      {
        text: "รับยาและออกเดินทาง",
        // Going back to village is implicit via lastLocationId — but the
        // existing engine still needs `next` on choices, so we point it
        // there explicitly for documentation.
        next: "village",
        effects: [
          { t: "startQuest", questId: "first_steps" },
          { t: "setFlag", flag: "got_elder_briefing", value: true },
          { t: "giveItem", itemId: "potion", count: 1 },
          { t: "addGold", amount: 50 },
          { t: "advanceQuest", questId: "first_steps" }, // → "defeat_thug"
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "elder_followup",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เร่งไปจัดการเรื่องโรงเตี๊ยมเถอะ ข้าจะรอ" },
    ],
    // Terminal dialog → ChoicePanel renders "ปิด" → exitToLocation → village.
  },

  {
    kind: "dialog",
    id: "bartender_chat",
    lines: [
      { t: "dialogue", speaker: "เจ้าของร้าน", text: "ระวังตัวด้วยล่ะ มีโจรเข้ามาเรียกค่าคุ้มครอง..." },
      { t: "narration", text: "เจ้าของร้านเช็ดถ้วยอย่างกระวนกระวาย" },
    ],
    // Terminal — exit back to tavern.
  },

  {
    kind: "dialog",
    id: "tavern_brawl",
    lines: [
      { t: "narration", text: "โจรหน้าใหม่หันมาทางเจ้า" },
      { t: "dialogue", speaker: "โจร", text: "ไอ้หนู เจ้ามายุ่งทำไม! รับการลงโทษซะ!" },
    ],
    choices: [
      {
        text: "เข้าโจมตี",
        next: "victory",
        effects: [
          { t: "triggerBattle", opponentId: "thug", onWin: "victory", onLose: "defeat" },
        ],
      },
      {
        text: "ถอยกลับไปก่อน",
        // "tavern" is the location the brawl scene logically belongs to.
        next: "tavern",
      },
    ],
  },

  {
    kind: "dialog",
    id: "victory",
    lines: [
      { t: "narration", text: "โจรล้มลง ผู้คนในโรงเตี๊ยมโห่ร้องด้วยความยินดี" },
      { t: "dialogue", speaker: "เจ้าของร้าน", text: "ขอบคุณยอดยุทธ! รับเงินรางวัลไปด้วยเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัลและกลับไปหาผู้อาวุโส",
        next: "ending_good",
        effects: [
          { t: "addGold", amount: 200 },
          { t: "advanceQuest", questId: "first_steps" }, // → "return"
          { t: "finishQuest", questId: "first_steps", success: true },
          { t: "setFlag", flag: "saved_tavern", value: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "defeat",
    lines: [
      { t: "narration", text: "เจ้าล้มลงในโรงเตี๊ยม โจรหัวเราะลั่น..." },
      { t: "narration", text: "เมื่อเจ้าได้สติ พบว่าตัวเองอยู่ที่ทางเข้าหมู่บ้าน เจ็บตัวแต่ยังมีชีวิต" },
    ],
    choices: [
      { text: "(ลุกขึ้นและก้าวต่อ)", next: "village" },
    ],
  },

  {
    kind: "dialog",
    id: "ending_good",
    lines: [
      { t: "narration", text: "เจ้าเดินทางกลับยังหมู่บ้านพร้อมเรื่องราวแห่งชัยชนะ" },
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "ทำได้ดีมาก เจ้าช่างเป็นยอดยุทธอย่างแท้จริง" },
      { t: "narration", text: "ถึงเวลาออกเดินทางสู่ยุทธภพอันกว้างใหญ่แล้ว..." },
    ],
    choices: [
      { text: "ออกเดินทางสู่ยุทธภพ →", next: "world_journey" },
    ],
  },

  // ─── Jail (lost to the law while wanted — lib/world/law.ts) ────────────
  {
    kind: "dialog",
    id: "jail_cell",
    lines: [
      { t: "narration", text: "เจ้าพ่ายแพ้และถูกตีตรวนคุมตัวไปยังคุกหลวงของเมือง" },
      { t: "dialogue", speaker: "ผู้คุม", text: "หมายจับหนึ่งใบ โทษสองวัน ในคุกมีงานให้ทำ มีเต๋าให้ทอย อยากออกเร็วก็ใช้แรงเอา… เว้นแต่เจ้าจะมีอะไรมาแลกความสะดวก" },
    ],
    choices: [
      { text: "ยอมถูกคุมตัวเข้าคุก (หมายจับละ 2 วัน · ล้างหมายจับ)", effects: [{ t: "imprison" }], next: "jail" },
      { text: "ติดสินบนผู้คุม (300 ตำลึง · ลดหมายจับ 2)", visibleIf: { t: "goldAtLeast", amount: 300 }, effects: [{ t: "bribeJail" }], next: "jail_bribed" },
    ],
  },
  {
    kind: "location",
    id: "jail",
    name: "คุกหลวง",
    description: "ลานคุกล้อมกำแพงหิน ห้องขังเรียงรายด้านเหนือ ผู้คุมเฝ้าประตูเหล็กทางใต้ นักโทษทุบหินใช้แรงงานเพื่อลดโทษ",
    npcs: [],
    routes: [],
  },
  {
    kind: "dialog",
    id: "jail_elder_prisoner_talk",
    lines: [
      { t: "dialogue", speaker: "ตาเฒ่าหลิวนักโทษ", text: "มาใหม่หรือ… ข้าอยู่ที่นี่มาสามฤดูหนาวแล้ว เพราะขโมยซาลาเปาก้อนเดียว" },
      { t: "dialogue", speaker: "ตาเฒ่าหลิวนักโทษ", text: "อยากออกเร็วก็ไปทุบหิน ผู้คุมนับแรงงานเป็นสองเท่า ส่วนกำแพงร้าวฝั่งตะวันออก… คนหนุ่มตัวเบาอาจปีนพ้น แต่ถ้าพลาด โทษจะงอกเพิ่ม" },
    ],
    choices: [
      { text: "ถามเรื่องการนั่งสมาธิในคุก", next: "jail_elder_prisoner_meditate" },
      { text: "ลาก่อน ตาเฒ่า", next: "jail" },
    ],
  },
  {
    kind: "dialog",
    id: "jail_elder_prisoner_meditate",
    lines: [
      { t: "dialogue", speaker: "ตาเฒ่าหลิวนักโทษ", text: "เสื่อแดงมุมตะวันออกนั่นแหละ ข้าหลับตาหายใจตรงนั้นทุกค่ำ ปราณไหลเวียนดีกว่าข้างนอกเสียอีก ที่นี่ไม่มีใครมารบกวน" },
    ],
    choices: [{ text: "ขอบคุณ ตาเฒ่า", next: "jail" }],
  },
  {
    kind: "dialog",
    id: "jail_guard_zhang_talk",
    lines: [
      { t: "dialogue", speaker: "ผู้คุมจาง", text: "มีอะไร? อยากออกก่อนกำหนดก็ต้องมีน้ำใจหน่อย… หรือจะทอยเต๋าฆ่าเวลาที่โต๊ะข้าก็ได้" },
    ],
    choices: [
      { text: "ติดสินบนผู้คุม (300 ตำลึง · ออกทันที)", visibleIf: { t: "goldAtLeast", amount: 300 }, effects: [{ t: "bribeJail" }], next: "jail_bribed" },
      { text: "ไม่มีอะไร", next: "jail" },
    ],
  },
  {
    kind: "dialog",
    id: "jail_bribed",
    lines: [
      { t: "narration", text: "ถุงเงินเปลี่ยนมือเงียบ ๆ ผู้คุมหันไปมองทางอื่น" },
      { t: "dialogue", speaker: "ผู้คุม", text: "ข้าไม่เห็นอะไรทั้งนั้น รีบไปก่อนเปลี่ยนเวร" },
    ],
  },

  // ─── Random-event scenes ─────────────────────────────────────────────
  // Fired by walk ticks (`rollWalkEvent` in lib/world/effects.ts). Each is a terminal
  // dialog whose onEnter applies the loot; pressing "ปิด" auto-returns to
  // lastLocationId (the leaf the player just stepped onto).

  {
    kind: "dialog",
    id: "evt_meet_wanderer",
    lines: [
      { t: "narration", text: "เจ้าพบนักเดินทางคนหนึ่งบนเส้นทาง" },
      { t: "dialogue", speaker: "นักเดินทาง", text: "ท่านดูเหนื่อยล้าเหลือเกิน รับสมุนไพรนี้ไปเถิด" },
      { t: "narration", text: "เขาส่งสมุนไพรหายากให้แล้วจากไป" },
    ],
    onEnter: [{ t: "giveItem", itemId: "herb", count: 1 }],
  },

  {
    kind: "dialog",
    id: "evt_meet_monk",
    lines: [
      { t: "narration", text: "พระผู้แสวงบุญรูปหนึ่งเดินผ่านมา" },
      { t: "dialogue", speaker: "พระ", text: "เจริญพร โยม จงเดินทางอย่างปลอดภัย" },
      { t: "narration", text: "ท่านส่งยาเลือดเล็กให้ก่อนเดินจากไป" },
    ],
    onEnter: [{ t: "giveItem", itemId: "potion", count: 1 }],
  },

  {
    kind: "dialog",
    id: "evt_meet_merchant",
    lines: [
      { t: "narration", text: "พ่อค้าเร่ผูกม้าอยู่ริมทาง" },
      { t: "dialogue", speaker: "พ่อค้า", text: "วันนี้ขายดี ขอแบ่งโชคให้ผู้พบเห็น!" },
      { t: "narration", text: "เขายื่นถุงเหรียญทองให้ก่อนจากไป" },
    ],
    onEnter: [{ t: "addGold", amount: 80 }],
  },

  {
    kind: "dialog",
    id: "evt_treasure_gold",
    lines: [
      { t: "narration", text: "เจ้าสะดุดถุงผ้าเก่าใต้พุ่มไม้" },
      { t: "narration", text: "ภายในมีเหรียญทองอยู่จำนวนหนึ่ง!" },
    ],
    onEnter: [{ t: "addGold", amount: 50 }],
  },

  {
    kind: "dialog",
    id: "evt_treasure_potion",
    lines: [
      { t: "narration", text: "เจ้าพบขวดยาเล็ก ๆ ซ่อนอยู่ในซอกหิน" },
      { t: "narration", text: "ดูเหมือนใครจะลืมไว้... เก็บไปด้วยก็แล้วกัน" },
    ],
    onEnter: [{ t: "giveItem", itemId: "potion", count: 1 }],
  },

  {
    kind: "dialog",
    id: "evt_treasure_herb",
    lines: [
      { t: "narration", text: "พุ่มสมุนไพรหายากซ่อนอยู่ใต้ใบไม้แห้ง" },
      { t: "narration", text: "เจ้าเด็ดยอดอ่อนใส่ย่ามอย่างระมัดระวัง" },
    ],
    onEnter: [{ t: "giveItem", itemId: "herb", count: 1 }],
  },

  {
    kind: "dialog",
    id: "evt_treasure_jade",
    lines: [
      { t: "narration", text: "แสงเขียวจาง ๆ ลอดผ่านโพรงหิน..." },
      { t: "narration", text: "เป็นหยกล้ำค่าอย่างไม่น่าเชื่อ!" },
    ],
    onEnter: [{ t: "giveItem", itemId: "jade", count: 1 }],
  },

  // ─── Beggar trainer (unlocks the begging life-skill) ─────────────────
  // Reachable via the NPC list at sect_beggars (พรรคยาจก). Setting the
  // `begging_learned` flag makes begging-resource nodes visible everywhere.
  {
    kind: "dialog",
    id: "beggar_trainer_talk",
    lines: [
      { t: "narration", text: "ผู้เฒ่ายาจกหันมามองเจ้าด้วยสายตาเอ็นดู" },
      { t: "dialogue", speaker: "ผู้เฒ่ายาจก", text: "อยากเรียนรู้ศาสตร์แห่งการขอทานหรือ? นี่ไม่ใช่เรื่องน่าอาย" },
      { t: "dialogue", speaker: "ผู้เฒ่ายาจก", text: "จงจำไว้: มารยาท ความถ่อมตน และการอ่านใจคน คือเคล็ดลับ" },
    ],
    choices: [
      {
        text: "รับการสอนและกลับไปฝึก",
        next: "sect_beggars",
        effects: [{ t: "setFlag", flag: "begging_learned", value: true }],
      },
      { text: "ขอตัวก่อน", next: "sect_beggars" },
    ],
  },

  // ─── NPC sparring outcome scenes (generic) ────────────────────────────
  // Both win and lose are reused by every NPC sparring match. The fame
  // reward is granted in the world store before navigation, so these
  // scenes only need to display the result and let the player return.
  {
    kind: "dialog",
    id: "npc_spar_win",
    lines: [
      { t: "narration", text: "เสียงปรบมือดังขึ้นรอบลานประลอง — เจ้าชนะการประลองอย่างสมศักดิ์ศรี!" },
      { t: "narration", text: "ชื่อเสียงของเจ้าแผ่ขจรไปอีกขั้นหนึ่ง" },
    ],
    // Terminal → "ปิด" sends the player back to lastLocationId.
  },
  {
    kind: "dialog",
    id: "npc_spar_lose",
    lines: [
      { t: "narration", text: "เจ้าพ่ายแพ้ในการประลอง แต่เป็นมิตรประลอง ไม่ถึงตาย" },
      { t: "narration", text: "เจ้าหายใจหอบ คู่ต่อสู้ยื่นมือพยุงเจ้าขึ้น" },
    ],
    // Terminal → returns to lastLocationId.
  },

  // ─── Demo registry-NPC dialogs ────────────────────────────────────────
  // These pair with entries in lib/world/data/npcs.ts. NpcInteractionPopup
  // routes its 💬 ทักทาย button to whichever dialog the NpcDef points to.
  {
    kind: "dialog",
    id: "swordsman_xiao_talk",
    lines: [
      { t: "dialogue", speaker: "เซียวจิ้งเทียน", text: "นักเดินทาง... ดาบของเจ้าดูคมพอจะลองมือกับข้าได้หรือไม่?" },
      { t: "dialogue", speaker: "เซียวจิ้งเทียน", text: "หากกล้าก็เลือก 'ขอประลอง' ที่หน้าต่างเมื่อกี้นี้ได้เลย" },
    ],
  },
  {
    kind: "route",
    id: "route_village__to__home_player",
    label: "ทางลงเขาสู่บ้าน (หมู่บ้านบนเชิงเขา → คฤหาสน์ตนเอง)",
    description: "เดินทางจากหมู่บ้านบนเชิงเขาไปยังคฤหาสน์ตนเอง",
    destinations: [{ locationId: "home_player", label: "คฤหาสน์ตนเอง", hint: "บ้านของเจ้า" }],
  },
  {
    kind: "route",
    id: "route_home_player__to__village",
    label: "ทางขึ้นเชิงเขา (คฤหาสน์ตนเอง → หมู่บ้านบนเชิงเขา)",
    description: "เดินทางจากคฤหาสน์ตนเองไปยังหมู่บ้านบนเชิงเขา",
    destinations: [{ locationId: "village", label: "หมู่บ้านบนเชิงเขา", hint: "หมู่บ้านของผู้อาวุโส ผู้มีงานให้คนหนุ่มสาวช่วย" }],
  },
  {
    kind: "dialog",
    id: "merchant_wang_talk",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่หวาง", text: "ฮ่าฮ่า ยินดีต้อนรับสู่นครหลวง! เจ้ามาจากไหนกันรึ?" },
      { t: "dialogue", speaker: "เถ้าแก่หวาง", text: "เรื่องของยุทธจักร ข้าฟังมาเยอะ — ถ้ามีเรื่องสนุก ๆ มาเล่าให้ฟังบ้างก็ดี" },
    ],
  },
];

// Final scene table: core tutorial + the full world map (84 locations) +
// the four regional content batches (NPC dialogs + side-quest beats). Each
// batch is owned by one content agent — see lib/world/data/scenes-content/.
export const SCENES: readonly Scene[] = [
  ...CORE_SCENES,
  ...WORLD_MAP_SCENES,
  ...SCENES_CITIES,
  ...SCENES_VILLAGES,
  ...SCENES_SECTS_TEMPLES,
  ...SCENES_WILDERNESS,
  ...SCENES_EVIL,
  ...SCENES_SPIES,
  ...STORY_SCENES,
  ...PLACE_SCENES,
];

export const SCENES_BY_ID = new Map<string, Scene>(SCENES.map((s) => [s.id, s]));

export function getScene(id: string | null | undefined): Scene | null {
  if (!id) return null;
  return SCENES_BY_ID.get(id) ?? null;
}

// Player starts at their own home (defined in world-map.ts as home_player)
// rather than the legacy "start" dialog. The home_player leaf carries a
// route back into the wider world so the original tutorial scenes are
// still reachable via "ออกเดินทาง" if quests need them.
export const START_SCENE_ID = "home_player";
