// Sect membership and dropped quests: abandoning forgets a quest (its start
// gifts are not paid twice), resigned disciples rejoin after the cooldown,
// betrayers come back through redemption (every sect has one), the intro
// reward honours joinRequirements, leaving by any path logs / echoes, a
// resigned sect's moves are frozen everywhere, and the store's sect actions
// check the membership's standing.
//   bun run test:systems   (runs after test-systems.ts)
import assert from "node:assert/strict";
import type { Condition, QuestDef, SectId, WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args);
};

const { useWorldStore } = await import("../store/world-store");
const { SECT_QUEST_GAP_DAYS, applyEffect, applyEffects, droppedQuestFlag, isQuestOfferable, isSectQuestOfferable, repeatsQuestGifts } = await import("../lib/world/effects");
const { setTestClock, setTestWorldTime } = await import("../lib/world/clock");
const { QUESTS, getQuest } = await import("../lib/world/data/quests");
const { getNpc } = await import("../lib/world/data/npcs");
const { SECT_MEMBERSHIPS } = await import("../lib/world/data/sect-memberships");
const { REJOIN_COOLDOWN_DAYS, isSkillFrozen, redemptionQuestId, sectIntroQuest, sectJoinCheck } = await import("../lib/world/sects");
const { applySkillLevelUps } = await import("../store/world/progression");
const { getSkill } = await import("../lib/game");

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const store = () => useWorldStore.getState();
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function newGame() {
  store().resetGame();
  store().startNewGame({ newWorld: true, name: "ทดสอบ", gender: "male" } as never);
}
function member(sectId: SectId, extra: Record<string, unknown> = {}) {
  const def = SECT_MEMBERSHIPS[sectId];
  return { rank: def.startRank, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: store().day, status: "active", ...extra };
}
const SECT_IDS = Object.keys(SECT_MEMBERSHIPS) as SectId[];

// ─── Dropping a quest forgets it ───────────────────────────────────────
check("abandon: every quest is forgotten and offered again; how far it got is remembered", () => {
  newGame();
  const side = QUESTS.find((q) => q.type === "side" && !q.sectId && !q.prereqs && !q.story && !q.lineage)!;
  assert.ok(store().acceptQuest(side.id).ok);
  assert.ok(store().abandonQuest(side.id).ok);
  assert.equal(store().quests[side.id], undefined, "forgotten, not failed");
  assert.equal(store().flags[droppedQuestFlag(side.id)], 1);
  assert.ok(isQuestOfferable(store(), side), "offered again");
  assert.ok(store().acceptQuest(side.id).ok, "taken again");
  assert.ok(store().actionLog.some((e) => e.message.includes("รับใหม่ได้ภายหลัง")));
  assert.ok(store().finishQuestNow(side.id).ok);
  assert.equal(store().flags[droppedQuestFlag(side.id)], undefined, "done at last: the dropped attempt is forgotten");
});

check("abandon: a sellable start gift is not paid again; an unsellable one is only topped up", () => {
  newGame();
  useWorldStore.setState({ visitedLocationIds: [...store().visitedLocationIds, "desert_ruins"] });
  // The relic quest hands over an ancient coin (sellable) when accepted.
  store().gotoScene("qs_qw_desert_relic_return_offer");
  store().makeChoice(0);
  assert.equal(store().quests.qw_desert_relic_return?.status, "active");
  assert.equal(store().inventory.ancient_coin, 1);
  useWorldStore.setState({ inventory: { ...store().inventory, ancient_coin: 0 } }); // sold
  assert.ok(store().abandonQuest("qw_desert_relic_return").ok);
  store().gotoScene("qs_qw_desert_relic_return_offer");
  store().makeChoice(0);
  assert.equal(store().quests.qw_desert_relic_return?.status, "active", "taken again");
  assert.equal(store().inventory.ancient_coin ?? 0, 0, "the coin is not given twice");
  // A key (unsellable) comes back only up to the authored count.
  const state = clone(store()) as WorldStateData;
  state.flags[droppedQuestFlag("qv_inn_lost_satchel")] = 1;
  state.inventory.old_key = 0;
  applyEffects(state, [{ t: "startQuest", questId: "qv_inn_lost_satchel" }, { t: "giveItem", itemId: "old_key", count: 1 }]);
  assert.equal(state.inventory.old_key, 1, "a lost key is handed back");
  delete state.quests.qv_inn_lost_satchel;
  applyEffects(state, [{ t: "startQuest", questId: "qv_inn_lost_satchel" }, { t: "giveItem", itemId: "old_key", count: 1 }]);
  assert.equal(state.inventory.old_key, 1, "but never stacks up");
});

