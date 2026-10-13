// The game server's TypeScript half without a server (docs/online.md "The
// shared world", "Battles on the server"): battles as replayable commands,
// the server's world document (the week, pins, echoes, killings) and its
// battle document (staging, replay, verdict), and the browser's checked-battle
// loop (store/cloud-battle.ts) against those same documents behind a fake fetch.
import assert from "node:assert/strict";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => { if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args); };

const { setTestClock, msAtWorld } = await import("../lib/world/clock");
const { useWorldStore } = await import("../store/world-store");
const { useBattleStore } = await import("../store/battle-store");
const { cloudBattle, useCloudBattle } = await import("../store/cloud-battle");
const { applyServerWorld, heroPins } = await import("../store/cloud-world");
const { cloudSave } = await import("../lib/net/cloud-save");
const { applyCommand, setSessionAuto, startSession, stepSession } = await import("../lib/game/grid/session");
const { battleItemOf, worldBattleStart } = await import("../lib/world/battle-setup");
const { acceptEcho, activePins, advanceWorld, bossFellInWorld, createWorld, echoProblem, killInWorld, setPins, ECHOES_PER_HOUR } = await import("../server/worker/ts/world-doc");
const { judge, newSession, playCommands, stageBattle } = await import("../server/worker/ts/battle-doc");
const { withPartyBonus } = await import("../server/worker/ts/battle-doc");
const social = await import("../server/worker/ts/social-doc");
const party = await import("../server/worker/ts/party-doc");
const { SOCIAL_LIMITS, cleanText, normalUsername } = await import("../lib/net/social-protocol");
const { BOSSES } = await import("../lib/world/data/bosses");
const { getQuest, QUESTS: allQuests } = await import("../lib/world");
type WorldStateData = import("../lib/world/types").WorldStateData;

let failed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  } finally {
    setTestClock(null);
  }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** A strong hero standing before `pendingBattle`. */
