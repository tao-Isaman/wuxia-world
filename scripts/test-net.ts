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
  assert.deepEqual(sockets[0].sent[0], { t: "hello", v: 2, name: "หลี่", body: "f1", x: 300, y: 400, dir: "E" });
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
  // Map chat: a line said here reaches the chat and floats over the speaker; a repeat (old seq) is ignored.
  const heard: string[] = [];
  const off = session.onChat((line) => heard.push(`${line.name}:${line.text}`));
  const refused: string[] = [];
  session.onChatError((code) => refused.push(code));
  assert.ok(session.say("สวัสดี"));
  assert.deepEqual(sockets[0].sent.at(-1), { t: "say", text: "สวัสดี" });
  sockets[0].fire("message", { t: "event", seq: 6, ev: { t: "said", id: "bob", name: "บ็อบ", text: "ไปกันเถอะ", at: 1 } });
  sockets[0].fire("message", { t: "event", seq: 6, ev: { t: "said", id: "bob", name: "บ็อบ", text: "ไปกันเถอะ", at: 1 } });
  assert.deepEqual(heard, ["บ็อบ:ไปกันเถอะ"]);
  assert.equal(session.bubble("home_player", "bob"), "ไปกันเถอะ");
  assert.equal(session.bubble("city_capital", "bob"), null, "bubbles belong to their map");
  assert.deepEqual(session.players("home_player").map((p) => p.id), ["bob"], "a chat line moves no one");
  sockets[0].fire("message", { t: "error", code: "too_fast", message: "" });
  assert.deepEqual(refused, ["too_fast"]);
  off();
  // A new map is a new room.
  session.report("city_capital", { x: 50, y: 60, dir: "N", moving: false });
  assert.equal(sockets.length, 2);
  assert.ok(sockets[1].url.includes("/rooms/city_capital/"));
  assert.equal(session.bubble("city_capital", "bob"), null, "a new room starts without bubbles");
  assert.equal(session.say("hi"), false, "not in the room yet");
  session.configure(null);
  assert.equal(session.status, "off");
});

