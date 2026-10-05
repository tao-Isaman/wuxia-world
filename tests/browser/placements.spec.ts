import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

// Objects placed on maps (public/assets/placements.json) drawn by the game,
// blocking the hero, and the engine's map editor (/game/engine, แผนที่).
// Both files are served from tests/fixtures/placements/ so the real library
// and placements never matter here.
const FIXTURES = join(__dirname, "../fixtures/placements");
const MANIFEST = JSON.parse(readFileSync(join(FIXTURES, "manifest.json"), "utf8"));
const PLACEMENTS = JSON.parse(readFileSync(join(FIXTURES, "placements.json"), "utf8"));
const EMPTY = { version: 1, maps: {} };
/** The editor's page; MAP_EDITOR_URL points it elsewhere (a branch without the engine page). */
const EDITOR_URL = process.env.MAP_EDITOR_URL ?? "/game/engine";

async function serve(page: Page, placements: unknown = PLACEMENTS, manifest: unknown = MANIFEST) {
  await page.route("**/assets/manifest.json", (route) => route.fulfill({ json: manifest }));
  await page.route("**/assets/placements.json", (route) => route.fulfill({ json: placements }));
  await page.route("**/assets/test/*.png", (route) => route.fulfill({ path: join(FIXTURES, basename(new URL(route.request().url()).pathname)) }));
}
async function startGame(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("ช่างวาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function goTo(page: Page, locationId: string) {
  await page.evaluate((id) => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: id, lastLocationId: id });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  }, locationId);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("placed objects are drawn on their map and the hero cannot walk through a blocking one", async ({ page }) => {
  // Chang'an walks as a placed map would: a tiled ground replaces its painting (and the painting's collision).
  // The fixture's capital placements stay: the capital is a draft (DRAFT_PLACED_MAPS), so the game ignores them.
  const tile = { ...MANIFEST.assets[0], id: "til_test_ground", category: "tile", subcategory: "ground", footprint: null,
    layer: "ground", mapWidth: 32, mapHeight: 32 };
  const changan = [
    { id: "p_000011", asset: "prop_test_crate", x: 560, y: 384 },
    { id: "p_000012", asset: "nat_test_pine", x: 624, y: 600, flip: true },
    { id: "p_000013", asset: "prop_test_arch", x: 324, y: 582 },
  ];
  await serve(page, { ...PLACEMENTS, maps: { ...PLACEMENTS.maps, city_changan: changan },
    grounds: { city_changan: { tile: tile.id }, city_capital: { tile: tile.id } } }, { ...MANIFEST, assets: [...MANIFEST.assets, tile] });
  await startGame(page);
  const world = page.getByTestId("world-canvas");
  // The opening map has no placements: nothing drawn, nothing changed.
  await expect(world).toHaveAttribute("data-placements", "0");

  // The draft capital keeps its painting: no placements, no ground.
  await goTo(page, "city_capital");
  await expect(world).toHaveAttribute("data-placements", "0");

  await goTo(page, "city_changan");
  await expect(world).toHaveAttribute("data-placements", "3");
  await expect(world).toHaveAttribute("data-placement-ids", "p_000011 p_000012 p_000013");
  // The hero starts at the spawn (480, 384); the crate's footprint spans x 540–580 on that line.
  expect(Number(await world.getAttribute("data-player-x"))).toBeCloseTo(480, 0);
  await world.focus();
  await page.keyboard.down("d");
  await page.waitForTimeout(1_200);
  await page.keyboard.up("d");
  await page.waitForTimeout(300);
  const x = Number(await world.getAttribute("data-player-x"));
  expect(x).toBeGreaterThan(510.2);
  expect(x).toBeLessThanOrEqual(534.7);
  await page.screenshot({ path: "test-results/screenshots/placements-game.png" });

  // Tap-to-walk past the crate takes a detour and arrives on the far side.
  const target = await world.evaluate((host: HTMLElement & { worldScreenPoint?: (x: number, y: number) => { x: number; y: number } }) =>
    host.worldScreenPoint!(610, 384));
  await page.mouse.click(target.x, target.y);
  await expect.poll(async () => Number(await world.getAttribute("data-player-x")), { timeout: 8_000 }).toBeGreaterThan(600);
});

