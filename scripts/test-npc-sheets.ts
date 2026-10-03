// Rigged NPC sheets (lib/characters/npc-sheets.ts, scripts/build-npc-sheets.ts)
// and map wandering (lib/stage/npc-wander.ts): every listed NPC has a painting,
// a complete sheet in the hero layout and a place on a map; so does every
// painted hero, costume archetype and enemy type; every villain is a reachable
// boss; every foe without its own art is drawn as a painted enemy type and
// every beast as a painted creature; wanderers stay near home, off blocked ground and still when
// frozen.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { ANIMATED_NPC_IDS, hasAnimatedSheet } from "../lib/characters/npc-sheets";
import { CHARACTER_IDS, CREATURE_ATLAS, CREATURE_FRAME_COUNT, FOE_CHARACTER_IDS, PAINTED_CHARACTER_IDS, characterDirectionSheet, characterSheet, creatureCell, hasDirectionalSheet, npcCharacterId } from "../lib/characters/catalog";
import { creatureFrameFor, findOpponentNpc, foeCharacterFor, opponentLook } from "../lib/world/battle-looks";
import { getNpc } from "../lib/world/data/npcs";
import { getLocationMap } from "../lib/world/data/location-maps";
import { OPPONENTS } from "../lib/world/data/opponents";
import { FIGHT_EVENTS } from "../lib/world/data/random-events";
import { npcBattleSprite, npcPixelSprite } from "../lib/world/data/npc-portraits";
import { WANDER_RADIUS, createWanderer, stepWanderer } from "../lib/stage/npc-wander";
import { encounterFoeAvailable } from "../lib/world/effects";
import { PLAYER_CHARACTER_IDS, characterWalk8Sheet, hasWalk8Sheet } from "../lib/characters/catalog";
import { WALK8_FIRST_FRAME, dir8FromVector, walk8Frame } from "../lib/characters/walk8";
import { HERO_ACTION_CELL, HERO_ACTION_IDS, HERO_ACTIVITIES, HERO_ATTACK_FRAMES, HERO_COMBAT_COLUMNS, HERO_COMBAT_ROWS, HERO_WORK_COLUMNS,
  HERO_WORK_GAPS, activityForBadge, activityForLifeSkill, hasHeroActions, heroHasPose, heroAttackColumn, heroAttackRow, heroCombatSheet, heroWorkSheet, practicePose } from "../lib/characters/hero-actions";
import { PLAYER_BODIES, heroBodyFor } from "../lib/world/data/player-bodies";
import { LIFE_SKILL_KEYS } from "../lib/world/types";
import { WEAPON_FAMILY_KEYS } from "../lib/game/types";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}

await check("65 rigged NPCs: 20 people + 10 villains + 35 strolling townsfolk, unique, each a registry NPC placed on a map", () => {
  assert.equal(ANIMATED_NPC_IDS.length, 65);
  assert.equal(new Set(ANIMATED_NPC_IDS).size, 65);
  for (const id of ANIMATED_NPC_IDS) {
    const npc = getNpc(id);
    assert.ok(npc, `${id} is a registry NPC`);
    assert.ok(npc.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[id]), `${id} stands on a map`);
    assert.ok(existsSync(`public/npcs/body/${id}.png`), `${id} has a painted body to rig`);
  }
});

const RIGGED = [...ANIMATED_NPC_IDS, ...PAINTED_CHARACTER_IDS];

await check("sheets: 512×512 base + 512×256 directions, every one of the 24 cells drawn", async () => {
  for (const id of RIGGED) {
    for (const [file, rows] of [[`public${characterSheet(id).split("?")[0]}`, 4], [`public${characterDirectionSheet(id).split("?")[0]}`, 2]] as const) {
      assert.ok(existsSync(file), `${file} exists (run bun scripts/build-npc-sheets.ts)`);
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, 512, file);
      assert.equal(info.height, rows * 128, file);
      for (let cell = 0; cell < rows * 4; cell++) {
        const ox = (cell % 4) * 128, oy = Math.floor(cell / 4) * 128;
        let opaque = 0;
        for (let y = oy; y < oy + 128; y++) for (let x = ox; x < ox + 128; x++) if (data[(y * 512 + x) * 4 + 3] >= 128) opaque++;
        assert.ok(opaque > 1500, `${file} cell ${cell} has a figure (${opaque} px)`);
      }
    }
  }
});