// Server saves (lib/net/cloud-save.ts) against a fake server: one fetch stub
// answers like the worker would.
{
  const { cloudSave, SAVE_DEBOUNCE_MS } = await import("../lib/net/cloud-save");
  type Call = { method: string; url: string; body: unknown };
  const calls: Call[] = [];
  let answer: (call: Call) => { status: number; body: unknown } | "down" = () => ({ status: 200, body: { rev: 1, summary: null } });
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const call = { method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    const reply = answer(call);
    if (reply === "down") throw new TypeError("fetch failed");
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  }) as typeof fetch;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const save = (gold: number, hasGame = true) => JSON.stringify({ state: { hasGame, gold }, version: 27 });

  await check("cloud save: loads the rev, waits while paused, debounces to the newest save, builds on the rev", async () => {
    calls.length = 0;
    answer = (call) => call.method === "GET"
      ? { status: 200, body: { rev: 4, save: { version: 27, state: { hasGame: true, gold: 7 } } } }
      : { status: 200, body: { rev: (call.body as { rev: number }).rev + 1, summary: null } };
    cloudSave.select("http://srv", "tok", "c1");
    const loaded = await cloudSave.storage.getItem("wusia-world-v1");
    assert.equal(JSON.parse(String(loaded)).state.gold, 7);
    cloudSave.storage.setItem("wusia-world-v1", save(8));
    await wait(SAVE_DEBOUNCE_MS + 100);
    assert.equal(calls.filter((c) => c.method === "PUT").length, 0, "paused: nothing written");
    cloudSave.resume();
    cloudSave.storage.setItem("wusia-world-v1", save(9));
    cloudSave.storage.setItem("wusia-world-v1", save(10));
    cloudSave.storage.setItem("wusia-world-v1", save(10, false));
    await wait(SAVE_DEBOUNCE_MS + 100);
    const puts = calls.filter((c) => c.method === "PUT");
    assert.equal(puts.length, 1, "one write for a burst");
    assert.deepEqual(puts[0].body, { rev: 4, version: 27, state: { hasGame: true, gold: 10 } }, "the newest hero save, on rev 4");
    assert.equal(puts[0].url, "http://srv/characters/c1/save");
    assert.equal(cloudSave.status, "saved");
    cloudSave.storage.setItem("wusia-world-v1", save(11));
    await cloudSave.flush();
    assert.equal((calls.filter((c) => c.method === "PUT")[1].body as { rev: number }).rev, 5, "the next builds on the new rev");
  });

  await check("cloud save: a stale save stops writing (conflict); a refused one too (rejected)", async () => {
    calls.length = 0;
    answer = () => ({ status: 409, body: { error: "stale" } });
    cloudSave.storage.setItem("wusia-world-v1", save(12));
    await cloudSave.flush();
    assert.equal(cloudSave.status, "conflict");
    cloudSave.storage.setItem("wusia-world-v1", save(13));
    await cloudSave.flush();
    assert.equal(calls.length, 1, "no more writes after a conflict");
    cloudSave.select("http://srv", "tok", "c2");
    cloudSave.resume();
    answer = () => ({ status: 422, body: { error: "gold_too_fast", detail: null } });
    cloudSave.storage.setItem("wusia-world-v1", save(99_999));
    await cloudSave.flush();
    assert.equal(cloudSave.status, "rejected");
    assert.equal(cloudSave.lastError, "gold_too_fast");
  });

  await check("cloud save: no answer keeps the save and tries again; too fast waits a moment", async () => {
    cloudSave.select("http://srv", "tok", "c3");
    cloudSave.resume();
    calls.length = 0;
    answer = () => "down";
    cloudSave.storage.setItem("wusia-world-v1", save(20));
    await cloudSave.flush();
    assert.equal(cloudSave.status, "offline");
    answer = () => ({ status: 200, body: { rev: 1, summary: null } });
    await cloudSave.flush();
    assert.equal(cloudSave.status, "saved");
    assert.deepEqual((calls.at(-1)!.body as { state: unknown }).state, { hasGame: true, gold: 20 });
    let first = true;
    answer = () => (first ? ((first = false), { status: 429, body: { error: "too_fast" } }) : { status: 200, body: { rev: 2, summary: null } });
    cloudSave.storage.setItem("wusia-world-v1", save(21));
    await cloudSave.flush();
    await wait(1400);
    assert.equal(cloudSave.status, "saved");
    cloudSave.clear();
    assert.equal(cloudSave.status, "off");
  });
  await check("cloud save: a call that stores a save itself (a letter's parcel) writes what is pending first, holds writes, then builds on its rev", async () => {
    cloudSave.select("http://srv", "tok", "c4");
    cloudSave.resume();
    calls.length = 0;
    answer = (call) => ({ status: 200, body: { rev: (call.body as { rev: number }).rev + 1, summary: null } });
    cloudSave.storage.setItem("wusia-world-v1", save(30));
    const reply = await cloudSave.exclusive(async (at) => {
      assert.equal(at.rev, 1, "the pending save went first");
      assert.equal(at.id, "c4");
      cloudSave.storage.setItem("wusia-world-v1", save(31));
      await wait(SAVE_DEBOUNCE_MS + 100);
      assert.equal(calls.length, 1, "no write while the call runs");
      return { rev: 7 };
    });
    assert.equal(reply.rev, 7);
    await wait(SAVE_DEBOUNCE_MS + 100);
    assert.deepEqual(calls.at(-1)!.body, { rev: 7, version: 27, state: { hasGame: true, gold: 31 } });
    await assert.rejects(cloudSave.exclusive(async () => { throw new Error("refused"); }), /refused/);
    cloudSave.storage.setItem("wusia-world-v1", save(32));
    await cloudSave.flush();
    assert.equal((calls.at(-1)!.body as { state: { gold: number } }).state.gold, 32, "writes go on after a refused call");
    cloudSave.clear();
  });
  globalThis.fetch = realFetch;
}

if (failed) {
  console.error(`${failed} net check(s) failed`);
  process.exit(1);
}
process.exit(0);
