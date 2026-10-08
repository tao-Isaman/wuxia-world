// The game server end to end (docs/online.md), against a running server:
//   cd server/worker && npx wrangler dev --port 8787        (then)
//   GAME_SERVER_URL=http://127.0.0.1:8787 bun scripts/test-online-server.ts
// Two accounts sign up and log in, walk into the same room, see each other
// join, move and leave; a second login of one account replaces the first.
import assert from "node:assert/strict";
import { connectRoom, login, register, type RoomConnection } from "../lib/net/client";
import type { ServerMsg } from "../lib/net/protocol";

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

function open(token: string, name: string, x: number): Promise<{ conn: RoomConnection; inbox: ServerMsg[] }> {
  const inbox: ServerMsg[] = [];
  return new Promise((resolve) => {
    const conn = connectRoom({
      server, token, room,
      hello: { name, body: name.startsWith("ก") ? "f1" : "m1", x, y: 300, dir: "S" },
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
  assert.equal(health.protocol, 1);
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

if (failed) {
  console.error(`${failed} online check(s) failed`);
  process.exit(1);
}
process.exit(0);