check("abandon: start gold and mid-quest payouts are not paid twice; a first attempt is", () => {
  newGame();
  const s = clone(store()) as WorldStateData;
  const quest = QUESTS.find((q) => q.stages.length >= 3 && !q.sectId)!;
  const gold = s.gold;
  applyEffects(s, [{ t: "startQuest", questId: quest.id }, { t: "addGold", amount: 50 }]);
  assert.equal(s.gold, gold + 50, "first time: paid");
  delete s.quests[quest.id];
  s.flags[droppedQuestFlag(quest.id)] = 2; // reached stage 1 last time
  assert.ok(repeatsQuestGifts(s, [{ t: "startQuest", questId: quest.id }]));
  applyEffects(s, [{ t: "startQuest", questId: quest.id }, { t: "addGold", amount: 50 }, { t: "addGold", amount: -10 }]);
  assert.equal(s.gold, gold + 40, "the advance is not paid again; a cost still applies");
  // Advancing 0 → 1 was done before; 1 → 2 was not.
  applyEffects(s, [{ t: "advanceQuest", questId: quest.id }, { t: "addGold", amount: 100 }]);
  assert.equal(s.gold, gold + 40);
  applyEffects(s, [{ t: "advanceQuest", questId: quest.id }, { t: "addGold", amount: 100 }]);
  assert.equal(s.gold, gold + 140, "a stage never reached pays");
});

// ─── Rejoining, redemption ─────────────────────────────────────────────
check("rejoin: a resigned disciple comes back after the cooldown, from the first rank, paid once per rank", () => {
  newGame();
  useWorldStore.setState({ sectMembership: { wudang: member("wudang", { rank: 7, points: 0 }) } as never });
  const rumors = store().rumorPool.length;
  assert.ok(store().resignSect("wudang").ok);
  const m = store().sectMembership.wudang!;
  assert.equal(m.status, "resigned");
  assert.equal(m.leftDay, store().day);
  assert.ok(store().rumorPool.length > rumors, "the jianghu hears of it");
  const early = store().joinSect("wudang");
  assert.equal(early.ok, false);
  assert.match(early.reason!, new RegExp(`อีก ${REJOIN_COOLDOWN_DAYS} วัน`));
  useWorldStore.setState({ sectMembership: { wudang: { ...m, leftDay: store().day - REJOIN_COOLDOWN_DAYS } } as never });
  assert.ok(store().joinSect("wudang").ok);
  const back = store().sectMembership.wudang!;
  assert.equal(back.status, "active");
  assert.equal(back.rank, SECT_MEMBERSHIPS.wudang.startRank);
  assert.equal(back.bestRank, 7);
  assert.equal(back.leftDay, undefined);
  assert.ok(store().actionLog.some((e) => e.message.includes("กลับเข้าสำนักอู่ตัง")));
  // Climbing again to a rank already held pays no gold.
  useWorldStore.setState({ sectMembership: { wudang: { ...back, points: 10_000 } } as never });
  const gold = store().gold;
  assert.ok(store().upgradeSectRank("wudang").ok);
  assert.equal(store().gold, gold, "rank 8 was held before");
  assert.ok(store().upgradeSectRank("wudang").ok);
  assert.ok(store().upgradeSectRank("wudang").ok);
  assert.ok(store().gold > gold, "rank 6 is new: paid");
  assert.equal(store().sectMembership.wudang!.bestRank, 6);
});

