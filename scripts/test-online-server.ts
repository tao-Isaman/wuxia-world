// The game server end to end (docs/online.md), against a running server:
//   cd server/worker && npx wrangler dev --port 8787        (then)
//   GAME_SERVER_URL=http://127.0.0.1:8787 bun scripts/test-online-server.ts
// Two accounts sign up and log in, walk into the same room, see each other
// join, move and leave; a second login of one account replaces the first.
// Characters and saves: create / list / delete, saves the server checks
// (rev, rate, hero, numbers, gold allowance). The one shared world (the same
// for every account, echoes become rumors) and checked battles (the server
// stages the fight, replays the log, gives the verdict and the spoils; a
// killing of a simulated person reaches the world; a felled beast rests).
// Map chat, friends, whispers, mail with parcels and the party
// (docs/design/social.md).
import assert from "node:assert/strict";

// The world store runs here to build real saves (it needs a localStorage).
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => { if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args); };

const {
  ApiFailure, checkToken, claimMail, connectRoom, createCharacter, deleteCharacter, finishBattle, listCharacters, loadSave, loadSocial,
  loadWorld, logBattle, login, partyAction, postEcho, register, sendMail, socialAction, socialUrl, startBattle, storeSave,
} = await import("../lib/net/client");
type SocialPush = import("../lib/net/social-protocol").SocialPush;
type RoomConnection = import("../lib/net/client").RoomConnection;
type ServerMsg = import("../lib/net/protocol").ServerMsg;
type BattleStartReply = import("../lib/net/play-protocol").BattleStartReply;
const { useWorldStore } = await import("../store/world-store");
const { partializeSave } = await import("../store/world/persist");
const { SAVE_VERSION } = await import("../store/world/save-version");
const { setSessionAuto, startSession, stepSession } = await import("../lib/game/grid/session");
const { OPPONENTS } = await import("../lib/world/data/opponents");
const { BOSSES } = await import("../lib/world/data/bosses");
const { npcFoeFor } = await import("../lib/world/npc-life");

const server = (process.env.GAME_SERVER_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const run = Date.now().toString(36);
const room = `test_room_${run}`;

let failed = 0;
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

/** Wait until a message matching `pick` arrives (or time out). */
function next<T extends ServerMsg>(inbox: ServerMsg[], pick: (m: ServerMsg) => m is T, ms = 5000): Promise<T> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      const index = inbox.findIndex(pick);
      if (index >= 0) { resolve(inbox.splice(index, 1)[0] as T); return; }
      if (Date.now() - started > ms) { reject(new Error(`timed out; inbox: ${JSON.stringify(inbox)}`)); return; }
      setTimeout(poll, 20);
    };
    poll();
  });
}
const isWelcome = (m: ServerMsg): m is Extract<ServerMsg, { t: "welcome" }> => m.t === "welcome";
const isEvent = <K extends string>(kind: K) => (m: ServerMsg): m is Extract<ServerMsg, { t: "event" }> => m.t === "event" && m.ev.t === kind;
const isError = (code: string) => (m: ServerMsg): m is Extract<ServerMsg, { t: "error" }> => m.t === "error" && m.code === code;

function open(token: string, name: string, x: number, look?: { outfit: string; weapon: string | null }): Promise<{ conn: RoomConnection; inbox: ServerMsg[] }> {
  const inbox: ServerMsg[] = [];
  return new Promise((resolve) => {
    const conn = connectRoom({
      server, token, room,
      hello: { name, body: name.startsWith("ก") ? "f1" : "m1", x, y: 300, dir: "S", ...look },
      onMessage: (message) => inbox.push(message),
      onOpen: () => resolve({ conn, inbox }),
    });
  });
}

const ann = `ann_${run}`.slice(0, 20);
const bob = `bob_${run}`.slice(0, 20);
let annToken = "";
let bobToken = "";

await check("health answers with the protocol version", async () => {
  const health = await (await fetch(`${server}/health`)).json() as { ok: boolean; protocol: number };
  assert.equal(health.ok, true);
  assert.equal(health.protocol, 3);
  assert.equal((health as { auth?: string }).auth, "ready", "the server can reach its signing key (KeyObject)");
});

