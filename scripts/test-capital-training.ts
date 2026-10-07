import assert from "node:assert/strict";
import { makeContext, makeInitialState, getNextTurn, decrementCooldowns, resolveSkill } from "../lib/game/battle";
import { activeUnit, manhattan, reachableFor } from "../lib/game/grid";
import { CAPITAL_TRAINING_OPPONENT_ID, CAPITAL_TRAINING_SCENE_ID } from "../lib/world/data/capital-training";
import { getOpponent, setOpponentStatScale } from "../lib/world/data/opponents";
import { FIGHT_EVENTS } from "../lib/world/data/random-events";
import { capitalTrainingStatus, capitalTrainingUpgrade } from "../lib/world/capital-training";
import { clinicPreparation } from "../lib/world/clinic-preparation";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const { useBattleStore } = await import("../store/battle-store");
const { ensureBattleStarted } = await import("../lib/world/battle-bridge");
const originalRandom = Math.random;
Math.random = () => 0.5;

function newTrainee() {
  useWorldStore.getState().startNewGame({ name: "Training test" });
  useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital", gold: 30, wExp: 20,
    inventory: { potion: 1, herb: 3 },
    quests: { qc_capital_clinic_supplies: { id: "qc_capital_clinic_supplies", stage: 1, status: "done" } } });
}

