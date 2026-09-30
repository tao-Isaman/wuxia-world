// Grid battle store + world bridge: start via pendingBattle, AI pacing via
// step(), player input guards, auto mode, and the world's result hand-off.
import assert from "node:assert/strict";
import type { CharacterBuild, StatBlock } from "../lib/game/types";
import {
  activeUnit, aimableFor, cellKey, manhattan, reachableFor, targetsFor, unitById,
  type Cell, type GridBattleState,
} from "../lib/game/grid";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useBattleStore, isPlayerTurn } = await import("../store/battle-store");
const { useWorldStore } = await import("../store/world-store");
const { ensureBattleStarted } = await import("../lib/world/battle-bridge");
const { NPCS } = await import("../lib/world/data/npcs");
const { npcBattleSprite } = await import("../lib/world/data/npc-portraits");
const { OPPONENTS, getOpponent } = await import("../lib/world/data/opponents");
const { packOpponentIdOf, opponentLook } = await import("../lib/world/battle-looks");

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args);
};
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
function withRandom<T>(v: number, run: () => T): T {
  const random = Math.random; Math.random = () => v;
  try { return run(); } finally { Math.random = random; }
}

const bs = () => useBattleStore.getState();
const st = () => bs().state!;
const STATS: StatBlock = { STR: 5, AGI: 5, POW: 5, VIT: 5, DEX: 5, LUK: 5, DEF: 5, INT: 5 };
const mk = (name: string, stats: Partial<StatBlock> = {}, skillIds: (string | null)[] = ["sf"]): CharacterBuild => ({
  name, stats: { ...STATS, ...stats }, artId: "none", artLevel: 1, skillIds,
  equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
});
const strong = (b: CharacterBuild): CharacterBuild =>
  ({ ...b, stats: { STR: 80, AGI: 60, POW: 80, VIT: 80, DEX: 80, LUK: 20, DEF: 60, INT: 40 } });

function newGame(extra: Partial<ReturnType<typeof useWorldStore.getState>> = {}) {
  bs().reset();
  useWorldStore.getState().startNewGame({ name: "Grid test" });
  useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital", ...extra });
}
function fight(opponentId: string, extra: { nonFatal?: boolean } = {}) {
  useWorldStore.setState({ pendingBattle: { opponentId, onWin: "city_capital", onLose: "city_capital", ...extra } });
  ensureBattleStarted();
  assert.ok(bs().state, `battle started for ${opponentId}`);
}
/** Player's turn: punch a foe in reach (walking first if needed), else wait. */
function playerTurn(): void {
  const s = st();
  const u = activeUnit(s)!;
  const hit = (state: GridBattleState): Cell | undefined =>
    aimableFor(state, u.id, 0).find((c) => targetsFor(state, u.id, 0, c).some((t) => t.team === "enemy"));
  let aim = hit(s);
  if (!aim) {
    const foes = s.units.filter((o) => o.alive && o.team === "enemy");
    let best: Cell | null = null, bestD = Infinity;
    for (const path of reachableFor(s, u.id).values()) {
      const c = path[path.length - 1];
      const d = Math.min(...foes.map((f) => manhattan(c, f.pos)));
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best && cellKey(best) !== cellKey(u.pos)) assert.equal(bs().move(best), true);
    aim = hit(st());
  }
  if (aim) assert.equal(bs().act(0, aim), true);
  else assert.equal(bs().wait(), true);
}
function playOut(maxTurns = 400): void {
  for (let i = 0; i < maxTurns && st().phase !== "over"; i++) {
    bs().stepAll();
    if (st().phase === "over") break;
    assert.ok(isPlayerTurn(st(), bs().auto));
    playerTurn();
  }
  assert.equal(st().phase, "over", "battle finished");
}

// ─── Bridge start ─────────────────────────────────────────────────────
check("bridge: pendingBattle starts a 1v1 grid battle with world HP/MP and looks", () => {
  newGame({ playerBodyId: "f2", currentHp: 30, currentMp: 5 });
  fight("thug");
  const s = st();
  assert.equal(s.units.length, 2);
  const a = unitById(s, "A")!, b = unitById(s, "B")!;
  assert.equal(a.team, "ally"); assert.ok(a.leader);
  assert.equal(b.team, "enemy");
  assert.deepEqual(a.look, { kind: "character", characterId: "f2" });
  assert.equal(b.look.kind, "character");
  assert.equal(a.hp, 30); assert.equal(s.hA, 30); assert.equal(a.mp, 5);
  assert.equal(bs().builds?.B.name, getOpponent("thug")!.build().name);
  assert.equal(s.phase, "start");
  ensureBattleStarted();
  assert.equal(st(), s, "second ensure is a no-op");
});