check("join: one sect at a time; a first join needs the intro quest done; the reward honours joinRequirements", () => {
  newGame();
  assert.match(sectJoinCheck(store(), "wudang").ok ? "" : (sectJoinCheck(store(), "wudang") as { reason: string }).reason, /ต้องผ่านภารกิจ/);
  useWorldStore.setState({ sectMembership: { huashan: member("huashan") } as never });
  assert.match((sectJoinCheck(store(), "wudang", { viaQuest: true }) as { reason: string }).reason, /หัวซาน/);
  // The intro reward: admitted when the rules hold, not when they don't.
  newGame();
  const intro = sectIntroQuest("wudang")!;
  assert.ok(store().acceptQuest(intro.id).ok);
  useWorldStore.setState({ traits: { ...store().traits, evil: 50 } });
  assert.ok(store().finishQuestNow(intro.id).ok);
  assert.equal(store().sectMembership.wudang, undefined, "too wicked at hand-in: not admitted");
  assert.ok(store().actionLog.some((e) => e.message.includes("ยังรับเจ้าเป็นศิษย์ไม่ได้")));
  assert.equal(store().joinSect("wudang").ok, false);
  useWorldStore.setState({ traits: { ...store().traits, evil: 0 } });
  assert.ok(store().joinSect("wudang").ok, "asks again at the master's door once the rules hold");
  assert.equal(store().sectMembership.wudang!.status, "active");
});

check("joinRequirements never drift from the intro quests: each intro's prereqs carry every requirement", () => {
  const leaves = (c: Condition | undefined): Condition[] => (!c ? [] : c.t === "and" ? c.all.flatMap(leaves) : [c]);
  const implied = (req: Condition, have: Condition[]) => have.some((h) => {
    if (h.t !== req.t) return false;
    if (req.t === "trait" && h.t === "trait") return h.trait === req.trait
      && (req.max === undefined || (h.max !== undefined && h.max <= req.max))
      && (req.min === undefined || (h.min !== undefined && h.min >= req.min));
    if (req.t === "lifeSkillLevel" && h.t === "lifeSkillLevel") return h.skill === req.skill && h.min >= req.min;
    return JSON.stringify(h) === JSON.stringify(req);
  });
  for (const sectId of SECT_IDS) {
    const intro = sectIntroQuest(sectId);
    assert.ok(intro, `${sectId}: an intro quest joins it`);
    const have = leaves(intro.prereqs);
    for (const req of leaves(SECT_MEMBERSHIPS[sectId].joinRequirements)) {
      assert.ok(implied(req, have), `${intro.id}: prereqs imply ${JSON.stringify(req)}`);
    }
  }
});

