// Type system for the world / story layer.
// Discriminator field is `t` to match the existing engine convention
// (lib/game/types.ts uses `t` on SelfEffect / EnemyEffect / ArtPassiveEffect).

import type { CharacterBuild } from "@/lib/game";

// ─── Scenes & dialogue ─────────────────────────────────────────────────

export type SceneLine =
  | { t: "narration"; text: string }
  | { t: "dialogue"; speaker: string; text: string };

export interface Scene {
  id: string;
  // Lines render in order before choices appear.
  lines: SceneLine[];
  // After lines, EITHER show choices OR auto-advance via `next`.
  choices?: Choice[];
  next?: string;
  // Effects applied once when entering this scene.
  onEnter?: SceneEffect[];
}

export interface Choice {
  text: string;
  // Choice is hidden if condition is set and evaluates false.
  visibleIf?: Condition;
  // Effects applied in order when the choice is taken.
  effects?: SceneEffect[];
  // Scene to navigate to after effects (unless an effect is `triggerBattle`,
  // which suspends navigation until the battle resolves).
  next: string;
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
  | { t: "goto"; sceneId: string };

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
  flags: Record<string, boolean | number | string>;
  quests: Record<string, QuestState>;
  inventory: Record<string, number>;
  gold: number;

  // Battle seam.
  pendingBattle: PendingBattle | null;
}
