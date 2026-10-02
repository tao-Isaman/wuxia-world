// Authoring formats for sect lineage quests and story sagas (pure data).
//
// Content files under lib/world/data/story/ write these compact specs; the
// compiler (./compile.ts) turns them into ordinary QuestDefs, dialog Scenes,
// cutscenes and opponents, so the quest engine, NPC cards, the quest log and
// the guide treat them like any other quest. See docs/story-quests.md.
//
//   • Lineage quest (T0–T3): a sect NPC passes on one skill or art. The
//     compiler builds the gates and the task from the item's tier.
//   • Story saga (T4): 8–10 chapters, each its own quest with a small reward,
//     telling a legend with dialogue and cutscenes; the last chapter teaches
//     the T4 skill or art.

import type { StatKey } from "@/lib/game";
import type { Condition, QuestReward, SectId, TraitKey } from "../types";

// ─── Lines ────────────────────────────────────────────────────────────

/**
 * One line of a dialog: a plain string is narration, a pair is
 * [speaker, words]. "{hero}" anywhere becomes the player's name.
 */
export type StoryLine = string | readonly [speaker: string, text: string];

/** A dialog beat: an optional film first, then the lines. */
export interface StoryBeat {
  cutscene?: CutsceneSpec;
  lines: readonly StoryLine[];
  /** Text of the button that moves on (default "ก้าวต่อไป"). */
  go?: string;
  /**
   * Optional side replies the player can pick instead of `go`: each shows a
   * short reaction, then continues exactly like `go`. For flavour and jokes.
   */
  asides?: readonly { say: string; reply: readonly StoryLine[] }[];
}

// ─── Cutscenes ────────────────────────────────────────────────────────

export type CutsceneMood = "day" | "dusk" | "night" | "past" | "snow" | "rain";
export type CutsceneFx =
  | "slash" | "burst" | "qi" | "flash" | "shake" | "sparkle" | "smoke"
  | "lightning" | "petals" | "fire" | "blood" | "heal" | "ice" | "poison";
export type CutsceneMotion = "attack" | "hurt" | "guard" | "victory" | "defeat" | "idle";
export type StagePoint = readonly [x: number, y: number];

export interface CastMember {
  /** Name on the subtitles. */
  name: string;
  /**
   * Sheet: "hero" (the player's body), a hero body m1–m4 / f1–f4, an
   * archetype (elder, monk, merchant, bandit, feng, wang, qing), a rigged NPC
   * id (ANIMATED_NPC_IDS), an enemy type (foe_bandit, foe_cultist… FOE_CHARACTER_IDS), or
   * "beast:<frame>" (0 wolf, 1 tiger, 2 bear, 3 boar, 4 snake, 5 rooster,
   * 6 eagle, 7 bat, 8 hare, 9 squirrel, 10 wild cat, 11 centipede).
   */
  look: string;
  /**
   * Where they stand: x −6…6 (left → right), y −3…3 (back → front), in steps
   * of 24 map units around the stage centre. Snapped onto walkable ground.
   */
  at: StagePoint;
  facing?: "left" | "right";
  /** Colour multiplied over the sprite, "#rrggbb" (a robe colour, a ghostly blue). */
  tint?: string;
  /** 1 = normal; 1.2 for a towering figure, 0.8 for a child. */
  size?: number;
  /** Off stage until an "enter" beat. */
  hidden?: boolean;
}

/**
 * One beat of a film, played in order. Lines ("say", "think", "narrate",
 * "title") wait for a tap (or the auto timer); "move" waits for the walk
 * unless marked "with" (then the next beat starts at once).
 */
export type CutsceneBeat =
  | readonly ["say", actor: string, text: string]
  | readonly ["think", actor: string, text: string]
  | readonly ["narrate", text: string]
  | readonly ["title", text: string, sub?: string]
  | readonly ["move", actor: string, to: StagePoint, how?: "walk" | "run" | "with" | "run-with"]
  | readonly ["face", actor: string, side: "left" | "right"]
  | readonly ["act", actor: string, motion: CutsceneMotion]
  | readonly ["fx", fx: CutsceneFx, actor?: string]
  | readonly ["enter", actor: string, at?: StagePoint]
  | readonly ["exit", actor: string]
  | readonly ["camera", target: string, zoom?: number]
  | readonly ["wait", ms: number]
  | readonly ["fade", dir: "out" | "in"]
  | readonly ["mood", mood: CutsceneMood];

