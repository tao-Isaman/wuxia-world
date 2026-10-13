// Outfits and weapons on the body (docs/design/appearance.md): the outfit
// catalogue, what unlocks each, wearing, where found outfits come from (never sold), the save, the weapon's
// family and carry, the recolour of a hero's sheet, and the battle look.
//   bun run test:appearance
import assert from "node:assert/strict";
import sharp from "sharp";
import { EQUIPMENT } from "../lib/game/data/equipment";
import { DEFAULT_OUTFIT, OUTFITS, getOutfit } from "../lib/world/data/outfits";
import { SECT_MEMBERSHIPS } from "../lib/world/data/sect-memberships";
import {
  characterLook, outfitSourceHint, wardrobeOutfits, currentOutfit, heroLook, outfitStatus, outfitUnlocked, unlockedOutfits, weaponFamilyOf, weaponLookOf,
} from "../lib/world/appearance";
import { HEAD_SHARE, HERO_CLOTH, frameBoxes, recolorColor, recolorSheet, rgbToHsl, hslToRgb } from "../lib/characters/outfit-recolor";
import { PL_SHEETS } from "../lib/characters/pl-sheets";
import { playerLook } from "../lib/world/battle-looks";
import { worldBattleStart } from "../lib/world/battle-setup";
import { validateAndRepair } from "../lib/world/validate";
import { OUTFIT_SOURCES, outfitItemId, outfitRecipeItemId, outfitRecipeId, rollOutfitLoot } from "../lib/world/data/outfit-sources";
import { getItem } from "../lib/world/data/items";
import { getQuest } from "../lib/world/data/quests";
import { getOpponent } from "../lib/world/data/opponents";
import { getRecipe } from "../lib/world/data/recipes";
import { SHOPS } from "../lib/world/data/shops";
import { ARTISANS, recipesOfferedBy } from "../lib/world/data/artisans";
import { migrateSave, partializeSave } from "../store/world/persist";
import { SAVE_VERSION } from "../store/world/save-version";
import { useWorldStore } from "../store/world-store";
import type { WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => { if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args); };