check("redemption: every joinable sect has one, at its grounds; a betrayer is offered it, a forgiven one may rejoin", () => {
  for (const sectId of SECT_IDS) {
    const q = getQuest(redemptionQuestId(sectId)) as QuestDef | undefined;
    assert.ok(q, `${sectId}: qst_${sectId}_redemption`);
    assert.equal(q.sectId, sectId);
    assert.deepEqual(q.prereqs, { t: "sectStatus", sectId, status: "betrayed" });
    assert.ok((q.rewards ?? []).some((r) => r.t === "resignSect" && r.sectId === sectId));
    const giver = getNpc(q.giverNpcId!);
    assert.ok(giver?.locationIds.includes(SECT_MEMBERSHIPS[sectId].hallLocationId), `${q.id}: its giver stands on the sect's grounds`);
  }
  newGame();
  useWorldStore.setState({ sectMembership: { xiaoyao: member("xiaoyao") } as never });
  const evil = store().traits.evil ?? 0;
  assert.ok(store().betraySect("xiaoyao").ok);
  assert.equal(store().traits.evil, evil + 5);
  const redemption = getQuest("qst_xiaoyao_redemption")!;
  assert.ok(isQuestOfferable(store(), redemption), "the master offers forgiveness");
  assert.equal(isSectQuestOfferable(store(), redemption).offerable, false, "not from the sect window");
  assert.equal(store().joinSect("xiaoyao").ok, false, "a betrayer cannot walk back in");
  assert.ok(store().acceptQuest(redemption.id).ok);
  assert.ok(store().finishQuestNow(redemption.id).ok);
  assert.equal(store().sectMembership.xiaoyao!.status, "resigned");
  assert.ok(store().actionLog.some((e) => e.message.includes("ให้อภัยแล้ว")));
  assert.equal(store().joinSect("xiaoyao").ok, false, "the cooldown counts from the forgiveness");
  useWorldStore.setState({ sectMembership: { xiaoyao: { ...store().sectMembership.xiaoyao!, leftDay: store().day - REJOIN_COOLDOWN_DAYS } } as never });
  assert.ok(store().joinSect("xiaoyao").ok);
  // Betray again: the redemption is offered again.
  assert.ok(store().betraySect("xiaoyao").ok);
  assert.ok(isQuestOfferable(store(), redemption));
});

check("leaving through a quest reward logs and echoes like the sect window (the Gumu swap's leaveSect)", () => {
  newGame();
  const build = store().playerBuild!;
  useWorldStore.setState({
    sectMembership: { quanzhen: member("quanzhen") } as never,
    playerBuild: { ...build, learnedArtIds: [...(build.learnedArtIds ?? []), "t3_qz_sun"] },
  });
  const rumors = store().rumorPool.length;
  assert.ok(store().acceptQuest("qst_gumu_disciple_intro").ok);
  assert.ok(store().finishQuestNow("qst_gumu_disciple_intro").ok);
  assert.equal(store().sectMembership.quanzhen!.status, "resigned");
  assert.equal(store().sectMembership.gumu!.status, "active");
  assert.ok(store().actionLog.some((e) => e.message.includes("ลาออกอย่างเป็นทางการจากสำนักฉวนเจิน")));
  assert.ok(store().actionLog.some((e) => e.message.includes("เข้าร่วมสำนักกู่มู่")));
  assert.ok(store().rumorPool.length >= rumors + 2, "the leaving and the joining are both news");
  // A scene's betraySect: evil +5, the log line.
  const s = clone(store()) as WorldStateData;
  const evil = s.traits.evil ?? 0;
  applyEffect(s, { t: "betraySect", sectId: "gumu" });
  assert.equal(s.sectMembership.gumu!.status, "betrayed");
  assert.equal(s.traits.evil, evil + 5);
  assert.ok(s.actionLog.some((e) => e.message.includes("ทรยศสำนักกู่มู่")));
});

check("freeze: a resigned sect's moves gain nothing from practice, w-exp or banked xp", () => {
  newGame();
  const tj = getSkill("tj")!;
  const build = store().playerBuild!;
  useWorldStore.setState({
    sectMembership: { wudang: member("wudang", { status: "resigned", leftDay: store().day }) } as never,
    playerBuild: { ...build, learnedSkillIds: [...(build.learnedSkillIds ?? []), tj.id], skillIds: [tj.id, ...build.skillIds.slice(1)] },
    skillLevel: { ...store().skillLevel, [tj.id]: 1 },
    currentSceneId: "sect_wudang", lastLocationId: "sect_wudang", stamina: 100, wExp: 100_000,
  });
  assert.ok(isSkillFrozen(store(), tj.id));
  const practice = store().practiceSkill(tj.id);
  assert.equal(practice.ok, false);
  assert.equal(!practice.ok && practice.reason, "frozen");
  const wexp = store().levelUpSkillFromWExp(tj.id);
  assert.equal(!wexp.ok && wexp.reason, "frozen");
  const s = clone(store()) as WorldStateData;
  s.skillExp[tj.id] = 1_000_000;
  applySkillLevelUps(s, tj.id);
  assert.equal(s.skillLevel[tj.id], 1, "banked xp does not level a frozen move");
  // Rejoining thaws it.
  useWorldStore.setState({ sectMembership: { wudang: member("wudang", { status: "resigned", leftDay: store().day - REJOIN_COOLDOWN_DAYS }) } as never });
  assert.ok(store().joinSect("wudang").ok);
  assert.ok(store().levelUpSkillFromWExp(tj.id).ok);
});