check("bridge: pack opponents spawn their weaker members as extra enemies", () => {
  const packs = OPPONENTS.filter((o) => o.pack);
  assert.ok(packs.length >= 4 && packs.length <= 8, `curated pack list (${packs.length})`);
  for (const o of packs) {
    const m = getOpponent(o.pack!.opponentId);
    assert.ok(m, `${o.id} pack member exists`);
    assert.ok((m!.ti ?? 0) <= (o.ti ?? 0), `${o.id} pack member is not stronger`);
    assert.ok(o.pack!.count >= 1 && o.pack!.count <= 2);
  }
  newGame();
  fight("bandit_chief");
  const s = st();
  assert.equal(s.units.length, 4);
  const extras = s.units.filter((u) => u.team === "enemy" && u.id !== "B");
  assert.equal(extras.length, 2);
  for (const u of extras) assert.equal(packOpponentIdOf(u.id), "bandit");
  assert.equal(packOpponentIdOf("B"), null);
  assert.equal(s.units.find((u) => u.team === "enemy")!.id, "B", "primary enemy is the compat 'B'");
  assert.equal(new Set(s.units.map((u) => cellKey(u.pos))).size, 4, "no overlapping units");
  assert.ok(s.log.some((l) => l.txt.includes("พวกอีก 2")));

  newGame();
  fight("wild_wolf");
  assert.deepEqual(st().units.map((u) => u.look.kind), ["character", "creature", "creature"]);
  newGame();
  fight("mountain_tiger");
  assert.deepEqual(unitById(st(), "B")!.look, { kind: "creature", frame: 1 });
  assert.equal(st().units.length, 2, "no pack → 1v1");
});

check("bridge: sparring NPCs fight in their unique battle sprite", () => {
  const npc = NPCS.find((n) => n.sparOpponentId && getOpponent(n.sparOpponentId) && npcBattleSprite(n.id));
  assert.ok(npc, "a sparring NPC with a battle sprite exists");
  newGame();
  fight(npc!.sparOpponentId!, { nonFatal: true });
  const look = unitById(st(), "B")!.look;
  assert.equal(look.kind, "character");
  assert.equal(look.kind === "character" && look.still, npcBattleSprite(npc!.id));
  assert.deepEqual(look, opponentLook(npc!.sparOpponentId!, npc));
  assert.equal(st().units.length, 2, "spar stays 1v1");
});

// ─── Pacing + input ───────────────────────────────────────────────────
check("step(): enemy turns are driven beat by beat until the player's turn", () => {
  bs().reset();
  bs().start(mk("ช้า", { AGI: 1, VIT: 40 }), mk("เร็ว", { AGI: 30 }));
  assert.equal(isPlayerTurn(st(), false), false);
  const s0 = st();
  bs().step();
  const s1 = st();
  assert.notEqual(s1, s0, "step publishes a new state");
  assert.equal(activeUnit(s1)?.team === "enemy" || s1.events.length > 0, true);
  bs().stepAll();
  assert.ok(isPlayerTurn(st(), false), "stops at the player's turn");
  assert.ok(st().events.some((e) => "unitId" in e && e.unitId === "B"), "the enemy acted first");
  const waiting = st();
  bs().step();
  assert.equal(st(), waiting, "step() does nothing while the player must act");
});

check("move / act / wait / flee refuse illegal input and publish new arrays on success", () => {
  bs().reset();
  bs().start(mk("ฮีโร่", { AGI: 90 }), mk("หุ่น", { AGI: 1 }));
  assert.equal(bs().move({ x: 3, y: 3 }), false, "not started → no input");
  assert.equal(bs().wait(), false);
  bs().stepAll();
  assert.ok(isPlayerTurn(st(), false));
  const before = st();
  const a = unitById(before, "A")!;
  assert.equal(bs().move({ x: 9, y: 0 }), false, "out of walking range");
  assert.equal(bs().move({ x: -1, y: 3 }), false, "off the board");
  assert.equal(bs().move(unitById(before, "B")!.pos), false, "onto an enemy");
  assert.equal(bs().act(0, { x: a.pos.x, y: a.pos.y }), false, "melee aimed at own cell");
  assert.equal(bs().act(7, { x: a.pos.x + 1, y: a.pos.y }), false, "empty slot");
  assert.equal(st(), before, "refused input leaves the state untouched");
  const to = { x: a.pos.x + 1, y: a.pos.y };
  assert.equal(bs().move(to), true);
  const moved = st();
  assert.notEqual(moved, before);
  assert.notEqual(moved.units, before.units, "units array identity changes");
  assert.notEqual(moved.events, before.events, "events array identity changes");
  assert.deepEqual(unitById(before, "A")!.pos, a.pos, "the previous snapshot is not mutated");
  assert.equal(moved.phase, "moved");
  assert.equal(bs().move({ x: to.x + 1, y: to.y }), false, "only one move per turn");
  assert.equal(bs().wait(), true);
  assert.equal(bs().wait(), false, "turn already over");
  assert.equal(isPlayerTurn(st(), false), false);
});

