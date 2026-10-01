import { test, expect, type Page } from "@playwright/test";

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function patch(page: Page, fields: Record<string, unknown>) {
  await page.evaluate((next) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(saved.state, next);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, fields);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function markerCount(page: Page, marker: string) {
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  const n = await page.locator(`[data-marker-id="${marker}"]`).count();
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  return n;
}
async function visit(page: Page, marker: string) {
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}

test("villages have people; a gift raises trust once a month; a kidnapped NPC is away", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ให้");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  const npc = "village_taishan_granny_die";
  await patch(page, { currentSceneId: "village_taishan", lastLocationId: "village_taishan", gold: 2000 });
  expect(await markerCount(page, `npc-${npc}`)).toBe(1);

  await visit(page, `npc-${npc}`);
  const picker = page.getByTestId("gift-picker");
  await picker.getByRole("button", { name: /ให้ของขวัญ/ }).click();
  await picker.locator('[data-gift-gold="500"]').click();
  await expect.poll(async () => (await save(page)).gold).toBe(1500);
  const after = await save(page);
  expect(after.npcStates[npc].relationship).toBeGreaterThan(0);
  expect(after.giftDays[npc]).toBe(after.day);
  await expect(picker).toContainText("ให้ได้อีกใน");

  // Kidnapped: gone from the map until the day they come back.
  await patch(page, { kidnappedUntil: { [npc]: after.day + 180 }, kidnappedNpcIds: [npc] });
  expect(await markerCount(page, `npc-${npc}`)).toBe(0);
  await patch(page, { day: after.day + 180 });
  expect(await markerCount(page, `npc-${npc}`)).toBe(1);
  expect(errors).toEqual([]);
});