await check("sign up two accounts; a taken name, a short password and a wrong password are refused", async () => {
  annToken = (await register(server, ann, "secret-ann")).token;
  bobToken = (await register(server, bob, "secret-bob")).token;
  await assert.rejects(register(server, ann, "another-pass"), /taken/);
  await assert.rejects(register(server, `c_${run}`.slice(0, 20), "123"), /bad_password/);
  await assert.rejects(login(server, ann, "wrong-pass"), /wrong_login/);
  const again = await login(server, ann.toUpperCase(), "secret-ann");
  assert.equal(again.username, ann, "usernames are case-insensitive");
});

await check("a saved token can be checked: valid, or rejected once the server no longer accepts it", async () => {
  const me = await (await fetch(`${server}/auth/me?token=${encodeURIComponent(annToken)}`)).json() as { username: string; expires: number };
  assert.equal(me.username, ann);
  assert.ok(me.expires > Date.now());
  assert.equal(await checkToken(server, annToken), "valid");
  assert.equal(await checkToken(server, `${annToken.slice(0, -1)}${annToken.endsWith("A") ? "B" : "A"}`), "rejected");
  assert.equal(await checkToken(server, "nope"), "rejected");
});

await check("a room refuses a bad token", async () => {
  const response = await fetch(`${server}/rooms/${room}/ws?token=nope`, { headers: { Upgrade: "websocket" } });
  assert.equal(response.status, 401);
});

await check("two players in one room: welcome, join, move and leave arrive in order", async () => {
  const a = await open(annToken, "อาจารย์หลิว", 200);
  const welcomeA = await next(a.inbox, isWelcome);
  assert.equal(welcomeA.you, ann);
  assert.deepEqual(welcomeA.players.map((p) => p.id), [ann]);

  const b = await open(bobToken, "กาเหว่า", 600);
  const welcomeB = await next(b.inbox, isWelcome);
  assert.deepEqual(welcomeB.players.map((p) => p.id).sort(), [ann, bob].sort());
  const joined = await next(a.inbox, isEvent("joined"));
  assert.equal(joined.ev.t === "joined" && joined.ev.player.name, "กาเหว่า");
  assert.equal(joined.seq, welcomeB.seq, "bob's welcome is at the seq of his own join");

  // Ann walks right for a moment: Bob sees every step, in seq order.
  for (let i = 1; i <= 3; i++) {
    await new Promise((r) => setTimeout(r, 120));
    a.conn.move({ x: 200 + i * 12, y: 300, dir: "E", moving: true });
  }
  const seen: number[] = [];
  let lastSeq = welcomeB.seq;
  for (let i = 0; i < 3; i++) {
    const moved = await next(b.inbox, isEvent("moved"));
    assert.ok(moved.seq > lastSeq, "seq goes up");
    lastSeq = moved.seq;
    if (moved.ev.t === "moved") { assert.equal(moved.ev.id, ann); seen.push(moved.ev.x); }
  }
  assert.deepEqual(seen, [212, 224, 236]);

  // A teleport is refused and nobody hears of it.
  a.conn.move({ x: 950, y: 600, dir: "E", moving: true });
  await next(a.inbox, isError("too_fast"));

  b.conn.close();
  const left = await next(a.inbox, isEvent("left"));
  assert.ok(left.ev.t === "left" && left.ev.id === bob && left.ev.reason === "closed");
  a.conn.close();
});

await check("map chat: a line reaches everyone on the map with the speaker's name; empty, long and fast lines are refused", async () => {
  const a = await open(annToken, "อาจารย์หลิว", 200);
  await next(a.inbox, isWelcome);
  const b = await open(bobToken, "กาเหว่า", 600);
  await next(b.inbox, isWelcome);
  a.conn.say("  สวัสดีสหาย  ");
  const said = await next(b.inbox, isEvent("said"));
  assert.ok(said.ev.t === "said" && said.ev.id === ann && said.ev.name === "อาจารย์หลิว" && said.ev.text === "สวัสดีสหาย");
  await next(a.inbox, isEvent("said"));
  a.conn.say("   ");
  await next(a.inbox, isError("bad_text"));
  a.conn.say("ก".repeat(121));
  await next(a.inbox, isError("bad_text"));
  for (let i = 0; i < 5; i++) a.conn.say(`บรรทัด ${i}`);
  await next(a.inbox, isError("too_fast"));
  a.conn.close();
  b.conn.close();
});

