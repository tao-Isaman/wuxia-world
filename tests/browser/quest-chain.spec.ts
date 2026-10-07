import { test, expect } from "@playwright/test";

// A finished chapter tells where the next one is: หัวใจอยู่ตรงไหน ch1 sent the
// hero toward ต้าหลี่, but ch2 is taken from ถังซือปี้ at the สกุลถัง grounds.
test("a finished saga chapter shows who offers the next one and where", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("wusia-world-v1"))).toBe(true);
  await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!); raw.state.quests.st_tang_heart_pierce_01 = { id: "st_tang_heart_pierce_01", status: "done", stage: 2 }; raw.state.currentSceneId = "city_dali"; raw.state.lastLocationId = "city_dali"; localStorage.setItem("wusia-world-v1", JSON.stringify(raw)); });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ภารกิจ", exact: true }).click();
  await page.locator("button", { hasText: "สำเร็จ" }).first().click({ timeout: 5000 });
  await page.getByText(/หัวใจอยู่ตรงไหน · บทที่ 1/).first().click();
  await expect(page.getByTestId("quest-chain-next")).toBeVisible();
  await expect(page.getByTestId("quest-chain-next")).toContainText("ถังซือปี้");
  await expect(page.getByTestId("quest-chain-next")).toContainText("สำนักสกุลถัง");
});

// Main story ch3 is done and ch4 already taken: the log still says where the story goes now.
test("a finished main-story chapter points on, even once the next chapter is taken", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("wusia-world-v1"))).toBe(true);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    for (const n of ["01", "02", "03"]) raw.state.quests[`st_main_${n}`] = { id: `st_main_${n}`, status: "done", stage: 2 };
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const openCh3 = async () => {
    await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ภารกิจ", exact: true }).click();
    await page.locator("button", { hasText: "สำเร็จ" }).first().click({ timeout: 5000 });
    await page.getByText(/บทที่ 3/).first().click();
  };
  await openCh3();
  await expect(page.getByTestId("quest-chain-next")).toContainText("บทที่ 4");
  await expect(page.getByTestId("quest-chain-next")).toContainText("ไปหา");

  // Take ch4: the block now follows its guide instead of vanishing.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    raw.state.quests.st_main_04 = { id: "st_main_04", status: "active", stage: 0, acceptedDay: raw.state.day };
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await openCh3();
  await expect(page.getByTestId("quest-chain-next")).toContainText("รับแล้ว");
  await expect(page.getByTestId("quest-chain-next")).toContainText("ตอนนี้:");
});