test("engineGoto (dev hook, local flag) moves the hero to a map and previews the editor's placements", async ({ page }) => {
  await serve(page, EMPTY);
  await startGame(page);
  const world = page.getByTestId("world-canvas");
  const preview = { version: 1, maps: { city_changan: [{ id: "p_000009", asset: "prop_test_crate", x: 300, y: 300 }] } };
  // Without the flag the address is ignored.
  await page.goto("/?engineGoto=city_changan");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId)).not.toBe("city_changan");

  await page.evaluate((file) => {
    localStorage.setItem("wuxia-engine-goto", "on");
    localStorage.setItem("wuxia-engine-preview", JSON.stringify(file));
  }, preview);
  await page.goto("/?engineGoto=city_changan&enginePreview=1");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId)).toBe("city_changan");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(world).toHaveAttribute("data-placements", "1");
  expect(await page.evaluate(() => !!localStorage.getItem("wusia-world-v1:before-engine-goto"))).toBe(true);
  expect(new URL(page.url()).searchParams.get("engineGoto")).toBeNull();
});

test("map editor: place, move, undo / redo, delete, warnings and save", async ({ page }) => {
  test.setTimeout(120_000);
  await serve(page, EMPTY);
  const saved: string[] = [];
  await page.route("**/game/engine/api/save", async (route) => {
    saved.push(route.request().postData() ?? "");
    await route.fulfill({ json: { ok: true, written: "public/assets/placements.json" } });
  });
  await page.addInitScript(() => { try { localStorage.removeItem("wuxia-engine-placements-draft"); } catch { /* */ } });
  const response = await page.goto(EDITOR_URL);
  test.skip(response?.status() === 404, `${EDITOR_URL} is not in this build (set MAP_EDITOR_URL)`);
  const mapTab = page.getByRole("tab", { name: /แผนที่/ });
  if (await mapTab.count()) await mapTab.first().click();
  const editor = page.getByTestId("map-editor");
  await expect(editor).toHaveAttribute("data-loaded", "true", { timeout: 30_000 });
  await page.locator('[data-map-id="city_capital"]').click();
  await expect(editor).toHaveAttribute("data-map", "city_capital");

  // Approved assets only.
  const palette = page.getByTestId("asset-palette");
  await expect(palette.locator("[data-asset-id]")).toHaveCount(3);
  await expect(palette.locator('[data-asset-id="prop_test_draft"]')).toHaveCount(0);

  const layer = page.getByTestId("map-editor-layer");
  const at = async (x: number, y: number) => {
    const box = (await layer.boundingBox())!;
    return { x: box.x + x / 960 * box.width, y: box.y + y / 640 * box.height };
  };
  // Click-to-place: arm the crate, click the map.
  await palette.locator('[data-asset-id="prop_test_crate"]').click();
  let point = await at(200, 600);
  await page.mouse.click(point.x, point.y);
  await expect(editor).toHaveAttribute("data-placement-count", "1");
  const placed = page.locator("[data-placement-id]");
  await expect(placed).toHaveCount(1);
  const id = (await placed.getAttribute("data-placement-id"))!;
  await expect(editor).toHaveAttribute("data-selected", id);
  await expect(page.getByTestId("map-editor-status")).toContainText("ยังไม่บันทึก");
  const xField = page.locator("#placement-x");
  await expect(xField).toHaveValue("200");

  // Drag it 100 map units right.
  const box = (await placed.boundingBox())!;
  const scale = (await layer.boundingBox())!.width / 960;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50 * scale, box.y + box.height / 2, { steps: 4 });
  await page.mouse.move(box.x + box.width / 2 + 100 * scale, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(xField).toHaveValue("300");
  // Arrow keys nudge (Shift = 10).
  await page.getByTestId("map-editor-stage").focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(xField).toHaveValue("310");

  // Undo twice → back where it was placed; redo once → dragged.
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  await expect(xField).toHaveValue("200");
  await page.keyboard.press("Control+Shift+z");
  await expect(xField).toHaveValue("300");

  // A crate on the physician's spot is flagged.
  await palette.locator('[data-asset-id="prop_test_crate"]').click();
  point = await at(237 + 38, 202 + 4 + 10);
  await page.mouse.click(point.x, point.y);
  await expect(editor).toHaveAttribute("data-placement-count", "2");
  await expect(page.getByTestId("map-editor-issues")).toContainText("ขวาง");
  await page.screenshot({ path: "test-results/screenshots/placements-editor.png" });

  // Delete removes it; undo brings it back; delete again.
  await page.getByTestId("map-editor-stage").focus();
  await page.keyboard.press("Delete");
  await expect(editor).toHaveAttribute("data-placement-count", "1");
  await expect(page.getByTestId("map-editor-issues")).toHaveCount(0);
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveAttribute("data-placement-count", "2");
  await page.keyboard.press("Delete");
  await expect(editor).toHaveAttribute("data-placement-count", "1");

  // Save writes the whole file through the engine save route.
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(page.getByTestId("map-editor-status")).toContainText("บันทึกแล้ว");
  const bodies = saved.filter(Boolean).map((raw) => JSON.parse(raw) as { key: string; json: string });
  const body = bodies.find((b) => b.key === "placements")!;
  const file = JSON.parse(body.json);
  expect(file.maps.city_capital).toEqual([{ id, asset: "prop_test_crate", x: 300, y: 600 }]);
  expect(file.spots, "moved markers never go into placements.json").toBeUndefined();
  // The moved markers go to their own file (none moved here).
  expect(JSON.parse(bodies.find((b) => b.key === "mapSpots")!.json)).toEqual({ version: 1, maps: {} });
});