function heroBefore(pendingBattle: WorldStateData["pendingBattle"]): WorldStateData {
  useWorldStore.getState().startNewGame({ name: "ทดสอบ", newWorld: true });
  const s = useWorldStore.getState();
  const stats = Object.fromEntries(Object.keys(s.playerBuild!.stats).map((k) => [k, 900])) as never;
  useWorldStore.setState({ playerBuild: { ...s.playerBuild!, stats }, currentHp: 99_999, currentMp: 99_999, pendingBattle });
  return clone(useWorldStore.getState()) as WorldStateData;
}
const thief = { opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital" };

// ─── Battles as commands ───────────────────────────────────────────────
await check("a seeded battle logs its commands, and replaying them gives the same battle; an unseeded one logs nothing", () => {
  const start = worldBattleStart(heroBefore({ ...thief, opponentId: "bandit_chief", withPack: true }))!;
  const played = startSession(start.a, start.b, { ...start.opts, seed: 4242 });
  setSessionAuto(played, true);
  for (let i = 0; i < 3000 && played.state.phase !== "over"; i++) stepSession(played);
  assert.equal(played.state.phase, "over");
  assert.ok(played.commands!.length > 3);
  const replay = startSession(start.a, start.b, { ...start.opts, seed: 4242 });
  for (const command of played.commands!) assert.ok(applyCommand(replay, command, battleItemOf), `replays ${JSON.stringify(command)}`);
  assert.deepEqual(clone(replay.state), clone(played.state));
  // A command that cannot happen in this battle is refused.
  const other = startSession(start.a, start.b, { ...start.opts, seed: 4242 });
  assert.equal(applyCommand(other, ["a", 63, 0, 0], battleItemOf), false);
  assert.equal(applyCommand(other, ["nonsense"], battleItemOf), false);
  assert.equal(startSession(start.a, start.b, start.opts).commands, null);
});

// ─── The server's battle document ──────────────────────────────────────
await check("stageBattle: the saved fight, or why not (no hero, no battle, a beast still resting)", () => {
  const ids = { battleId: "b1", seed: 7, player: "p", characterId: "c" };
  assert.deepEqual(stageBattle({ ...heroBefore(thief), playerBuild: null } as never, ids, {}, 0), { error: "no_hero" });
  assert.deepEqual(stageBattle(heroBefore(null), ids, {}, 0), { error: "no_battle" });
  assert.deepEqual(stageBattle(heroBefore({ ...thief, opponentId: "nobody" }), ids, {}, 0), { error: "no_battle" });
  // A legendary beast is the world's, fought by a party (raid-doc.ts), never in a solo checked battle.
  const boss = BOSSES[0]!;
  const atLair = heroBefore({ opponentId: boss.id, onWin: boss.lair, onLose: "home_player" });
  assert.deepEqual(stageBattle(atLair, ids, {}, 0), { error: "boss_party" });
});

// ─── World bosses: party fights on the server ────────────────────────
const raid = await import("../server/worker/ts/raid-doc");
const { RAID_RULES } = await import("../lib/net/raid-protocol");
const { humanToAct } = await import("../lib/game/grid/session");

/** A strong hero standing in `lair` (a save as the server would load it). */
function heroAt(name: string, lair: string): WorldStateData {
  useWorldStore.getState().startNewGame({ name, newWorld: true });
  const s = useWorldStore.getState();
  const stats = Object.fromEntries(Object.keys(s.playerBuild!.stats).map((k) => [k, 2_000])) as never;
  useWorldStore.setState({ playerBuild: { ...s.playerBuild!, stats }, currentHp: 99_999, currentMp: 99_999, currentSceneId: lair, lastLocationId: lair });
  return clone(useWorldStore.getState()) as WorldStateData;
}

await check("world boss: the leader opens at the lair, the party joins, the fight begins; one party at a time", () => {
  const boss = BOSSES[0]!;
  const doc = raid.newRaidDoc(boss.id);
  const t0 = 1_000_000;
  const ann = heroAt("แอน", boss.lair), ben = heroAt("เบน", boss.lair), far = heroAt("ไกล", "city_capital");
  const party = [{ player: "ann", name: "แอน" }, { player: "ben", name: "เบน" }];
  assert.equal(raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, party.slice(0, 1), { id: "f1", seed: 3 }, t0), "party_small");
  assert.equal(raid.openRaid(doc, { player: "ann", characterId: "c1", save: far }, party, { id: "f1", seed: 3 }, t0), "not_here");
  assert.equal(raid.openRaid(doc, { player: "ben", characterId: "c2", save: ben }, party, { id: "f1", seed: 3 }, t0), "not_leader");
  assert.equal(raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, party, { id: "f1", seed: 3 }, t0), null);
  assert.equal(raid.bossStatus(doc).fighting, "แอน");
  assert.equal(raid.openRaid(doc, { player: "cat", characterId: "c3", save: ann }, [{ player: "cat", name: "แคท" }, ...party], { id: "f2", seed: 3 }, t0), "taken", "one party at a time");
  assert.equal(raid.joinRaid(doc, "f1", { player: "ben", characterId: "c2", save: far }, t0), "not_here");
  assert.equal(raid.joinRaid(doc, "f1", { player: "eve", characterId: "c9", save: ben }, t0), "not_member");
  assert.equal(raid.joinRaid(doc, "f1", { player: "ben", characterId: "c2", save: ben }, t0), null);
  const session = raid.beginRaid(doc, t0 + 1_000);
  assert.ok(typeof session !== "string");
  if (typeof session === "string") return;
  const fight = doc.fight!;
  assert.equal(fight.phase, "battle");
  assert.deepEqual(fight.members.map((m) => m.unit), ["A", "P2"]);
  // Both heroes stand on the board; the beast has HP for two.
  assert.deepEqual(session.state.units.filter((u) => u.team === "ally").map((u) => u.id), ["A", "P2"]);
  const plain = { ...fight.start!.b, baseHp: 0 };
  assert.ok((raid.partyScaled(plain, 2).baseHp ?? 0) > 0 && raid.partyScaled(plain, 1) === plain, "a party adds to the beast's HP; one alone adds nothing");
  assert.ok((fight.start!.b.baseHp ?? 0) > 0, "this beast is sturdier for the party of two");
  // Each sees the same fight from the start; a stranger sees none.
  const view = raid.raidView(doc, "ben", 0, t0 + 1_000);
  assert.equal(view.fight?.me, "P2");
  assert.ok(view.fight?.start && view.fight.total === fight.commands.length);
  assert.equal(raid.raidView(doc, "eve", 0, t0).fight, null);
});

