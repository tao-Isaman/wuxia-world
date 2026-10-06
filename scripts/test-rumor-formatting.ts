import assert from "node:assert/strict";
import { ARTS_BY_ID } from "../lib/game/data/arts";
import { ITEMS_BY_ID } from "../lib/world/data/items";
import { getNamedDefault } from "../lib/world/data/named-npcs";
import { NPC_EVENT_TEMPLATES, PLAYER_ECHO_TEMPLATES, WARNING_TEMPLATES, renderTemplate } from "../lib/world/data/rumor-templates";
import { SECT_MEMBERSHIPS } from "../lib/world/data/sect-memberships";
import { tickAllNamedNpcs } from "../lib/world/npc-tick";
import { generateNpcEventEcho, generatePlayerEcho, generateWarning } from "../lib/world/rumor-engine";
import type { NpcEventKind, Rumor, WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const npcId = "sect_shaolin_abbot_huiyuan";
const random = Math.random;
const warn = console.warn;
const warnings: unknown[][] = [];
console.warn = (...args) => { warnings.push(args); };
function sequence(...rolls: number[]) {
  let index = 0;
  Math.random = () => rolls[index++] ?? 0.5;
}
function readable(rumor: Rumor) {
  assert.doesNotMatch(rumor.text, /\{\w+\}/, rumor.text);
  assert.doesNotMatch(rumor.text, /\b(?:shaolin|wudang|huashan|diamond|jade)\b/, "IDs must resolve to display names");
}

try {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Rumor formatting test" });
  assert.equal(useWorldStore.getState().joinSect("shaolin").ok, true);
  const baseline: WorldStateData = clone(useWorldStore.getState());
  baseline.rumorSeenLog = [{ rumorId: baseline.rumorPool[0].id, dayHeard: baseline.day, location: "city_capital" }];
  baseline.rumorArchive = [{ id: "earlier_news", about: npcId, truth: "true", expiredDay: baseline.day }];
  let variants = 0;

  // Force every authored template, with the payload field names the live
  // tick engine supplies and the circumstances its `when` asks for. NPC
  // events really happened (Liveness 2.0): their rumors are always true.
  for (const [kind, templates] of Object.entries(NPC_EVENT_TEMPLATES)) {
    for (let index = 0; index < templates.length; index++) {
      const tpl = templates[index];
      const state = clone(baseline);
      state.npcExt[npcId] = clone(getNamedDefault(npcId)!);
      let payload: Record<string, string | number | boolean> = {};
      if (kind === "master_art" && tpl.when?.art !== false) payload = { artId: "diamond" };
      if (kind === "found_treasure") payload = { itemId: "jade", locationId: "city_capital" };
      if (kind === "sect_promotion") payload = { sect: "shaolin", rank: 9 };
      if (kind === "journey") payload = { purpose: tpl.when?.purpose ?? "wander", dest: "sect_wudang", sect: "wudang" };
      if (kind === "betray_sect") {
        state.npcExt[npcId].sect = null; // live tick clears membership before echo
        payload = { formerSect: "huashan" };
      }
      if (tpl.when?.sect === false) state.npcExt[npcId].sect = null;
      // Pick exactly this template among those its circumstances allow.
      const allowed = templates.filter((t) => (!t.when?.purpose || t.when.purpose === payload.purpose)
        && (t.when?.sect === undefined || t.when.sect === !!(state.npcExt[npcId].sect ?? payload.sect ?? payload.formerSect))
        && (t.when?.art === undefined || t.when.art === !!payload.artId));
      const at = allowed.indexOf(tpl);
      assert.ok(at >= 0, `${kind}[${index}] is reachable`);
      sequence((at + 0.25) / allowed.length);
      const id = generateNpcEventEcho({ state, kind: kind as NpcEventKind, npcId,
        partnerNpcId: "sect_wudang_master_qingxu", locationId: "city_capital", payload });
      assert.ok(id, `${kind}[${index}] made a rumor`);
      const rumor = state.rumorPool.at(-1)!;
      readable(rumor);
      assert.equal(rumor.channel, tpl.channel);
      assert.equal(rumor.truth, "true", "NPC news tells what happened");
      assert.equal(rumor.source, "npc_event");
      assert.equal(rumor.about, npcId);
      assert.equal(rumor.refersToEvent?.eventKind, kind);
      if (kind === "master_art" && payload.artId) assert.ok(rumor.text.includes(ARTS_BY_ID.get("diamond")!.n));
      assert.deepEqual(state.rumorPool.slice(0, -1), baseline.rumorPool, "new formatting does not rewrite saved rumors");
      assert.deepEqual(state.rumorSeenLog, baseline.rumorSeenLog);
      assert.deepEqual(state.rumorArchive, baseline.rumorArchive);
      variants++;
    }
  }
  for (const [actionId, templates] of Object.entries(PLAYER_ECHO_TEMPLATES)) {
    for (let index = 0; index < templates.length; index++) {
      for (const truthRoll of [0.01, 0.2, 0.9]) {
        const state = clone(baseline);
        if (actionId === "sect_leave_or_betray") state.sectMembership.shaolin!.status = "resigned";
        sequence((index + 0.25) / templates.length, truthRoll);
        generatePlayerEcho({ state, actionId, targetNpcId: npcId });
        const rumor = state.rumorPool.at(-1)!;
        readable(rumor);
        if (actionId.startsWith("sect_")) assert.ok(rumor.text.includes(SECT_MEMBERSHIPS.shaolin.name));
        assert.equal(rumor.channel, templates[index].channel);
        assert.deepEqual(state.rumorSeenLog, baseline.rumorSeenLog);
        assert.deepEqual(state.rumorArchive, baseline.rumorArchive);
        variants++;
      }
    }
  }
  for (const warningKind of Object.keys(WARNING_TEMPLATES)) {
    const state = clone(baseline);
    generateWarning({ state, warningKind, triggerDay: state.day + 7, locationId: "city_capital" });
    readable(state.rumorPool.at(-1)!);
    variants++;
  }
  console.log(`PASS ${variants} generated template/truth combinations: readable names, no unresolved tokens, unchanged channel/event identity and existing history`);

  const state = clone(baseline);
  state.npcExt[npcId] = { ...clone(getNamedDefault(npcId)!), sect: "wudang" };
  sequence(0, 0.9);
  generateNpcEventEcho({ state, kind: "master_art", npcId, locationId: "sect_wudang", payload: { artId: "diamond" } });
  assert.ok(state.rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.wudang.name), "current membership overrides authored default");
  assert.ok(state.rumorPool.at(-1)!.text.includes(ARTS_BY_ID.get("diamond")!.n));
  sequence(0, 0.9);
  generateNpcEventEcho({ state, kind: "found_treasure", npcId, locationId: "city_capital", payload: { itemId: "jade" } });
  assert.ok(state.rumorPool.at(-1)!.text.includes(ITEMS_BY_ID.get("jade")!.name));
  sequence(0, 0.9);
  generateNpcEventEcho({ state, kind: "betray_sect", npcId, locationId: "city_capital", payload: { formerSect: "huashan" } });
  assert.ok(state.rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.huashan.name), "event's former sect takes precedence over current/default membership");
  const unnamed = clone(baseline);
  unnamed.sectMembership.wudang = clone(unnamed.sectMembership.shaolin!);
  sequence(0, 0.9);
  generatePlayerEcho({ state: unnamed, actionId: "sect_rank_up" });
  assert.ok(unnamed.rumorPool.at(-1)!.text.includes("ที่ไม่เปิดเผยชื่อ"));
  assert.ok(!unnamed.rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.shaolin.name));
  assert.ok(!unnamed.rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.wudang.name));
  const wanderer = clone(baseline);
  wanderer.npcExt[npcId] = { ...clone(getNamedDefault(npcId)!), sect: null };
  sequence(0, 0.9);
  generateNpcEventEcho({ state: wanderer, kind: "travel", npcId, locationId: "city_capital" });
  assert.ok(!wanderer.rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.shaolin.name), "a departed NPC is not silently reattached to its authored sect");
  readable(wanderer.rumorPool.at(-1)!);
  console.log("PASS exact art/item names, runtime/former sect precedence, and unnamed fallback without invented art or guessed membership");

  Math.random = () => 0.5;
  const ticking = clone(baseline);
  ticking.npcExt[npcId] = clone(getNamedDefault(npcId)!);
  // A near-complete authored goal deterministically exercises the live
  // tick's artId payload without relying on random long-term progress.
  ticking.npcExt[npcId].goals.find(goal => goal.kind === "master_art")!.progress = 99;
  for (let day = 8; day <= 91; day += 7) {
    ticking.day = day;
    tickAllNamedNpcs(ticking, { currentDay: day });
  }
  const echoes = ticking.rumorPool.filter(rumor => rumor.source === "npc_event");
  assert.ok(echoes.some(rumor => rumor.refersToEvent?.eventKind === "master_art"));
  for (const rumor of echoes) readable(rumor);
  // Test the existing action callers, which do not supply a sectId.
  useWorldStore.setState({ sectMembership: { shaolin: { ...useWorldStore.getState().sectMembership.shaolin!, points: 100 } } });
  assert.equal(useWorldStore.getState().upgradeSectRank("shaolin").ok, true);
  assert.ok(useWorldStore.getState().rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.shaolin.name));
  assert.equal(useWorldStore.getState().resignSect("shaolin").ok, true);
  assert.ok(useWorldStore.getState().rumorPool.at(-1)!.text.includes(SECT_MEMBERSHIPS.shaolin.name));
  for (const rumor of useWorldStore.getState().rumorPool) readable(rumor);
  assert.equal(warnings.length, 0, `runtime emitted no unresolved-token warnings: ${JSON.stringify(warnings)}`);
  console.log(`PASS real 90-day NPC ticks (${echoes.length} echoes) and store join/rank-up/resign actions: no unresolved-token warnings`);

  // Keep authoring typo diagnostics; the fix supplies real template data,
  // rather than stripping unknown placeholders and hiding future errors.
  assert.equal(renderTemplate("{authoring_typo}", {}), "{authoring_typo}");
  assert.equal(warnings.length, process.env.NODE_ENV === "production" ? 0 : 1);
  console.log("PASS unknown-token authoring diagnostic remains intact");
} finally {
  Math.random = random;
  console.warn = warn;
}
