// Golden replay: a seeded, scripted run through (nearly) every world-store
// action, printing each result and a hash of the whole store (and the save)
// after it, then hashes of the read models (who stands where, who holds which
// quests, the quest guide). Run it before and after a refactor that should
// not change behaviour; the outputs must be identical:
//
//   bun scripts/golden-replay.ts > before.txt   (on the base commit)
//   bun scripts/golden-replay.ts > after.txt    (with the change); cmp before.txt after.txt
//
// Math.random and Date.now are replaced with seeded stand-ins, so a run is
// deterministic. A change that is meant to alter behaviour changes the output.
import { createHash } from "node:crypto";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k) } });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
console.warn = () => {};
let seed = 12345;
Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
let clock = 1_700_000_000_000;
Date.now = () => (clock += 1000);

const { useWorldStore } = await import("../store/world-store");
const { useBattleStore } = await import("../store/battle-store");
const { ensureBattleStarted } = await import("../lib/world/battle-bridge");
const { QUESTS } = await import("../lib/world/data/quests");
const { SHOPS } = await import("../lib/world/data/shops");
const { RESOURCES } = await import("../lib/world/data/resources");
const { RECIPES } = await import("../lib/world/data/recipes");
const { getNpcsAtLocation } = await import("../lib/world/data/npcs");
const { ITEMS } = await import("../lib/world/data/items");
const { getScene } = await import("../lib/world/data/scenes");
const { EQUIPMENT } = await import("../lib/game");
const { namedNpcIds } = await import("../lib/world/data/named-npcs");

const st = () => useWorldStore.getState();
const out: string[] = [];
function data() {
  const s = st() as unknown as Record<string, unknown>;
  const o: Record<string, unknown> = {};
  for (const k of Object.keys(s).sort()) if (typeof s[k] !== "function") o[k] = s[k];
  return o;
}
function hash(): string { return createHash("sha1").update(JSON.stringify(data())).digest("hex").slice(0, 12); }
function step(name: string, fn: () => unknown) {
  let r: unknown;
  try { r = fn(); } catch (e) { r = "THROW " + (e as Error).message; }
  out.push(`${name.padEnd(40)} ${JSON.stringify(r) ?? "-"} ${hash()} save=${createHash("sha1").update(memory.get("wusia-world-v1") ?? "").digest("hex").slice(0, 8)}`);
}
function battle(winner: "A" | "B" | "escape") {
  step("ensureBattleStarted", () => { ensureBattleStarted(); return !!useBattleStore.getState().state; });
  const b = useBattleStore.getState().state;
  if (b) {
    useBattleStore.setState({ state: { ...b, winner: winner === "escape" ? null : winner, escaped: winner === "escape", phase: "over",
      skillUses: { A: { basic_punch: 4 } }, artUses: { A: {} }, hitsReceived: { A: 3 }, hA: 20, mpA: 5 } as never });
  }
  step("victorySpoils", () => st().victorySpoils());
  step(`acknowledgeBattleResult(${winner})`, () => st().acknowledgeBattleResult());
}

