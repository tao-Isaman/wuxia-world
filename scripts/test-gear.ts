// Gear options (ออฟชั่นเสริม, lib/game/gear.ts + lib/world/gear.ts): every
// piece's stats halved, its tier, the rolls by tier, keys that clamp, the
// options in the derived stats and in battle, the magic materials from tier-3
// foes, buying and re-rolling at a craft shop, the ประสบการณ์ยุทธ option and the
// repair of old saves.
//   bun run test:gear
import assert from "node:assert/strict";
import {
  EQUIPMENT,
  EQUIP_STAT_SCALE,
  GEAR_AFFIX_COUNT,
  GEAR_AFFIX_KINDS,
  GEAR_AFFIX_RANGE,
  GEAR_FAMILY_REDUCE_CAP,
  affixParts,
  affixQuality,
  combinedStats,
  deriveAll,
  equipStatParts,
  gearFamilyMods,
  gearKey,
  getBuildBonus,
  getEquip,
  parseGear,
  rollGearAffixes,
  rollGearKey,
  type CharacterBuild,
  type GearAffix,
} from "../lib/game";
import { calcSkillDamage, critMultiplier, makeContext, makeInitialState } from "../lib/game/battle";
import { SKILLS, isBeastMove, isBossMove } from "../lib/game/data";
import { seededRng, withRandom } from "../lib/game/rng";
import {
  REFORGE_MIN_LEVEL,
  SPIRIT_STONE,
  SPIRIT_THREAD,
  gearProfession,
  reforgeCheck,
  reforgeMaterial,
  repairGear,
  rollSpiritMaterials,
  wExpWithGear,
} from "../lib/world/gear";
import { getItem } from "../lib/world/data/items";
import { itemIconId } from "../lib/world/data/item-icons";
import { BOSSES } from "../lib/world/data/bosses";
import { ARTISANS, equipmentOfferedBy } from "../lib/world/data/artisans";
import { getOpponent } from "../lib/world/data/opponents";
import { rollVictorySpoilsFrom } from "../lib/world/spoils";
import { validateAndRepair } from "../lib/world/validate";
import { useWorldStore } from "../store/world-store";
import type { WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => { if (!String(args[0]).includes("zustand persist middleware") && !String(args[0]).includes("dropping unknown equipment")) originalWarn(...args); };

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const store = () => useWorldStore.getState();
function newGame() {
  store().resetGame();
  store().startNewGame({ newWorld: true, name: "ทดสอบ", gender: "male" } as never);
}
const build = (): CharacterBuild => structuredClone(store().playerBuild!);
const withGear = (b: CharacterBuild, W: string | null): CharacterBuild => ({ ...b, equipment: { ...b.equipment, W } });

check("every piece is halved at load: stats and effect", () => {
  assert.equal(EQUIP_STAT_SCALE, 0.5);
  const w5 = getEquip("W5")!;
  assert.equal(w5.atkb, 55, "ดาบมังกรเทพ 110 → 55");
  assert.deepEqual(w5.eff, { t: "flat_cri", v: 10 });
  assert.equal(getEquip("A5")!.pdb, 89, "เกราะเทพ 178 → 89");
  assert.deepEqual(getEquip("A5")!.eff, { t: "pct_reduce", v: 6 });
  assert.equal(getEquip("eq_t0_w_fist")!.atkb, 7);
  assert.equal(getEquip("W4")!.eff?.t, "on_hit");
  // The same stat once: a flat crit effect folds into the crit line.
  const parts = equipStatParts(w5);
  assert.equal(parts.filter((p) => p.startsWith("คริติคอล")).length, 1);
  assert.ok(parts.includes("คริติคอล +15"), parts.join(" · "));
});

check("every piece has a tier 0–4: the shop roster 0 / 1, city specialties 2, beast gear 3 / 4", () => {
  for (const e of EQUIPMENT) assert.ok(Number.isInteger(e.ti) && e.ti >= 0 && e.ti <= 4, e.id);
  assert.equal(getEquip("eq_t0_w_sword")!.ti, 0);
  assert.equal(getEquip("eq_t1_a_iron")!.ti, 1);
  assert.equal(getEquip("eq_suzhou_a_silk")!.ti, 2);
  for (const boss of BOSSES) for (const id of boss.gear) assert.ok(getEquip(id)!.ti >= 3, `${boss.id} drops ${id}`);
  assert.equal(getEquip("W4")!.ti, 3);
  assert.equal(getEquip("W5")!.ti, 4);
});

check("rolls: the count by tier, one of each kind at most, values in range, every kind and family reachable", () => {
  assert.deepEqual(GEAR_AFFIX_COUNT[0], [0, 1]);
  assert.deepEqual(GEAR_AFFIX_COUNT[1], [1, 2]);
  assert.deepEqual(GEAR_AFFIX_COUNT[3], [2, 3]);
  assert.deepEqual(GEAR_AFFIX_COUNT[4], [3, 4]);
  assert.equal(GEAR_AFFIX_KINDS.length, 17);
  const seenKinds = new Set<string>(), seenCounts: Record<number, Set<number>> = {};
  for (let ti = 0; ti <= 4; ti++) {
    seenCounts[ti] = new Set();
    for (let seed = 0; seed < 400; seed++) {
      const list = rollGearAffixes(ti, seededRng(seed, ti));
      const [lo, hi] = GEAR_AFFIX_COUNT[ti]!;
      assert.ok(list.length >= lo && list.length <= hi, `tier ${ti}: ${list.length}`);
      seenCounts[ti]!.add(list.length);
      assert.equal(new Set(list.map((a) => a.k)).size, list.length, "no kind twice");
      for (const a of list) {
        seenKinds.add(a.k);
        const [min, max] = GEAR_AFFIX_RANGE[a.k];
        assert.ok(Number.isInteger(a.v) && a.v >= min && a.v <= max, `${a.k} ${a.v}`);
        if (a.k === "stat") assert.ok(a.stat);
        if (a.k === "fam_dmg" || a.k === "fam_red") assert.ok(a.fam);
      }
    }
    assert.equal(seenCounts[ti]!.size, GEAR_AFFIX_COUNT[ti]![1] - GEAR_AFFIX_COUNT[ti]![0] + 1, `tier ${ti} rolls every count`);
  }
  assert.equal(seenKinds.size, 17, "every kind rolls");
  assert.deepEqual(GEAR_AFFIX_RANGE.stat, [1, 10]);
  assert.deepEqual(GEAR_AFFIX_RANGE.pd, [5, 15]);
  assert.deepEqual(GEAR_AFFIX_RANGE.pa_pct, [1, 10]);
  assert.deepEqual(GEAR_AFFIX_RANGE.acc_pct, [1, 15]);
  assert.deepEqual(GEAR_AFFIX_RANGE.cri, [5, 15]);
  assert.deepEqual(GEAR_AFFIX_RANGE.crit_dmg, [1, 10]);
  assert.deepEqual(GEAR_AFFIX_RANGE.wexp, [5, 15]);
  assert.deepEqual(GEAR_AFFIX_RANGE.fam_dmg, [5, 25]);
  assert.deepEqual(GEAR_AFFIX_RANGE.fam_red, [5, 25]);
});

check("keys: canonical, clamped, unknown tokens and extra options dropped, a bare id has none", () => {
  const key = gearKey("eq_t1_w_sword", [{ k: "pa", v: 6 }, { k: "fam_dmg", fam: "sword", v: 15 }]);
  assert.equal(key, "eq_t1_w_sword~pa:6,fam_dmg:sword:15");
  assert.deepEqual(parseGear(key)!.affixes, [{ k: "pa", v: 6 }, { k: "fam_dmg", fam: "sword", v: 15 }]);
  assert.equal(getEquip(key)!.id, "eq_t1_w_sword");
  assert.deepEqual(parseGear("eq_t1_w_sword")!.affixes, []);
  // Too strong, too many, nonsense: clamped and cut to the tier's most (T1: 2).
  const forged = parseGear("eq_t1_w_sword~pa:999,cri:-4,bogus:3,stat:XYZ:5,pd:7,id:8")!;
  assert.deepEqual(forged.affixes, [{ k: "pa", v: 15 }, { k: "cri", v: 5 }]);
  assert.equal(forged.key, "eq_t1_w_sword~pa:15,cri:5");
  assert.equal(parseGear("nope~pa:5"), null);
  assert.ok(affixParts("eq_t1_w_sword~fam_red:blade:20").some((t) => t.includes("ดาบ") && t.includes("20%")));
  assert.match(affixParts("W5~stat:STR:7,wexp:9,crit_dmg:4").join(" "), /กำลัง \+7.*ประสบการณ์ยุทธที่ได้รับ \+9%.*ความเสียหายคริติคอล \+4%/);
  // The colour of an option is how good its roll is: bottom 0 … top 5.
  assert.equal(affixQuality({ k: "pd", v: 5 }), 0);
  assert.equal(affixQuality({ k: "pd", v: 10 }), 2);
  assert.equal(affixQuality({ k: "pd", v: 14 }), 4);
  assert.equal(affixQuality({ k: "pd", v: 15 }), 5);
  assert.equal(affixQuality({ k: "fam_dmg", v: 25 }), 5);
  assert.equal(affixQuality({ k: "stat", v: 1 }), 0);
});

check("sources: every slot has tier-3 and tier-4 beast gear, instruments are sold, no two pieces share a name", () => {
  const beast = new Set(BOSSES.flatMap((b) => b.gear));
  for (const ty of ["W", "A", "H", "B", "BR", "R", "C"] as const) {
    for (const ti of [3, 4]) assert.ok([...beast].some((id) => getEquip(id)!.ty === ty && getEquip(id)!.ti === ti), `${ty} T${ti} from a beast`);
  }
  const sold = new Set(ARTISANS.flatMap((a) => equipmentOfferedBy(a).map((o) => o.equipId)));
  for (const id of ["W_flute", "W_pipa"]) assert.ok(sold.has(id) && getEquip(id)!.instrument, `${id} sold`);
  const names = EQUIPMENT.map((e) => e.n);
  assert.equal(new Set(names).size, names.length, "unique names");
});

newGame();

check("options join the derived stats: flats, % on the whole stat, base stats (not for training gates)", () => {
  const b = build();
  const plain = deriveAll(withGear(b, "eq_t0_w_fist"));
  const flats = deriveAll(withGear(b, "eq_t0_w_fist~pd:10"));
  assert.equal(flats.PD, plain.PD + 10);
  const pct = deriveAll(withGear(b, "eq_t0_w_fist~pa_pct:10"));
  assert.equal(pct.PA, Math.round(plain.PA * 1.1));
  const stat = withGear(b, "eq_t0_w_fist~stat:VIT:8");
  assert.equal(combinedStats(stat).VIT, combinedStats(b).VIT + 8);
  assert.equal(combinedStats(stat, undefined, { excludeEquipment: true }).VIT, combinedStats(b, undefined, { excludeEquipment: true }).VIT);
  assert.ok(deriveAll(stat).HP > plain.HP, "VIT feeds HP");
  const crit = getBuildBonus(withGear(b, "W5~crit_dmg:8,wexp:12,res:9"));
  assert.equal(crit.crit_dmg, 8);
  assert.equal(crit.wexp, 12);
  assert.equal(critMultiplier(crit), 1.58);
  assert.equal(deriveAll(withGear(b, "W5~res:9")).Res, deriveAll(withGear(b, "W5")).Res + 9);
});

check("battle: a family's moves hit harder with its option, softer against its guard (capped)", () => {
  // A plain one-hit physical move, so the hit is one roll.
  const skill = SKILLS.find((x) => x.at === "phy" && x.dm > 0 && !x.hits && !isBeastMove(x.id) && !isBossMove(x.id))!;
  assert.ok(skill, "a damaging move");
  const fam = skill.w;
  const a = build(), d = build();
  const roll = (atk: CharacterBuild, def: CharacterBuild) => {
    const ctx = makeContext(atk, def);
    const state = makeInitialState(atk, def);
    return withRandom(seededRng(7, 1), () => {
      // Always hit, never crit: compare the raw damage only.
      state.dA.Acc = 9999; state.dB.Eva = 0; state.dA.Cri = 0; state.dB.Res = 9999;
      return calcSkillDamage(state, "A", skill, ctx).dmg;
    });
  };
  // Both sides wear the same plain piece; only the option differs.
  const plain = "eq_t0_w_fist";
  const base = roll(withGear(a, plain), withGear(d, plain));
  const up = roll(withGear(a, gearKey("eq_t0_w_fist", [{ k: "fam_dmg", fam, v: 20 } as GearAffix])), withGear(d, plain));
  assert.ok(Math.abs(up - Math.round(base * 1.2)) <= 1, `${base} → ${up}`);
  const guarded = roll(withGear(a, plain), withGear(d, gearKey("eq_t0_w_fist", [{ k: "fam_red", fam, v: 20 } as GearAffix])));
  assert.ok(Math.abs(guarded - Math.round(base * 0.8)) <= 1, `${base} → ${guarded}`);
  // Other families are untouched.
  const other = fam === "fist" ? "blade" : "fist";
  assert.equal(roll(withGear(a, gearKey("eq_t0_w_fist", [{ k: "fam_dmg", fam: other, v: 25 } as GearAffix])), withGear(d, plain)), base);
  // The guard caps across pieces.
  const many = { ...d, equipment: { ...d.equipment, BR: [`eq_t0_br_iron~fam_red:${fam}:25`, `eq_t0_br_cloth~fam_red:${fam}:25`] as [string, string], R: [`eq_t0_r_copper~fam_red:${fam}:25`, null] as [string, null] } };
  assert.equal(gearFamilyMods(many.equipment).red[fam], GEAR_FAMILY_REDUCE_CAP);
});

check("magic materials: two items with icons; tier 3 and up drop them, beasts always leave both", () => {
  for (const id of [SPIRIT_STONE, SPIRIT_THREAD]) {
    assert.equal(getItem(id)?.category, "material");
    assert.ok(itemIconId(id), `${id} icon`);
  }
  assert.equal(reforgeMaterial("W"), SPIRIT_STONE);
  assert.equal(reforgeMaterial("R"), SPIRIT_STONE);
  assert.equal(reforgeMaterial("C"), SPIRIT_STONE);
  for (const ty of ["A", "H", "B", "BR"] as const) assert.equal(reforgeMaterial(ty), SPIRIT_THREAD);
  const tally = (ti: number) => {
    let n = 0;
    withRandom(seededRng(3, ti), () => { for (let i = 0; i < 2000; i++) n += rollSpiritMaterials({ ti }).length; });
    return n;
  };
  assert.equal(tally(0) + tally(1) + tally(2), 0, "below tier 3: none");
  assert.ok(tally(3) > 600 && tally(3) < 1000, `tier 3 ≈ 20% each: ${tally(3)}`);
  assert.ok(tally(5) > tally(3));
  const boss = rollSpiritMaterials({ ti: 5, boss: true });
  assert.deepEqual(boss.map((m) => m.itemId).sort(), [SPIRIT_STONE, SPIRIT_THREAD].sort());
  for (const m of boss) assert.ok(m.count >= 2 && m.count <= 3);
});

check("spoils: a beast's gear arrives with its options rolled; the ประสบการณ์ยุทธ option raises the pay", () => {
  const boss = BOSSES[0]!;
  const opp = getOpponent(boss.id)!;
  assert.ok(opp?.boss);
  const s = JSON.parse(JSON.stringify(store())) as WorldStateData;
  const pb = { opponentId: boss.id } as NonNullable<WorldStateData["pendingBattle"]>;
  let gear: string[] = [];
  for (let seed = 0; seed < 200 && !gear.length; seed++) gear = withRandom(seededRng(seed, 9), () => rollVictorySpoilsFrom(s, pb, null).gear ?? []);
  assert.ok(gear.length, "a drop within 200 tries");
  const g = parseGear(gear[0])!;
  assert.ok(boss.gear.includes(g.def.id));
  assert.ok(g.affixes.length >= GEAR_AFFIX_COUNT[g.def.ti]![0], gear[0]);
  const plain = rollVictorySpoilsFrom(s, pb, null).wExp;
  s.playerBuild = withGear(s.playerBuild!, "W5~wexp:10");
  assert.equal(rollVictorySpoilsFrom(s, pb, null).wExp, Math.round(plain * 1.1));
  assert.equal(wExpWithGear(s.playerBuild, 100), 110);
});

check("buying rolls the piece's options into its key", () => {
  newGame();
  useWorldStore.setState({ gold: 100_000 });
  const keys = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const r = store().buyEquipment("eq_t1_w_sword", 260);
    assert.ok(r.ok);
    const g = parseGear(r.equipId)!;
    assert.equal(g.def.id, "eq_t1_w_sword");
    assert.ok(g.affixes.length >= 1 && g.affixes.length <= 2, r.equipId);
    keys.add(r.equipId);
  }
  assert.ok(keys.size > 5, "rolls differ");
  assert.equal(Object.values(store().inventoryEquipment).reduce((a, b) => a + b, 0), 30);
  // Wearing one carries its options into the battle build.
  const key = [...keys][0]!;
  assert.ok(store().equipFromBag(key).ok);
  assert.equal(store().playerBuild!.equipment.W, key);
});

