import assert from "node:assert/strict";
import { clinicPreparation } from "../lib/world/clinic-preparation";
import { CAPITAL_TRAINING_OPPONENT, CAPITAL_TRAINING_OPPONENT_ID } from "../lib/world/data/capital-training";
import { deriveAll } from "../lib/game";

const playerBuild = CAPITAL_TRAINING_OPPONENT.build();
const derived = deriveAll(playerBuild);
const state: Parameters<typeof clinicPreparation>[0] = {
  currentSceneId: "city_capital",
  quests: { qc_capital_clinic_supplies: { id: "qc_capital_clinic_supplies", status: "done", stage: 1 } },
  inventory: { herb: 3 }, gold: 80, wExp: 20,
  playerBuild, skillLevel: {}, skillExp: {},
  currentHp: derived.HP, currentMp: derived.MP, stamina: 60,
  defeatedCounts: {}, pendingBattle: null, gameOver: false,
};
const before = JSON.stringify(state);
const advice = clinicPreparation(state)!;
assert.ok(advice);
assert.equal(advice.nextStep, "จุดหมาย → ตลาดนครหลวง");
assert.match(advice.description, /50 ทอง · มี 80 ทอง · ฟื้น HP ได้สูงสุด 30/);
assert.match(advice.note, /อัปขั้นใช้ 50 W-EXP · มี 20 W-EXP/);
assert.equal(JSON.stringify(state), before, "advice does not mutate the game");
assert.match(clinicPreparation({ ...state, gold: 49 })!.nextStep, /ฝึกประลองฟรี/, "free practice remains accessible without enough gold");
assert.match(clinicPreparation({ ...state, inventory: { herb: 3, potion: 1 } })!.nextStep, /สำนักยุทธิ์ → ฝึกประลองฟรี/, "a prepared hero can try a beginner opponent");
assert.match(clinicPreparation({ ...state, inventory: { potion_mid: 1 } })!.nextStep, /ฝึกประลองฟรี/, "stronger medicine also counts as preparation");
assert.match(clinicPreparation({ ...state, inventory: { potion: 1 }, currentHp: 5 })!.nextStep, /พักริมทาง/, "hurt beginners see free recovery first");
assert.equal(clinicPreparation({ ...state, currentSceneId: "route_city_capital__to__inn_yuelai" }), null, "leaving does not keep prompting");
assert.equal(clinicPreparation({ ...state, quests: { ...state.quests, other: { id: "other", status: "active", stage: 0 } } }), null, "other quests take over");
assert.equal(clinicPreparation({ ...state, quests: { qc_capital_clinic_supplies: { id: "qc_capital_clinic_supplies", status: "active", stage: 1 } } }), null);
assert.match(clinicPreparation({ ...state, skillExp: { basic_punch: 15 } })!.note, /อัปขั้นใช้ 35 W-EXP/, "accounts for skill-specific experience");
const won = { ...state, defeatedCounts: { [CAPITAL_TRAINING_OPPONENT_ID]: 1 }, wExp: 70, skillExp: { basic_punch: 20 } };
assert.match(clinicPreparation(won)!.action, /วิชา → หมัดตรง → เร่งด้วย w-exp \(30\)/);
assert.equal(clinicPreparation({ ...won, skillLevel: { basic_punch: 2 }, skillExp: { basic_punch: 0 }, wExp: 40 }), null, "a real upgrade consumes banked XP and ends the hint");
assert.equal(clinicPreparation({ ...won, wExp: 0 }), null, "never promises an unaffordable upgrade");
console.log("PASS post-clinic preparation: real supply, free beginner duel/recovery, affordable earned upgrade, stop after upgrade/departure/other quest, unchanged state");
