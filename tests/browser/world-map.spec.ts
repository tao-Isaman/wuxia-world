import { test, expect, type Page } from "@playwright/test";

// แผนที่โลก and the boats: the painted world map shows where the hero is, the
// regions and the roads; picking an island plans the walk to a port and the
// boat ride; นำทาง points the guide arrow at the boatman, who sails the hero
// over for a fare (the islands have no road).

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function patch(page: Page, edit: string) {
  await page.evaluate((body) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    new Function("state", body)(saved.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, edit);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("world map: where the hero is, the regions, a planned way to an island, and the boatman's crossing", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await patch(page, `state.gold = 2000; state.currentSceneId = "city_suzhou"; state.lastLocationId = "city_suzhou";
    state.visitedLocationIds = [...new Set([...state.visitedLocationIds, "city_suzhou", "city_capital", "city_yangzhou"])];`);

  // The map opens on the hero, in Suzhou.
  await page.locator(".hud-iconbar").getByRole("button", { name: "แผนที่", exact: true }).click();
  const map = page.getByTestId("world-map");
  await expect(map).toBeVisible();
  await expect(map.getByTestId("world-map-hero")).toBeVisible();
  await expect(map.getByTestId("world-map-overview")).toContainText("ซูโจว");
  await expect(map.locator('[data-atlas-place="city_suzhou"]')).toHaveAttribute("data-visited", "true");
  await expect(map.locator('[data-atlas-place="isle_boni"]')).toHaveAttribute("data-visited", "false");
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-results/screenshots/world-map.png" });

  // A region tab frames the region and lists its places.
  await map.locator('[data-region-tab="east"]').click();
  await expect(map.getByTestId("world-map-region")).toContainText("ภาคตะวันออก");
  await expect(map.getByTestId("world-map-region")).toContainText("เกาะ");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/screenshots/world-map-east.png" });

  // An island: the way there is a boat ride from this port; นำทาง sets the guide.
  await map.getByTestId("world-map-region").getByRole("button", { name: "เกาะโรตี" }).click();
  const detail = map.getByTestId("world-map-detail");
  await expect(detail).toHaveAttribute("data-place", "isle_boni");
  await expect(detail.getByTestId("world-map-steps")).toContainText("ลุงจาง คนแจวเรือ");
  await expect(detail).toContainText("ค่าเรือรวม");
  await expect(detail).toContainText("ต้องจ้างคนเรือ");
  await expect(map.getByTestId("world-map-route")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test-results/screenshots/world-map-route.png" });
  await detail.getByTestId("world-map-navigate").click();
  await expect.poll(async () => (await save(page)).flags.mapWaypoint).toBe("isle_boni");
  await page.keyboard.press("Escape");

  // The HUD shows the waypoint, and the guide arrow points at the boatman.
  await expect(page.locator("[data-waypoint]")).toHaveAttribute("data-waypoint", "isle_boni");
  // Its ✕ is a small corner button, clear of the card's title (not the quest card's full-width button).
  const cancel = await page.locator("[data-waypoint] .qt-cancel").boundingBox();
  const kicker = await page.locator("[data-waypoint] .qt-kicker").boundingBox();
  expect(cancel!.width).toBeLessThan(30);
  expect(cancel!.x).toBeGreaterThanOrEqual(kicker!.x + kicker!.width - 1);
  await expect(canvas).toHaveAttribute("data-guide-marker", "npc-ferry_boatman", { timeout: 20_000 });
  // The card names the island to sail to (the arrow alone only shows the boatman).
  await expect(page.locator("[data-waypoint] [data-ferry-to]")).toHaveAttribute("data-ferry-to", "isle_boni");

  // The boatman sails the hero over for a fare; arriving ends the waypoint.
  const gold = (await save(page)).gold;
  await page.getByRole("button", { name: "จุดหมาย", exact: true }).click();
  const boatman = page.locator('[data-marker-id="npc-ferry_boatman"]');
  await page.locator(`[data-places-tab="${await boatman.getAttribute("data-category")}"]`).click();
  await boatman.click();
  await expect(page.getByTestId("ferry-trips")).toBeVisible();
  // The pier the guide sails to comes first, marked.
  await expect(page.getByTestId("ferry-trips").locator("li").first()).toHaveAttribute("data-guide", "true");
  await expect(page.getByTestId("ferry-trips").locator("li").first()).toContainText("ตามภารกิจ");
  await page.getByTestId("ferry-sail-isle_boni").click();
  await expect.poll(async () => (await save(page)).currentSceneId, { timeout: 20_000 }).toBe("isle_boni");
  const after = await save(page);
  expect(after.gold).toBeLessThan(gold);
  expect(after.flags.mapWaypoint ?? "").toBe("");
  await expect(page.locator("[data-waypoint]")).toHaveCount(0);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  test("world map: fits a phone held sideways, map beside the detail column", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.locator("#hero-name").fill("จอมยุทธ์");
    await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
    await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    await page.locator(".hud-iconbar").getByRole("button", { name: "แผนที่", exact: true }).click();
    const map = page.getByTestId("world-map");
    await expect(map).toBeVisible();
    const view = await map.locator(".atlas-view").boundingBox();
    const side = await map.locator(".atlas-side").boundingBox();
    expect(view && side && view.width > side.width && view.height > 150).toBeTruthy();
    expect(view!.x + view!.width).toBeLessThanOrEqual(side!.x + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/screenshots/world-map-phone.png" });
  });
});
