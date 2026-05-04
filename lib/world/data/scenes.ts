import type { Scene } from "../types";

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
// resets unknown ids to "start" on save load.
export const SCENES: readonly Scene[] = [
  // ─── Opening ─────────────────────────────────────────────────────────
  {
    kind: "dialog",
    id: "start",
    lines: [
      { t: "narration", text: "ลมหนาวพัดผ่านเส้นทางขรุขระสู่หมู่บ้านเล็ก ๆ บนเชิงเขา" },
      { t: "narration", text: "เจ้าเดินทางมาจากแดนไกลเพื่อพิสูจน์ฝีมือในยุทธภพ" },
    ],
    choices: [
      { text: "เข้าสู่หมู่บ้าน →", next: "village" },
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
        routeSceneId: "mountain_road",
        label: "ทางเหนือสู่ภูผา",
        hint: "เส้นทางขึ้นเขาสำหรับชมทิวทัศน์",
      },
    ],
  },

  {
    kind: "location",
    id: "viewpoint",
    name: "จุดชมวิวบนภูผา",
    description: "บนยอดเขาที่มองเห็นหมู่บ้านเบื้องล่าง สายลมหนาวพัดพาเสียงห่างไกล",
    npcs: [],
    routes: [
      {
        routeSceneId: "viewpoint_road",
        label: "ทางลงเขากลับหมู่บ้าน",
        hint: "ทางเดิมที่ขึ้นมา",
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

  {
    kind: "route",
    id: "mountain_road",
    label: "ทางเหนือสู่ภูผา",
    description: "เส้นทางคดเคี้ยวสูงชัน ลมแรงขึ้นเรื่อย ๆ ตามความสูง",
    destinations: [
      { locationId: "viewpoint", label: "จุดชมวิวบนภูผา", hint: "ขึ้นเขาต่อไป" },
    ],
  },

  {
    kind: "route",
    id: "viewpoint_road",
    label: "ทางลงเขา",
    description: "เส้นทางลงเขาเดียวกันที่ขึ้นมา",
    destinations: [
      { locationId: "village", label: "หมู่บ้านบนเชิงเขา", hint: "กลับลงไป" },
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
      { t: "narration", text: "(จบเดโม่ — เพิ่มฉากต่อใน lib/world/data/scenes.ts)" },
    ],
    choices: [
      { text: "ก้าวต่อไป...", next: "village" },
    ],
  },
];

export const SCENES_BY_ID = new Map<string, Scene>(SCENES.map((s) => [s.id, s]));

export function getScene(id: string | null | undefined): Scene | null {
  if (!id) return null;
  return SCENES_BY_ID.get(id) ?? null;
}

export const START_SCENE_ID = "start";