await check("world boss: only the unit's own player acts on its turn; a turn that runs out is the AI's; the party wins together", () => {
  const boss = BOSSES[0]!;
  const doc = raid.newRaidDoc(boss.id);
  let now = 2_000_000;
  const ann = heroAt("แอน", boss.lair), ben = heroAt("เบน", boss.lair);
  raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, [{ player: "ann", name: "แอน" }, { player: "ben", name: "เบน" }], { id: "f1", seed: 11 }, now);
  raid.joinRaid(doc, "f1", { player: "ben", characterId: "c2", save: ben }, now);
  let session = raid.beginRaid(doc, now) as Exclude<ReturnType<typeof raid.beginRaid>, string>;
  const fight = doc.fight!;
  const whose = (unit: string | null) => fight.members.find((m) => m.unit === unit)?.player;
  // Whoever's unit holds the turn: the other player is refused, its own player may wait.
  const turn = humanToAct(session);
  if (turn) {
    const other = whose(turn) === "ann" ? "ben" : "ann";
    assert.equal(raid.actRaid(doc, session, other, { t: "wait" }, now), "not_your_turn");
    assert.equal(raid.actRaid(doc, session, whose(turn)!, { t: "wait" }, now), null);
  }
  // A client replaying the server's commands reaches the same board.
  const client = raid.sessionOf(fight);
  assert.equal(JSON.stringify(client.state.units.map((u) => [u.id, u.hp, u.pos])), JSON.stringify(session.state.units.map((u) => [u.id, u.hp, u.pos])));
  // From here nobody acts: every turn runs out and the AI plays it, until the fight ends.
  for (let i = 0; i < 4000 && doc.fight!.phase === "battle" && session.state.phase !== "over"; i++) {
    now += RAID_RULES.turnMs + 1;
    for (const m of fight.members) m.seen = now; // they are there, only slow
    session = raid.tickRaid(doc, session, now) as typeof session;
  }
  assert.equal(session.state.phase, "over", "the fight ends");
  assert.ok(fight.commands.some((c) => c[0] === "x"), "timed-out turns were played by the AI");
  const won = raid.judgeRaid(doc, session, now);
  assert.equal(typeof won, "boolean");
  const verdicts = doc.fight!.verdicts!;
  assert.deepEqual(Object.keys(verdicts).sort(), ["ann", "ben"]);
  if (won) {
    assert.ok(verdicts.ann!.spoils && verdicts.ben!.spoils, "each winner's own spoils");
    assert.ok(verdicts.ann!.hA >= 1 && verdicts.ben!.hA >= 1, "a fallen member still walks away");
    assert.equal(doc.fellAt, now);
    assert.deepEqual(doc.fellBy, ["แอน", "เบน"]);
    assert.equal(raid.bossUp(doc, now + RAID_RULES.respawnMs - 1), false, "gone for three hours");
    assert.equal(raid.bossUp(doc, now + RAID_RULES.respawnMs), true, "back after three hours");
    assert.equal(raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, [{ player: "ann", name: "แอน" }, { player: "ben", name: "เบน" }], { id: "f2", seed: 1 }, now + 1), "resting");
  } else {
    assert.equal(doc.fellAt, null, "lost: the beast is free again");
  }
  assert.equal(raid.bossStatus(doc).fighting, null);
});

await check("world boss: the quiet are played by the AI; a gathering that runs out begins with who came, or ends", () => {
  const boss = BOSSES[1]!;
  let doc = raid.newRaidDoc(boss.id);
  const now = 3_000_000;
  const ann = heroAt("แอน", boss.lair), ben = heroAt("เบน", boss.lair);
  const party = [{ player: "ann", name: "แอน" }, { player: "ben", name: "เบน" }, { player: "cat", name: "แคท" }];
  raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, party, { id: "f1", seed: 5 }, now);
  raid.joinRaid(doc, "f1", { player: "ben", characterId: "c2", save: ben }, now);
  // Cat never came: the gathering runs out and the fight begins with two.
  const session = raid.tickRaid(doc, null, now + RAID_RULES.gatherMs);
  assert.ok(session);
  assert.equal(doc.fight!.phase, "battle");
  assert.deepEqual(doc.fight!.members.map((m) => m.player), ["ann", "ben"]);
  // Ben goes quiet: the AI plays his unit.
  doc.fight!.members.find((m) => m.player === "ben")!.seen = now - RAID_RULES.idleMs - 1;
  doc.fight!.members.find((m) => m.player === "ann")!.seen = now + RAID_RULES.gatherMs;
  raid.tickRaid(doc, session, now + RAID_RULES.gatherMs + 1);
  assert.ok(session!.autoUnits.includes("P2"));
  // Alone, nobody else came: no fight.
  doc = raid.newRaidDoc(boss.id);
  raid.openRaid(doc, { player: "ann", characterId: "c1", save: ann }, party.slice(0, 2), { id: "f2", seed: 5 }, now);
  assert.equal(raid.tickRaid(doc, null, now + RAID_RULES.gatherMs), null);
  assert.equal(doc.fight!.phase, "over");
  assert.equal(raid.bossStatus(doc).fighting, null);
});

