// Type system for the world / story layer.
// Discriminator field is `t` to match the existing engine convention
// (lib/game/types.ts uses `t` on SelfEffect / EnemyEffect / ArtPassiveEffect).

import type { CharacterBuild } from "@/lib/game";

// ─── Scenes ────────────────────────────────────────────────────────────
// Three scene kinds, discriminated on `kind`:
//   "dialog"   — narration + dialogue lines + optional choices (scripted beat)
//   "location" — persistent place: description + NPC list + outbound routes
//   "route"    — travel screen: description + destination list + back option
//
// All share `id` and an optional `onEnter` effect array. Use `goto` and the
// existing `Condition` machinery to navigate / gate items in any kind.

export type SceneLine =
  | { t: "narration"; text: string }
  | { t: "dialogue"; speaker: string; text: string };

export type Scene = DialogScene | LocationScene | RouteScene;

export interface DialogScene {
  kind: "dialog";
  id: string;
  // Lines render in order before choices/next/close appear.
  lines: SceneLine[];
  // After lines, the renderer picks one of:
  //   - `choices` (if any visible) → wait for click
  //   - `next` → auto-advance
  //   - neither → terminal dialog: render a "ปิด" button that calls
  //     `exitToLocation` (returns to the most recently visited location).
  choices?: Choice[];
  next?: string;
  onEnter?: SceneEffect[];
}

export interface LocationScene {
  kind: "location";
  id: string;
  name: string;             // location title shown at top
  description: string;      // long-form arrival narration
  npcs: NpcRef[];           // talk-to-NPC links (each opens a dialog scene)
  routes: RouteRef[];       // outbound paths (each opens a route scene)
  onEnter?: SceneEffect[];
}

export interface RouteScene {
  kind: "route";
  id: string;
  label: string;            // displayed name e.g. "ทางเหนือ"
  description?: string;     // optional travel-narration text
  destinations: RouteDestination[];
  // Where the back button sends the player. Defaults to lastLocationId
  // (the location they came from). Set explicitly only if you want a
  // different fallback.
  back?: string;
  onEnter?: SceneEffect[];
}

export interface Choice {
  text: string;
  visibleIf?: Condition;
  effects?: SceneEffect[];
  next: string;             // sceneId to go to (unless triggerBattle suspends)
}

export interface NpcRef {
  id: string;               // for keys + visibility debugging
  name: string;
  hint?: string;            // short text shown next to name
  dialogSceneId: string;    // a scene with kind === "dialog"
  visibleIf?: Condition;
}

export interface RouteRef {
  routeSceneId: string;     // a scene with kind === "route"
  label: string;
  hint?: string;
  visibleIf?: Condition;
}

export interface RouteDestination {
  locationId: string;       // a scene with kind === "location"
  label: string;
  hint?: string;
  visibleIf?: Condition;
  // Effects applied when the player picks this destination (e.g., gold cost,
  // setFlag for "first visit", advanceQuest on arrival).
  effects?: SceneEffect[];
}

// ─── Effects ───────────────────────────────────────────────────────────

export type SceneEffect =
  | { t: "setFlag"; flag: string; value: boolean | number | string }
  | { t: "giveItem"; itemId: string; count?: number }
  | { t: "takeItem"; itemId: string; count?: number }
  | { t: "addGold"; amount: number }
  | { t: "startQuest"; questId: string }
  | { t: "advanceQuest"; questId: string }
  | { t: "finishQuest"; questId: string; success: boolean }
  | { t: "triggerBattle"; opponentId: string; onWin: string; onLose: string }
  | { t: "goto"; sceneId: string }
  | { t: "gotoRandom"; sceneIds: string[] };

// ─── Conditions ────────────────────────────────────────────────────────

export type QuestStatus = "none" | "active" | "done" | "failed";

export type Condition =
  | { t: "flag"; flag: string; equals?: boolean | number | string }
  | { t: "hasItem"; itemId: string; count?: number }
  | { t: "questStatus"; questId: string; status: QuestStatus }
  | { t: "and"; all: Condition[] }
  | { t: "or"; any: Condition[] }
  | { t: "not"; of: Condition };

// ─── Quests ────────────────────────────────────────────────────────────

export interface QuestStage {
  id: string;
  description: string;
}

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  stages: QuestStage[];
}

export interface QuestState {
  id: string;
  status: "active" | "done" | "failed";
  stage: number;
}

// ─── Items ─────────────────────────────────────────────────────────────

export interface ItemDef {
  id: string;
  name: string;
  description: string;
}

// ─── Opponents (for triggerBattle) ─────────────────────────────────────

// Opponents are wrapped in a build factory so future encounters can scale
// off flags / story state without mutating a shared object.
export interface OpponentDef {
  id: string;
  name: string;
  build: () => CharacterBuild;
}

// ─── Live world state (persisted) ──────────────────────────────────────

export interface PendingBattle {
  opponentId: string;
  onWin: string;
  onLose: string;
}

// Snapshot data only — actions are added by the store.
export interface WorldStateData {
  hasGame: boolean;

  // World player. Initialized at startNewGame() with STARTER_BUILD; this is
  // the world's *own* character, completely independent of the /debug
  // setup-tab character A. The world can mutate this (level up, equip, etc.)
  // without touching the dev sandbox.
  playerBuild: CharacterBuild | null;

  // Story state.
  currentSceneId: string;
  // The most recently visited LOCATION scene. Updated whenever gotoScene
  // (or auto-advance) lands on a scene with kind === "location". Powers:
  //   - the "ปิด" button on terminal dialogs (returns here)
  //   - the back button on route scenes (default fallback)
  // null only before the player has visited any location.
  lastLocationId: string | null;
  flags: Record<string, boolean | number | string>;
  quests: Record<string, QuestState>;
  inventory: Record<string, number>;
  gold: number;

  // Battle seam.
  pendingBattle: PendingBattle | null;
}
