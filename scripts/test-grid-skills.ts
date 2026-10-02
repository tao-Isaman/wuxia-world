// Grid geometry for every skill / art active (lib/game/grid/skill-grid.ts).
// Run: bun run test:grid-skills
import assert from "node:assert/strict";
import { castVfx } from "../lib/stage/cast-vfx";
import { heroMoveFor, heroPose, movesIn, type HeroMove } from "../lib/stage/hero-motion";
import { SKILLS, ARTS } from "../lib/game/data";
import { WEAPON_FAMILY_KEYS } from "../lib/game/types";
import { skillGrid, artGrid, slotGrid, describeGrid, SKILL_GRID_OVERRIDES } from "../lib/game/grid/skill-grid";
import { aimCells, areaCells, manhattan, type Board } from "../lib/game/grid/geometry";
import { GRID_DEFAULT_COLS, GRID_DEFAULT_ROWS, type GridSkillProfile } from "../lib/game/grid/types";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

const THAI = /[฀-๿]/;
const board: Board = { cols: GRID_DEFAULT_COLS, rows: GRID_DEFAULT_ROWS, blocked: new Set() };
const centre = { x: Math.floor(GRID_DEFAULT_COLS / 2), y: Math.floor(GRID_DEFAULT_ROWS / 2) };

function assertValid(label: string, p: GridSkillProfile) {
  const { min, max } = p.range;
  assert.ok(Number.isInteger(min) && Number.isInteger(max), `${label}: integer range`);
  assert.ok(min >= 0 && max <= 5 && min <= max, `${label}: range ${min}..${max}`);
  if (p.target === "self") assert.deepEqual(p.range, { min: 0, max: 0 }, `${label}: self ⇒ {0,0}`);
  if (p.target === "enemy") assert.ok(max >= 1, `${label}: enemy ⇒ max ≥ 1`);
  const a = p.area;
  if (a.kind === "line") {
    assert.ok(a.size >= 1 && a.size <= 4, `${label}: line size ${a.size}`);
    assert.ok(min >= 1, `${label}: line ⇒ min ≥ 1`);
    assert.ok(max <= a.size, `${label}: line aim ${max} beyond its length ${a.size}`);
  }
  if (a.kind === "diamond" || a.kind === "square" || a.kind === "cross")
    assert.ok(a.size >= 1 && a.size <= 2, `${label}: ${a.kind} size ${a.size}`);
  const text = describeGrid(p);
  assert.ok(text.length > 0 && THAI.test(text), `${label}: describeGrid "${text}"`);
  if (p.target === "enemy") {
    const aims = aimCells(board, centre, p);
    assert.ok(aims.length > 0, `${label}: no aim cell from the board centre`);
    // Some aim reaches a tile other than the caster's own.
    assert.ok(aims.some((c) => areaCells(board, centre, c, p.area).some((h) => manhattan(h, centre) >= 1)),
      `${label}: area never leaves the caster's tile`);
  }
}

check(`every skill (${SKILLS.length}) yields a valid profile`, () => {
  for (const s of SKILLS) assertValid(`skill ${s.id}`, skillGrid(s));
});

check("pure self skills are self, damaging / debuffing skills target enemies", () => {
  for (const s of SKILLS) {
    const p = skillGrid(s);
    if (!s.at && !s.ee) assert.equal(p.target, "self", s.id);
    else assert.equal(p.target, "enemy", s.id);
  }
});

const activeArts = ARTS.filter((a) => a.act);
check(`every art with an active (${activeArts.length}) yields a valid profile; passive-only arts → null`, () => {
  for (const a of ARTS) {
    const p = artGrid(a);
    if (!a.act) { assert.equal(p, null, a.id); continue; }
    assert.ok(p, a.id);
    assertValid(`art ${a.id}`, p);
    const selfTypes = ["heal", "heal_cleanse", "heal_full_cleanse", "buff_reflect", "buff_reduce", "buff_spd", "buff_eva_debuff_eva"];
    assert.equal(p.target, selfTypes.includes(a.act.t) ? "self" : "enemy", `${a.id} (${a.act.t})`);
  }
});

check(`every override key (${Object.keys(SKILL_GRID_OVERRIDES).length}) is a real skill with a valid profile`, () => {
  for (const id of Object.keys(SKILL_GRID_OVERRIDES)) {
    const s = SKILLS.find((k) => k.id === id);
    assert.ok(s, `override ${id} is not a skill id`);
    const p = skillGrid(s);
    assertValid(`override ${id}`, p);
    const ov = SKILL_GRID_OVERRIDES[id];
    if (ov.area) assert.equal(p.area.kind, ov.area.kind, `${id}: override area applied`);
  }
});

check("slotGrid parses skill ids, art: ids and junk", () => {
  const s = SKILLS[0];
  assert.deepEqual(slotGrid(s.id), skillGrid(s));
  const a = activeArts[0];
  assert.deepEqual(slotGrid(`art:${a.id}`), artGrid(a));
  const passive = ARTS.find((x) => !x.act && x.id !== "none");
  if (passive) assert.equal(slotGrid(`art:${passive.id}`), null);
  for (const junk of [null, undefined, "", "nope_not_a_skill", "art:", "art:nope", "art:none"]) assert.equal(slotGrid(junk), null, String(junk));
});