check("re-rolling: the line's own shop, craft level 3, one material; bag and worn pieces", () => {
  newGame();
  const forge = "city_capital";
  useWorldStore.setState({ gold: 100_000, currentSceneId: forge });
  const bought = store().buyEquipment("eq_t1_w_blade", 300);
  assert.ok(bought.ok);
  const key = bought.equipId;
  assert.equal(gearProfession(getEquip(key)!), "forge");
  assert.equal(gearProfession(getEquip("eq_t1_a_leather")!), "tailoring");
  assert.equal(gearProfession(getEquip("R5")!), "jewelry");
  assert.equal(gearProfession(getEquip("C4")!), "accessory");
  assert.equal(gearProfession(getEquip("A5")!), "forge");

  assert.deepEqual(store().reforgeGear(key), { ok: false, reason: "low-skill" });
  useWorldStore.setState({ lifeSkillXp: { ...store().lifeSkillXp, forge: 300 } });
  assert.deepEqual(store().reforgeGear(key), { ok: false, reason: "no-material" });
  useWorldStore.setState({ inventory: { ...store().inventory, [SPIRIT_THREAD]: 3 } });
  assert.deepEqual(store().reforgeGear(key), { ok: false, reason: "no-material" }, "a weapon needs the stone");
  useWorldStore.setState({ inventory: { ...store().inventory, [SPIRIT_STONE]: 2 } });
  assert.equal(REFORGE_MIN_LEVEL, 3);
  assert.equal(reforgeCheck(store(), "forge", key).ok, true);
  assert.equal(reforgeCheck(store(), "tailoring", key).reason, "wrong-shop");

  // Elsewhere: no forge, no re-roll.
  useWorldStore.setState({ currentSceneId: "home_player" });
  assert.deepEqual(store().reforgeGear(key), { ok: false, reason: "no-artisan" });
  useWorldStore.setState({ currentSceneId: forge });

  const r = withRandom(seededRng(11, 2), () => store().reforgeGear(key));
  assert.ok(r.ok);
  assert.equal(store().inventory[SPIRIT_STONE], 1);
  assert.equal(store().inventoryEquipment[key] ?? 0, r.key === key ? 1 : 0);
  assert.equal(store().inventoryEquipment[r.key], 1);
  assert.equal(parseGear(r.key)!.def.id, "eq_t1_w_blade");

  // A worn piece is re-rolled in its slot.
  assert.ok(store().equipFromBag(r.key).ok);
  const worn = withRandom(seededRng(12, 2), () => store().reforgeGear(r.key, { ty: "W", idx: 0 }));
  assert.ok(worn.ok);
  assert.equal(store().playerBuild!.equipment.W, worn.key);
  assert.equal(store().inventory[SPIRIT_STONE] ?? 0, 0);
  assert.deepEqual(store().reforgeGear(worn.key, { ty: "W", idx: 0 }), { ok: false, reason: "no-material" });
  // A piece the hero doesn't hold.
  useWorldStore.setState({ inventory: { ...store().inventory, [SPIRIT_STONE]: 1 } });
  assert.deepEqual(store().reforgeGear("eq_t1_w_blade~pa:5,cri:5"), { ok: false, reason: "not-owned" });
});