check("flee: success ends the battle as escaped; failure spends the turn", () => {
  bs().reset();
  bs().start(mk("ฮีโร่", { AGI: 90 }), mk("หุ่น", { AGI: 1 }));
  bs().stepAll();
  const turn = st().turn;
  assert.equal(withRandom(0.999, () => bs().flee()), true);
  assert.equal(st().escaped, undefined);
  assert.equal(st().turn, turn + 1);
  assert.equal(isPlayerTurn(st(), false), false);
  bs().stepAll();
  assert.equal(withRandom(0, () => bs().flee()), true);
  assert.equal(st().escaped, true);
  assert.equal(st().phase, "over");
  assert.equal(st().winner, null);
  const over = st();
  bs().step();
  assert.equal(st(), over, "step() is a no-op once over");
  assert.equal(bs().flee(), false);
});

check("auto mode: the AI plays the player's turns too", () => {
  bs().reset();
  bs().start(strong(mk("ฮีโร่")), mk("หุ่น"));
  bs().setAuto(true);
  assert.equal(bs().auto, true);
  withRandom(0.5, () => bs().stepAll());
  assert.equal(st().phase, "over");
  assert.equal(st().winner, "A");
  assert.ok(Object.values(st().skillUses.A).reduce((n, v) => n + v, 0) > 0, "leader skill uses mirrored");
  bs().reset();
  assert.equal(bs().auto, false, "reset turns auto off");
  assert.equal(bs().state, null);
  assert.equal(bs().builds, null);
});

// ─── World hand-off ───────────────────────────────────────────────────
check("win: HP carryover, kill counts for the foe and its pack, rewards, battle cleared", () => {
  newGame();
  const pb = useWorldStore.getState().playerBuild!;
  useWorldStore.setState({ playerBuild: strong(pb), currentHp: 99999, currentMp: 9999 });
  const wExp = useWorldStore.getState().wExp;
  fight("bandit_chief");
  withRandom(0.5, () => playOut());
  const s = st();
  assert.equal(s.winner, "A");
  const hp = unitById(s, "A")!.hp;
  assert.equal(s.hA, hp);
  useWorldStore.getState().acknowledgeBattleResult();
  const w = useWorldStore.getState();
  assert.equal(w.pendingBattle, null);
  assert.equal(w.gameOver, false);
  assert.equal(w.currentHp, hp);
  assert.equal(w.defeatedCounts.bandit_chief, 1);
  assert.equal(w.defeatedCounts.bandit, 2);
  assert.equal(w.wExp, wExp + 50);
  assert.ok(Object.keys(w.skillExp).length > 0, "per-skill xp from the leader's uses");
  assert.equal(bs().state, null);
});

check("loss: fatal → game over at 0 HP; non-fatal → 1 HP and onLose", () => {
  for (const nonFatal of [false, true]) {
    newGame({ currentHp: 5 });
    fight("law_bounty_hunter", { nonFatal });
    assert.equal(st().units.length, 3, "bounty hunter brings a constable");
    bs().setAuto(true);
    withRandom(0.5, () => bs().stepAll());
    assert.equal(st().winner, "B");
    assert.equal(st().hA, 0);
    useWorldStore.getState().acknowledgeBattleResult();
    const w = useWorldStore.getState();
    assert.equal(w.pendingBattle, null);
    assert.equal(w.gameOver, !nonFatal);
    assert.equal(w.currentHp, nonFatal ? 1 : 0);
    assert.equal(w.defeatedCounts.law_bounty_hunter ?? 0, 0);
    assert.equal(bs().state, null);
  }
});

check("escape: no rewards, HP kept, battle cleared", () => {
  newGame({ currentHp: 40 });
  const before = useWorldStore.getState();
  fight("thug");
  // Hand the player the first turn, then retreat.
  const s = st(); unitById(s, "A")!.gauge = 100;
  bs().stepAll();
  assert.ok(isPlayerTurn(st(), false));
  const hp = st().hA;
  assert.equal(withRandom(0, () => bs().flee()), true);
  useWorldStore.getState().acknowledgeBattleResult();
  const w = useWorldStore.getState();
  assert.equal(w.pendingBattle, null);
  assert.equal(w.gameOver, false);
  assert.equal(w.currentHp, Math.max(1, hp));
  assert.equal(w.wExp, before.wExp);
  assert.equal(w.defeatedCounts.thug ?? 0, 0);
  assert.equal(bs().state, null);
});

bs().reset();
console.warn = originalWarn;
console.log(`${checks} grid store checks passed.`);