await check("looks: an outfit and a carried weapon arrive with the player; a change is heard by all; bad or hurried looks are refused", async () => {
  const a = await open(annToken, "อาจารย์หลิว", 200, { outfit: "sect_emei", weapon: "eq_t1_w_long" });
  await next(a.inbox, isWelcome);
  const b = await open(bobToken, "กาเหว่า", 600);
  const welcome = await next(b.inbox, isWelcome);
  const annThere = welcome.players.find((p) => p.id === ann)!;
  assert.deepEqual([annThere.outfit, annThere.weapon], ["sect_emei", "eq_t1_w_long"]);
  assert.equal(welcome.players.find((p) => p.id === bob)!.outfit, "default", "no look given: the default");
  a.conn.look({ outfit: "tailor_ink", weapon: null });
  const looked = await next(b.inbox, isEvent("looked"));
  assert.ok(looked.ev.t === "looked" && looked.ev.id === ann && looked.ev.outfit === "tailor_ink" && looked.ev.weapon === null);
  a.conn.look({ outfit: "tailor_jade", weapon: null });
  await next(a.inbox, isError("too_fast"));
  await new Promise((r) => setTimeout(r, 600));
  a.conn.look({ outfit: "<script>", weapon: null });
  await next(a.inbox, isError("bad_profile"));
  a.conn.close();
  b.conn.close();
});

await check("logging in again elsewhere replaces the older socket", async () => {
  const first = await open(annToken, "อาจารย์หลิว", 100);
  await next(first.inbox, isWelcome);
  const watcher = await open(bobToken, "กาเหว่า", 500);
  await next(watcher.inbox, isWelcome);
  const second = await open(annToken, "อาจารย์หลิว", 120);
  const welcome = await next(second.inbox, isWelcome);
  assert.equal(welcome.players.filter((p) => p.id === ann).length, 1, "one Ann in the room");
  await next(first.inbox, isError("replaced"));
  const replaced = await next(watcher.inbox, isEvent("left"));
  assert.ok(replaced.ev.t === "left" && replaced.ev.reason === "replaced");
  const rejoined = await next(watcher.inbox, isEvent("joined"));
  assert.ok(rejoined.ev.t === "joined" && rejoined.ev.player.x === 120);
  // The replaced socket closing later does not make Ann leave.
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(watcher.inbox.filter(isEvent("left")).length, 0);
  second.conn.close();
  watcher.conn.close();
});

/** The code a refused call answered with. */
async function refusal(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiFailure) return error.code;
    throw error;
  }
  throw new Error("the call was accepted");
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function heroState(name: string, gold: number) {
  return { hasGame: true, day: 90, gold, wExp: 0, meridianPoints: 0, lastLocationId: "city_capital", inventory: { herb_common: 2 },
    inventoryEquipment: {}, sectMembership: {}, playerBuild: { name, artLevel: 1, stats: { STR: 5 }, skillLevels: { basic_punch: 1 } } };
}

await check("characters: none at first, created up to four with unique names, one deleted; only the owner sees them", async () => {
  assert.deepEqual(await listCharacters(server, annToken), []);
  const mei = await createCharacter(server, annToken, " เหมยหลิง ", "female");
  assert.equal(mei.name, "เหมยหลิง");
  assert.equal(mei.body, "f1");
  assert.equal(mei.rev, 0);
  assert.equal(await refusal(createCharacter(server, annToken, "เหมยหลิง", "male")), "name_taken");
  assert.equal(await refusal(createCharacter(server, annToken, "", "male")), "bad_name");
  for (const name of ["ข", "ค", "ง"]) await createCharacter(server, annToken, name, "male");
  assert.equal(await refusal(createCharacter(server, annToken, "จ", "male")), "too_many");
  assert.equal((await listCharacters(server, annToken)).length, 4);
  assert.deepEqual(await listCharacters(server, bobToken), [], "another account sees none of them");
  const extra = (await listCharacters(server, annToken)).find((c) => c.name === "ง")!;
  await deleteCharacter(server, annToken, extra.id);
  assert.equal(await refusal(deleteCharacter(server, annToken, extra.id)), "no_character");
  assert.equal(await refusal(deleteCharacter(server, bobToken, mei.id)), "no_character", "bob cannot delete ann's character");
  const response = await fetch(`${server}/characters`);
  assert.equal(response.status, 401, "no token, no list");
});