check("describeGrid labels", () => {
  assert.equal(describeGrid({ range: { min: 0, max: 0 }, area: { kind: "single" }, target: "self" }), "ตนเอง");
  assert.equal(describeGrid({ range: { min: 1, max: 1 }, area: { kind: "single" }, target: "enemy" }), "ระยะ 1 · เป้าเดียว");
  assert.equal(describeGrid({ range: { min: 2, max: 4 }, area: { kind: "diamond", size: 1 }, target: "enemy" }), "ระยะ 2–4 · วงรัศมี 1");
  assert.equal(describeGrid({ range: { min: 1, max: 3 }, area: { kind: "line", size: 3 }, target: "enemy" }), "แนวตรง 3 ช่อง");
});

check("spot checks follow the rule table", () => {
  const g = (id: string) => skillGrid(SKILLS.find((s) => s.id === id)!);
  assert.deepEqual(g("basic_punch"), { range: { min: 1, max: 1 }, area: { kind: "single" }, target: "enemy" });
  assert.equal(g("nc5").area.kind, "line");                 // spear pokes a line
  assert.equal(g("hgs_five_peaks").area.kind, "arc");       // T2 phy sword sweeps
  assert.equal(g("hgs_swift_blade").area.kind, "single");   // 4-hit flurry stays single
  assert.equal(g("gn").range.min, 2);                       // needles are ranged
  assert.equal(g("nc8").range.min, 1);                      // whips work up close
  assert.equal(g("zs").area.kind, "diamond");               // music AoE
  assert.equal(g("rf").target, "self");                     // pure buff
  assert.equal(g("pn").target, "enemy");                    // no-damage poison needle
});

// ── Histogram for eyeballing balance ───────────────────────────────────
function key(p: GridSkillProfile): string {
  if (p.target === "self") return "self";
  const a = p.area;
  const shape = "size" in a ? `${a.kind}${a.size}` : a.kind;
  return `${p.range.min}-${p.range.max} ${shape}`;
}
console.log("\n── skill profiles per weapon family ──");
for (const w of WEAPON_FAMILY_KEYS) {
  const counts = new Map<string, number>();
  const list = SKILLS.filter((s) => s.w === w);
  for (const s of list) { const k = key(skillGrid(s)); counts.set(k, (counts.get(k) ?? 0) + 1); }
  const row = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join("  ");
  console.log(`${w.padEnd(6)} (${String(list.length).padStart(3)})  ${row}`);
}
check("hero combat motion: every skill and art has a body move, and the poses rest, rise and reach as drawn", () => {
  const seen = new Set<HeroMove>();
  const FAMILY: Record<string, HeroMove> = { sword: "sweep", blade: "cleave", fist: "strike", long: "lunge", short: "flurry", hidden: "throw", music: "play" };
  for (const skill of SKILLS) {
    const move = heroMoveFor(castVfx({ tier: skill.ti, source: { kind: "skill", id: skill.id } }), { support: false });
    assert.equal(move, FAMILY[skill.w] ?? "strike", `${skill.id} (${skill.w})`);
    seen.add(move);
  }
  for (const art of ARTS.filter((a) => a.id !== "none")) {
    assert.equal(heroMoveFor(castVfx({ tier: art.ti, source: { kind: "art", id: art.id } }), { support: false }), "channel", art.id);
  }
  assert.equal(heroMoveFor(castVfx({ tier: 0, source: { kind: "skill", id: SKILLS[0].id } }), { support: true }), "guard");
  assert.ok(seen.size >= 6, `skills use ${seen.size} different moves`);
  const timing = { hitDelay: 300, lastImpact: 520 };
  const all: HeroMove[] = ["sweep", "cleave", "strike", "lunge", "flurry", "throw", "play", "channel", "guard"];
  for (const move of all) {
    for (const age of [0, timing.lastImpact + 360]) {
      const rest = heroPose(move, age, timing);
      assert.deepEqual([rest.reach, rest.step, rest.lift, rest.lean, rest.aura], [0, 0, 0, 0, 0], `${move} rests at ${age}`);
    }
  }
  assert.ok(heroPose("cleave", 150, timing).lift > 30, "the sabre leaps");
  assert.ok(heroPose("throw", 290, timing).step < -10, "a thrower steps back");
  assert.ok(heroPose("lunge", 400, timing).reach > 1, "a spear drives past");
  assert.ok(heroPose("channel", 400, timing).aura > 0.5 && heroPose("channel", 400, timing).lift > 15, "an art rises in qi");
  assert.ok(heroPose("sweep", 200, timing).ghost && heroPose("flurry", 400, timing).ghost, "fast moves leave afterimages");
  assert.ok(movesIn("strike") && movesIn("flurry") && !movesIn("throw") && !movesIn("channel"));
});

const artCounts = new Map<string, number>();
for (const a of activeArts) { const k = key(artGrid(a)!); artCounts.set(k, (artCounts.get(k) ?? 0) + 1); }
console.log(`arts   (${String(activeArts.length).padStart(3)})  ${[...artCounts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join("  ")}`);

console.log(`\n${checks} checks passed`);
