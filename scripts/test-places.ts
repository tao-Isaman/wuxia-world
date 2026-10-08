// Living places: people, quests, activities and meetings in villages, towns and
// homes; ยุทธจักร skill quests; wandering NPCs; NPC presence (assassinated /
// kidnapped); gifts.
//   bun run test:places
import assert from "node:assert/strict";
import { SKILLS } from "../lib/game/data/skills";
import { ARTS } from "../lib/game/data/arts";
import { getItem, getNpc, getQuest, getScene, QUESTS, NPCS, SCENES } from "../lib/world/data";
import { getNpcsAtLocation } from "../lib/world/data/npcs";
import { ACTIVITIES, placeActivitiesAt } from "../lib/world/data/activities";
import { PLACE_NPCS, PLACE_QUESTS, PLACE_ACTIVITY_DEFS } from "../lib/world/data/places";
import { getLocationMap } from "../lib/world/data/location-maps";
import { KIDNAP_RETURN_DAYS, npcPresent } from "../lib/world/npc-presence";
import { GIFT_COOLDOWN_DAYS, giftOutcome, giftWorth, npcTastes } from "../lib/world/gifts";
import { npcCharacterId } from "../lib/characters/catalog";
import { hasAnimatedSheet } from "../lib/characters/npc-sheets";
import { npcBattleSprite, npcBodySprite, npcPixelSprite, npcPortrait } from "../lib/world/data/npc-portraits";
import type { Condition } from "../lib/world/types";
import { useWorldStore } from "../store/world-store";

const WALKER_BODIES = new Set(["m1", "m2", "m3", "m4", "f1", "f2", "f3", "f4"]);
let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}

const PLACES = [
  "village_noname", "village_huashan", "village_taishan", "city_lingxiao", "palace_royal", "tribe_huizu", "inn_youjian",
  "home_player", "home_hufei", "home_chengkun", "home_xuemuhua", "home_nanxian", "home_yideng", "home_tianboguang",
  "home_miaoren", "home_chengying", "home_yanji", "home_beichou", "villa_meizhuang", "villa_fuwei",
];

// Who teaches what: every learnSkill / learnArt in a quest's rewards.
const taughtBy = new Map<string, string[]>();
const teaches = (questId: string, node: unknown) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((n) => teaches(questId, n)); return; }
  const o = node as Record<string, unknown>;
  const key = o.t === "learnSkill" ? `skill:${o.skillId}` : o.t === "learnArt" ? `art:${o.artId}` : null;
  if (key) taughtBy.set(key, [...(taughtBy.get(key) ?? []), questId]);
  for (const v of Object.values(o)) if (v && typeof v === "object") teaches(questId, v);
};
for (const q of QUESTS) teaches(q.id, q.rewards);
const placeQuestIds = new Set(PLACE_QUESTS.map((q) => q.id));

check("every ยุทธจักร skill and art T0–T3 is a quest reward; the new ones come from exactly one place quest", () => {
  const items = [
    ...SKILLS.filter((s) => s.sc === "ยุทธจักร" && !s.id.startsWith("bst_") && s.id !== "basic_punch" && s.ti <= 3).map((s) => ({ key: `skill:${s.id}`, ti: s.ti })),
    ...ARTS.filter((a) => a.sc === "ยุทธจักร" && a.id !== "none" && a.ti <= 3).map((a) => ({ key: `art:${a.id}`, ti: a.ti })),
  ];
  const missing = items.filter((i) => !taughtBy.get(i.key)?.length).map((i) => i.key);
  assert.deepEqual(missing, [], "taught by no quest");
  let fromPlaces = 0;
  for (const i of items) {
    const by = (taughtBy.get(i.key) ?? []).filter((id) => placeQuestIds.has(id));
    assert.ok(by.length <= 1, `${i.key} taught by ${by.join(", ")}`);
    fromPlaces += by.length;
  }
  console.log(`  ${items.length} ยุทธจักร items; ${fromPlaces} taught by place quests`);
});

check("skill quests are gated by rarity: T1+ need a stat, T2+ also the giver's trust", () => {
  const tierOf = (key: string) => {
    const [kind, id] = key.split(":");
    return (kind === "skill" ? SKILLS.find((s) => s.id === id)?.ti : ARTS.find((a) => a.id === id)?.ti) ?? 0;
  };
  const has = (c: Condition | undefined, t: Condition["t"]): boolean =>
    !!c && (c.t === t || (c.t === "and" && c.all.some((s) => has(s, t))) || (c.t === "or" && c.any.some((s) => has(s, t))));
  for (const [key, ids] of taughtBy) for (const id of ids) {
    if (!placeQuestIds.has(id)) continue;
    const q = getQuest(id)!, ti = tierOf(key);
    if (ti >= 1) assert.ok(has(q.prereqs, "statAtLeast"), `${id} (${key} T${ti}) needs a statAtLeast gate`);
    if (ti >= 2) assert.ok(has(q.prereqs, "npcRelationship"), `${id} (${key} T${ti}) needs an npcRelationship gate`);
  }
});