await check("saves: the server checks rev, pace, the hero, its numbers and the gold allowance", async () => {
  const mei = (await listCharacters(server, annToken)).find((c) => c.name === "เหมยหลิง")!;
  assert.deepEqual(await loadSave(server, annToken, mei.id), { rev: 0, save: null });
  const first = await storeSave(server, annToken, mei.id, 0, { version: 27, state: heroState("เหมยหลิง", 50) });
  assert.equal(first.rev, 1);
  assert.equal(first.summary?.gold, 50);
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 0, { version: 27, state: heroState("เหมยหลิง", 60) })), "stale");
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 1, { version: 27, state: heroState("เหมยหลิง", 60) })), "too_fast");
  await sleep(1100);
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 1, { version: 27, state: heroState("คนอื่น", 60) })), "name_mismatch");
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 1, { version: 27, state: heroState("เหมยหลิง", 5_000_000) })), "gold_too_fast");
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 1, { version: 26, state: heroState("เหมยหลิง", 60) })), "bad_version");
  const broken = heroState("เหมยหลิง", 60);
  (broken.playerBuild.skillLevels as Record<string, number>).basic_punch = 99;
  assert.equal(await refusal(storeSave(server, annToken, mei.id, 1, { version: 27, state: broken })), "bad_save");
  const second = await storeSave(server, annToken, mei.id, 1, { version: 27, state: heroState("เหมยหลิง", 80) });
  assert.equal(second.rev, 2);
  const loaded = await loadSave(server, annToken, mei.id);
  assert.equal(loaded.rev, 2);
  assert.equal(loaded.save?.version, 27);
  assert.equal((loaded.save?.state as { gold: number }).gold, 80);
  const listed = (await listCharacters(server, annToken)).find((c) => c.id === mei.id)!;
  assert.deepEqual([listed.rev, listed.summary?.day, listed.summary?.location], [2, 90, "city_capital"]);
});

await check("the shared world: one for every account; a deed becomes a rumor the server writes", async () => {
  const forAnn = await loadWorld(server, annToken);
  const forBob = await loadWorld(server, bobToken);
  assert.ok(!forAnn.same && !forBob.same);
  if (forAnn.same || forBob.same) return;
  assert.equal(forAnn.world.worldSeed, forBob.world.worldSeed, "the same world");
  assert.ok(Object.keys(forAnn.world.npcExt).length >= 30, "its people live on the server");
  assert.deepEqual(await loadWorld(server, annToken, forAnn.rev), { rev: forAnn.rev, same: true });
  const before = forAnn.world.rumorPool.length;
  const { rev } = await postEcho(server, annToken, {
    actionId: "sect_join", context: { archetype: "นักท่องยุทธ์", sceneId: "city_capital", sectId: "shaolin" },
  });
  assert.ok(rev > forAnn.rev);
  const after = await loadWorld(server, bobToken, forBob.rev);
  assert.ok(!after.same && after.world.rumorPool.length > before, "bob hears of ann's deed");
  assert.equal(await refusal(postEcho(server, annToken, { actionId: "made_up", context: { archetype: "นักท่องยุทธ์", sceneId: null, sectId: null } })), "bad_action");
  assert.equal(await refusal(postEcho(server, annToken, { actionId: "sect_join", context: { archetype: "<b>hi</b>", sceneId: null, sectId: null } })), "bad_context");
  assert.equal((await fetch(`${server}/world`)).status, 401, "no token, no world");
});

// ─── Checked battles ───────────────────────────────────────────────────
let heroRev = 0;
const heroId = (await listCharacters(server, bobToken).catch(() => []))[0]?.id ?? (await createCharacter(server, bobToken, "หลี่ทดสอบ", "male")).id;