await check("playCommands + judge: the log replays in parts (a repeated part skipped), a gap or a bad command refused; a win pays", () => {
  const record = stageBattle(heroBefore(thief), { battleId: "b2", seed: 99, player: "p", characterId: "c" }, {}, 0);
  assert.ok(!("error" in record));
  if ("error" in record) return;
  const client = startSession(record.start.a, record.start.b, { ...record.start.opts, seed: record.seed });
  setSessionAuto(client, true);
  for (let i = 0; i < 3000 && client.state.phase !== "over"; i++) stepSession(client);
  const log = client.commands!;
  const server = newSession(record);
  assert.equal(playCommands(record, server, 5, log), "gap");
  assert.equal(judge(record, server), null, "not over yet");
  const half = Math.floor(log.length / 2);
  assert.equal(playCommands(record, server, 0, log.slice(0, half)), null);
  assert.equal(playCommands(record, server, 0, log.slice(0, half)), null, "a repeated part");
  assert.equal(playCommands(record, server, half, log.slice(half)), null);
  const verdict = judge(record, server)!;
  assert.equal(verdict.winner, "A");
  assert.equal(verdict.hA, client.state.hA);
  assert.ok(verdict.spoils && verdict.spoils.wExp > 0 && verdict.spoils.gold > 0);
  assert.equal(playCommands(record, server, log.length, [["s"]]), "bad_log", "nothing after the end");
  const fresh = stageBattle(heroBefore(thief), { battleId: "b3", seed: 99, player: "p", characterId: "c" }, {}, 0);
  if (!("error" in fresh)) assert.equal(playCommands(fresh, newSession(fresh), 0, [["m", 60, 60]]), "bad_log");
});

// ─── The server's world document ───────────────────────────────────────
await check("the world moves with the clock: a day keeps the talk, a week lives the people; same day, same world", () => {
  const t0 = msAtWorld(100, 2);
  const doc = createWorld(t0, 1234);
  assert.equal(doc.day, 100);
  assert.ok(Object.keys(doc.world.npcExt).length >= 30);
  assert.equal(advanceWorld(doc, msAtWorld(100, 6)), false);
  const rev = doc.rev;
  assert.equal(advanceWorld(doc, msAtWorld(101, 0)), true);
  assert.equal(doc.rev, rev + 1);
  assert.equal(doc.world.lastNpcTickDay, 100, "no week yet");
  advanceWorld(doc, msAtWorld(108, 0));
  assert.equal(doc.world.lastNpcTickDay, 107);
  // The same seed and days give the same people.
  const twin = createWorld(t0, 1234);
  advanceWorld(twin, msAtWorld(108, 0));
  assert.deepEqual(clone(twin.world.npcExt), clone(doc.world.npcExt));
});

await check("a world from before the clock moved back rewinds to today and lives on from there", () => {
  const doc = createWorld(msAtWorld(121, 3), 99);
  const npc = Object.keys(doc.world.npcExt)[0]!;
  const tick = doc.world.npcExt[npc]!.lastTickDay;
  assert.equal(advanceWorld(doc, msAtWorld(2, 1)), true);
  assert.equal(doc.day, 2);
  assert.equal(doc.world.lastNpcTickDay, 2);
  assert.equal(doc.world.npcExt[npc]!.lastTickDay, tick - 119);
  advanceWorld(doc, msAtWorld(9, 0));
  assert.equal(doc.world.lastNpcTickDay, 9, "a week later the people live it");
});

await check("pins: people a player's quests hold, kept for two game days, only known people", () => {
  const doc = createWorld(msAtWorld(50), 5);
  const npc = Object.keys(doc.world.npcExt)[0]!;
  setPins(doc, "ann", [npc, "nobody_at_all", "<script>"], msAtWorld(50));
  assert.deepEqual(activePins(doc, msAtWorld(50, 6)), [npc]);
  assert.deepEqual(activePins(doc, msAtWorld(53)), [], "expired");
  // The browser sends the givers of the hero's open quests.
  const state = heroBefore(null);
  const quest = Object.values(state.quests)[0] ?? null;
  const pins = heroPins(state);
  if (quest) assert.ok(pins.includes(getQuest(quest.id)?.giverNpcId ?? pins[0]!));
  assert.ok(pins.length <= 40);
});

await check("echoes: the server writes the rumor from known templates; bad deeds, contexts and floods refused", () => {
  const at = msAtWorld(60);
  const doc = createWorld(at, 6);
  const context = { archetype: "นักท่องยุทธ์", sceneId: "city_capital", sectId: "shaolin" };
  const before = doc.world.rumorPool.length;
  assert.equal(acceptEcho(doc, "ann", { actionId: "sect_join", context }, at), null);
  assert.equal(doc.world.rumorPool.length, before + 1);
  assert.equal(doc.world.worldEventLog.at(-1)?.t, "rumor");
  assert.equal(echoProblem({ actionId: "made_up", context }), "bad_action");
  assert.equal(echoProblem({ actionId: "sect_join", targetNpcId: "nobody", context }), "bad_target");
  assert.equal(echoProblem({ actionId: "sect_join", context: { ...context, archetype: "ใครก็ได้" } }), "bad_context");
  assert.equal(echoProblem({ actionId: "sect_join", context: { ...context, sceneId: "nowhere" } }), "bad_context");
  assert.equal(echoProblem({ actionId: "sect_join", context: { ...context, sectId: "fake" } }), "bad_context");
  for (let i = 1; i < ECHOES_PER_HOUR; i++) assert.equal(acceptEcho(doc, "ann", { actionId: "sect_join", context }, at + i), null);
  assert.equal(acceptEcho(doc, "ann", { actionId: "sect_join", context }, at + 100), "too_many");
  assert.equal(acceptEcho(doc, "bob", { actionId: "sect_join", context }, at + 100), null, "per player");
});