test("map editor: drag an NPC, an exit and the spawn to move them; undo, reset and save to map-spot-overrides.json", async ({ page }) => {
  test.setTimeout(120_000);
  await serve(page, EMPTY);
  const saved: string[] = [];
  await page.route("**/game/engine/api/save", async (route) => {
    saved.push(route.request().postData() ?? "");
    await route.fulfill({ json: { ok: true, written: "file" } });
  });
  await page.addInitScript(() => { try { localStorage.removeItem("wuxia-engine-placements-draft"); } catch { /* */ } });
  const response = await page.goto(EDITOR_URL);
  test.skip(response?.status() === 404, `${EDITOR_URL} is not in this build (set MAP_EDITOR_URL)`);
  const mapTab = page.getByRole("tab", { name: /แผนที่/ });
  if (await mapTab.count()) await mapTab.first().click();
  const editor = page.getByTestId("map-editor");
  await expect(editor).toHaveAttribute("data-loaded", "true", { timeout: 30_000 });
  await page.locator('[data-map-id="home_player"]').click();
  await expect(editor).toHaveAttribute("data-moved-spots", "0");
  const layer = page.getByTestId("map-editor-layer");
  const scale = async () => (await layer.boundingBox())!.width / 960;
  /** Drag a marker by its figure / pin by (dx, dy) map units. */
  const dragMarker = async (anchorId: string, dx: number, dy: number) => {
    const handle = page.locator(`[data-anchor-id="${anchorId}"][data-movable] span`).first();
    const box = (await handle.boundingBox())!;
    const s = await scale();
    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx * s / 2, from.y + dy * s / 2, { steps: 4 });
    await page.mouse.move(from.x + dx * s, from.y + dy * s, { steps: 4 });
    await page.mouse.up();
  };
  const left = async (anchorId: string) => parseFloat((await page.locator(`[data-anchor-id="${anchorId}"]`).getAttribute("style"))!.match(/left:\s*([\d.]+)px/)![1]);

  // ป้าหลิว stands at (60 %, 31 %) = (576, 198.4); drag her 96 map units right (10 %).
  const liu = "npc:home_player_housekeeper_liu";
  expect(await left(liu)).toBeCloseTo(576, 0);
  await dragMarker(liu, 96, 0);
  await expect(editor).toHaveAttribute("data-moved-spots", "1");
  await expect.poll(() => left(liu)).toBeGreaterThan(660);
  await expect(page.getByTestId("map-editor-status")).toContainText("ยังไม่บันทึก");
  // The exit and the spawn move too; an arrival point (derived from its exit) does not.
  await dragMarker("exit:city_capital", -48, 0);
  await dragMarker("spawn", 0, -32);
  await expect(editor).toHaveAttribute("data-moved-spots", "3");
  await expect(page.locator('[data-anchor-id^="arrival:"][data-movable]')).toHaveCount(0);
  // Undo takes back the spawn; คืนจุดเดิม clears the map; undo brings them back.
  await page.getByTestId("map-editor-stage").focus();
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveAttribute("data-moved-spots", "2");
  await page.getByTestId("map-spots-reset").click();
  await expect(editor).toHaveAttribute("data-moved-spots", "0");
  expect(await left(liu)).toBeCloseTo(576, 0);
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveAttribute("data-moved-spots", "2");

  // Save: the markers go to map-spot-overrides.json in map percentages.
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(page.getByTestId("map-editor-status")).toContainText("บันทึกแล้ว");
  const bodies = saved.filter(Boolean).map((raw) => JSON.parse(raw) as { key: string; json: string });
  const spots = JSON.parse(bodies.find((b) => b.key === "mapSpots")!.json);
  expect(Object.keys(spots.maps)).toEqual(["home_player"]);
  expect(spots.maps.home_player.npcs.home_player_housekeeper_liu.x).toBeGreaterThan(68);
  expect(spots.maps.home_player.npcs.home_player_housekeeper_liu.y).toBeCloseTo(31, 0);
  expect(spots.maps.home_player.exits.city_capital.x).toBeLessThan(43);
  expect(spots.maps.home_player.spawn).toBeUndefined();
  expect(JSON.parse(bodies.find((b) => b.key === "placements")!.json).spots).toBeUndefined();
});