/** Bob's hero, strong enough to win, standing before `pendingBattle`; saved on the server. */
async function standBefore(pendingBattle: Record<string, unknown>, gold = 0): Promise<void> {
  const store = useWorldStore.getState();
  if (!store.hasGame) store.startNewGame({ name: "หลี่ทดสอบ", gender: "male" });
  const s = useWorldStore.getState();
  const stats = Object.fromEntries(Object.keys(s.playerBuild!.stats).map((k) => [k, 900]));
  useWorldStore.setState({ playerBuild: { ...s.playerBuild!, stats: stats as never }, currentHp: 99_999, currentMp: 99_999, gold, pendingBattle: pendingBattle as never });
  await sleep(1100);
  const saved = await storeSave(server, bobToken, heroId, heroRev, { version: SAVE_VERSION, state: partializeSave(useWorldStore.getState()) as never });
  heroRev = saved.rev;
}

/** Play the server's fight here on auto, sending the log in parts; returns the local end and the verdict. */
async function fight(reply: BattleStartReply, tamper = false) {
  const session = startSession(reply.start.a, reply.start.b, { ...reply.start.opts, seed: reply.seed });
  setSessionAuto(session, true);
  for (let i = 0; i < 5000 && session.state.phase !== "over"; i++) stepSession(session);
  const log = [...session.commands!];
  if (tamper) log.splice(2, 0, ["a", 63, 0, 0]);
  const half = Math.floor(log.length / 2);
  const { at } = await logBattle(server, bobToken, heroId, { battleId: reply.battleId, from: 0, commands: log.slice(0, half) });
  assert.equal(at, half);
  // A repeated part (an answer lost on the way) is fine.
  await logBattle(server, bobToken, heroId, { battleId: reply.battleId, from: 0, commands: log.slice(0, half) });
  const verdict = await finishBattle(server, bobToken, heroId, { battleId: reply.battleId, from: half, commands: log.slice(half) });
  return { session, verdict };
}

await check("battles: the server stages the saved fight, replays the log and pays a win; its gold lifts the allowance", async () => {
  const foe = OPPONENTS.find((o) => o.ti === 5 && o.category === "human" && !o.boss && !o.id.startsWith("law_"))!;
  // The whole first allowance spent at once.
  await standBefore({ opponentId: foe.id, onWin: "city_capital", onLose: "city_capital" }, 100_000);
  const reply = await startBattle(server, bobToken, heroId);
  assert.equal(reply.start.b.name.length > 0, true);
  const { session, verdict } = await fight(reply);
  assert.equal(verdict.winner, session.state.winner, "the server saw the same fight");
  assert.equal(verdict.hA, session.state.hA);
  assert.equal(verdict.winner, "A");
  assert.ok(verdict.spoils && verdict.spoils.gold >= 350, "a T5 purse");
  // Asking again gives the same verdict.
  assert.deepEqual(await finishBattle(server, bobToken, heroId, { battleId: reply.battleId, from: session.commands!.length, commands: [] }), verdict);
  // The purse can be saved at once though the allowance is spent.
  useWorldStore.setState({ gold: 100_000 + verdict.spoils!.gold, pendingBattle: null });
  await sleep(1100);
  heroRev = (await storeSave(server, bobToken, heroId, heroRev, { version: SAVE_VERSION, state: partializeSave(useWorldStore.getState()) as never })).rev;
});