await check("killInWorld: only the simulated people die for everyone, once; a felled beast is news", () => {
  const doc = createWorld(msAtWorld(70), 7);
  const victim = Object.keys(doc.world.npcExt)[3]!;
  assert.equal(killInWorld(doc, victim, "ann", "city_capital"), true);
  assert.equal(doc.world.npcExt[victim]!.status, "dead");
  assert.equal(killInWorld(doc, victim, "ann", "city_capital"), false, "already dead");
  assert.equal(killInWorld(doc, "village_elder_nobody", "ann", "city_capital"), false);
  assert.equal(bossFellInWorld(doc, BOSSES[0]!.id, "ann"), true);
  assert.ok(doc.world.rumorPool.some((r) => r.id.startsWith(`rumor_boss_${BOSSES[0]!.id}`)));
  assert.ok(!("bossDefeatedDay" in doc.world), "the beast's rest is each player's");
});

await check("applyServerWorld: the server's world replaces the shared fields; a dead giver's quest passes on or ends, and the hero is told", () => {
  const state = heroBefore(null);
  const doc = createWorld(msAtWorld(state.day), state.worldSeed);
  // A side quest whose giver is one of the simulated people, taken by the hero.
  const giverQuest = allQuests.find((q) => q.giverNpcId && doc.world.npcExt[q.giverNpcId] && !q.lineage && !q.story)!;
  assert.ok(giverQuest, "some quest is given by a simulated person");
  state.quests = { ...state.quests, [giverQuest.id]: { id: giverQuest.id, status: "active", stage: 0 } as never };
  const logBefore = state.actionLog.length;
  killInWorld(doc, giverQuest.giverNpcId!, "someone", "city_capital");
  applyServerWorld(state, doc.world);
  assert.equal(state.worldSeed, doc.world.worldSeed);
  assert.equal(state.npcExt[giverQuest.giverNpcId!]!.status, "dead");
  assert.deepEqual(state.assassinatedNpcIds, [], "the hero killed no one");
  assert.ok(state.actionLog.length > logBefore, "the hero hears of the quest");
  assert.ok(state.actionLog.at(-1)!.message.includes(giverQuest.name));
});

// ─── The browser's checked battle, against the server's documents ──────
await check("a checked battle: staged by the server, played here, judged there; the world takes the verdict's spoils", async () => {
  setTestClock(msAtWorld(120));
  heroBefore(thief);
  const goldBefore = useWorldStore.getState().gold;
  let record: ReturnType<typeof stageBattle> | null = null;
  let server: ReturnType<typeof newSession> | null = null;
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    calls.push(path);
    const body = init?.body ? JSON.parse(String(init.body)) as { from: number; commands: unknown[] } : null;
    const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
    if (path.endsWith("/battle/start")) {
      record = stageBattle(clone(useWorldStore.getState()) as WorldStateData, { battleId: "cb1", seed: 31337, player: "p", characterId: "c1" }, {}, 0);
      if ("error" in record) return reply(record, 422);
      server = newSession(record);
      return reply({ battleId: record.battleId, seed: record.seed, start: record.start });
    }
    if (record && !("error" in record) && server && body) {
      const error = playCommands(record, server, body.from, body.commands);
      if (error) return reply({ error }, 422);
      if (path.endsWith("/battle/log")) return reply({ at: record.commands.length });
      return reply(judge(record, server));
    }
    return reply({ error: "not_found" }, 404);
  }) as typeof fetch;
  try {
    cloudSave.select("http://srv", "tok", "c1");
    cloudSave.resume();
    assert.equal(cloudBattle.enabled(), true);
    await cloudBattle.begin();
    assert.equal(useCloudBattle.getState().status, "playing");
    assert.equal(useBattleStore.getState().seed, 31337);
    assert.equal(cloudBattle.checking(), true);
    // Not over: the world waits.
    useWorldStore.getState().acknowledgeBattleResult();
    assert.ok(useWorldStore.getState().pendingBattle, "no result before the verdict");
    useBattleStore.getState().setAuto(true);
    useBattleStore.getState().stepAll();
    assert.equal(useBattleStore.getState().state?.phase, "over");
    for (let i = 0; i < 50 && useCloudBattle.getState().status !== "done"; i++) await new Promise((r) => setTimeout(r, 10));
    const verdict = useCloudBattle.getState().verdict!;
    assert.equal(verdict.winner, "A");
    assert.ok(calls.some((p) => p.endsWith("/battle/finish")));
    assert.deepEqual(useWorldStore.getState().victorySpoils(), verdict.spoils, "the result panel shows the server's spoils");
    useWorldStore.getState().acknowledgeBattleResult();
    assert.equal(useWorldStore.getState().pendingBattle, null);
    assert.equal(useWorldStore.getState().gold, goldBefore + verdict.spoils!.gold);
    assert.equal(useCloudBattle.getState().status, "idle");
    assert.equal(useBattleStore.getState().state, null);
  } finally {
    globalThis.fetch = realFetch;
    cloudBattle.stop();
    cloudSave.clear();
  }
});