check("repair: pieces from before options get their share, alike every time; bad keys and slots go", () => {
  const s = {
    inventoryEquipment: { eq_t1_w_sword: 2, eq_t0_w_fist: 1, "eq_t1_c_wood~pa:999": 1, ghost_piece: 1, "eq_t1_r_silver~cri:7": 0 },
    playerBuild: { ...build(), equipment: { W: "eq_t1_w_long", A: "R1", H: null, B: null, BR: [null, null], R: ["eq_t1_r_silver", null], C: [null, null] } },
  } as unknown as Pick<WorldStateData, "inventoryEquipment" | "playerBuild">;
  const again = structuredClone(s);
  repairGear(s);
  repairGear(again);
  assert.deepEqual(s, again, "seeded: the same repair everywhere");
  const bag = Object.entries(s.inventoryEquipment);
  assert.equal(bag.filter(([k]) => k.startsWith("ghost")).length, 0);
  assert.equal(bag.reduce((n, [, c]) => n + c, 0), 4);
  for (const [k] of bag) {
    const g = parseGear(k)!;
    assert.equal(k, g.key, "canonical");
    assert.ok(g.affixes.length >= GEAR_AFFIX_COUNT[g.def.ti]![0], k);
  }
  assert.ok(s.inventoryEquipment["eq_t0_w_fist"] === 1, "a tier-0 piece may have none");
  assert.ok(bag.some(([k]) => k === "eq_t1_c_wood~pa:15"), "clamped");
  const eq = s.playerBuild!.equipment;
  assert.equal(eq.A, null, "a ring in the robe slot comes off");
  assert.ok(parseGear(eq.W)!.affixes.length >= 1);
  assert.ok(parseGear(eq.R[0])!.affixes.length >= 1);
  // And the full repair keeps a fresh save as it is.
  newGame();
  const state = JSON.parse(JSON.stringify(store())) as WorldStateData;
  state.inventoryEquipment = { [rollGearKey("eq_t1_w_sword", seededRng(1, 1))]: 1 };
  const before = JSON.stringify(state.inventoryEquipment);
  validateAndRepair(state);
  assert.equal(JSON.stringify(state.inventoryEquipment), before);
});

console.log(`\n${passed} gear checks passed`);