await check("battles: a log that does not fit the fight is refused, and no fight without a saved one", async () => {
  await standBefore({ opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital" }, 100_000);
  const reply = await startBattle(server, bobToken, heroId);
  assert.equal(await refusal(fight(reply, true)), "bad_log");
  await standBefore(null as never, 100_000);
  assert.equal(await refusal(startBattle(server, bobToken, heroId)), "no_battle");
  assert.equal(await refusal(startBattle(server, annToken, heroId)), "no_character", "only the owner's characters");
});

await check("battles: a felled beast rests for this hero; a killing of a simulated person reaches the world", async () => {
  const boss = BOSSES[0]!;
  await standBefore({ opponentId: boss.id, onWin: boss.lair, onLose: "home_player" }, 100_000);
  const { verdict } = await fight(await startBattle(server, bobToken, heroId));
  assert.equal(verdict.winner, "A");
  assert.equal(await refusal(startBattle(server, bobToken, heroId)), "boss_resting");
  const world = await loadWorld(server, bobToken);
  assert.ok(!world.same);
  if (world.same) return;
  const victim = Object.entries(world.world.npcExt).find(([, ext]) => ext.status !== "dead" && ext.sectRank < 10)![0];
  useWorldStore.setState({ npcExt: world.world.npcExt });
  await standBefore({ opponentId: npcFoeFor(useWorldStore.getState(), victim), onWin: "city_capital", onLose: "city_capital", killNpcId: victim }, 100_000);
  const killed = await fight(await startBattle(server, bobToken, heroId));
  assert.equal(killed.verdict.winner, "A");
  const after = await loadWorld(server, annToken);
  assert.ok(!after.same && after.world.npcExt[victim]?.status === "dead", "dead for everyone");
});

// ─── Friends, whispers, mail, party (docs/design/social.md) ───────────

/** A player's social socket: what their hub pushes, and a way to tell it where they stand. */
function openSocial(token: string): Promise<{ inbox: SocialPush[]; status: (name: string, location: string | null, characterId?: string) => void; close: () => void }> {
  const inbox: SocialPush[] = [];
  const socket = new WebSocket(socialUrl(server, token));
  socket.addEventListener("message", (event) => { try { inbox.push(JSON.parse(String(event.data)) as SocialPush); } catch { /* skip */ } });
  return new Promise((resolve, reject) => {
    socket.addEventListener("error", () => reject(new Error("social socket failed")));
    socket.addEventListener("open", () => resolve({
      inbox,
      status: (name, location, characterId) => socket.send(JSON.stringify({ t: "status", name, body: "m1", location, characterId: characterId ?? null })),
      close: () => socket.close(1000, "bye"),
    }));
  });
}
function pushed<K extends SocialPush["t"]>(inbox: SocialPush[], t: K, ms = 5000, pick: (m: Extract<SocialPush, { t: K }>) => boolean = () => true): Promise<Extract<SocialPush, { t: K }>> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      const index = inbox.findIndex((m) => m.t === t && pick(m as Extract<SocialPush, { t: K }>));
      if (index >= 0) { resolve(inbox.splice(index, 1)[0] as Extract<SocialPush, { t: K }>); return; }
      if (Date.now() - started > ms) { reject(new Error(`no ${t}; inbox: ${JSON.stringify(inbox)}`)); return; }
      setTimeout(poll, 20);
    };
    poll();
  });
}

const annSocial = await openSocial(annToken);
const bobSocial = await openSocial(bobToken);
annSocial.status("เหมยหลิง", "city_capital");
bobSocial.status("หลี่ทดสอบ", useWorldStore.getState().currentSceneId, heroId);
await sleep(300);

await check("friends: a request is pushed, accepted on the other side; both see each other online and where", async () => {
  assert.equal(await refusal(socialAction(server, annToken, "friends/request", { to: "nobody_here_x" })), "no_player");
  assert.equal(await refusal(socialAction(server, annToken, "friends/request", { to: ann })), "bad_target");
  const asked = await socialAction<{ outcome: string }>(server, annToken, "friends/request", { to: bob });
  assert.equal(asked.outcome, "requested");
  const request = await pushed(bobSocial.inbox, "friend_request");
  assert.equal(request.from.username, ann);
  assert.equal(request.from.name, "เหมยหลิง", "the hero name the hub last heard");
  await socialAction(server, bobToken, "friends/accept", { from: ann });
  await pushed(annSocial.inbox, "friend_added", 5000, (m) => m.friend.username === bob);
  const forAnn = await loadSocial(server, annToken);
  const friend = forAnn.friends.find((f) => f.username === bob)!;
  assert.ok(friend.online, "bob's socket is open");
  assert.equal(friend.name, "หลี่ทดสอบ");
  assert.equal(friend.location, useWorldStore.getState().currentSceneId);
  assert.equal(await refusal(socialAction(server, annToken, "friends/request", { to: bob })), "already");
  // Bob moves: Ann hears it.
  bobSocial.status("หลี่ทดสอบ", "city_capital", heroId);
  await pushed(annSocial.inbox, "friend_status", 5000, (m) => m.friend.username === bob && m.friend.location === "city_capital");
});

