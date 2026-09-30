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

test("quest tracking: pin a quest, the HUD follows it, and the ฉางอัน spy objective advances in person", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ติดตาม");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await patch(page, {
    currentSceneId: "city_changan", lastLocationId: "city_changan",
    quests: {
      qc_jinling_spy_network: { id: "qc_jinling_spy_network", status: "active", stage: 1 },
      qc_xixia_iron_supply: { id: "qc_xixia_iron_supply", status: "active", stage: 0 },
    },
  });

  // Nothing pinned yet: the tracker follows the newest quest.
  const tracker = page.getByRole("complementary", { name: "ภารกิจที่ติดตาม" });
  await expect(tracker).toHaveAttribute("data-tracked-quest", "qc_xixia_iron_supply");

  // Pin the spy network from the quest log (the tracker opens it).
  await tracker.getByRole("button").click();
  await page.locator('[data-quest-id="qc_jinling_spy_network"]').getByRole("button", { name: "ติดตามภารกิจนี้" }).click();
  expect((await save(page)).flags.trackedQuestId).toBe("qc_jinling_spy_network");
  await page.locator('[data-quest-id="qc_jinling_spy_network"]').getByRole("button", { name: /เครือข่ายสายลับ/ }).click();
  await expect(page.locator(".quest-guide")).toContainText("สังเกตประตูเมืองและตลาด");
  await page.screenshot({ path: "test-results/screenshots/quest-tracking-log.png" });
  await page.keyboard.press("Escape");

  await expect(tracker).toHaveAttribute("data-tracked-quest", "qc_jinling_spy_network");
  await expect(tracker).toContainText("สังเกตประตูเมืองและตลาด");
  await expect(tracker).toContainText("อยู่ที่นี่");
  const world = page.getByTestId("world-canvas");
  const marker = "objective-qc_jinling_spy_network-0";
  await expect(world).toHaveAttribute("data-guide-marker", marker);
  await page.screenshot({ path: "test-results/screenshots/quest-tracking-hud.png" });

  // Walk to the magnifier spot and observe.
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
  await expect.poll(async () => (await save(page)).quests.qc_jinling_spy_network.stage, { timeout: 30_000 }).toBe(2);
  await expect(tracker).toContainText("นักยุทธศาสตร์กง");
  await expect(tracker).toContainText("จินหลิง");
  // Off to จินหลิง: the arrow sits on an exit now.
  await expect(world).toHaveAttribute("data-guide-marker", /^route_city_changan__to__/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(tracker).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/quest-tracking-phone.png" });
  expect(errors).toEqual([]);
});