await check("sheets: every frame is its own pose — no two cells of a clip alike, no repeats anywhere", async () => {
  const CLIPS = [["idle", 0, 4], ["walk", 4, 8], ["attack", 8, 12], ["hurt/guard/victory/defeat", 12, 16], ["walk north", 16, 20], ["walk south", 20, 24]] as const;
  for (const id of RIGGED) {
    const cells: Int32Array[] = [];
    for (const [file, rows] of [[`public${characterSheet(id).split("?")[0]}`, 4], [`public${characterDirectionSheet(id).split("?")[0]}`, 2]] as const) {
      const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let cell = 0; cell < rows * 4; cell++) {
        const ox = (cell % 4) * 128, oy = Math.floor(cell / 4) * 128, px = new Int32Array(128 * 128);
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
          const i = ((oy + y) * 512 + ox + x) * 4;
          px[y * 128 + x] = data[i + 3] < 128 ? -1 : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
        }
        cells.push(px);
      }
    }
    const difference = (a: Int32Array, b: Int32Array) => {
      let changed = 0, union = 0;
      for (let i = 0; i < a.length; i++) if (a[i] >= 0 || b[i] >= 0) { union++; if (a[i] !== b[i]) changed++; }
      return changed / union;
    };
    for (const [clip, from, to] of CLIPS) {
      for (let i = from; i < to; i++) for (let j = i + 1; j < to; j++) {
        const d = difference(cells[i], cells[j]);
        assert.ok(d >= 0.15, `${id} ${clip}: cells ${i} and ${j} differ by only ${(d * 100).toFixed(0)}%`);
      }
    }
    for (let i = 0; i < 24; i++) for (let j = i + 1; j < 24; j++) {
      assert.ok(difference(cells[i], cells[j]) >= 0.1, `${id}: cells ${i} and ${j} repeat`);
    }
  }
});

await check("catalog: rigged NPCs are character ids with directions, and replace the single-pose stills", () => {
  for (const id of ANIMATED_NPC_IDS) {
    assert.ok((CHARACTER_IDS as readonly string[]).includes(id));
    assert.ok(hasDirectionalSheet(id));
    assert.equal(npcCharacterId(`npc-${id}`), id);
    assert.equal(npcPixelSprite(id), undefined);
    assert.equal(npcBattleSprite(id), undefined);
  }
  assert.ok(!hasAnimatedSheet("thug"));
  assert.equal(characterSheet("m1"), "/art/characters/m1.png");
  assert.equal(characterDirectionSheet("m1"), "/art/characters/m1-directions.png");
});

await check("enemy types: every foe without its own art is a painted, rigged enemy type, and every type is used", () => {
  const used = new Set<string>();
  for (const o of OPPONENTS) {
    const look = opponentLook(o.id, findOpponentNpc(o.id));
    if (look.kind === "creature" || look.still) continue;
    if (hasAnimatedSheet(look.characterId)) continue;
    assert.ok((FOE_CHARACTER_IDS as readonly string[]).includes(look.characterId), `${o.id} is drawn as ${look.characterId}, not an enemy type`);
    assert.equal(look.characterId, foeCharacterFor(o.id, o));
    used.add(look.characterId);
  }
  for (const id of FOE_CHARACTER_IDS) {
    assert.ok(used.has(id), `${id} is drawn for some foe`);
    assert.ok(hasDirectionalSheet(id) && existsSync(`public/foes/body/${id}.png`), `${id} has a painted body and directions`);
  }
  assert.equal(foeCharacterFor("river_pirate"), "foe_pirate");
  assert.equal(foeCharacterFor("law_constable"), "foe_constable");
  assert.equal(foeCharacterFor("night_blade", OPPONENTS.find((o) => o.id === "night_blade")), "foe_assassin_f");
});