check("each village, town and home has people, an activity and three quests", () => {
  for (const id of PLACES) {
    assert.equal(getScene(id)?.kind, "location", id);
    const people = getNpcsAtLocation(id);
    assert.ok(people.length >= 1, `${id}: no NPCs`);
    assert.ok(placeActivitiesAt(id).length >= 1, `${id}: no activity`);
    const quests = PLACE_QUESTS.filter((q) => people.some((n) => n.id === q.giverNpcId));
    assert.ok(quests.length >= 2, `${id}: only ${quests.length} quests`);
    const map = getLocationMap(id);
    if (map) for (const n of people) assert.ok(map.npcSpots?.[n.id], `${id}: ${n.id} has no spot on the map`);
  }
});

check("new NPCs: a talk dialog, their own art (strollers rigged, the rest a unique sprite), gift tastes", () => {
  let wander = 0, noArt = 0;
  for (const n of PLACE_NPCS) {
    assert.equal(getScene(n.dialogSceneId ?? "")?.kind, "dialog", `${n.id}: talk dialog`);
    assert.ok(n.look?.body, `${n.id}: look.body`);
    if (!npcBodySprite(n.id)) {
      // Not painted yet: the authored body stands in (only m/f bodies can walk).
      noArt++;
      assert.ok(!hasAnimatedSheet(n.id), `${n.id}: rigged without a painted body`);
      if (n.look?.wander) { wander++; assert.ok(WALKER_BODIES.has(n.look.body!), `${n.id}: ${n.look.body} cannot wander`); }
      assert.equal(npcCharacterId(n.id), n.look!.body, `${n.id}: falls back to its authored body`);
    } else if (n.look?.wander) {
      assert.ok(npcPortrait(n.id), `${n.id}: a portrait`);
      wander++;
      assert.ok(hasAnimatedSheet(n.id), `${n.id} wanders, so it needs its own rigged sheet (ANIMATED_NPC_IDS)`);
      assert.equal(npcCharacterId(n.id), n.id, `${n.id}: plays its own sheet`);
    } else {
      assert.ok(npcPortrait(n.id), `${n.id}: a portrait`);
      assert.ok(!hasAnimatedSheet(n.id), `${n.id} stands still`);
      assert.ok(npcPixelSprite(n.id) && npcBattleSprite(n.id), `${n.id}: a unique pixel sprite (bun scripts/build-npc-sprites.ts)`);
    }
    assert.ok((n.likes?.length ?? 0) >= 1, `${n.id}: likes`);
    for (const t of [...(n.likes ?? []), ...(n.dislikes ?? [])]) {
      const ok = t === "gold" || ["material", "herb", "venom", "potion", "food", "book", "craft", "valuable", "misc"].includes(t) || !!getItem(t);
      assert.ok(ok, `${n.id}: taste ${t} is not an item, category or gold`);
    }
  }
  console.log(`  ${PLACE_NPCS.length} new NPCs, ${wander} wander, ${PLACE_NPCS.length - noArt} with their own art`);
  assert.ok(wander > 0 && wander < PLACE_NPCS.length, "some wander, some stand");
});

check("place activities are well formed", () => {
  for (const a of PLACE_ACTIVITY_DEFS) {
    assert.ok(a.place?.locationIds.length, a.id);
    assert.ok(ACTIVITIES.some((x) => x.id === a.id), `${a.id} registered`);
    for (const loc of a.place!.locationIds) assert.equal(getScene(loc)?.kind, "location", `${a.id} at ${loc}`);
  }
});

check("no one who teaches a skill is a target of assassination or kidnapping", () => {
  const targets = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const o = node as Record<string, unknown>;
    if ((o.t === "assassinatedNpc" || o.t === "kidnappedNpc") && typeof o.npcId === "string") targets.add(o.npcId);
    for (const v of Object.values(o)) if (v && typeof v === "object") walk(v);
  };
  for (const q of QUESTS) walk(q.stages);
  for (const [key, ids] of taughtBy) for (const id of ids) {
    const giver = getQuest(id)?.giverNpcId;
    if (giver && placeQuestIds.has(id)) assert.ok(!targets.has(giver), `${giver} teaches ${key} but can be assassinated or kidnapped`);
  }
});