await check("whispers reach the other player, are kept for later, and are rate limited", async () => {
  const sent = await socialAction<{ whisper: { text: string } }>(server, annToken, "whisper", { to: bob, text: "ไปดื่มชากันไหม" });
  assert.equal(sent.whisper.text, "ไปดื่มชากันไหม");
  const got = await pushed(bobSocial.inbox, "whisper");
  assert.ok(!got.whisper.mine && got.whisper.with.username === ann);
  const kept = await loadSocial(server, bobToken);
  assert.ok(kept.whispers.some((w) => w.text === "ไปดื่มชากันไหม"));
  assert.equal(await refusal(socialAction(server, annToken, "whisper", { to: bob, text: "" })), "bad_text");
  let refusedFast = "";
  for (let i = 0; i < 6 && !refusedFast; i++) {
    refusedFast = await socialAction(server, annToken, "whisper", { to: bob, text: `${i}` }).then(() => "", (e) => (e as InstanceType<typeof ApiFailure>).code);
  }
  assert.equal(refusedFast, "too_fast");
});

await check("mail: a parcel must leave the sender's save; the letter arrives; taking it once grants the gold", async () => {
  const mei = (await listCharacters(server, annToken)).find((c) => c.name === "เหมยหลิง")!;
  let { rev } = await loadSave(server, annToken, mei.id);
  await sleep(1100);
  // A save that kept the gold is refused (not_enough) and nothing is sent.
  const cheat = { to: bob, text: "ทองให้", parcel: { gold: 50 }, characterId: mei.id, rev, version: 27, state: heroState("เหมยหลิง", 80) };
  assert.equal(await refusal(sendMail(server, annToken, cheat)), "not_enough");
  assert.equal(await refusal(sendMail(server, annToken, { ...cheat, parcel: { gold: 500 }, state: heroState("เหมยหลิง", 0) })), "not_enough", "ann has only 80");
  assert.equal(await refusal(sendMail(server, annToken, { ...cheat, parcel: { itemId: "no_such", count: 1 } })), "not_mailable");
  const sent = await sendMail(server, annToken, { ...cheat, state: heroState("เหมยหลิง", 20) });
  assert.ok(sent.delivered && sent.rev === rev + 1);
  rev = sent.rev;
  assert.equal(((await loadSave(server, annToken, mei.id)).save?.state as { gold: number }).gold, 20, "the paid save is the one kept");
  const mail = await pushed(bobSocial.inbox, "mail");
  assert.deepEqual(mail.mail.parcel, { gold: 50 });
  assert.equal(mail.mail.from.username, ann);
  // Reading does not take it; claiming does, once.
  await socialAction(server, bobToken, "mail/read", { ids: [mail.mail.id] });
  const box = await loadSocial(server, bobToken);
  assert.ok(box.mail.find((m) => m.id === mail.mail.id)?.read && !box.mail.find((m) => m.id === mail.mail.id)?.claimed);
  const taken = await claimMail(server, bobToken, mail.mail.id, heroId);
  assert.deepEqual(taken.parcel, { gold: 50 });
  assert.equal(await refusal(claimMail(server, bobToken, mail.mail.id, heroId)), "claimed");
  // An item parcel; deleting it untaken sends it home to the sender.
  await sleep(1100);
  const withPotion = { ...heroState("เหมยหลิง", 10), inventory: { potion: 3 } };
  rev = (await storeSave(server, annToken, mei.id, rev, { version: 27, state: withPotion })).rev;
  await sleep(1100);
  const potionMail = await sendMail(server, annToken, { to: bob, text: "ยาให้", parcel: { itemId: "potion", count: 2 }, characterId: mei.id, rev, version: 27,
    state: { ...heroState("เหมยหลิง", 0), inventory: { potion: 1 } } });
  assert.ok(potionMail.delivered);
  const arrived = await pushed(bobSocial.inbox, "mail");
  await socialAction(server, bobToken, "mail/delete", { ids: [arrived.mail.id] });
  const back = await pushed(annSocial.inbox, "mail");
  assert.ok(back.mail.returned);
  assert.deepEqual(back.mail.parcel, { itemId: "potion", count: 2 });
  const home = await claimMail(server, annToken, back.mail.id, mei.id);
  assert.deepEqual(home.parcel, { itemId: "potion", count: 2 });
  assert.equal(await refusal(sendMail(server, annToken, { ...cheat, to: "nobody_here_x" })), "no_player");
});