await check("creatures: a 4 × 3 painted atlas, every cell drawn, every beast on a frame of its kind", async () => {
  const file = `public${CREATURE_ATLAS.url.split("?")[0]}`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width / CREATURE_ATLAS.columns, info.height / CREATURE_ATLAS.rows, "square cells");
  for (let frame = 0; frame < CREATURE_FRAME_COUNT; frame++) {
    const { left, top, width, height } = creatureCell(info.width, info.height, frame);
    let opaque = 0;
    for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) if (data[(y * info.width + x) * 4 + 3] >= 128) opaque++;
    assert.ok(opaque > 1500, `creature ${frame} is drawn (${opaque} px)`);
  }
  const expect: Record<string, number> = { wild_wolf: 0, mountain_tiger: 1, brown_bear: 2, wild_boar: 3, viper_snake: 4, wild_chicken: 5, hunt_pheasant: 5,
    thunder_eagle: 6, vampire_bat: 7, hunt_rabbit: 8, hunt_squirrel: 9, hunt_jungle_cat: 10, hunt_mountain_lynx: 10, giant_centipede: 11 };
  for (const [id, frame] of Object.entries(expect)) assert.equal(creatureFrameFor(id), frame, id);
  for (const o of OPPONENTS.filter((o) => o.category === "beast")) assert.ok(creatureFrameFor(o.id)! < CREATURE_FRAME_COUNT, o.id);
});

await check("villains: every rigged villain is a power-gated boss with a gang in the encounter pool", () => {
  // Story-saga foes (st_*) may borrow a villain's sheet and spars (spar_*) use
  // their NPC's own sheet; the encounter bosses are the elite_ ones.
  const villains = OPPONENTS.filter((o) => o.look?.npc && !o.id.startsWith("st_") && !o.id.startsWith("spar_"));
  assert.equal(villains.length, 10);
  for (const o of villains) {
    assert.ok(hasAnimatedSheet(o.look!.npc), `${o.id} → ${o.look!.npc} has a sheet`);
    assert.ok(o.id.startsWith("elite_"), `${o.id} is power-gated`);
    assert.ok(o.pack, `${o.id} brings a gang`);
    const event = FIGHT_EVENTS.find((e) => e.opponentId === o.id);
    assert.ok(event && (event.share ?? 1) < 1, `${o.id} is a rarer encounter`);
  }
  assert.deepEqual(new Set(villains.map((o) => o.look!.npc)), new Set(ANIMATED_NPC_IDS.slice(20, 30)));
  const alive = { npcExt: {}, assassinatedNpcIds: [], kidnappedNpcIds: [] };
  assert.ok(encounterFoeAvailable(alive, "elite_villain_zhou"));
  assert.ok(encounterFoeAvailable(alive, "bandit"), "ordinary foes are always available");
  assert.ok(!encounterFoeAvailable({ ...alive, assassinatedNpcIds: ["evil_capital_blackmarket_zhou"] }, "elite_villain_zhou"), "a slain villain never ambushes");
  assert.ok(!encounterFoeAvailable({ ...alive, kidnappedNpcIds: ["evil_wudu_elder_dushi"] }, "elite_villain_dushi"), "nor a kidnapped one");
});

await check("wander: strolls within its radius, never onto blocked ground, faces where it walks", () => {
  const home = { x: 400, y: 300 };
  const w = createWanderer("npc-test", home);
  const canStand = (p: { x: number; y: number }) => p.x < 420; // a wall east of x = 420
  let moved = false, maxDistance = 0;
  for (let i = 0; i < 3000; i++) {
    const before = { ...w.pos };
    stepWanderer(w, 1 / 30, false, canStand);
    if (w.moving) {
      moved = true;
      const dx = w.pos.x - before.x, dy = w.pos.y - before.y;
      const expected = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "north" : "south") : (dx < 0 ? "west" : "east");
      assert.equal(w.facing, expected);
    }
    assert.ok(canStand(w.pos), "never on blocked ground");
    maxDistance = Math.max(maxDistance, Math.hypot(w.pos.x - home.x, w.pos.y - home.y));
  }
  assert.ok(moved, "it walks");
  assert.ok(maxDistance <= WANDER_RADIUS + 0.01, `stays within ${WANDER_RADIUS} (max ${maxDistance.toFixed(1)})`);
});