test("map editor kit brush: a dragged wall joins itself, erasing re-joins, a gate snaps in", async ({ page }) => {
  test.setTimeout(120_000);
  // A test wall set: one piece per join mask, plus a one-cell gate (lib/assets/kits.ts).
  const piece = (id: string, mask: number, extra: Record<string, unknown> = {}) => ({
    id, name: `กำแพงทดสอบ · ${mask}`, category: "kit", subcategory: "wall", region: "any", tags: ["kit"],
    image: "/assets/test/crate.png", width: 96, height: 96, mapWidth: 32, mapHeight: 32, anchorX: 48, anchorY: 96,
    footprint: { x: -12, y: -20, w: 24, h: 10 }, layer: "object", flippable: false, status: "approved",
    source: { tool: "test", prompt: "", size: 32 }, kit: { set: "kit_any_wall_test", kind: "wall", cell: 32, mask, ...extra },
  });
  const kits = [...Array.from({ length: 16 }, (_, mask) => piece(`kit_any_wall_test_${mask}`, mask)),
    piece("kit_any_wall_test_gate", 10, { special: "gate" })];
  await page.route("**/assets/manifest.json", (route) => route.fulfill({ json: { ...MANIFEST, assets: [...MANIFEST.assets, ...kits] } }));
  await page.route("**/assets/placements.json", (route) => route.fulfill({ json: EMPTY }));
  await page.route("**/assets/test/*.png", (route) => route.fulfill({ path: join(FIXTURES, basename(new URL(route.request().url()).pathname)) }));
  await page.addInitScript(() => { try { localStorage.removeItem("wuxia-engine-placements-draft"); } catch { /* */ } });
  const response = await page.goto(EDITOR_URL);
  test.skip(response?.status() === 404, `${EDITOR_URL} is not in this build (set MAP_EDITOR_URL)`);
  const mapTab = page.getByRole("tab", { name: /แผนที่/ });
  if (await mapTab.count()) await mapTab.first().click();
  const editor = page.getByTestId("map-editor");
  await expect(editor).toHaveAttribute("data-loaded", "true", { timeout: 30_000 });
  await page.locator('[data-map-id="city_capital"]').click();

  const brush = page.getByTestId("kit-brush");
  await brush.getByRole("tab", { name: "กำแพงบ้าน" }).click();
  // The test set is on the square grid; the brush lists iso (diagonal) sets by default.
  await brush.getByLabel("แนวทแยง").uncheck();
  await brush.locator('[data-kit-set="kit_any_wall_test"]').click();
  const stage = page.getByTestId("map-editor-stage");
  await expect(stage).toHaveAttribute("data-brush", "paint");
  const layer = page.getByTestId("map-editor-layer");
  const cell = async (col: number, row: number) => {
    const box = (await layer.boundingBox())!;
    return { x: box.x + (col + 0.5) * 32 / 960 * box.width, y: box.y + (row + 0.5) * 32 / 640 * box.height };
  };
  const drag = async (a: [number, number], b: [number, number], shift = false) => {
    const from = await cell(...a), to = await cell(...b);
    if (shift) await page.keyboard.down("Shift");
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
    if (shift) await page.keyboard.up("Shift");
  };
  // The piece drawn in a cell: 32 × 32 map units, anchored at the cell's bottom centre.
  const at = (col: number, row: number) => page.locator(`[data-placement-id][style*="left: ${col * 32}px;"][style*="top: ${row * 32}px;"]`);

  // An L: five cells east along row 15, then three south down column 7.
  await drag([3, 15], [7, 15]);
  await expect(editor).toHaveAttribute("data-placement-count", "5");
  await drag([7, 16], [7, 18]);
  await expect(editor).toHaveAttribute("data-placement-count", "8");
  await expect(at(3, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_2");    // east end
  await expect(at(5, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_10");   // straight E-W
  await expect(at(7, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_12");   // corner S-W
  await expect(at(7, 18)).toHaveAttribute("data-asset-id", "kit_any_wall_test_1");    // north end
  // One stroke is one undo step.
  await stage.focus();
  await page.keyboard.press("Control+z");
  await expect(editor).toHaveAttribute("data-placement-count", "5");
  await expect(at(7, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_8");
  await page.keyboard.press("Control+Shift+z");
  await expect(editor).toHaveAttribute("data-placement-count", "8");
  // Shift-drag erases; the corner's neighbours become ends.
  await drag([7, 15], [7, 15], true);
  await expect(editor).toHaveAttribute("data-placement-count", "7");
  await expect(at(6, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_8");
  await expect(at(7, 16)).toHaveAttribute("data-asset-id", "kit_any_wall_test_4");
  // A gate snaps to the grid and replaces the run under it.
  await brush.locator('[data-asset-id="kit_any_wall_test_gate"]').click();
  const gateAt = await cell(5, 15);
  await page.mouse.click(gateAt.x + 7, gateAt.y - 5);
  await expect(editor).toHaveAttribute("data-placement-count", "7");
  await expect(at(5, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_gate");
  await expect(at(4, 15)).toHaveAttribute("data-asset-id", "kit_any_wall_test_10");
  await page.screenshot({ path: "test-results/screenshots/placements-kit-brush.png" });
});