export interface CutsceneSpec {
  /** Location whose painted map is the stage. */
  stage: string;
  /** Centre the stage on this NPC's spot on that map (default: the map's arrival point). */
  around?: string;
  mood?: CutsceneMood;
  /** Opening title card. */
  title?: string;
  subtitle?: string;
  cast: Readonly<Record<string, CastMember>>;
  beats: readonly CutsceneBeat[];
}

/** A compiled film, registered under `id`. */
export interface CutsceneDef extends CutsceneSpec {
  id: string;
  /** The saga it belongs to, for replay in the quest log. */
  arcId?: string;
  /** Short label for the replay list. */
  label: string;
}

// ─── Story sagas ──────────────────────────────────────────────────────

export type StoryStep =
  /** Go to a place and play a scene there (a 🔍 spot on its map). */
  | { t: "visit"; locationId: string; label: string; hint: string; scene: StoryBeat }
  /** Talk to someone (an action on their card) at the place they stand. */
  | { t: "talk"; npcId: string; locationId: string; label: string; hint: string; scene: StoryBeat }
  /**
   * A scripted fight at a place: `before` → battle → (win) `after`. Losing
   * is never fatal; the spot stays open to try again.
   */
  | { t: "duel"; locationId: string; label: string; hint: string; opponentId: string; before: StoryBeat; after: StoryBeat }
  /** Beat foes met on the road (counts kills since the chapter was taken). */
  | { t: "hunt"; opponentId: string; count: number; hint: string }
  /** Bring items (handed over at the end of the chapter). */
  | { t: "gather"; itemId: string; count: number; hint: string }
  /** Grow a trait (ความดี, ความถ่อมตน …). */
  | { t: "trait"; trait: TraitKey; min: number; hint: string }
  /** Grow a stat (gearless, as the profile shows). */
  | { t: "stat"; stat: StatKey; min: number; hint: string };

export interface StoryChapterSpec {
  title: string;
  /** Quest-log description: what this chapter is about. */
  summary: string;
  /** Who offers the chapter and takes the hand-in. */
  giver: string;
  /** Extra gate for this chapter, on top of finishing the one before. */
  require?: Condition;
  /** Briefing after accepting (often with a cutscene). */
  offer: StoryBeat;
  /** 1–3 things to do. */
  steps: readonly StoryStep[];
  /** Hand-in at the giver. */
  complete: StoryBeat;
  /** Small rewards (gold ≤ 300, wExp ≤ 250, items, traits, relationship). */
  reward: readonly QuestReward[];
}

/** A new foe a saga needs (a named villain for its climax). */
export interface StoryOpponentSpec {
  id: string;
  name: string;
  ti: 0 | 1 | 2 | 3 | 4;
  category?: "human" | "beast" | "supernatural";
  look?: { sheet?: string; frame?: number; tint?: number; size?: number; npc?: string };
  stats?: Partial<Record<StatKey, number>>;
  skillIds: readonly string[];
  artId?: string;
  artLevel?: number;
}

export interface StoryArcSpec {
  /** Snake case; chapter quests become `st_<id>_<nn>`. */
  id: string;
  title: string;
  /** One-line hook for the quest log. */
  tagline: string;
  /** Sect label as on the skill / art (`sc`). */
  sc: string;
  sectId?: SectId;
  reward: { kind: "skill" | "art"; id: string; level?: number };
  /** Gate for chapter 1 (rank, stats …). The compiler adds "not learned yet". */
  require: Condition;
  chapters: readonly StoryChapterSpec[];
  opponents?: readonly StoryOpponentSpec[];
}

/** What the quest log shows for a saga. */
export interface StoryArcInfo {
  id: string;
  title: string;
  tagline: string;
  sc: string;
  sectId?: SectId;
  reward: { kind: "skill" | "art"; id: string };
  questIds: readonly string[];
  chapterTitles: readonly string[];
  cutsceneIds: readonly string[];
}

// ─── Lineage quests ───────────────────────────────────────────────────

export interface LineageSpec {
  kind: "skill" | "art";
  /** Skill or art id; its tier sets the difficulty. */
  id: string;
  /** The sect NPC who teaches it. */
  giver: string;
  /** Quest title (default "สืบทอด<name>"). */
  title?: string;
  /** Why this teacher, why now: 2–5 lines. */
  offer: readonly StoryLine[];
  /** The lesson itself: 2–5 lines. */
  complete: readonly StoryLine[];
  /** The foe to prove yourself on (tier-appropriate; picked by tier when omitted). */
  foe?: string;
  /** The item to bring (picked by tier when omitted). */
  item?: string;
  /** An extra gate on top of the tier's (e.g. a prologue trial done). */
  require?: Condition;
}