try {
  const opponent = getOpponent(CAPITAL_TRAINING_OPPONENT_ID)!;
  assert.ok(opponent);
  setOpponentStatScale(3);
  assert.deepEqual(Object.values(opponent.build().stats), Array(8).fill(1), "fixed novice never inherits random encounter scaling");
  setOpponentStatScale(1);
  assert.equal(opponent.ti, 0);
  assert.equal(opponent.drops?.length, 0, "no repeatable loot economy");
  assert.ok(FIGHT_EVENTS.every(event => event.opponentId !== opponent.id), "training opponent never spawns on the road");

  newTrainee();
  assert.equal(capitalTrainingStatus(useWorldStore.getState())?.canStart, true);
  assert.equal(capitalTrainingStatus({ ...useWorldStore.getState(), currentHp: 1 })?.canStart, false);
  assert.equal(capitalTrainingStatus({ ...useWorldStore.getState(), currentMp: 1 })?.needsRest, true);
  assert.equal(capitalTrainingStatus({ ...useWorldStore.getState(), stamina: 4 })?.canStart, false);
  useWorldStore.getState().gotoScene(CAPITAL_TRAINING_SCENE_ID);
  const intent = useWorldStore.getState().pendingBattle!;
  assert.equal(intent.nonFatal, true);
  assert.equal(intent.onWin, intent.onLose, "both outcomes return to the hall");
  assert.equal(useWorldStore.getState().gold, 30, "no entry fee");
  const player = useWorldStore.getState().playerBuild!;
  const enemy = opponent.build();
  const ctx = makeContext(player, enemy);
  const duel = makeInitialState(player, enemy);
  // Engine level (battle.ts 1v1): plain punches must win it.
  while (!duel.winner && duel.turn < 30) {
    const side = getNextTurn(duel);
    decrementCooldowns(duel, side);
    resolveSkill(duel, side, 0, "basic_punch", ctx);
  }
  assert.equal(duel.winner, "A", "unmodified starter can win with basic punches alone");
  // Grid battle through the bridge: the player waits for the novice to
  // close in, then steps up and punches first.
  ensureBattleStarted();
  const store = useBattleStore.getState;
  for (let i = 0; i < 200 && store().state!.phase !== "over"; i++) {
    store().stepAll();
    const s = store().state!;
    if (s.phase === "over") break;
    const me = activeUnit(s)!;
    let done = false;
    for (const path of reachableFor(s, me.id).values()) {
      const cell = path[path.length - 1];
      const foe = s.units.find((u) => u.alive && u.team === "enemy" && manhattan(u.pos, cell) === 1);
      if (!foe) continue;
      if (cell.x !== me.pos.x || cell.y !== me.pos.y) assert.equal(store().move(cell), true);
      assert.equal(store().act(0, foe.pos), true);
      done = true;
      break;
    }
    if (!done) assert.equal(store().wait(), true);
  }
  const battle = store().state!;
  assert.equal(battle.winner, "A", "starter wins the grid duel with basic punches alone");
  assert.ok(battle.hA > 0);
  useWorldStore.getState().acknowledgeBattleResult();
  const won = useWorldStore.getState();
  assert.equal(won.currentSceneId, "city_capital");
  assert.equal(won.pendingEncounter, null, "hall return cannot trigger a travel encounter");
  assert.equal(won.pendingBattle, null);
  assert.equal(won.gameOver, false);
  assert.equal(won.gold, 30);
  assert.deepEqual(won.inventory, { potion: 1, herb: 3 });
  assert.equal(won.wExp, 60, "only ordinary battle W-EXP is awarded (a T0 person: 40)");
  assert.equal(won.defeatedCounts[opponent.id], 1);
  assert.equal(capitalTrainingStatus(won)?.canStart, false, "hall closes the beginner duel after a victory");
  const upgrade = capitalTrainingUpgrade(won)!;
  assert.ok(upgrade, "actual starter battle leaves an affordable upgrade");
  assert.match(clinicPreparation(won)!.action, /เลื่อนระดับ \(ใช้ประสบการณ์ยุทธ/);
  const result = won.levelUpSkillFromWExp(upgrade.skill.id);
  assert.equal(result.ok, true);
  assert.equal(useWorldStore.getState().skillLevel.basic_punch, upgrade.level + 1);
  assert.equal(useWorldStore.getState().wExp, 60 - upgrade.cost);
  assert.equal(clinicPreparation(useWorldStore.getState()), null, "one real upgrade ends the optional guidance");
  useWorldStore.getState().acknowledgeBattleResult();
  assert.equal(useWorldStore.getState().wExp, 60 - upgrade.cost, "acknowledging twice never repeats rewards");
  console.log(`PASS fixed novice duel: waiting, then punching first wins the grid duel in ${battle.turn} turns at ${battle.hA} HP; ${battle.skillUses.A.basic_punch} punches; upgrade costs ${upgrade.cost} W-EXP`);

  newTrainee();
  useWorldStore.getState().gotoScene(CAPITAL_TRAINING_SCENE_ID);
  ensureBattleStarted();
  useBattleStore.setState({ state: { ...useBattleStore.getState().state!, hA: 0, mpA: 0, winner: "B", phase: "over" } });
  useWorldStore.getState().acknowledgeBattleResult();
  const lost = useWorldStore.getState();
  assert.equal(lost.currentSceneId, "city_capital");
  assert.equal(lost.currentHp, 1);
  assert.equal(lost.pendingEncounter, null);
  assert.equal(lost.pendingBattle, null);
  assert.equal(lost.gameOver, false);
  assert.equal(lost.gold, 30);
  assert.equal(lost.wExp, 20);
  assert.equal(capitalTrainingStatus(lost)?.canStart, false);
  // The hall rest action remains usable even if the separate stamina pool is full.
  useWorldStore.setState({ stamina: useWorldStore.getState().staminaMax });
  for (let i = 0; i < 4; i++) assert.equal(useWorldStore.getState().rest("route").ok, true);
  assert.equal(capitalTrainingStatus(useWorldStore.getState())?.needsRest, false);
  assert.equal(capitalTrainingStatus(useWorldStore.getState())?.canStart, true);
  assert.equal(useWorldStore.getState().gold, 30);
  console.log("PASS nonfatal loss returns safely at 1 HP; free ordinary rest heals at full stamina and allows another attempt");
} finally {
  Math.random = originalRandom;
  setOpponentStatScale(1);
  useBattleStore.getState().reset();
}
