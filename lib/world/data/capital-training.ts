import type { OpponentDef, Scene } from "../types";

export const CAPITAL_TRAINING_OPPONENT_ID = "training_capital_apprentice";
export const CAPITAL_TRAINING_SCENE_ID = "capital_training_duel";
export const CAPITAL_TRAINING_RETURN_ID = "capital_training_return";
export const CAPITAL_TRAINING_NAME = "ศิษย์ฝึกหัดอาเฉิง";

/** A fixed novice, deliberately independent of random-encounter scaling. */
export const CAPITAL_TRAINING_OPPONENT: OpponentDef = {
  id: CAPITAL_TRAINING_OPPONENT_ID,
  name: CAPITAL_TRAINING_NAME,
  ti: 0,
  category: "human",
  drops: [],
  build: () => ({
    name: CAPITAL_TRAINING_NAME,
    stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
    artId: "none", artLevel: 1,
    skillIds: ["basic_punch", ...Array<null>(9).fill(null)],
    learnedSkillIds: ["basic_punch"],
    learnedArtIds: [],
    equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
  }),
};

export const CAPITAL_TRAINING_SCENES: readonly Scene[] = [
  {
    id: CAPITAL_TRAINING_SCENE_ID,
    kind: "dialog",
    lines: [],
    onEnter: [{
      t: "triggerBattle", opponentId: CAPITAL_TRAINING_OPPONENT_ID,
      onWin: CAPITAL_TRAINING_RETURN_ID, onLose: CAPITAL_TRAINING_RETURN_ID,
      nonFatal: true,
    }],
  },
  {
    id: CAPITAL_TRAINING_RETURN_ID,
    kind: "dialog",
    lines: [],
    // We stayed inside the hall. Return without rolling the city's travel
    // encounter hook, especially after a nonfatal loss at one HP.
    onEnter: [{ t: "goto", sceneId: "city_capital" }],
  },
];