await check("a battle the server refuses counts as left: no spoils, no harm", async () => {
  setTestClock(msAtWorld(121));
  heroBefore(thief);
  const before = useWorldStore.getState();
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/battle/start")) {
      const record = stageBattle(clone(useWorldStore.getState()) as WorldStateData, { battleId: "cb2", seed: 5, player: "p", characterId: "c1" }, {}, 0);
      if ("error" in record) return new Response(JSON.stringify(record), { status: 422 });
      return new Response(JSON.stringify({ battleId: record.battleId, seed: record.seed, start: record.start }));
    }
    return new Response(JSON.stringify({ error: "bad_log" }), { status: 422 });
  }) as typeof fetch;
  try {
    cloudSave.select("http://srv", "tok", "c1");
    cloudSave.resume();
    await cloudBattle.begin();
    useBattleStore.getState().setAuto(true);
    useBattleStore.getState().stepAll();
    for (let i = 0; i < 50 && useCloudBattle.getState().status !== "done"; i++) await new Promise((r) => setTimeout(r, 10));
    assert.equal(useCloudBattle.getState().verdict, null);
    assert.equal(useCloudBattle.getState().error, "bad_log");
    useWorldStore.getState().acknowledgeBattleResult();
    const after = useWorldStore.getState();
    assert.equal(after.pendingBattle, null);
    assert.equal(after.gold, before.gold);
    assert.equal(after.currentHp, before.currentHp);
    assert.ok(after.actionLog.at(-1)?.message.includes("ไม่ผ่านการตรวจ"));
  } finally {
    globalThis.fetch = realFetch;
    cloudBattle.stop();
    cloudSave.clear();
  }
});

// ─── Friends, mail, party (docs/design/social.md) ─────────────────────

await check("social: chat and letter text is cleaned, usernames normalized", () => {
  assert.equal(cleanText("  สวัสดี\u0007 ", 120), "สวัสดี");
  assert.equal(cleanText("   ", 120), null);
  assert.equal(cleanText("ก".repeat(121), 120), null);
  assert.equal(cleanText(5, 120), null);
  assert.equal(normalUsername("@Lin_Chong"), "lin_chong");
  assert.equal(normalUsername("ab"), null);
  assert.equal(normalUsername("bad name"), null);
});

await check("social: friend requests — ask, a request both ways makes friends, block forgets and refuses", () => {
  const a = social.emptyHub("aaa");
  const b = social.emptyHub("bbb");
  assert.equal(social.receiveRequest(b, { username: "aaa", name: "อา" }, 1), "requested");
  social.recordAsked(a, { username: "bbb", name: "บี" }, "requested", 1);
  assert.ok(a.requestsOut.bbb && b.requestsIn.aaa);
  // b asks a back: a's hub sees its own request out → friends.
  assert.equal(social.receiveRequest(a, { username: "bbb", name: "บี" }, 2), "friends");
  assert.ok(a.friends.bbb && !a.requestsOut.bbb);
  assert.equal(social.receiveRequest(a, { username: "bbb", name: "บี" }, 3), "already");
  assert.ok(social.acceptRequest(b, "aaa", 3));
  assert.ok(b.friends.aaa && !b.requestsIn.aaa);
  assert.equal(social.acceptRequest(b, "nobody", 3), null);
  social.block(b, { username: "aaa", name: "อา" }, 4);
  assert.ok(!b.friends.aaa && b.blocked.aaa);
  assert.equal(social.receiveRequest(b, { username: "aaa", name: "อา" }, 5), "blocked");
});

