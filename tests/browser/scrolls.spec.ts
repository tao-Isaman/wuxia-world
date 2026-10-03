import { test, expect, type Page } from "@playwright/test";

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function newGame(page: Page, patch: (state: Record<string, unknown>) => void) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(`(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1"));
    (${patch.toString()})(raw.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  })()`);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function visit(page: Page, marker: string) {
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}
// Reads the offer: skips a film if one plays, pages to the choices.
async function readOffer(page: Page) {
  const stage = page.getByTestId("dialog-stage");
  const film = page.getByTestId("cutscene");
  await expect(stage.or(film)).toBeVisible({ timeout: 30_000 });
  if (await film.count()) {
    await film.getByRole("button", { name: /ข้าม/ }).click();
    await expect(film).toHaveCount(0, { timeout: 10_000 });
  }
  await expect(stage).toBeVisible();
  const pages = Number((await stage.getAttribute("data-pages")) ?? 1);
  for (let i = 1; i < pages; i++) await page.getByTestId("dialog-next-page").click();
  return stage;
}
const menu = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name, exact: true }).click();

test("sect window: T4 moves stay off the list, the rest are วิชาลึกลับ until learned", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page, (s) => {
    s.sectMembership = { wudang: { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 0, status: "active" } };
  });
  await menu(page, "สำนัก");
  await page.getByRole("button", { name: /ขั้นและวิชา/ }).click();
  const line = page.getByTestId("sect-lineage");
  await expect(line.locator('[data-lineage-id="tj"]')).toContainText("วิชาลึกลับ");
  await expect(line.locator('[data-lineage-id="tj"]')).not.toContainText("ไทจี้เจี้ยน");
  await expect(line.locator('[data-lineage-id="taiji"]')).toHaveCount(0);
});

test("a quest's scroll: read it from the bag, then pick and equip the move in the skills window", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page, (s) => {
    (s.inventory as Record<string, number>)["scroll_skill_tj"] = 1;
  });
  await menu(page, "ย่าม");
  await page.getByRole("button", { name: "คัมภีร์ไทจี้เจี้ยน ×1" }).click();
  await page.getByRole("button", { name: "ใช้", exact: true }).click();
  await expect.poll(async () => (await save(page)).playerBuild.learnedSkillIds).toContain("tj");
  expect((await save(page)).inventory.scroll_skill_tj ?? 0).toBe(0);
  await page.getByRole("button", { name: "ปิด", exact: true }).click();

  // Reading auto-slots the move; take it off, then put it back from the library.
  await menu(page, "วิชา");
  const library = page.getByTestId("skill-library");
  await expect(library).toContainText("ไทจี้เจี้ยน");
  await library.locator('[data-library-id="tj"]').click();
  const detail = page.getByTestId("skill-detail");
  await expect(detail).toContainText("ไทจี้เจี้ยน");
  await detail.getByRole("button", { name: /ถอดออกจากช่อง/ }).click();
  await expect.poll(async () => (await save(page)).playerBuild.skillIds).not.toContain("tj");
  await detail.getByTestId("skill-equip").click();
  await expect.poll(async () => (await save(page)).playerBuild.skillIds).toContain("tj");
});

test("a lineage offer can be turned down, and an accepted one dropped and offered again; the HUD shows HP / MP / พลัง", async ({ page }) => {
  test.setTimeout(180_000);
  const quest = "ql_skill_tj";
  await newGame(page, (s) => {
    s.sectMembership = { wudang: { rank: 9, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 0, status: "active" } };
    s.currentSceneId = "sect_wudang";
    s.lastLocationId = "sect_wudang";
    (s.visitedLocationIds as string[]).push("sect_wudang");
  });

  // The vitals card sits above the icon menu and reads the save.
  const vitals = page.getByTestId("hud-vitals");
  await expect(vitals).toBeVisible();
  const state = await save(page);
  await expect(vitals.locator('[data-gauge="hp"]')).toHaveAttribute("aria-valuenow", String(state.currentHp));
  await expect(vitals.locator('[data-gauge="st"]')).toHaveAttribute("aria-valuenow", String(state.stamina));
  const vBox = (await vitals.boundingBox())!;
  const mBox = (await page.getByRole("navigation", { name: "เมนูเกม" }).boundingBox())!;
  expect(vBox.y + vBox.height).toBeLessThanOrEqual(mBox.y + 1);

  // Turn it down: the offer opens before accepting; ปฏิเสธ leaves it on offer.
  await visit(page, "npc-sect_wudang_disciple_qingxin");
  await page.getByRole("button", { name: /สืบทอดวิชาลึกลับของ/ }).first().click();
  let stage = await readOffer(page);
  await stage.getByRole("button", { name: "ขอปฏิเสธไว้ก่อน" }).click();
  await expect.poll(async () => (await save(page)).quests[quest]).toBeUndefined();

  // Take it, then drop it from the quest log: it is forgotten, not failed.
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await visit(page, "npc-sect_wudang_disciple_qingxin");
  await page.getByRole("button", { name: /สืบทอดวิชาลึกลับของ/ }).first().click();
  stage = await readOffer(page);
  await stage.getByRole("button", { name: "รับคำ" }).click();
  await expect.poll(async () => (await save(page)).quests[quest]?.status).toBe("active");
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await menu(page, "ภารกิจ");
  await page.locator(`[data-quest-id="${quest}"]`).getByRole("button").first().click();
  await page.getByRole("button", { name: "ละทิ้งภารกิจ" }).click();
  await page.getByRole("dialog").filter({ hasText: "ยืนยันละทิ้งภารกิจ" }).getByRole("button", { name: "ละทิ้ง", exact: true }).click();
  await expect.poll(async () => (await save(page)).quests[quest]).toBeUndefined();
});
