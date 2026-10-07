// Micro-benchmarks for the world engine's hot paths: the save write, the
// per-render work of the map view (people here, quest marks, the guide), the
// quest-progress re-tick, walk ticks and rests. Numbers are wall-clock means
// on this machine; compare runs before / after a change on the same box.
//
//   bun scripts/bench-world.ts            # a fresh game and one played for a year
//   bun scripts/bench-world.ts --days 720 # a longer simulated game
import { performance } from "node:perf_hooks";

const memory = new Map<string, string>();
let writes = 0;
let writeMs = 0;
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { writes++; memory.set(key, value); },
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
console.warn = () => {};

const daysArg = process.argv.indexOf("--days");
const DAYS = daysArg > 0 ? Number(process.argv[daysArg + 1]) : 360;

/** A seeded random source (mulberry32) so runs are comparable. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = seeded(42);

const { useWorldStore } = await import("../store/world-store");
const world = await import("../lib/world");
const life = await import("../lib/world/npc-life");
const { QUESTS } = await import("../lib/world/data/quests");
const { getLocationMap } = await import("../lib/world/data/location-maps");
import type { WorldStateData } from "../lib/world/types";

const store = () => useWorldStore.getState();

function bench(name: string, fn: () => void, { minMs = 300, minRuns = 5 } = {}): number {
  fn(); // warm
  let runs = 0;
  const start = performance.now();
  while (runs < minRuns || performance.now() - start < minMs) { fn(); runs++; }
  const mean = (performance.now() - start) / runs;
  console.log(`  ${name.padEnd(52)} ${mean < 1 ? (mean * 1000).toFixed(1) + " µs" : mean.toFixed(3) + " ms"}  (${runs} runs)`);
  return mean;
}

/** What LocationMap computes on every render (the parts that touch the registries). */
function mapViewWork(state: WorldStateData, sceneId: string) {
  const scene = world.getScene(sceneId);
  if (scene?.kind !== "location") return;
  const map = getLocationMap(sceneId);
  const spots = map?.npcSpots ?? {};
  const spotFor = (id: string) => spots[id] ?? life.predecessorsOf(state, id).map((p) => spots[p]).find(Boolean);
  const here = life.npcsAt(state, sceneId).filter((n) => world.npcPresent(state, n.id) && (!n.visibleIf || world.evaluateCondition(state, n.visibleIf)));
  for (const npc of here) {
    spotFor(npc.id);
    const quests = life.heldQuests(state, npc.id);
    void (quests.some((q) => world.isQuestTurnInForNpc(state, q, npc.id)) || world.objectiveSpotsForNpc(state, npc.id).length
      || quests.some((q) => world.isQuestOfferable(state, q)));
  }
  world.objectiveSpotsAt(state, sceneId);
  const guide = world.activeGuide(state);
  if (guide) world.guideMarkerId(state, guide);
}

function acceptSomeQuests(n: number) {
  let taken = 0;
  for (const def of QUESTS) {
    if (taken >= n) break;
    if (def.sectId || def.prereqs) continue;
    const r = store().acceptQuest(def.id);
    if (r.ok) taken++;
  }
  return taken;
}

function report(label: string) {
  const s = store();
  console.log(`\n== ${label}: day ${s.day}, ${Object.keys(s.quests).length} quests in the log, ${Object.keys(s.npcExt).length} simulated people, ${s.rumorPool.length} rumors (+${s.rumorArchive.length} archived)`);
  const raw = memory.get("wusia-world-v1") ?? "";
  console.log(`  save size                                            ${(raw.length / 1024).toFixed(1)} KiB (${raw.length} chars)`);
  const persisted = JSON.parse(raw).state;
  bench("save write (JSON.stringify of the persisted slice)", () => { JSON.stringify({ state: persisted, version: 26 }); });
  const sceneIds = ["city_capital", "village_start", "home_player", "sect_shaolin"].filter((id) => world.getScene(id));
  for (const id of sceneIds) bench(`map view work @ ${id}`, () => mapViewWork(s, id));
  bench("activeGuide", () => { world.activeGuide(s); });
  bench("tickQuestProgress (draft copy)", () => {
    const draft = { ...s, quests: Object.fromEntries(Object.entries(s.quests).map(([id, q]) => [id, { ...q }])) } as WorldStateData;
    world.tickQuestProgress(draft);
  });
  const snapshot = JSON.stringify(persisted);
  const restore = () => useWorldStore.setState(JSON.parse(snapshot));
  bench("store.walkTick (no event)", () => { store().walkTick(); });
  restore();
  bench("store.rest('route') incl. persist write", () => { restore(); store().rest("route"); }, { minMs: 500 });
  restore();
  const w0 = writes, t0 = performance.now();
  for (let i = 0; i < 50; i++) store()._setFlag("bench", i);
  const per = (performance.now() - t0) / 50;
  writeMs = per;
  console.log(`  ${"trivial set (_setFlag) incl. persist write".padEnd(52)} ${per.toFixed(3)} ms  (${writes - w0} writes)`);
  restore();
}

store().resetGame();
store().startNewGame({ name: "Bench", gender: "male" } as never);
useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital" });
console.log(`accepted ${acceptSomeQuests(25)} quests`);
report("new game");

// Live for a while: rest at home day after day (liveness weeks, rumors, letters).
const t = performance.now();
useWorldStore.setState({ currentSceneId: "home_player", lastLocationId: "home_player" });
for (let i = 0; i < DAYS * 3; i++) store().rest("home");
console.log(`\nsimulated ${DAYS} days with ${DAYS * 3} home rests in ${(performance.now() - t).toFixed(0)} ms (${((performance.now() - t) / (DAYS * 3)).toFixed(2)} ms / rest)`);
useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital" });
acceptSomeQuests(25);
report(`after ${DAYS} days`);
void writeMs;