await check("social: chat and mail rate limits", () => {
  const hub = social.emptyHub("aaa");
  for (let i = 0; i < SOCIAL_LIMITS.chatBurst; i++) assert.ok(social.takeChat(hub, 1000 + i));
  assert.ok(!social.takeChat(hub, 1100));
  assert.ok(social.takeChat(hub, 1000 + SOCIAL_LIMITS.chatWindowMs + 10));
  for (let i = 0; i < SOCIAL_LIMITS.mailPerHour; i++) assert.ok(social.takeMail(hub, i));
  assert.ok(!social.takeMail(hub, 100));
  assert.ok(social.takeMail(hub, 3_600_001));
});

const { ITEMS } = await import("../lib/world/data/items");
const { giftable } = await import("../lib/world/gifts");
await check("social: parcels — gold within limits, giftable items only, the debit carries the postage", () => {
  assert.equal(social.parcelProblem(null), null);
  assert.equal(social.parcelProblem({ gold: 100 }), null);
  assert.equal(social.parcelProblem({ gold: 0 }), "bad_parcel");
  assert.equal(social.parcelProblem({ gold: SOCIAL_LIMITS.maxParcelGold + 1 }), "bad_parcel");
  assert.equal(social.parcelProblem({ gold: 1.5 }), "bad_parcel");
  assert.equal(social.parcelProblem({ itemId: "no_such_item", count: 1 }), "not_mailable");
  const ok = Object.values(ITEMS).find((i) => giftable(i) && !i.id.startsWith("scroll_"))!;
  const canGift = (i: (typeof ITEMS)[number]): boolean => giftable(i);
  const quest = ITEMS.find((i) => !canGift(i));
  assert.equal(social.parcelProblem({ itemId: ok.id, count: 2 }), null);
  if (quest) assert.equal(social.parcelProblem({ itemId: quest.id, count: 1 }), "not_mailable");
  const scroll = Object.values(ITEMS).find((i) => i.id.startsWith("scroll_"));
  if (scroll) assert.equal(social.parcelProblem({ itemId: scroll.id, count: 1 }), "not_mailable");
  assert.deepEqual(social.debitOf(null), { gold: SOCIAL_LIMITS.postage });
  assert.deepEqual(social.debitOf({ gold: 500 }), { gold: 500 + SOCIAL_LIMITS.postage });
  assert.deepEqual(social.debitOf({ itemId: ok.id, count: 2 }), { gold: SOCIAL_LIMITS.postage, itemId: ok.id, count: 2 });
});

await check("social: mail — claim once, a full box refuses but keeps room for returns, delete and expiry send parcels home", () => {
  const hub = social.emptyHub("bbb");
  const from = { username: "aaa", name: "อา" };
  const letter = (id: string, parcel: import("../lib/net/social-protocol").Parcel | null, sentAt = 0) =>
    ({ id, from, text: "สวัสดี", parcel, sentAt, read: false, claimed: false, returned: false });
  assert.equal(social.receiveMail(hub, letter("m1", { gold: 50 })), "ok");
  assert.equal(social.receiveMail(hub, letter("m1", { gold: 50 })), "ok");
  assert.equal(hub.mail.length, 1, "a repeated delivery is one letter");
  const taken = social.claimMail(hub, "m1");
  assert.deepEqual(taken, { parcel: { gold: 50 } });
  assert.deepEqual(social.claimMail(hub, "m1"), { error: "claimed" });
  assert.ok(hub.mail[0]!.read);
  // Fill the box: a new letter is refused, a returned one makes room.
  for (let i = 2; i <= SOCIAL_LIMITS.mailbox; i++) social.receiveMail(hub, letter(`m${i}`, null));
  assert.equal(social.receiveMail(hub, letter("extra", null)), "full");
  const back = social.returnedLetter(letter("x", { gold: 5 }), { username: "_post", name: "ม้าเร็ว" }, 9);
  assert.equal(social.receiveMail(hub, back), "ok");
  assert.equal(hub.mail.length, SOCIAL_LIMITS.mailbox);
  assert.ok(!hub.mail.some((m) => m.id === "m1"), "the read, claimed letter made room");
  // Blocked senders are refused (a return never is).
  social.block(hub, { username: "ccc", name: "" }, 1);
  assert.equal(social.receiveMail(hub, { ...letter("c1", null), from: { username: "ccc", name: "" } }), "blocked");
  // Delete: an untaken parcel goes home; a returned one deleted untaken is gone.
  const box = social.emptyHub("ddd");
  social.receiveMail(box, letter("p1", { gold: 7 }));
  social.receiveMail(box, back);
  assert.deepEqual(social.deleteMail(box, ["p1", back.id]).map((m) => m.id), ["p1"]);
  assert.equal(box.mail.length, 0);
  // Expiry: after 30 days the letter leaves; its untaken parcel goes home.
  social.receiveMail(box, letter("old", { gold: 3 }, 0));
  social.receiveMail(box, letter("new", null, SOCIAL_LIMITS.mailKeepMs));
  assert.deepEqual(social.expireMail(box, SOCIAL_LIMITS.mailKeepMs + 1).map((m) => m.id), ["old"]);
  assert.deepEqual(box.mail.map((m) => m.id), ["new"]);
});