step("resetGame", () => st().resetGame());
step("startNewGame", () => st().startNewGame({ newWorld: true, name: "Golden", gender: "female" } as never));
step("_giveGold", () => st()._giveGold(50000));
step("_setFlag", () => st()._setFlag("golden", 1));
// Quests
let accepted = 0;
for (const def of QUESTS) {
  if (accepted >= 30) break;
  if (def.sectId || def.prereqs) continue;
  const r = st().acceptQuest(def.id);
  if (r.ok) { accepted++; out.push(`accept ${def.id}`); }
}
step("hash after accepts", () => accepted);
const firstActive = Object.values(st().quests).find((q) => q.status === "active")?.id ?? "";
step("finishQuestNow", () => st().finishQuestNow(firstActive));
const secondActive = Object.values(st().quests).filter((q) => q.status === "active")[1]?.id ?? "";
step("abandonQuest", () => st().abandonQuest(secondActive));
step("doQuestObjective", () => st().doQuestObjective(firstActive, 0));
// Travel
step("gotoScene home_player", () => st().gotoScene("home_player"));
const home = getScene("home_player");
const route = home?.kind === "location" ? home.routes[0]?.routeSceneId : undefined;
step("canTravelTo route", () => route && st().canTravelTo(route));
step("gotoScene route", () => route && st().gotoScene(route));
const rs = route ? getScene(route) : null;
step("travelRoute", () => rs?.kind === "route" && st().travelRoute(rs.destinations.find((d) => d.locationId !== "home_player")?.locationId ?? ""));
step("exitToLocation", () => st().exitToLocation());
for (const kind of ["home", "sect", "inn", "temple", "route"] as const) step(`rest ${kind}`, () => st().rest(kind));
step("gotoScene city_capital", () => st().gotoScene("city_capital"));
step("stationTravel", () => st().stationTravel("village_start"));
step("gotoScene city_capital", () => st().gotoScene("city_capital"));
// Shops and items
const shop = SHOPS.find((s) => s.locationId === "city_capital") ?? SHOPS[0];
for (const itemId of shop.inventory.slice(0, 6)) step(`buyItem ${itemId}`, () => st().buyItem(itemId, 2));
step("sellItem", () => st().sellItem(shop.inventory[0], 1, 0.5));
for (const item of ITEMS.filter((i) => i.use).slice(0, 8)) {
  step(`give ${item.id}`, () => useWorldStore.setState({ inventory: { ...st().inventory, [item.id]: 2 } }));
  step(`useItem ${item.id}`, () => st().useItem(item.id));
}
step("buyMoveSkill", () => st().buyMoveSkill("sl_luohan_fist", 100));
step("buyInnerSkill", () => st().buyInnerSkill("none", 100));
const recipe = RECIPES[0];
step("buyRecipe", () => st().buyRecipe(recipe.id, 100));
step("craftRecipe", () => st().craftRecipe(recipe.id));
step("buyEquipment", () => st().buyEquipment(EQUIPMENT[0].id, 100));
step("equipFromBag", () => st().equipFromBag(EQUIPMENT[0].id));
step("unequipFromSlot", () => st().unequipFromSlot("W"));
step("equipSlot", () => st().equipSlot(1, "basic_punch"));
step("levelUpSkillFromWExp", () => { useWorldStore.setState({ wExp: 5000 }); return st().levelUpSkillFromWExp("basic_punch"); });
step("levelUpArtFromWExp", () => st().levelUpArtFromWExp(st().playerBuild?.learnedArtIds?.[0] ?? "none"));
step("practiceSkill", () => { useWorldStore.setState({ currentSceneId: "sect_shaolin", stamina: 100 }); return st().practiceSkill("basic_punch"); });
step("practiceMusic", () => st().practiceMusic());
step("openMeridianNode", () => st().openMeridianNode("x", 0));
step("forgetSkill", () => st().forgetSkill("sl_luohan_fist"));
step("forgetArt", () => st().forgetArt("none"));
// Gathering
for (const res of RESOURCES.slice(0, 6)) {
  step(`gatherResource ${res.id}`, () => { useWorldStore.setState({ stamina: 100 }); return st().gatherResource(res.id); });
  if (st().pendingBattle) battle("A");
}
// Sects
step("joinSect", () => st().joinSect("shaolin" as never));
step("upgradeSectRank", () => { const m = st().sectMembership.shaolin; if (m) useWorldStore.setState({ sectMembership: { ...st().sectMembership, shaolin: { ...m, points: 9999 } } }); return st().upgradeSectRank("shaolin" as never); });
step("acceptSectQuest", () => { const q = QUESTS.find((d) => d.sectId === "shaolin"); return q && st().acceptSectQuest("shaolin" as never, q.id); });
// NPCs
useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital", stamina: 100 });
const npcs = getNpcsAtLocation("city_capital");
for (const npc of npcs.slice(0, 3)) {
  step(`meetNpc ${npc.id}`, () => st().meetNpc(npc.id));
  step(`giveGift ${npc.id}`, () => st().giveGift(npc.id, { gold: 100 }));
}
step("startSparWith", () => st().startSparWith(npcs[0].id));
if (st().pendingBattle) battle("A");
step("startSparWith 2", () => st().startSparWith(npcs[1].id));
if (st().pendingBattle) battle("B");
step("attemptSteal", () => st().attemptSteal(npcs[2].id));
if (st().pendingBattle) battle("escape");
step("attemptAssassinate", () => st().attemptAssassinate(npcs[0].id));
if (st().pendingBattle) battle("B");
step("attemptKidnap", () => st().attemptKidnap(npcs[1].id));
if (st().pendingBattle) battle("A");
const named = namedNpcIds();
step("startKillDuel", () => { const id = named[3]; const loc = st().npcExt[id]?.currentLocation; if (loc) useWorldStore.setState({ currentSceneId: loc }); return st().startKillDuel(id); });
if (st().pendingBattle) battle("A");
// Law
step("surrender", () => st().surrender());
for (const a of ["jail_labor", "jail_dice", "jail_meditate", "jail_escape"]) step(`doActivity ${a}`, () => { useWorldStore.setState({ stamina: 100 }); return st().doActivity(a); });
if (st().pendingBattle) battle("A");
step("surrender again", () => { useWorldStore.setState({ wanted: 4, jailUntil: null, currentSceneId: "city_capital" }); return st().surrender(); });
step("serveSentence", () => st().serveSentence());
step("doActivity jail_gate", () => { useWorldStore.setState({ jailUntil: 1 }); return st().doActivity("jail_gate"); });
// Walking and encounters
useWorldStore.setState({ currentSceneId: "city_capital", jailUntil: null, wanted: 3 });
for (let i = 0; i < 12; i++) {
  step(`walkTick ${i}`, () => st().walkTick(() => ({ x: 40, y: 50 })));
  if (st().pendingEncounter) {
    if (i % 2) step("fleeEncounter", () => st().fleeEncounter());
    else { step("acceptEncounter", () => st().acceptEncounter()); if (st().pendingBattle) battle(i % 4 ? "A" : "B"); }
  }
  if (st().pendingBattle) battle("A");
  const foe = st().roamingFoes[0];
  if (foe && i % 3 === 0) { step("engageFoe", () => st().engageFoe(foe.id)); if (st().pendingEncounter) { step("acceptEncounter", () => st().acceptEncounter()); battle("A"); } }
}
step("dismissDeath", () => st().dismissDeath());
step("clearPendingBattle", () => st().clearPendingBattle());
// Time: a year and a half of rests (liveness, letters, tournament)
useWorldStore.setState({ currentSceneId: "home_player", lastLocationId: "home_player", jailUntil: null });
for (let i = 0; i < 600; i++) {
  st().rest("home");
  if (i % 50 === 0) out.push(`rest#${i} ${hash()}`);
}
step("letters", () => st().letters.length);
const letter = st().letters[0];
step("openLetter", () => letter && st().openLetter(letter.id));
step("deleteLetters", () => st().deleteLetters(st().letters.slice(0, 3).map((l) => l.id)));
step("recordRumorHeard", () => { const r = st().rumorPool[0]; return r && st().recordRumorHeard(r.id); });
// Tournament
step("registerTournament", () => { for (let d = 361; d < 720; d++) { useWorldStore.setState({ day: d, currentSceneId: "sect_huashan", gold: 5000 }); if (st().registerTournament()) return d; } return false; });
step("fightTournamentBout", () => { const d0 = st().day; for (let d = d0; d < d0 + 60; d++) { useWorldStore.setState({ day: d }); if (st().fightTournamentBout()) return d; } return false; });
if (st().pendingBattle) battle("A");
step("fightTournamentBout 2", () => st().fightTournamentBout());
if (st().pendingBattle) battle("B");
step("pickTournamentPrize", () => st().pickTournamentPrize("x"));
// Dialog choices
step("gotoScene dialog", () => st().gotoScene(npcs[0].dialogSceneId ?? ""));
step("makeChoice 0", () => st().makeChoice(0));
step("persisted keys", () => Object.keys(JSON.parse(memory.get("wusia-world-v1") ?? "{}").state ?? {}).length);
// Rehydrate from the save
step("rehydrate", () => { const raw = memory.get("wusia-world-v1")!; useWorldStore.persist.rehydrate(); return raw.length; });
console.log(out.join("\n"));
// Read models: who stands where, who holds which quests, the guide for every active quest.
{
  const world = await import("../lib/world");
  const life = await import("../lib/world/npc-life");
  const { NPCS } = await import("../lib/world/data/npcs");
  const { SCENES } = await import("../lib/world/data/scenes");
  const { getQuestsForNpc, getQuestsForSect } = await import("../lib/world/data/quests");
  const guide = await import("../lib/world/quest-guide");
  const h = (v: unknown) => createHash("sha1").update(JSON.stringify(v)).digest("hex").slice(0, 12);
  const s = st();
  console.log("questsForNpc", h(NPCS.map((n) => getQuestsForNpc(n.id).map((q) => q.id))));
  console.log("questsForSect", h(["shaolin", "wudang", "emei", "huashan", "gumu", "nope"].map((id) => getQuestsForSect(id).map((q) => q.id))));
  const locs = SCENES.filter((x) => x.kind === "location").map((x) => x.id);
  console.log("npcsAtLocation", h(locs.map((id) => getNpcsAtLocation(id).map((n) => n.id))));
  console.log("npcsAt", h(locs.map((id) => life.npcsAt(s, id).map((n) => n.id))));
  console.log("heldQuests", h(NPCS.map((n) => life.heldQuests(s, n.id).map((q) => q.id))));
  const fresh = { ...s, quests: { ...s.quests } } as typeof s;
  for (const def of QUESTS.slice(0, 400)) if (!fresh.quests[def.id]) fresh.quests[def.id] = { id: def.id, status: "active", stage: 0 } as never;
  for (const at of ["city_capital", "home_player", "sect_shaolin", locs[40], locs[80]]) {
    const here = { ...fresh, currentSceneId: at, lastLocationId: at } as typeof s;
    const guides = Object.keys(here.quests).map((id) => guide.guideForQuest(here, id));
    console.log("guides@" + at, h(guides), h(guides.map((g) => g && guide.guideMarkerId(here, g))));
  }
  const routeScene = SCENES.find((x) => x.kind === "route")!;
  const onRoad = { ...fresh, currentSceneId: routeScene.id } as typeof s;
  console.log("guides@road", h(Object.keys(onRoad.quests).map((id) => { const g = guide.guideForQuest(onRoad, id); return g && [g, guide.guideMarkerId(onRoad, g)]; })));
  console.log("pathBetween", h(locs.slice(0, 30).map((a) => locs.slice(0, 30).map((b) => guide.pathBetween(a, b)))));
  void world;
}