await check("party: invite, accept, party chat; a companion on the map lifts a checked win; leaving dissolves a party of two", async () => {
  assert.equal(await refusal(partyAction(server, annToken, "chat", { text: "hi" })), "no_party");
  const { partyId } = await partyAction<{ partyId: string }>(server, annToken, "invite", { to: bob });
  const invite = await pushed(bobSocial.inbox, "party_invite");
  assert.equal(invite.invite.partyId, partyId);
  await partyAction(server, bobToken, "accept", { partyId });
  const view = await pushed(annSocial.inbox, "party", 5000, (m) => (m.party?.members.length ?? 0) === 2);
  assert.equal(view.party!.leader, ann);
  await partyAction(server, bobToken, "chat", { text: "ออกเดินทางกัน" });
  const line = await pushed(annSocial.inbox, "party_chat");
  assert.equal(line.text, "ออกเดินทางกัน");
  assert.equal(line.from.username, bob);
  // Ann stands where Bob fights: the win pays the party bonus.
  const foe = OPPONENTS.find((o) => o.ti === 2 && o.category === "human" && !o.boss && !o.id.startsWith("law_"))!;
  await standBefore({ opponentId: foe.id, onWin: "city_capital", onLose: "city_capital" }, 100_000);
  const location = useWorldStore.getState().currentSceneId;
  annSocial.status("เหมยหลิง", location);
  await pushed(bobSocial.inbox, "party", 5000, (m) => m.party?.members.find((x) => x.username === ann)?.location === location);
  const { verdict } = await fight(await startBattle(server, bobToken, heroId));
  assert.equal(verdict.winner, "A");
  assert.equal(verdict.spoils?.partyBonus, true);
  // Ann walks away: no bonus.
  annSocial.status("เหมยหลิง", "village_far_away");
  await pushed(bobSocial.inbox, "party", 5000, (m) => m.party?.members.find((x) => x.username === ann)?.location === "village_far_away");
  await standBefore({ opponentId: foe.id, onWin: "city_capital", onLose: "city_capital" }, 100_000);
  const alone = await fight(await startBattle(server, bobToken, heroId));
  assert.ok(!alone.verdict.spoils?.partyBonus);
  // Ann leaves: two less one dissolves; Bob is told.
  await partyAction(server, annToken, "leave", {});
  await pushed(bobSocial.inbox, "party", 5000, (m) => m.party === null);
  assert.equal((await loadSocial(server, bobToken)).party, null);
});

await check("block: the blocked player is unfriended and their whispers, requests and mail are refused", async () => {
  await sleep(10_500); // the whisper burst above
  await socialAction(server, bobToken, "block", { username: ann, name: "เหมยหลิง" });
  await pushed(annSocial.inbox, "friend_removed", 5000, (m) => m.username === bob);
  assert.equal(await refusal(socialAction(server, annToken, "whisper", { to: bob, text: "ฮัลโหล" })), "refused");
  assert.equal(await refusal(socialAction(server, annToken, "friends/request", { to: bob })), "refused");
  assert.equal(await refusal(partyAction(server, annToken, "invite", { to: bob })), "refused");
  const mei = (await listCharacters(server, annToken)).find((c) => c.name === "เหมยหลิง")!;
  const { rev } = await loadSave(server, annToken, mei.id);
  assert.equal(await refusal(sendMail(server, annToken, { to: bob, text: "ขอโทษ", parcel: null, characterId: mei.id, rev, version: 27, state: heroState("เหมยหลิง", 0) })), "refused");
  assert.equal((await loadSave(server, annToken, mei.id)).rev, rev, "no postage paid for a refused letter");
  const forBob = await loadSocial(server, bobToken);
  assert.ok(forBob.blocked.some((b) => b.username === ann) && !forBob.friends.some((f) => f.username === ann));
  await socialAction(server, bobToken, "unblock", { username: ann });
  assert.equal(await refusal(fetch(`${server}/social`).then((r) => { if (!r.ok) throw new ApiFailure("bad_token", r.status); })), "bad_token");
});
annSocial.close();
bobSocial.close();

if (failed) {
  console.error(`${failed} online check(s) failed`);
  process.exit(1);
}
process.exit(0);
