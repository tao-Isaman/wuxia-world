import assert from "node:assert/strict";
import { ITEMS } from "../lib/world/data/items";
import { RECIPES } from "../lib/world/data/recipes";
import { RESOURCES } from "../lib/world/data/resources";
import { getScene as sceneById } from "../lib/world";
import { getLocationMap } from "../lib/world/data/location-maps";
import { WORLD_COORDS } from "../lib/world/data/world-coords";
import { deriveAll } from "../lib/game";
import { applyDeathPenalty, deathLosableItems, describeDeathPenalty, rollDeathPenalty } from "../lib/world/death";
import { stepTowards, clearMapPositions, getMapPosition, rememberMapPosition } from "../lib/stage/types";
import type { RouteScene } from "../lib/world/types";
import { makeContext, makeInitialState, resolveSkill } from "../lib/game/battle";
import { checkWin } from "../lib/game/effects";
import { advanceTestClock, setTestClock, setTestWorldTime } from "../lib/world/clock";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useBattleStore, isPlayerTurn } = await import("../store/battle-store");
const { useWorldStore, REST_COOLDOWN_HOURS } = await import("../store/world-store");
const { SCENES_BY_ID } = await import("../lib/world/data/scenes");

// Stores run in memory here; browser persistence is covered by Playwright.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args);
};
let checks = 0;
import { ARTS } from "../lib/game/data/arts";
import { SKILLS } from "../lib/game/data/skills";
import { passiveLine } from "../lib/game/skill-text";
function check(name: string, run: () => void) { run(); checks++; console.log("PASS " + name); }

check("movement has constant diagonal speed and stops at its destination", () => {
  assert.deepEqual(stepTowards({ x: 0, y: 0 }, { x: 3, y: 4 }, 2.5), { x: 1.5, y: 2 });
  assert.deepEqual(stepTowards({ x: 0, y: 0 }, { x: 3, y: 4 }, 9), { x: 3, y: 4 });
});
check("session map positions clear for a new character", () => {
  rememberMapPosition("test", { x: 40, y: 50 });
  assert.deepEqual(getMapPosition("test", { x: 1, y: 2 }), { x: 40, y: 50 });
  clearMapPositions();
  assert.deepEqual(getMapPosition("test", { x: 1, y: 2 }), { x: 1, y: 2 });
});

useWorldStore.getState().startNewGame({ newWorld: true, name: "Runtime test" });
const build = useWorldStore.getState().playerBuild!;
check("player names remain literal text in attack and victory logs", () => {
  const named = { ...build, name: '<img src=x onerror="alert(1)">' };
  const context = makeContext(named, build);
  const state = makeInitialState(named, build);
  resolveSkill(state, "A", 0, "punch", context);
  state.hB = 0;
  checkWin(state, context.names);
  assert.ok(state.log.some((entry) => entry.txt.includes("&lt;img")));
  assert.ok(state.log.every((entry) => !entry.txt.includes("<img")));
  assert.equal(context.names.A, named.name);
});
check("enemy turns wait for step(), and a reset clears the battle", () => {
  useBattleStore.getState().start(build, { ...build, stats: { ...build.stats, AGI: 40 } });
  assert.equal(useBattleStore.getState().state!.turn, 0, "nothing happens until the renderer steps");
  useBattleStore.getState().step();
  const first = useBattleStore.getState().state!;
  assert.ok(first.activeId !== null || first.events.length > 0, "one step begins the fast enemy's turn");
  useBattleStore.getState().reset();
  assert.equal(useBattleStore.getState().state, null);
});
check("a waiting player turn cannot be skipped by stepping", () => {
  useBattleStore.getState().start({ ...build, stats: { ...build.stats, AGI: 40 } }, build);
  useBattleStore.getState().stepAll();
  const waiting = useBattleStore.getState().state!;
  assert.equal(isPlayerTurn(waiting, false), true);
  for (let i = 0; i < 10; i++) useBattleStore.getState().step();
  assert.equal(useBattleStore.getState().state, waiting);
  useBattleStore.getState().reset();
});