/** A hero's PixelLab sheet as RGBA pixels. */
const sheets: Record<string, { data: Uint8ClampedArray; width: number; height: number }> = {};
for (const hero of ["m1", "f1"]) {
  const { data, info } = await sharp(`public/art/characters/pl/${hero}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  sheets[hero] = { data: new Uint8ClampedArray(data), width: info.width, height: info.height };
}

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const store = () => useWorldStore.getState();
function newGame(gender: "male" | "female" = "male") {
  store().resetGame();
  store().startNewGame({ newWorld: true, name: "ทดสอบ", gender } as never);
}

check("outfits: unique ids, a uniform for every joinable sect, tints in range, Thai names", () => {
  const ids = OUTFITS.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(getOutfit(DEFAULT_OUTFIT)?.tint, null);
  for (const sectId of Object.keys(SECT_MEMBERSHIPS)) {
    assert.ok(OUTFITS.some((o) => o.unlock.t === "sect" && o.unlock.sectId === sectId), `uniform for ${sectId}`);
  }
  for (const outfit of OUTFITS) {
    assert.match(outfit.id, /^[a-z0-9_]{1,32}$/, "fits the server's look check");
    assert.match(outfit.name, /[฀-๿]/);
    for (const hsl of [outfit.tint?.primary, outfit.tint?.secondary].filter(Boolean)) {
      const [h, s, l] = hsl!;
      assert.ok(h >= 0 && h < 360 && s >= 0 && s <= 1 && l >= 0 && l <= 1, `${outfit.id} tint`);
    }
    if (outfit.unlock.t === "item") assert.ok(OUTFIT_SOURCES[outfit.id], `${outfit.id} has sources`);
  }
  assert.ok(OUTFITS.some((o) => o.unlock.t === "champion"));
});

check("unlocks: the default always; the hero's own sect's uniform only (while a disciple); a found outfit once its item is used; champion once won", () => {
  newGame();
  const s = store();
  assert.deepEqual(unlockedOutfits(s).map((o) => o.id), [DEFAULT_OUTFIT]);
  assert.equal(outfitStatus(s, getOutfit("sect_shaolin")!).hint, "ศิษย์เส้าหลินเท่านั้น");
  assert.ok(!wardrobeOutfits(s).some((o) => o.unlock.t === "sect"), "no sect: no uniforms in the wardrobe");
  const member = { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 1 };
  useWorldStore.setState({ sectMembership: { shaolin: member } });
  assert.ok(outfitUnlocked(store(), "sect_shaolin"));
  assert.deepEqual(wardrobeOutfits(store()).filter((o) => o.unlock.t === "sect").map((o) => o.id), ["sect_shaolin"], "only the own sect's");
  useWorldStore.setState({ sectMembership: { shaolin: { ...member, status: "resigned" } } });
  assert.ok(!outfitUnlocked(store(), "sect_shaolin"), "a former disciple no longer wears it");
  assert.ok(!wardrobeOutfits(store()).some((o) => o.unlock.t === "sect"));
  useWorldStore.setState({ sectMembership: { shaolin: { ...member, status: "betrayed" } } });
  assert.ok(!outfitUnlocked(store(), "sect_shaolin"));
  assert.ok(!outfitUnlocked(store(), "tailor_ink"));
  useWorldStore.setState({ wardrobe: ["tailor_ink"] });
  assert.ok(outfitUnlocked(store(), "tailor_ink"));
  assert.ok(!outfitUnlocked(store(), "champion_gold"));
  useWorldStore.setState({ tournamentHistory: [{ year: 1, champion: "player" }] });
  assert.ok(outfitUnlocked(store(), "champion_gold"));
  assert.ok(!outfitUnlocked(store(), "no_such_outfit"));
});

check("gender: Shaolin's robe is only for men, Emei's only for women — left out of the other's wardrobe and never worn", () => {
  newGame("male");
  const member = { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 1 };
  const all = { shaolin: member, emei: member, wudang: member };
  const ids = (gender: "male" | "female") => wardrobeOutfits({ gender, sectMembership: all }).map((o) => o.id);
  assert.ok(ids("male").includes("sect_shaolin") && !ids("male").includes("sect_emei"));
  assert.ok(ids("female").includes("sect_emei") && !ids("female").includes("sect_shaolin"));
  assert.ok(ids("male").includes("sect_wudang") && ids("female").includes("sect_wudang"), "open sects for both");
  // Even a save that says so (an edit) gives a man no Emei robe.
  useWorldStore.setState({ sectMembership: { emei: member } });
  assert.ok(!outfitUnlocked(store(), "sect_emei"));
  assert.equal(outfitStatus(store(), getOutfit("sect_emei")!).hint, "สำนักนี้รับเฉพาะศิษย์หญิง");
  assert.equal(store().wearOutfit("sect_emei"), false);
});

check("found outfits: no shop or tailor sells one; each comes from quests, drops or a recipe, with a repeatable source", () => {
  const found = OUTFITS.filter((o) => o.unlock.t === "item");
  assert.equal(found.length, 6);
  for (const outfit of found) {
    const src = OUTFIT_SOURCES[outfit.id]!;
    const item = getItem(outfitItemId(outfit.id));
    assert.ok(item?.use?.t === "learnOutfit" && item.use.outfitId === outfit.id, `${outfit.id}: its item adds it`);
    for (const q of src.questRewards ?? []) {
      assert.ok(getQuest(q)?.rewards?.some((r) => r.t === "item" && r.itemId === outfitItemId(outfit.id)), `${q} hands over ${outfit.id}`);
    }
    for (const l of [...(src.loot ?? []), ...(src.craft?.recipeLoot ?? [])]) assert.ok(getOpponent(l.opponentId), `${l.opponentId} exists`);
    if (src.craft) {
      const recipe = getRecipe(outfitRecipeId(outfit.id));
      assert.equal(recipe?.skill, "tailoring");
      assert.equal(recipe?.output.itemId, outfitItemId(outfit.id));
      for (const input of recipe!.inputs) assert.ok(getItem(input.itemId), input.itemId);
      assert.equal(getItem(outfitRecipeItemId(outfit.id))?.use?.t, "learnRecipe");
    }
    // Repeatable: a foe's drop or a recipe to craft it again and again.
    assert.ok((src.loot?.length ?? 0) > 0 || !!src.craft, `${outfit.id} has a repeatable source`);
    assert.ok(!outfitSourceHint(outfit.id).includes("undefined"));
    // Never sold.
    for (const shop of SHOPS) assert.ok(!shop.inventory.some((e) => (typeof e === "string" ? e : (e as { itemId: string }).itemId) === outfitItemId(outfit.id)), `${shop.id} sells ${outfit.id}`);
    for (const artisan of ARTISANS) assert.ok(!recipesOfferedBy(artisan).some((o) => o.recipeId === outfitRecipeId(outfit.id)), `${artisan.id} sells its recipe`);
  }
  // A foe's drop rolls.
  assert.deepEqual(rollOutfitLoot("night_blade", () => 0), [outfitItemId("tailor_ink")]);
  assert.deepEqual(rollOutfitLoot("night_blade", () => 0.99), []);
});

check("wearing: only what the wardrobe holds; an outfit's item puts it there for good", () => {
  newGame();
  assert.equal(store().wearOutfit("tailor_jade"), false, "locked");
  assert.match(outfitStatus(store(), getOutfit("tailor_jade")!).hint, /ไม่มีร้านใดขาย/);
  assert.equal(store().appearance.outfit, DEFAULT_OUTFIT);
  useWorldStore.setState({ inventory: { [outfitItemId("tailor_jade")]: 2 } });
  const used = store().useItem(outfitItemId("tailor_jade"));
  assert.ok(used.ok && used.kind === "learnOutfit");
  assert.deepEqual(store().wardrobe, ["tailor_jade"]);
  assert.equal(store().inventory[outfitItemId("tailor_jade")], 1, "one used");
  assert.equal(store().useItem(outfitItemId("tailor_jade")).ok, false, "already in the wardrobe: kept");
  assert.equal(store().inventory[outfitItemId("tailor_jade")], 1);
  assert.ok(store().actionLog.at(-1)?.message.includes("ชุดเขียวหยก"));
  assert.ok(store().wearOutfit("tailor_jade"));
  assert.ok(store().wearOutfit(DEFAULT_OUTFIT));
  store().setHideWeapon(true);
  assert.equal(store().appearance.hideWeapon, true);
});

check("a worn outfit no longer held falls back to the default (current look, and repaired on load)", () => {
  newGame("female");
  const member = { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 1 };
  useWorldStore.setState({ sectMembership: { emei: member }, appearance: { outfit: "sect_emei", hideWeapon: false } });
  assert.equal(currentOutfit(store()), "sect_emei");
  useWorldStore.setState({ sectMembership: { emei: { ...member, status: "betrayed" } } });
  assert.equal(currentOutfit(store()), DEFAULT_OUTFIT);
  const state = JSON.parse(JSON.stringify(store())) as WorldStateData;
  state.wardrobe = ["tailor_ink", "tailor_ink", "sect_emei", "made_up"];
  validateAndRepair(state);
  assert.deepEqual(state.wardrobe, ["tailor_ink"], "only found outfits, once each");
  assert.equal(state.appearance.outfit, DEFAULT_OUTFIT);
});

check("save v29: appearance and wardrobe are saved; an older save gets the default look", () => {
  assert.equal(SAVE_VERSION, 30);
  newGame();
  useWorldStore.setState({ wardrobe: ["tailor_ink"], appearance: { outfit: "tailor_ink", hideWeapon: true } });
  const saved = partializeSave(store()) as unknown as WorldStateData;
  assert.deepEqual(saved.appearance, { outfit: "tailor_ink", hideWeapon: true });
  assert.deepEqual(saved.wardrobe, ["tailor_ink"]);
  const old = { ...saved } as Partial<WorldStateData>;
  delete old.appearance; delete old.wardrobe;
  const migrated = migrateSave(old, 28);
  assert.deepEqual(migrated.appearance, { outfit: DEFAULT_OUTFIT, hideWeapon: false });
  assert.deepEqual(migrated.wardrobe, []);
  assert.deepEqual(migrateSave({ ...old, appearance: { outfit: 5, hideWeapon: "yes" }, wardrobe: [1, "tailor_ink"] } as never, 29).wardrobe, ["tailor_ink"]);
});

check("weapons: every weapon has a family and its icon; long arms, sabres and instruments ride the back, fans the waist; fists, hidden weapons and the jian are not drawn", () => {
  const weapons = EQUIPMENT.filter((e) => e.ty === "W");
  for (const weapon of weapons) {
    const look = weaponLookOf(weapon.id);
    assert.ok(look, weapon.id);
    assert.match(look!.iconId, /^ico_/);
  }
  const family = (id: string) => weaponFamilyOf(id);
  assert.equal(family("eq_t1_w_long"), "long");
  assert.equal(family("eq_t0_w_long"), "long");
  assert.equal(family("W1"), "blade");
  assert.equal(family("W5"), "sword");
  assert.equal(family("eq_t1_w_sword"), "sword");
  assert.equal(family("W_pipa"), "music");
  assert.equal(family("eq_t0_w_short"), "short");
  assert.equal(family("eq_t1_w_hidden"), "hidden");
  assert.equal(family("eq_t0_w_fist"), "fist");
  assert.equal(family("A1"), null, "armour is no weapon");
  assert.equal(weaponLookOf("eq_t1_w_long")?.carry, "back");
  assert.equal(weaponLookOf("eq_t0_w_short")?.carry, "waist");
  assert.equal(weaponLookOf("eq_t1_w_sword")?.carry, null);
  assert.equal(weaponLookOf("eq_t1_w_hidden")?.carry, null);
});

check("the hero's look: outfit and the carried weapon (none when hidden or not drawn); the renderers' look", () => {
  newGame();
  const build = store().playerBuild!;
  useWorldStore.setState({ playerBuild: { ...build, equipment: { ...build.equipment, W: "eq_t1_w_long" } } });
  assert.deepEqual(heroLook(store()), { outfit: DEFAULT_OUTFIT, weapon: "eq_t1_w_long" });
  store().setHideWeapon(true);
  assert.equal(heroLook(store()).weapon, null);
  store().setHideWeapon(false);
  useWorldStore.setState({ playerBuild: { ...build, equipment: { ...build.equipment, W: "eq_t1_w_sword" } } });
  assert.equal(heroLook(store()).weapon, null, "the jian is already on the sheet");
  const look = characterLook("tailor_ink", "eq_t1_w_long");
  assert.equal(look.outfit, "tailor_ink");
  assert.deepEqual(look.tint, getOutfit("tailor_ink")!.tint);
  assert.equal(look.weapon?.carry, "back");
  assert.match(look.weapon!.icon, /^\/assets\/icon\/.+\.png$/);
  assert.deepEqual(characterLook("no_such", null), { outfit: DEFAULT_OUTFIT, tint: null, weapon: null });
});

check("battle: the hero fights in their outfit (the staged look carries its recolour)", () => {
  const look = playerLook("f1", "sect_emei");
  assert.ok(look.kind === "character" && look.outfit?.id === "sect_emei");
  assert.deepEqual(look.kind === "character" && look.outfit?.primary, getOutfit("sect_emei")!.tint!.primary);
  assert.ok(!("outfit" in playerLook("m1", DEFAULT_OUTFIT)));
  newGame();
  const member = { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 1 };
  useWorldStore.setState({ sectMembership: { wudang: member }, appearance: { outfit: "sect_wudang", hideWeapon: false },
    pendingBattle: { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player" } as never });
  const start = worldBattleStart(store());
  assert.ok(start);
  const heroLookInBattle = start!.opts.looks?.A;
  assert.ok(heroLookInBattle?.kind === "character" && heroLookInBattle.outfit?.id === "sect_wudang");
});

check("recolour: colour maths round-trips; robe pixels take the outfit, skin and outlines do not", () => {
  for (const rgb of [[200, 30, 40], [12, 200, 90], [128, 128, 128], [250, 240, 10]] as const) {
    const [h, l, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const back = hslToRgb(h, l, s);
    rgb.forEach((v, i) => assert.ok(Math.abs(back[i] - v) <= 1));
  }
  const tint = getOutfit("sect_shaolin")!.tint!;
  const robe = recolorColor(HERO_CLOTH.m1, tint, 60, 85, 120);
  assert.ok(robe, "m1's blue robe is cloth");
  const [hue] = rgbToHsl(robe![0], robe![1], robe![2]);
  assert.ok(Math.abs(hue - 32) < 6, `saffron (${hue})`);
  assert.equal(recolorColor(HERO_CLOTH.m1, tint, 220, 170, 130), null, "skin stays");
  assert.equal(recolorColor(HERO_CLOTH.m1, tint, 20, 18, 16), null, "outlines stay");
  assert.ok(recolorColor(HERO_CLOTH.f1, tint, 200, 215, 200), "f1's pale green robe is cloth");
});

check("recolour on the real sheets: most of each hero's cloth changes, the head never does", () => {
  for (const hero of ["m1", "f1"]) {
    const sheet = PL_SHEETS[hero];
    const png = sheets[hero];
    const before = Uint8ClampedArray.from(png.data);
    const data = Uint8ClampedArray.from(png.data);
    const changed = recolorSheet(data, png.width, png.height, sheet.cell, hero, getOutfit("sect_jinyiwei")!.tint!);
    const opaque = before.filter((_, i) => i % 4 === 3 && before[i] > 10).length;
    assert.ok(changed > opaque * 0.3, `${hero}: ${changed} of ${opaque} pixels recoloured`);
    // The standing south frame's head rows are untouched.
    const frame = sheet.walk8.stand.S;
    const box = frameBoxes(before, png.width, png.height, sheet.cell)[frame]!;
    const x0 = (frame % sheet.columns) * sheet.cell, y0 = Math.floor(frame / sheet.columns) * sheet.cell;
    const headRows = Math.floor(HEAD_SHARE * (box.bottom - box.top)) - 1;
    for (let y = y0 + box.top; y < y0 + box.top + headRows; y++) {
      for (let x = x0; x < x0 + sheet.cell; x++) {
        const i = (y * png.width + x) * 4;
        assert.deepEqual([...data.slice(i, i + 4)], [...before.slice(i, i + 4)], `${hero} head pixel ${x},${y}`);
      }
    }
    assert.equal(recolorSheet(data, png.width, png.height, sheet.cell, "npc_x", getOutfit("tailor_ink")!.tint!), 0, "only heroes have cloth rules");
  }
});

check("frame boxes: each cell's figure, empty cells null", () => {
  const width = 8, height = 4, cell = 4;
  const data = new Uint8ClampedArray(width * height * 4);
  const set = (x: number, y: number) => { data[(y * width + x) * 4 + 3] = 255; };
  set(1, 1); set(2, 3);
  assert.deepEqual(frameBoxes(data, width, height, cell), [{ left: 1, top: 1, right: 2, bottom: 3 }, null]);
});

console.log(`${passed} appearance checks passed.`);
process.exit(0);
