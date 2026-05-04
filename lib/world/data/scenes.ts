import type { Scene } from "../types";

// Scenes table. Sceneflow:
//   start → village_entry → {elder | walk_around | tavern_brawl}
//   tavern_brawl → triggerBattle(thug) → {victory | defeat}
//
// Authoring rule: every `next` must point to a scene id that exists in this
// table, otherwise validateAndRepair will reset the player to "start".
export const SCENES: readonly Scene[] = [
  {
    id: "start",
    lines: [
      { t: "narration", text: "ลมหนาวพัดผ่านเส้นทางขรุขระสู่หมู่บ้านเล็ก ๆ บนเชิงเขา" },
      { t: "narration", text: "เจ้าเดินทางมาจากแดนไกลเพื่อพิสูจน์ฝีมือในยุทธภพ" },
    ],
    next: "village_entry",
  },

  {
    id: "village_entry",
    lines: [
      { t: "narration", text: "ที่ประตูหมู่บ้าน ชายชราในเสื้อคลุมเทา ๆ ยืนรอเจ้าอยู่" },
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เจ้ามาถึงสักที ข้ามีเรื่องจะให้เจ้าช่วย..." },
    ],
    choices: [
      {
        text: "พูดคุยกับผู้อาวุโส",
        next: "elder_talk",
        // Hide once the player has already received the briefing.
        visibleIf: { t: "not", of: { t: "flag", flag: "got_elder_briefing" } },
        effects: [
          { t: "startQuest", questId: "first_steps" },
        ],
      },
      {
        text: "ทักทายผู้อาวุโส (สั้น ๆ)",
        next: "elder_followup",
        // Reverse condition — only after briefing.
        visibleIf: { t: "flag", flag: "got_elder_briefing" },
      },
      {
        text: "เดินสำรวจหมู่บ้านก่อน",
        next: "walk_around",
      },
      {
        text: "ตรงไปยังโรงเตี๊ยม (มีเรื่องวุ่นวาย)",
        next: "tavern_brawl",
        visibleIf: { t: "questStatus", questId: "first_steps", status: "active" },
      },
    ],
  },

  {
    id: "elder_talk",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "ช่วงนี้มีโจรชุกชุมแถวโรงเตี๊ยม ไปจัดการให้ทีเถิด" },
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เอาขวดยาฟื้นเลือดไปด้วย เผื่อยามฉุกเฉิน" },
    ],
    choices: [
      {
        text: "รับยาและออกเดินทาง",
        next: "village_entry",
        effects: [
          // One-shot flag; village_entry uses it to hide this choice path.
          { t: "setFlag", flag: "got_elder_briefing", value: true },
          { t: "giveItem", itemId: "potion", count: 1 },
          { t: "addGold", amount: 50 },
          // Move quest from stage 0 (talk_elder) to stage 1 (defeat_thug).
          { t: "advanceQuest", questId: "first_steps" },
        ],
      },
    ],
  },

  {
    id: "elder_followup",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "เร่งไปจัดการเรื่องโรงเตี๊ยมเถอะ ข้าจะรอ" },
    ],
    next: "village_entry",
  },

  {
    id: "walk_around",
    lines: [
      { t: "narration", text: "เจ้าเดินดูไปทั่วหมู่บ้าน เห็นชาวบ้านวิตกจริต ต่างพูดคุยกันถึงโจร" },
      { t: "narration", text: "ดูเหมือนเรื่องนี้คงต้องลงมือเอง" },
    ],
    next: "village_entry",
  },

  {
    id: "tavern_brawl",
    lines: [
      { t: "narration", text: "ในโรงเตี๊ยม โจรหน้าใหม่กำลังเดินกร่างจะรีดเงินจากเจ้าของร้าน" },
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
        next: "village_entry",
      },
    ],
  },

  {
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
          // Stage was advanced to "defeat_thug" in elder_talk; this moves it
          // to the final "return" stage, then finishQuest marks it done.
          { t: "advanceQuest", questId: "first_steps" },
          { t: "finishQuest", questId: "first_steps", success: true },
          { t: "setFlag", flag: "saved_tavern", value: true },
        ],
      },
    ],
  },

  {
    id: "defeat",
    lines: [
      { t: "narration", text: "เจ้าล้มลงในโรงเตี๊ยม โจรหัวเราะลั่น..." },
      { t: "narration", text: "เมื่อเจ้าได้สติ พบว่าตัวเองอยู่ที่ประตูหมู่บ้าน เจ็บตัวแต่ยังมีชีวิต" },
    ],
    next: "village_entry",
  },

  {
    id: "ending_good",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโส", text: "ทำได้ดีมาก เจ้าช่างเป็นยอดยุทธอย่างแท้จริง" },
      { t: "narration", text: "เรื่องราวยังไม่จบ... แต่ก้าวแรกของเจ้าในยุทธภพได้เริ่มต้นแล้ว" },
      { t: "narration", text: "(จบเดโม่ — เพิ่มฉากต่อใน lib/world/data/scenes.ts)" },
    ],
    choices: [
      { text: "เริ่มเกมใหม่", next: "start" },
    ],
  },
];

export const SCENES_BY_ID = new Map<string, Scene>(SCENES.map((s) => [s.id, s]));

export function getScene(id: string | null | undefined): Scene | null {
  if (!id) return null;
  return SCENES_BY_ID.get(id) ?? null;
}

export const START_SCENE_ID = "start";