check("death penalty: half the gold, 1–3 losable kinds halved, quest items / scrolls / books kept", () => {
  const inv = { ginseng: 4, rock: 9, potion: 1, jade: 2, old_key: 1, book_basic: 1, man_qf: 1, scroll_skill_basic_punch: 1, chart_x: 1 };
  assert.deepEqual(deathLosableItems(inv), ["ginseng", "jade", "potion", "rock"]);
  for (const r of [0, 0.5, 0.999]) {
    const p = rollDeathPenalty({ gold: 999, inventory: inv }, () => r);
    assert.equal(p.goldLost, 499);
    assert.ok(p.itemsLost.length >= 1 && p.itemsLost.length <= 3);
    for (const { itemId, count } of p.itemsLost) assert.equal(count, Math.ceil(inv[itemId as keyof typeof inv] / 2));
    const state = { gold: 999, inventory: { ...inv } as Record<string, number> };
    applyDeathPenalty(state, p);
    assert.equal(state.gold, 500);
    assert.equal(state.inventory.old_key, 1);
  }
  const broke = rollDeathPenalty({ gold: 0, inventory: { old_key: 1 } });
  assert.deepEqual(broke, { goldLost: 0, itemsLost: [] });
  assert.deepEqual(describeDeathPenalty(broke), ["ไม่มีสิ่งใดติดตัวให้สูญเสีย"]);
});

check("sleeping at home: free, a full restore at once; only at home; then a cooldown", () => {
  setTestWorldTime(40, 3);
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Rest test" });
  useWorldStore.setState({ currentSceneId: "home_player", stamina: 10, currentHp: 5, currentMp: 0, gold: 7 });
  const result = useWorldStore.getState().rest("home");
  assert.ok(result.ok && result.restored > 0);
  const w = useWorldStore.getState();
  const max = deriveAll(w.playerBuild!);
  assert.equal(w.stamina, w.staminaMax);
  assert.equal(w.currentHp, max.HP);
  assert.equal(w.currentMp, max.MP);
  assert.equal(w.gold, 7, "free");
  assert.equal(w.day, 40, "no time passes");
  assert.ok(Math.abs(w.time - 3) < 1e-9, "no time passes");
  // A free rest is ready again REST_COOLDOWN_HOURS ชั่วยาม later; an inn room any time.
  const again = useWorldStore.getState().rest("home");
  assert.ok(!again.ok && again.reason === "cooldown" && Math.abs(again.readyIn - REST_COOLDOWN_HOURS) < 1e-9);
  useWorldStore.setState({ gold: 1000 });
  assert.ok(useWorldStore.getState().rest("inn").ok, "an inn room has no cooldown");
  advanceTestClock(REST_COOLDOWN_HOURS);
  assert.ok(useWorldStore.getState().rest("home").ok, "ready after the cooldown");
  useWorldStore.setState({ currentSceneId: "city_capital" });
  assert.deepEqual(useWorldStore.getState().rest("home"), { ok: false, reason: "place" });
  // An active disciple sleeps free on their own sect's grounds; elsewhere, or once resigned, they can't.
  const member = (status: "active" | "resigned") => ({ wudang: { ...useWorldStore.getState().sectMembership.wudang, sectId: "wudang", rank: 9, points: 0, status } });
  advanceTestClock(REST_COOLDOWN_HOURS);
  useWorldStore.setState({ currentSceneId: "sect_wudang", stamina: 0, sectMembership: member("active") as never });
  const sect = useWorldStore.getState().rest("sect");
  assert.ok(sect.ok && useWorldStore.getState().stamina === useWorldStore.getState().staminaMax);
  useWorldStore.setState({ currentSceneId: "sect_shaolin" });
  assert.deepEqual(useWorldStore.getState().rest("sect"), { ok: false, reason: "place" });
  useWorldStore.setState({ currentSceneId: "sect_wudang", sectMembership: member("resigned") as never });
  assert.deepEqual(useWorldStore.getState().rest("sect"), { ok: false, reason: "place" });
  setTestClock(null);
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Runtime test" });
});

