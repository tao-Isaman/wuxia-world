import { test, expect, type Page } from "@playwright/test";

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function activate(page: Page, id: string) {
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  const marker = page.locator(`[data-marker-id="${id}"]`);
  await page.locator(`[data-places-tab="${await marker.getAttribute("data-category")}"]`).click();
  await marker.click();
}

test("roads run the way you left and you arrive beside the way back", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  await activate(page, "route_home_player__to__city_capital");
  await expect.poll(async () => (await save(page)).currentSceneId).toBe("route_home_player__to__city_capital");
  await expect(world).toHaveAttribute("data-ready", "true");
  const road = page.locator("[data-route-direction]");
  const direction = (await road.getAttribute("data-route-direction"))!;
  expect(direction).toMatch(/^(N|NE|E|SE|S|SW|W|NW)$/);
  // The hero starts at the near end: the half of the road opposite its direction.
  const x = Number(await world.getAttribute("data-player-x")), y = Number(await world.getAttribute("data-player-y"));
  if (direction.includes("E")) expect(x).toBeLessThan(480);
  if (direction.includes("W")) expect(x).toBeGreaterThan(480);
  if (direction.startsWith("N")) expect(y).toBeGreaterThan(320);
  if (direction.startsWith("S")) expect(y).toBeLessThan(320);
  await page.screenshot({ path: "test-results/screenshots/road-start.png" });

  await activate(page, "destination-0");
  await expect.poll(async () => {
    const state = await save(page);
    return state.currentSceneId === "city_capital" || state.lastLocationId === "city_capital";
  }).toBe(true);
  if ((await save(page)).pendingEncounter) await page.getByRole("button", { name: /หนี/ }).click();
  else if ((await save(page)).currentSceneId !== "city_capital") await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await expect(world).toHaveAttribute("data-ready", "true");
  // Arrived on the side we came in: the way back home is right here.
  await expect(world).toHaveAttribute("data-nearby-marker", "route_city_capital__to__home_player");
  await page.screenshot({ path: "test-results/screenshots/road-arrival.png" });
  expect(errors).toEqual([]);
});