await check("wander: frozen means standing still; the same id strolls the same way", () => {
  const a = createWanderer("npc-same", { x: 100, y: 100 }), b = createWanderer("npc-same", { x: 100, y: 100 });
  for (let i = 0; i < 600; i++) { stepWanderer(a, 1 / 30, false, () => true); stepWanderer(b, 1 / 30, false, () => true); }
  assert.deepEqual(a.pos, b.pos);
  const at = { ...a.pos };
  for (let i = 0; i < 300; i++) stepWanderer(a, 1 / 30, true, () => true);
  assert.deepEqual(a.pos, at);
  assert.equal(a.moving, false);
});

await check("heroes: one body per gender (m1, f1), older bodies fall back to their gender's", () => {
  assert.deepEqual(PLAYER_BODIES, { male: ["m1"], female: ["f1"] });
  assert.equal(heroBodyFor("m3", "male"), "m1");
  assert.equal(heroBodyFor("f4", "female"), "f1");
  assert.equal(heroBodyFor(undefined, "female"), "f1");
  assert.equal(heroBodyFor("f1", "female"), "f1");
  for (const id of [...PLAYER_BODIES.male, ...PLAYER_BODIES.female]) assert.ok(hasHeroActions(id), `${id} has painted action sheets`);
});

await check("hero action sheets: a weapon row per family + combat poses, a four-frame loop per activity, every cell drawn", async () => {
  assert.deepEqual([...HERO_COMBAT_ROWS.slice(0, 7)].sort(), [...WEAPON_FAMILY_KEYS].sort());
  const { width: CW, height: CH } = HERO_ACTION_CELL;
  for (const id of HERO_ACTION_IDS) {
    for (const [file, columns, rows, used] of [
      [`public${heroCombatSheet(id)}`, HERO_COMBAT_COLUMNS, HERO_COMBAT_ROWS.length, (row: number, col: number) => row === HERO_COMBAT_ROWS.length - 1 || col < HERO_ATTACK_FRAMES],
      [`public${heroWorkSheet(id)}`, HERO_WORK_COLUMNS, HERO_ACTIVITIES.length, (row: number) => !(HERO_WORK_GAPS[id] ?? []).includes(HERO_ACTIVITIES[row])],
    ] as const) {
      assert.ok(existsSync(file), `${file} exists (bun scripts/build-hero-actions.ts)`);
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, CW * columns, file);
      assert.equal(info.height, CH * rows, file);
      for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
        let opaque = 0, feet = 0;
        for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
          if (data[(((row * CH + y) * info.width) + col * CW + x) * 4 + 3] < 128) continue;
          opaque++;
          feet = Math.max(feet, y);
        }
        if (!used(row, col)) { assert.equal(opaque, 0, `${file} row ${row} col ${col} is listed as unpainted but has a figure`); continue; }
        assert.ok(opaque > 1500, `${file} row ${row} col ${col} has a figure (${opaque} px)`);
        assert.ok(feet >= HERO_ACTION_CELL.feet - 2 && feet <= HERO_ACTION_CELL.feet + 1, `${file} row ${row} col ${col} stands on the foot line (${feet})`);
      }
    }
  }
});

await check("hero actions: attacks follow the weapon, work follows the life skill", () => {
  for (const family of WEAPON_FAMILY_KEYS) assert.equal(heroAttackRow(family), family);
  assert.equal(heroAttackRow(undefined), "fist");
  const timing = { hitDelay: 300, lastImpact: 520, gap: 110 };
  const columns = [0, 120, 300, 520, 700, 860].map((age) => heroAttackColumn(age, timing));
  assert.deepEqual([columns[0], columns[1], columns[2]], [0, 1, 2], "stance, wind-up, strike");
  assert.equal(columns[5], 4, "recovers at the end");
  assert.ok(columns.slice(2, 5).includes(3), "follows through");
  const mapped = LIFE_SKILL_KEYS.map((skill) => [skill, activityForLifeSkill(skill)] as const);
  for (const [skill, row] of mapped) if (row) assert.ok(HERO_ACTIVITIES.includes(row), skill);
  assert.deepEqual(["mining", "woodcutting", "fishing", "herbalism", "hunting", "venom", "forge", "chef", "alchemy", "tailoring", "reading", "music"]
    .map(activityForLifeSkill), ["mine", "chop", "fish", "herb", "hunt", "venom", "forge", "cook", "alchemy", "craft", "read", "music"]);
  assert.equal(activityForBadge("labor"), "mine");
  assert.equal(activityForBadge("rest"), "sleep");
  assert.deepEqual(practicePose(false, "sword"), { sheet: "combat", row: "sword" });
  assert.deepEqual(practicePose(true, undefined), { sheet: "work", row: "meditate" });
  assert.equal(heroHasPose("m1", { sheet: "work", row: "sleep" }), true);
  assert.equal(heroHasPose("f1", { sheet: "work", row: "mine" }), true);
  assert.equal(heroHasPose("f1", { sheet: "work", row: "sleep" }), (HERO_WORK_GAPS.f1 ?? []).includes("sleep") === false);
  assert.equal(heroHasPose("m2", { sheet: "combat", row: "sword" }), false);
});