check("food restores stamina (never in a fight); potions heal flat + % of max; poisons are alchemy; every resource has a place", () => {
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Item test" });
  useWorldStore.setState({ stamina: 50, inventory: { spicy_stew: 1, potion: 1, potion_qi: 1 }, currentHp: 10, currentMp: 0 });
  const stew = useWorldStore.getState().useItem("spicy_stew");
  assert.ok(stew.ok);
  assert.equal(useWorldStore.getState().stamina, 80, "ต้มยำ +30 พลัง");
  const max = deriveAll(useWorldStore.getState().playerBuild!);
  const hp0 = useWorldStore.getState().currentHp;
  assert.ok(useWorldStore.getState().useItem("potion").ok);
  assert.equal(useWorldStore.getState().currentHp, Math.min(max.HP, hp0 + Math.round(40 + max.HP * 0.2)));
  assert.ok(useWorldStore.getState().useItem("potion_qi").ok);
  assert.equal(useWorldStore.getState().currentMp, Math.min(max.MP, Math.round(20 + max.MP * 0.35)));
  for (const it of ITEMS) {
    if (it.category === "food") assert.equal(it.battle, undefined, `${it.id}: food is not a battle item`);
    if (it.category === "food" && it.use?.t === "heal") assert.ok((it.use.stamina ?? 0) > 0, `${it.id} restores stamina`);
  }
  for (const id of ["potion", "potion_mid", "potion_big", "potion_qi", "poison_powder", "poison_needle", "poison_vial", "poison_black_centipede", "throw_dart", "throw_knife", "throw_star"])
    assert.ok(ITEMS.find((i) => i.id === id)?.battle, `${id} is usable in battle`);
  for (const r of RECIPES.filter((x) => x.output.itemId.startsWith("poison_"))) assert.equal(r.skill, "alchemy", `${r.id} uses เภสัช`);
  const placed = new Set<string>();
  for (const id of Object.keys(WORLD_COORDS)) {
    if (sceneById(id)?.kind !== "location") continue;
    for (const spot of getLocationMap(id)?.spots ?? []) if (spot.kind === "resource") placed.add(spot.resourceId);
  }
  for (const r of RESOURCES) assert.ok(placed.has(r.id), `${r.id} can be gathered somewhere`);
  const tang = (getLocationMap("sect_tang")?.spots ?? []).filter((x) => x.kind === "resource").map((x) => (x as { resourceId: string }).resourceId);
  assert.ok(tang.includes("venom_viper") && tang.includes("venom_scorpion"), "the Tang clan gathers its own venoms");
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Runtime test" });
});

