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

async function serve(page: Page, placements: unknown = PLACEMENTS) {
  await page.route("**/assets/manifest.json", (route) => route.fulfill({ json: MANIFEST }));
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
  await serve(page);
  await startGame(page);
  const world = page.getByTestId("world-canvas");
  // The opening map has no placements: nothing drawn, nothing changed.
  await expect(world).toHaveAttribute("data-placements", "0");

  await goTo(page, "city_capital");
  await expect(world).toHaveAttribute("data-placements", "3");
  await expect(world).toHaveAttribute("data-placement-ids", "p_000001 p_000002 p_000003");
  // The hero starts at the south gate (480, 499); the crate's footprint spans x 540–580 on that line.
  expect(Number(await world.getAttribute("data-player-x"))).toBeCloseTo(480, 0);
  await world.focus();
  await page.keyboard.down("d");
  await page.waitForTimeout(1_200);
  await page.keyboard.up("d");
  await page.waitForTimeout(300);
  const x = Number(await world.getAttribute("data-player-x"));
  expect(x).toBeGreaterThan(510);
  expect(x).toBeLessThanOrEqual(534.5);
  await page.screenshot({ path: "test-results/screenshots/placements-game.png" });

  // Tap-to-walk past the crate takes a detour and arrives on the far side.
  const target = await world.evaluate((host: HTMLElement & { worldScreenPoint?: (x: number, y: number) => { x: number; y: number } }) =>
    host.worldScreenPoint!(610, 499));
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
  point = await at(336 + 38, 371 + 4 + 10);
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
  const body = JSON.parse(saved.at(-1)!) as { key: string; json: string };
  expect(body.key).toBe("placements");
  const file = JSON.parse(body.json);
  expect(file.maps.city_capital).toEqual([{ id, asset: "prop_test_crate", x: 300, y: 600 }]);
});
