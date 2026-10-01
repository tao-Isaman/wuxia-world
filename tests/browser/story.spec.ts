import { test, expect, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("หลิวเฟิง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("story saga: the chapter's film plays (skippable), the long briefing pages, and the ตำนาน tab replays the film", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  // Open chapter 1 of the Taiji-fist saga as if just accepted at Wudang.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, {
      currentSceneId: "qs_st_wudang_taiji_fist_01_offer", lastLocationId: "sect_wudang",
      quests: { st_wudang_taiji_fist_01: { id: "st_wudang_taiji_fist_01", status: "active", stage: 0 } },
    });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();

  const film = page.getByTestId("cutscene");
  await expect(film).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(film).toHaveAttribute("data-cutscene-id", "cs_st_wudang_taiji_fist_01_offer");
  // The opening title card, then a tap moves the film on.
  await expect(film.getByRole("heading", { name: "หมัดที่ต้องลืม" })).toBeVisible();
  await film.click({ position: { x: 200, y: 300 } });
  await expect(film).toHaveAttribute("data-beat", /\d+/);
  await page.getByTestId("cutscene").getByRole("button", { name: /ข้าม/ }).click();
  await expect(film).toHaveCount(0, { timeout: 10_000 });

  // The briefing has more lines than one screen: it pages, choices after the last page.
  const dialog = page.getByTestId("dialog-stage");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("ปรมาจารย์ผู้ก่อตั้งของเรา");
  const pages = Number(await dialog.getAttribute("data-pages"));
  for (let i = 1; i < pages; i++) await page.getByTestId("dialog-next-page").click();
  await expect(page.getByRole("button", { name: /รับคำ ไปอ่านศิลาจารึก/ })).toBeVisible();
  await page.getByRole("button", { name: /รับคำ ไปอ่านศิลาจารึก/ }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  // The quest log's ตำนาน tab lists the saga, the open chapter, and the watched film.
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ภารกิจ", exact: true }).click();
  await page.getByRole("button", { name: /^ตำนาน\s*\d*$/ }).click();
  const saga = page.locator('[data-saga-id="wudang_taiji_fist"]');
  await expect(saga).toBeVisible();
  await saga.getByRole("button", { name: /หมัดที่ต้องลืม/ }).click();
  await expect(saga).toContainText("บทที่ 1: คำถามของคนแก่");
  await saga.getByRole("button", { name: /🎬/ }).first().click();
  await expect(page.getByTestId("cutscene")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByTestId("cutscene").getByRole("button", { name: /ข้าม/ }).click();
  await expect(page.getByTestId("cutscene")).toHaveCount(0, { timeout: 10_000 });
  expect(errors).toEqual([]);
});
