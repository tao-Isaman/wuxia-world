// Quest tracking + guidance for every kind of stage, and the regression that
// started it: เครือข่ายสายลับ (qc_jinling_spy_network) had nothing to do in
// ฉางอัน at its "observe" stage. Run: bun scripts/test-quest-guide.ts
import assert from "node:assert/strict";
import { QUESTS } from "../lib/world/data/quests";
import { itemSources } from "../lib/world/quest-guide";
import { SCENES } from "../lib/world/data/scenes";
import { RECIPES } from "../lib/world/data/recipes";
import { TRACK_NONE, activeGuide, getScene, guideForQuest, guideMarkerId, objectiveMarkerId, routeBackTarget, trackedQuestId, type QuestGuide, type RouteScene } from "../lib/world";

const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();
Math.random = () => 0.99;
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
function fresh(quests: Record<string, number>, at = "home_player") {
  store().startNewGame({ newWorld: true, name: "Guide test", gender: "male" } as never);
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

check("on a road: a fight keeps the way back, and the guide turns back for a target behind", () => {
  const road = "route_city_capital__to__city_changan";
  const scene = getScene(road) as RouteScene;
  assert.equal(scene?.kind, "route");
  fresh({}, "city_capital");
  useWorldStore.setState({ currentSceneId: road, lastLocationId: "city_capital",
    roamingFoes: [{ id: "foe_t", opponentId: "thug", locationId: road, x: 400, y: 300 }] });
  store().engageFoe("foe_t");
  assert.equal(store().pendingEncounter?.returnSceneId, road, "the fight returns to the road");
  assert.equal(store().lastLocationId, "city_capital", "the road is not pinned as the last place");
  useWorldStore.setState({ pendingEncounter: null });
  store().walkTick();
  assert.equal(store().lastLocationId, "city_capital", "walk ticks don't pin the road either");
  assert.equal(routeBackTarget(store(), scene), "city_capital");
  // A save from before the fix (the road pinned) still has a way back: the road's origin.
  assert.equal(routeBackTarget({ lastLocationId: road }, scene), "city_capital");
  // A target in the city behind: the arrow is on ย้อนกลับ; one ahead: on the destination.
  const at = (locationId: string) => ({ kind: "npc", action: "", locationId, path: [] }) as unknown as QuestGuide;
  assert.equal(guideMarkerId(store(), at("city_capital")), "back");
  assert.equal(guideMarkerId(store(), at("city_changan")), "destination-0");
  useWorldStore.setState({ lastLocationId: road });
  assert.equal(guideMarkerId(store(), at("city_capital")), "back", "also from a pinned save");
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

check("every item a quest stage waits for can be bought, gathered or looted (or crafted / handed over; else the stage needs 🔍 spots)", () => {
  const hasItemIn = (c: unknown): string[] => {
    const x = c as { t?: string; itemId?: string; all?: unknown[]; any?: unknown[] } | undefined;
    if (!x) return [];
    if (x.t === "hasItem" && x.itemId) return [x.itemId];
    return [...(x.all ?? []), ...(x.any ?? [])].flatMap(hasItemIn);
  };
  // Letters and tokens someone hands over in a conversation count as sourced.
  const handedOver = new Set(SCENES.flatMap((scene) => JSON.stringify(scene).match(/"t":"giveItem","itemId":"[a-z0-9_]+"/g) ?? [])
    .map((m) => m.split('"itemId":"')[1].slice(0, -1)));
  for (const recipe of RECIPES) handedOver.add(recipe.output.itemId); // crafted
  const sourceless: string[] = [];
  for (const quest of QUESTS) quest.stages.forEach((stage, index) => {
    if (stage.objective) return;
    for (const itemId of hasItemIn(stage.autoAdvance)) if (!itemSources(itemId).length && !handedOver.has(itemId)) sourceless.push(`${quest.id}#${index} ${itemId}`);
  });
  assert.deepEqual(sourceless, [], "items with no world source");
});

check("แผ่นตำราหายของปรมาจารย์: the pages are three 🔍 spots on เกาะดอกท้อ, and the guide leads there", () => {
  fresh({ qw_taohua_codex_fragments: 0 }, "isle_taohua");
  const guide = guideForQuest(store(), "qw_taohua_codex_fragments")!;
  assert.equal(guide.locationId, "isle_taohua");
  assert.equal(guide.progress?.required, 3);
  for (let i = 0; i < 3; i++) assert.ok(store().doQuestObjective("qw_taohua_codex_fragments", i).ok, `spot ${i}`);
  assert.equal(store().quests.qw_taohua_codex_fragments.stage, 1, "on to the hand-in");
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