await check("heroes: an eight-way walk sheet each — 28 drawn cells, every direction its own picture", async () => {
  for (const id of PLAYER_CHARACTER_IDS) {
    assert.ok(hasWalk8Sheet(id), id);
    const file = `public${characterWalk8Sheet(id)}`;
    assert.ok(existsSync(file), `${file} exists (bun scripts/build-hero-walk8.ts)`);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 512, file);
    assert.equal(info.height, 7 * 128, file);
    const cells: Uint8Array[] = [];
    for (let cell = 0; cell < 28; cell++) {
      const ox = (cell % 4) * 128, oy = Math.floor(cell / 4) * 128;
      const px = new Uint8Array(128 * 128 * 4);
      let opaque = 0;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const i = ((oy + y) * 512 + ox + x) * 4;
        if (data[i + 3] < 128) continue;
        opaque++;
        px.set([data[i], data[i + 1], data[i + 2], 255], (y * 128 + x) * 4);
      }
      assert.ok(opaque > 1200, `${file} cell ${cell} has a figure (${opaque} px)`);
      cells.push(px);
    }
    // Share of the figures' pixels that differ (outline, shape or colour).
    const differ = (a: Uint8Array, b: Uint8Array) => {
      let d = 0, n = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (!a[i + 3] && !b[i + 3]) continue;
        n++;
        if (a[i + 3] !== b[i + 3] || Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) d++;
      }
      return d / Math.max(1, n);
    };
    // The five standing poses (S, SE, E, NE, N) are different views, and each walk has a real stride.
    for (let i = 20; i < 25; i++) for (let j = i + 1; j < 25; j++) assert.ok(differ(cells[i], cells[j]) > 0.3, `${id}: standing ${i} and ${j} look alike (${differ(cells[i], cells[j]).toFixed(2)})`);
    for (let row = 0; row < 5; row++) assert.ok(differ(cells[row * 4], cells[row * 4 + 2]) > 0.15, `${id}: walk row ${row} barely moves (${differ(cells[row * 4], cells[row * 4 + 2]).toFixed(2)})`);
  }
  assert.equal(hasWalk8Sheet("sect_wudang_master_qingxu"), false);
});

await check("walk8: the hero faces the way it moves — eight headings, west mirrored from east", () => {
  assert.equal(dir8FromVector(1, 0, "S"), "E");
  assert.equal(dir8FromVector(-1, 0, "S"), "W");
  assert.equal(dir8FromVector(0, -1, "S"), "N");
  assert.equal(dir8FromVector(0, 1, "N"), "S");
  assert.equal(dir8FromVector(1, 1, "N"), "SE");
  assert.equal(dir8FromVector(-1, -1, "S"), "NW");
  assert.equal(dir8FromVector(0, 0, "NE"), "NE", "standing keeps the heading");
  assert.equal(dir8FromVector(1, 0.42, "E"), "E", "a joystick near a boundary does not flicker");
  assert.deepEqual(walk8Frame("E", 1), { frame: WALK8_FIRST_FRAME + 2 * 4 + 1, mirror: false });
  assert.deepEqual(walk8Frame("W", 1), { frame: WALK8_FIRST_FRAME + 2 * 4 + 1, mirror: true });
  assert.deepEqual(walk8Frame("SW", null), { frame: WALK8_FIRST_FRAME + 20 + 1, mirror: true });
  assert.deepEqual(walk8Frame("N", null), { frame: WALK8_FIRST_FRAME + 24, mirror: false });
});

console.log(`${passed} NPC sheet and wander checks passed`);