check("presence: assassinated is gone for good, kidnapped is back after 180 days", () => {
  const base = { assassinatedNpcIds: [] as string[], kidnappedUntil: {} as Record<string, number>, day: 10 };
  assert.ok(npcPresent(base, "x"));
  assert.ok(!npcPresent({ ...base, assassinatedNpcIds: ["x"], day: 9999 }, "x"));
  const away = { ...base, kidnappedUntil: { x: 10 + KIDNAP_RETURN_DAYS } };
  assert.ok(!npcPresent(away, "x"));
  assert.ok(!npcPresent({ ...away, day: 10 + KIDNAP_RETURN_DAYS - 1 }, "x"));
  assert.ok(npcPresent({ ...away, day: 10 + KIDNAP_RETURN_DAYS }, "x"));
});

check("gift worth and taste: liked doubles, a favourite is a delight, disliked costs", () => {
  assert.equal(giftWorth(50), 1);
  assert.equal(giftWorth(5000), 5);
  const npc = { likes: ["herb", "ginseng"], dislikes: ["venom"], tags: [] };
  const item = (id: string, category: string, price: number) => ({ id, name: id, category, price, description: "" }) as never;
  assert.deepEqual(giftOutcome(npc, { item: item("x", "herb", 150) }), { reaction: "like", points: 4 });
  assert.equal(giftOutcome(npc, { item: item("ginseng", "herb", 150) }).reaction, "love");
  assert.deepEqual(giftOutcome(npc, { item: item("y", "venom", 999) }), { reaction: "dislike", points: -2 });
  assert.deepEqual(giftOutcome(npc, { gold: 500 }), { reaction: "plain", points: 3 });
  assert.ok(npcTastes({ tags: ["monk"] }).dislikes.includes("venom"), "tags give tastes");
  assert.deepEqual(npcTastes({}).likes, ["food"]);
});

check("store: a gift raises trust once a month; gold works; absent NPCs take nothing", () => {
  useWorldStore.getState().startNewGame({ newWorld: true, name: "ทดสอบ", gender: "male" } as never);
  const npc = PLACE_NPCS.find((n) => n.likes?.includes("gold")) ?? NPCS[0];
  useWorldStore.setState({ gold: 10000 });
  const first = useWorldStore.getState().giveGift(npc.id, { gold: 1000 });
  assert.ok(first.ok, JSON.stringify(first));
  let s = useWorldStore.getState();
  assert.equal(s.gold, 9000);
  assert.equal(s.npcStates[npc.id]?.relationship, first.ok ? first.points : 0);
  const again = s.giveGift(npc.id, { gold: 100 });
  assert.ok(!again.ok && again.reason === "cooldown");
  useWorldStore.setState({ day: s.day + GIFT_COOLDOWN_DAYS });
  assert.ok(useWorldStore.getState().giveGift(npc.id, { gold: 100 }).ok, "a month later");
  s = useWorldStore.getState();
  const other = NPCS.find((n) => n.id !== npc.id)!;
  useWorldStore.setState({ kidnappedUntil: { [other.id]: s.day + 5 } });
  const absent = useWorldStore.getState().giveGift(other.id, { gold: 100 });
  assert.ok(!absent.ok && absent.reason === "absent");
  assert.ok(!useWorldStore.getState().giveGift(npc.id, { gold: 999999 }).ok);
});

check("store: a place activity pays out once per cooldown, only at its place", () => {
  const act = PLACE_ACTIVITY_DEFS.find((a) => !a.place!.costGold && (a.place!.cooldownDays ?? 0) > 0);
  assert.ok(act, "an activity with a cooldown");
  useWorldStore.getState().startNewGame({ newWorld: true, name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "city_capital" === act.place!.locationIds[0] ? "village_noname" : "city_capital" });
  const away = useWorldStore.getState().doActivity(act.id);
  assert.ok(!away.ok && away.reason === "not-here");
  useWorldStore.setState({ currentSceneId: act.place!.locationIds[0], stamina: 100 });
  const done = useWorldStore.getState().doActivity(act.id);
  assert.ok(done.ok, JSON.stringify(done));
  const twice = useWorldStore.getState().doActivity(act.id);
  assert.ok(!twice.ok && twice.reason === "cooldown");
});

check("scenes referenced by place content exist", () => {
  const ids = new Set(SCENES.map((s) => s.id));
  for (const q of PLACE_QUESTS) {
    for (const suffix of ["offer", "complete"]) {
      const sid = `qs_${q.id}_${suffix}`;
      if (ids.has(sid)) assert.equal(getScene(sid)?.kind, "dialog");
    }
    assert.ok(getNpc(q.giverNpcId ?? ""), `${q.id}: giver ${q.giverNpcId}`);
  }
});

console.log(`${passed} place checks passed`);
