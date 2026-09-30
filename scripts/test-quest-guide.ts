// Quest tracking + guidance for every kind of stage, and the regression that
// started it: เครือข่ายสายลับ (qc_jinling_spy_network) had nothing to do in
// ฉางอัน at its "observe" stage. Run: bun scripts/test-quest-guide.ts
import assert from "node:assert/strict";
import { QUESTS } from "../lib/world/data/quests";
import { TRACK_NONE, activeGuide, guideForQuest, guideMarkerId, objectiveMarkerId, trackedQuestId, type QuestGuide } from "../lib/world";

const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();
Math.random = () => 0.99;
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
function fresh(quests: Record<string, number>, at = "home_player") {
  store().startNewGame({ name: "Guide test", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: at, lastLocationId: at,
    quests: Object.fromEntries(Object.entries(quests).map(([id, stage]) => [id, { id, status: "active" as const, stage }])) });
}

check("spy network: the observe stage points to ฉางอัน and a spot there advances it", () => {
  fresh({ qc_jinling_spy_network: 1 }, "city_jinling");
  let guide = guideForQuest(store(), "qc_jinling_spy_network")!;
  assert.equal(guide.kind, "objective");
  assert.equal(guide.locationId, "city_changan");
  assert.ok(guide.path.length > 1, "a route from จินหลิง");
  assert.equal(guideMarkerId(store(), guide), `route_city_jinling__to__${guide.path[1]}`);
  useWorldStore.setState({ currentSceneId: "city_changan", lastLocationId: "city_changan" });
  guide = guideForQuest(store(), "qc_jinling_spy_network")!;
  assert.equal(guideMarkerId(store(), guide), objectiveMarkerId("qc_jinling_spy_network", 0));
  const before = store().time + store().day * 12;
  const result = store().doQuestObjective("qc_jinling_spy_network", 0);
  assert.ok(result.ok && result.advanced);
  assert.equal(store().quests.qc_jinling_spy_network.stage, 2);
  assert.ok(store().time + store().day * 12 > before, "observing takes time");
  guide = guideForQuest(store(), "qc_jinling_spy_network")!;
  assert.equal(guide.kind, "npc");
  assert.equal(guide.npcId, "city_jinling_strategist_kong");
  assert.equal(guide.locationId, "city_jinling");
});

check("objective spots refuse to work from elsewhere", () => {
  fresh({ qc_jinling_spy_network: 1 }, "city_jinling");
  const result = store().doQuestObjective("qc_jinling_spy_network", 0);
  assert.equal(result.ok, false);
  assert.equal(store().quests.qc_jinling_spy_network.stage, 1);
});

check("multi-spot objectives count up (3 places for the beggars' spy report)", () => {
  fresh({ qst_beggars_spy_report: 0 }, "city_capital");
  assert.deepEqual(guideForQuest(store(), "qst_beggars_spy_report")!.progress, { current: 0, required: 3 });
  store().doQuestObjective("qst_beggars_spy_report", 0);
  const guide = guideForQuest(store(), "qst_beggars_spy_report")!;
  assert.deepEqual(guide.progress, { current: 1, required: 3 });
  assert.notEqual(guide.locationId, "city_capital", "the next spot is in another city");
  assert.equal(store().quests.qst_beggars_spy_report.stage, 0);
});

check("item stages point to a place that has the item, with a counter", () => {
  fresh({ qc_xixia_iron_supply: 0 }, "city_xixia");
  const guide = guideForQuest(store(), "qc_xixia_iron_supply")!;
  assert.ok(["shop", "gather", "hunt", "wander"].includes(guide.kind), guide.kind);
  assert.ok(guide.locationId);
  assert.equal(guide.progress?.current, 0);
});

check("kill stages point to where the foe roams or is hunted", () => {
  const quest = QUESTS.find((q) => q.stages[0].autoAdvance?.t === "defeatedOpponent")!;
  fresh({ [quest.id]: 0 }, "city_capital");
  const guide = guideForQuest(store(), quest.id)!;
  assert.ok(guide.kind === "hunt" || guide.kind === "wander", `${quest.id}: ${guide.kind}`);
  assert.ok(guide.locationId);
});

check("tracking: newest by default, the chosen one when pinned, nothing when cleared", () => {
  fresh({ qc_jinling_spy_network: 1, qc_xixia_iron_supply: 0 });
  assert.equal(trackedQuestId(store()), "qc_xixia_iron_supply");
  store()._setFlag("trackedQuestId", "qc_jinling_spy_network");
  assert.equal(activeGuide(store())?.questId, "qc_jinling_spy_network");
  store()._setFlag("trackedQuestId", TRACK_NONE);
  assert.equal(activeGuide(store()), null);
});

check("every active stage of every quest has something to show, most with a place to go", () => {
  const withoutPlace: string[] = [];
  let stages = 0;
  for (const quest of QUESTS) {
    quest.stages.forEach((_, index) => {
      fresh({ [quest.id]: index }, "city_capital");
      const guide: QuestGuide | null = guideForQuest(store(), quest.id);
      assert.ok(guide?.action, `${quest.id} stage ${index}: an action`);
      stages++;
      if (!guide.locationId) withoutPlace.push(`${quest.id}#${index}`);
    });
  }
  console.log(`  ${stages - withoutPlace.length}/${stages} stages point somewhere`);
  if (process.env.GUIDE_DEBUG) console.log(withoutPlace.join("\n"));
  assert.ok(withoutPlace.length / stages < 0.1, `too many stages without a place: ${withoutPlace.slice(0, 20).join(", ")}`);
});

console.log(`quest guide: ${checks} checks passed`);
