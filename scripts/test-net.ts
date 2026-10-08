// The client side of online play (lib/net, docs/online.md), without a server:
// the presence reducer applies the server's events in seq order and asks for
// a resync on a gap; the session throttles moves and switches rooms with the map.
import assert from "node:assert/strict";
import { applyServerMsg, emptyPresence, othersIn, type PresenceState } from "../lib/net/presence";
import type { Presence, ServerMsg } from "../lib/net/protocol";

let failed = 0;
function check(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve().then(fn).then(
    () => console.log(`PASS ${name}`),
    (error) => { failed++; console.error(`FAIL ${name}`); console.error(error); },
  );
}

const ann: Presence = { id: "ann", name: "หลี่", body: "f1", x: 100, y: 200, dir: "S", moving: false, at: 1 };
const bob: Presence = { id: "bob", name: "จาง", body: "m1", x: 500, y: 300, dir: "W", moving: false, at: 2 };
const welcome: ServerMsg = { t: "welcome", you: "ann", room: "home_player", epoch: "e1", seq: 4, players: [ann, bob] };
const fold = (state: PresenceState, ...messages: ServerMsg[]) => messages.reduce((s, m) => applyServerMsg(s, m).state, state);

await check("a welcome is the room's snapshot; others leave us out", () => {
  const state = fold(emptyPresence(), welcome);
  assert.equal(state.seq, 4);
  assert.deepEqual(othersIn(state).map((p) => p.id), ["bob"]);
});

await check("events apply in seq order: joined, moved, left", () => {
  const carl: Presence = { ...bob, id: "carl", name: "เฉิน" };
  const state = fold(emptyPresence(), welcome,
    { t: "event", seq: 5, ev: { t: "joined", player: carl } },
    { t: "event", seq: 6, ev: { t: "moved", id: "bob", x: 480, y: 300, dir: "W", moving: true, at: 9 } },
    { t: "event", seq: 7, ev: { t: "left", id: "carl", reason: "closed" } });
  assert.equal(state.seq, 7);
  assert.deepEqual(Object.keys(state.players).sort(), ["ann", "bob"]);
  assert.equal(state.players.bob.x, 480);
  assert.equal(state.players.bob.moving, true);
});

await check("a gap in seq is not applied and asks for a resync; old or early events are ignored", () => {
  const state = fold(emptyPresence(), welcome);
  const gap = applyServerMsg(state, { t: "event", seq: 9, ev: { t: "left", id: "bob", reason: "closed" } });
  assert.equal(gap.resync, true);
  assert.equal(gap.state, state, "nothing changed");
  const old = applyServerMsg(state, { t: "event", seq: 3, ev: { t: "left", id: "bob", reason: "closed" } });
  assert.equal(old.resync, false);
  assert.equal(old.state, state);
  const early = applyServerMsg(emptyPresence(), { t: "event", seq: 1, ev: { t: "left", id: "bob", reason: "closed" } });
  assert.equal(early.resync, false, "before the welcome, events are simply skipped");
});

await check("the session joins with the hero's real position, throttles moves and switches rooms with the map", async () => {
  // A fake WebSocket that records what the session sends.
  const sockets: { url: string; sent: unknown[]; fire: (type: string, data?: unknown) => void }[] = [];
  class FakeSocket {
    static OPEN = 1;
    readyState = 0;
    listeners: Record<string, ((event: unknown) => void)[]> = {};
    record: (typeof sockets)[number];
    constructor(public url: string) {
      this.record = { url, sent: [], fire: (type, data) => {
        if (type === "open") this.readyState = 1;
        for (const listener of this.listeners[type] ?? []) listener(type === "message" ? { data: JSON.stringify(data) } : { code: 1006, reason: "" });
      } };
      sockets.push(this.record);
    }
    addEventListener(type: string, listener: (event: unknown) => void) { (this.listeners[type] ??= []).push(listener); }
    send(text: string) { this.record.sent.push(JSON.parse(text)); }
    close() { this.readyState = 3; }
  }
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: FakeSocket });
  const { OnlineSession, MOVE_INTERVAL_MS } = await import("../lib/net/session");
  const session = new OnlineSession();
  session.report("home_player", { x: 1, y: 1, dir: "S", moving: false });
  assert.equal(sockets.length, 0, "not signed in: nothing opens");
  session.configure({ server: "http://game.test", token: "tok", name: "หลี่", body: "f1" });
  session.report("home_player", { x: 300, y: 400, dir: "E", moving: false });
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].url, "ws://game.test/rooms/home_player/ws?token=tok");
  sockets[0].fire("open");
  assert.deepEqual(sockets[0].sent[0], { t: "hello", v: 1, name: "หลี่", body: "f1", x: 300, y: 400, dir: "E" });
  sockets[0].fire("message", welcome);
  assert.equal(session.status, "online");
  assert.deepEqual(session.players("home_player").map((p) => p.id), ["bob"]);
  assert.deepEqual(session.players("city_capital"), [], "another map's players are none of ours");
  // Starting to walk goes out at once; the next step waits for the interval.
  session.report("home_player", { x: 302, y: 400, dir: "E", moving: true });
  session.report("home_player", { x: 304, y: 400, dir: "E", moving: true });
  assert.equal(sockets[0].sent.length, 2);
  await new Promise((r) => setTimeout(r, MOVE_INTERVAL_MS + 20));
  session.report("home_player", { x: 320, y: 400, dir: "E", moving: true });
  assert.deepEqual(sockets[0].sent.at(-1), { t: "move", x: 320, y: 400, dir: "E", moving: true });
  // A new map is a new room.
  session.report("city_capital", { x: 50, y: 60, dir: "N", moving: false });
  assert.equal(sockets.length, 2);
  assert.ok(sockets[1].url.includes("/rooms/city_capital/"));
  session.configure(null);
  assert.equal(session.status, "off");
});

if (failed) {
  console.error(`${failed} net check(s) failed`);
  process.exit(1);
}
process.exit(0);