await check("party: invite, join, four at most, leaving passes the lead, one alone dissolves, the bonus needs a companion on the map", () => {
  const doc = party.createParty("0123456789abcdef", { username: "aaa", name: "อา", location: "city_capital" }, 0);
  assert.equal(party.invite(doc, "bbb", "ccc", 1), "not_leader");
  assert.equal(party.invite(doc, "aaa", "aaa", 1), "self");
  assert.equal(party.invite(doc, "aaa", "bbb", 1), "ok");
  assert.equal(party.join(doc, { username: "zzz", name: "" }, 2), "not_invited");
  assert.equal(party.join(doc, { username: "bbb", name: "บี", location: "city_capital" }, 2), "ok");
  assert.equal(party.invite(doc, "aaa", "bbb", 3), "member");
  party.invite(doc, "aaa", "ccc", 3);
  party.invite(doc, "aaa", "ddd", 3);
  assert.equal(party.invite(doc, "aaa", "eee", 3), "full", "two members and two invites fill the party");
  // Invites lapse.
  assert.equal(party.join(doc, { username: "ccc", name: "" }, 3 + SOCIAL_LIMITS.inviteMs + 1), "not_invited");
  assert.equal(party.join(doc, { username: "ddd", name: "" }, 3 + SOCIAL_LIMITS.inviteMs + 1), "not_invited");
  // The bonus: another online member on the same map.
  assert.ok(party.bonusFor(doc, "aaa", "city_capital"));
  assert.ok(!party.bonusFor(doc, "aaa", "village_peach"));
  party.memberStatus(doc, "bbb", { online: false, location: "city_capital", body: null });
  assert.ok(!party.bonusFor(doc, "aaa", "city_capital"), "an offline member gives no bonus");
  assert.ok(!party.bonusFor(doc, "zzz", "city_capital"));
  // Chat burst.
  for (let i = 0; i < SOCIAL_LIMITS.chatBurst; i++) assert.ok(party.takePartyChat(doc, "aaa", 10 + i));
  assert.ok(!party.takePartyChat(doc, "aaa", 20));
  // Kick, lead, leave.
  assert.equal(party.kick(doc, "bbb", "aaa"), "not_leader");
  assert.equal(party.lead(doc, "aaa", "bbb"), "ok");
  assert.equal(doc.leader, "bbb");
  assert.deepEqual(party.leave(doc, "bbb"), { dissolved: true });
  assert.equal(doc.leader, "aaa", "the lead passes to who stayed longest");
  const view = party.viewOf(doc, 30);
  assert.deepEqual(view.members.map((m) => m.username), ["aaa"]);
});

await check("party bonus raises w-exp and move xp by a tenth, nothing else", () => {
  const spoils = { gold: 40, wExp: 100, items: [{ itemId: "x", count: 1 }], moves: [{ id: "s", kind: "skill" as const, xp: 20 }], hunt: null };
  const raised = withPartyBonus(spoils);
  assert.equal(raised.wExp, 110);
  assert.equal(raised.moves[0]!.xp, 22);
  assert.equal(raised.gold, 40);
  assert.deepEqual(raised.items, spoils.items);
  assert.ok(raised.partyBonus);
});

await check("the server's TypeScript half bundles from the repository alone (no npm package: Workers Builds has none)", async () => {
  const packages = new Set<string>();
  type Resolve = { path: string };
  type Builder = { onResolve(options: { filter: RegExp }, fn: (args: Resolve) => { path: string; external: boolean } | undefined): void };
  const bun = (globalThis as unknown as { Bun: { build(options: unknown): Promise<{ success: boolean; logs: unknown[] }> } }).Bun;
  const result = await bun.build({
    entrypoints: [`${process.cwd()}/server/worker/ts/entry.ts`],
    target: "browser",
    external: ["cloudflare:workers", "wuxia-rust"],
    plugins: [{
      name: "no-npm",
      setup(build: Builder) {
        build.onResolve({ filter: /.*/ }, (args: Resolve) => {
          if (/^(\.|\/|@\/)/.test(args.path) || args.path === "cloudflare:workers" || args.path === "wuxia-rust") return undefined;
          packages.add(args.path);
          return { path: args.path, external: true };
        });
      },
    }],
  });
  assert.ok(result.success, result.logs.join("\n"));
  assert.deepEqual([...packages], []);
});

if (failed) {
  console.error(`${failed} play-server check(s) failed`);
  process.exit(1);
}
process.exit(0);
