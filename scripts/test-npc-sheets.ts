// Rigged NPC sheets (lib/characters/npc-sheets.ts, scripts/build-npc-sheets.ts)
// and map wandering (lib/stage/npc-wander.ts): every listed NPC has a painting,
// a complete sheet in the hero layout and a place on a map; every villain is a
// reachable boss; wanderers stay near home, off blocked ground and still when
// frozen.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { ANIMATED_NPC_IDS, hasAnimatedSheet } from "../lib/characters/npc-sheets";
import { CHARACTER_IDS, characterDirectionSheet, characterSheet, hasDirectionalSheet, npcCharacterId } from "../lib/characters/catalog";
import { getNpc } from "../lib/world/data/npcs";
import { getLocationMap } from "../lib/world/data/location-maps";
import { OPPONENTS } from "../lib/world/data/opponents";
import { FIGHT_EVENTS } from "../lib/world/data/random-events";
import { npcBattleSprite, npcPixelSprite } from "../lib/world/data/npc-portraits";
import { WANDER_RADIUS, createWanderer, stepWanderer } from "../lib/stage/npc-wander";
import { encounterFoeAvailable } from "../lib/world/effects";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}

await check("30 rigged NPCs: 20 people + 10 villains, unique, each a registry NPC placed on a map", () => {
  assert.equal(ANIMATED_NPC_IDS.length, 30);
  assert.equal(new Set(ANIMATED_NPC_IDS).size, 30);
  for (const id of ANIMATED_NPC_IDS) {
    const npc = getNpc(id);
    assert.ok(npc, `${id} is a registry NPC`);
    assert.ok(npc.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[id]), `${id} stands on a map`);
    assert.ok(existsSync(`public/npcs/body/${id}.png`), `${id} has a painted body to rig`);
  }
});

await check("sheets: 512×512 base + 512×256 directions, every one of the 24 cells drawn", async () => {
  for (const id of ANIMATED_NPC_IDS) {
    for (const [file, rows] of [[`public${characterSheet(id)}`, 4], [`public${characterDirectionSheet(id)}`, 2]] as const) {
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

await check("villains: every rigged villain is a power-gated boss with a gang in the encounter pool", () => {
  const villains = OPPONENTS.filter((o) => o.look?.npc);
  assert.equal(villains.length, 10);
  for (const o of villains) {
    assert.ok(hasAnimatedSheet(o.look!.npc), `${o.id} → ${o.look!.npc} has a sheet`);
    assert.ok(o.id.startsWith("elite_"), `${o.id} is power-gated`);
    assert.ok(o.pack, `${o.id} brings a gang`);
    const event = FIGHT_EVENTS.find((e) => e.opponentId === o.id);
    assert.ok(event && (event.share ?? 1) < 1, `${o.id} is a rarer encounter`);
  }
  assert.deepEqual(new Set(villains.map((o) => o.look!.npc)), new Set(ANIMATED_NPC_IDS.slice(20)));
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

console.log(`${passed} NPC sheet and wander checks passed`);