const route: RouteScene = { id: "__runtime_route", kind: "route", label: "Test route", destinations: [
  { locationId: "__runtime_location", label: "Test destination", effects: [{ t: "addTrait", trait: "good", amount: 7 }, { t: "addGold", amount: 13 }] },
] };
check("non-fatal defeat leaves one HP; a fatal one wakes the hero at home poorer", () => {
  for (const nonFatal of [true, false]) {
    useWorldStore.getState().startNewGame({ newWorld: true, name: "Defeat test" });
    useWorldStore.setState({ gold: 101, inventory: { ginseng: 5, old_key: 1, scroll_skill_basic_punch: 1 },
      pendingBattle: { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal } });
    useBattleStore.getState().start(build, build);
    useBattleStore.setState({ state: { ...useBattleStore.getState().state!, hA: 0, winner: "B", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    const w = useWorldStore.getState();
    assert.equal(w.gameOver, false, "death never ends the game");
    assert.equal(w.pendingBattle, null);
    assert.equal(w.stamina, 95);
    if (nonFatal) {
      assert.equal(w.currentHp, 1);
      assert.equal(w.gold, 101);
      assert.equal(w.lastDeath, null);
    } else {
      assert.equal(w.currentSceneId, "home_player");
      assert.equal(w.gold, 51, "half the gold is gone");
      assert.equal(w.inventory.ginseng, 2, "the one losable stack lost half (rounded up)");
      assert.equal(w.inventory.old_key, 1, "quest items are kept");
      assert.equal(w.inventory.scroll_skill_basic_punch, 1, "move scrolls are kept");
      assert.ok(w.currentHp >= 1, "wakes at home at once");
      assert.ok(w.lastDeath && w.lastDeath.lines.length >= 1);
      useWorldStore.getState().dismissDeath();
      assert.equal(useWorldStore.getState().lastDeath, null);
    }
  }
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Runtime test" });
});
SCENES_BY_ID.set(route.id, route);
SCENES_BY_ID.set("__runtime_location", { id: "__runtime_location", kind: "location", name: "Test", description: "", npcs: [], routes: [] });
check("route effects and travel cost are committed together", () => {
  useWorldStore.setState({ currentSceneId: route.id, stamina: 100, gold: 0, traits: { ...useWorldStore.getState().traits, good: 0 } });
  useWorldStore.getState().travelRoute("__runtime_location");
  const state = useWorldStore.getState();
  assert.equal(state.currentSceneId, "__runtime_location");
  assert.equal(state.stamina, 90);
  assert.equal(state.gold, 13);
  assert.equal(state.traits.good, 7);
});
check("unaffordable, hidden and unknown route destinations have no effects", () => {
  useWorldStore.setState({ currentSceneId: route.id, stamina: 0, gold: 0 });
  useWorldStore.getState().travelRoute("__runtime_location");
  assert.equal(useWorldStore.getState().gold, 0);
  assert.equal(useWorldStore.getState().currentSceneId, route.id);
  useWorldStore.setState({ stamina: 100 });
  route.destinations[0].visibleIf = { t: "flag", flag: "__never_true", equals: true };
  useWorldStore.getState().travelRoute("__runtime_location");
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().currentSceneId, route.id);
  assert.equal(useWorldStore.getState().gold, 0);
});
check("Three.js runtime objects never enter the version 27 save", () => {
  const options = useWorldStore.persist.getOptions();
  assert.equal(options.version, 27);
  const saved = options.partialize!(useWorldStore.getState());
  assert.equal(JSON.stringify(saved).includes("enemyElapsedMs"), false);
  assert.equal("travelRoute" in saved, false);
});
SCENES_BY_ID.delete(route.id);
SCENES_BY_ID.delete("__runtime_location");
// The conversation standard: key words marked, long lines cut into beats.
{
  const { markText, plainText, sliceSegments, splitBeats, BEAT_CHARS } = await import("../lib/world/text-marks");
  const { SCENES } = await import("../lib/world/data/scenes");
  const marks = (text: string) => markText(text).filter((s) => s.mark).map((s) => `${s.mark}:${s.text}`);
  assert.deepEqual(marks("ไปหา**ผู้เฒ่า**ที่นครหลวง ปราบโจรป่า 3 ตัว เอายาเลือดเล็กมา แล้วเรียนไทจี้เจี้ยนกับพรรคยาจก"),
    ["key:ผู้เฒ่า", "place:นครหลวง", "foe:โจรป่า", "number:3", "item:ยาเลือดเล็ก", "move:ไทจี้เจี้ยน", "sect:พรรคยาจก"]);
  assert.deepEqual(marks("องครักษ์เสื้อแพรยึดคัมภีร์ไปไว้ที่หอคัมภีร์หลวง"), ["key:องครักษ์เสื้อแพร", "key:คัมภีร์", "key:หอคัมภีร์หลวง"]);
  assert.deepEqual(marks("ป้าหลิวรออยู่"), ["person:ป้าหลิว"], "people beat a foe with the same name");
  assert.equal(markText("ไม่มีคำสำคัญเลย")[0].mark, undefined);
  assert.equal(markText("ข้อความ **ไม่ปิด").map((s) => s.text).join(""), "ข้อความ **ไม่ปิด", "an unclosed mark stays as written");
  assert.equal(plainText("ไปเอา**คัมภีร์**มา"), "ไปเอาคัมภีร์มา");
  assert.equal(markText("ไปเอา**คัมภีร์**มา").map((s) => s.text).join(""), "ไปเอาคัมภีร์มา", "marks never change the words");
  assert.equal(sliceSegments(markText("ไปหาป้าหลิวที่บ้าน"), 7).map((s) => s.text).join(""), "ไปหาป้า");
  checks += 6;
  // Beats: short lines stay whole; a long one is cut between words, never inside a mark, and keeps its speaker.
  const long = { t: "dialogue" as const, speaker: "ป้าหลิว", text: "ฟังให้ดี ".repeat(25) + "**คำสำคัญ ที่มีช่องว่าง** จบ" };
  const beats = splitBeats([{ t: "narration", text: "สั้น ๆ" }, long]);
  assert.equal(beats[0].text, "สั้น ๆ");
  assert.ok(beats.length >= 3, "a long line is cut");
  for (const beat of beats.slice(1)) {
    assert.equal(beat.t === "dialogue" && beat.speaker, "ป้าหลิว");
    assert.ok(plainText(beat.text).length <= BEAT_CHARS + 20, `beat too long: ${beat.text.length}`);
    assert.equal((beat.text.match(/\*\*/g)?.length ?? 0) % 2, 0, "a mark is never cut");
  }
  assert.equal(beats.slice(1).map((b) => b.text).join(" ").replace(/\s+/g, " "), long.text.trim().replace(/\s+/g, " "), "nothing lost");
  // Every line in the game splits into beats that keep all their words.
  let lines = 0;
  for (const scene of SCENES) if (scene.kind === "dialog") for (const line of scene.lines) {
    lines++;
    const words = splitBeats([line]).map((b) => b.text).join(" ").replace(/\s+/g, " ");
    assert.equal(words, line.text.trim().replace(/\s+/g, " "), `${scene.id}: words lost when cut into beats`);
    assert.equal((line.text.match(/\*\*/g)?.length ?? 0) % 2, 0, `${scene.id}: an unclosed ** mark`);
  }
  assert.ok(lines > 5000);
  checks += 3;
}

check("every inner art's passive can fire, and its text names the real trigger", () => {
  // use_int fires on internal-attack moves or an internal art active (battle.ts);
  // a sect with neither can never trigger it.
  const INT_ACTIVES = new Set(["atk_int_pen", "drain", "drain_acc", "debuff_acc_dmg"]);
  const intSects = new Set(SKILLS.filter((s) => s.at === "int").map((s) => s.sc));
  for (const art of ARTS) {
    if (!art.pas) continue;
    if (art.pas.tr === "use_int" && !intSects.has(art.sc) && !(art.act && INT_ACTIVES.has(art.act.t))) {
      throw new Error(`${art.id} (${art.n}): fires on internal-attack moves, but ${art.sc} has none`);
    }
    const line = passiveLine(art.pas);
    if (art.pas.tr === "use_act" && line.includes("โจมตีภายใน")) throw new Error(`${art.id}: its own active read as an internal attack — "${line}"`);
    if (/\b(?:IA|Int skill|Crit|Phy)\b/.test(line)) throw new Error(`${art.id}: shorthand left in "${line}"`);
  }
});

console.warn = originalWarn;
console.log(checks + " runtime regression checks passed.");