check("store sect actions need an active membership", () => {
  newGame();
  useWorldStore.setState({ sectMembership: { wudang: member("wudang", { status: "resigned", points: 10_000, leftDay: store().day }) } as never });
  assert.equal(store().upgradeSectRank("wudang").ok, false);
  const sectQuest = QUESTS.find((q) => q.sectId === "wudang" && !q.isArtQuest && q.id !== redemptionQuestId("wudang"))!;
  assert.equal(store().acceptSectQuest("wudang", sectQuest.id).ok, false);
  assert.equal(store().resignSect("wudang").ok, false);
  assert.equal(store().betraySect("wudang").ok, false);
  useWorldStore.setState({ sectMembership: { wudang: member("wudang", { points: 10_000 }) } as never });
  assert.ok(store().upgradeSectRank("wudang").ok);
  assert.ok(store().acceptSectQuest("wudang", sectQuest.id).ok);
});

check("sect quests: one every two real hours across every sect, not saved up; dropping it gives the turn back; art quests are apart", () => {
  setTestWorldTime(500, 0);
  try {
    newGame();
    useWorldStore.setState({ sectMembership: { wudang: member("wudang", { rank: 1 }) } as never });
    const repeatable = QUESTS.filter((q) => q.sectId === "wudang" && !q.isArtQuest && q.id !== redemptionQuestId("wudang") && isSectQuestOfferable(store(), q).offerable);
    assert.ok(repeatable.length >= 2, "two quests to try");
    const [a, b] = repeatable;
    assert.ok(isSectQuestOfferable(store(), a!).offerable);
    assert.ok(store().acceptSectQuest("wudang", a!.id).ok);
    const blocked = isSectQuestOfferable(store(), b!);
    assert.equal(blocked.offerable, false, "the next waits");
    assert.ok(Math.abs(blocked.cooldownLeft - SECT_QUEST_GAP_DAYS) < 1e-6, "two real hours (world days)");
    assert.equal(store().acceptSectQuest("wudang", b!.id).ok, false);
    // An hour and a half later: still waiting; two hours: open again.
    setTestWorldTime(501, 6);
    assert.equal(store().acceptSectQuest("wudang", b!.id).ok, false);
    setTestWorldTime(502, 0);
    assert.ok(store().acceptSectQuest("wudang", b!.id).ok, "two hours on");
    // Dropping the quest just taken gives the turn back.
    assert.ok(store().abandonQuest(b!.id).ok);
    assert.equal(store().sectQuestTaken, null);
    assert.ok(isSectQuestOfferable(store(), b!).offerable);
    // A long absence does not stack turns: one quest, then two hours again.
    setTestWorldTime(530, 0);
    assert.ok(store().acceptSectQuest("wudang", b!.id).ok);
    const other = repeatable.find((q) => q.id !== b!.id && store().quests[q.id]?.status !== "active")!;
    assert.equal(store().acceptSectQuest("wudang", other.id).ok, false, "no saved-up turns");
    // The one-shot art trials keep their own gate.
    const art = QUESTS.find((q) => q.sectId === "wudang" && q.isArtQuest)!;
    assert.notEqual(isSectQuestOfferable(store(), art).reason, "รับภารกิจสำนักได้ทุก 2 ชั่วโมง");
  } finally { setTestClock(null); }
});

console.warn = originalWarn;
console.log(`\n${passed} sect and quest-drop checks passed.`);
