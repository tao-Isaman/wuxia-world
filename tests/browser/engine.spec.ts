import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

// /game/engine: the asset library (on a fixture manifest), the map tab's
// placeholder, and the skill text editor with its live card preview. Against a
// production server the save route is read-only, so saving downloads the JSON.

const FIXTURES = path.join(__dirname, "..", "fixtures", "engine");
const SHOTS = "test-results/screenshots";

async function withFixtures(page: Page) {
  await page.route("**/assets/manifest.json", (route) => route.fulfill({ path: path.join(FIXTURES, "manifest.json"), contentType: "application/json" }));
  await page.route("**/engine-fixtures/*.png", (route) => route.fulfill({ path: path.join(FIXTURES, path.basename(new URL(route.request().url()).pathname)), contentType: "image/png" }));
}

async function saveMode(page: Page): Promise<string> {
  const chip = page.getByTestId("save-mode");
  await expect(chip).not.toHaveText(/กำลังตรวจ/);
  return (await page.locator("[data-engine-root]").getAttribute("data-save-mode"))!;
}

test("engine: asset library filters, detail edits, draft, bulk status and save", async ({ page }) => {
  await withFixtures(page);
  await page.goto("/game/engine");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const mode = await saveMode(page);
  if (mode === "download") await expect(page.getByTestId("save-mode")).toHaveText(/อ่านอย่างเดียว/);

  const grid = page.getByTestId("asset-grid");
  await expect(grid.locator("li")).toHaveCount(3);
  await page.locator('[data-category="nature"]').click();
  await expect(grid.locator("li")).toHaveCount(1);
  await expect(grid.locator("li").first()).toHaveAttribute("data-asset-id", "nat_any_pine_01");
  await page.getByRole("button", { name: /^ทั้งหมด/ }).first().click();
  await page.getByTestId("asset-search").fill("ร้านน้ำชา");
  await expect(grid.locator("li")).toHaveCount(1);
  await page.getByTestId("asset-search").fill("BARREL");
  await expect(grid.locator("li")).toHaveCount(1);
  await page.getByTestId("asset-search").fill("");
  await page.getByTestId("asset-status-filter").selectOption("rejected");
  await expect(grid.locator("li")).toHaveCount(1);
  await page.getByTestId("asset-status-filter").selectOption("all");
  await expect(grid.locator("li")).toHaveCount(3);

  // Detail: preview with anchor and footprint, both views, editable fields.
  await grid.locator('[data-asset-id="bld_east_teahouse_01"] .eng-thumb-btn').click();
  const detail = page.getByTestId("asset-detail");
  await expect(detail).toHaveAttribute("data-asset-id", "bld_east_teahouse_01");
  await expect(detail.getByTestId("anchor")).toBeAttached();
  await expect(detail.getByTestId("asset-views").locator("button")).toHaveCount(2);
  await detail.getByTestId("asset-name").fill("โรงน้ำชาใหม่");
  await expect(page.getByTestId("asset-dirty")).toContainText("1 ภาพ");

  const width = detail.getByTestId("asset-footprint").locator("input").nth(2);
  await expect(width).toHaveValue("66");
  const handle = detail.getByTestId("footprint-handle");
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 10, { steps: 4 });
  await page.mouse.up();
  await expect(width).not.toHaveValue("66");
  await detail.getByRole("button", { name: "อนุมัติ" }).click();
  await expect(grid.locator('[data-asset-id="bld_east_teahouse_01"]')).toHaveAttribute("data-status", "approved");
  await page.screenshot({ path: `${SHOTS}/engine-assets.png` });

  // The draft survives a reload; discarding drops it.
  await page.reload();
  await expect(page.getByTestId("asset-dirty")).toBeVisible();
  await expect(grid.locator('[data-asset-id="bld_east_teahouse_01"]')).toContainText("โรงน้ำชาใหม่");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "ทิ้งการแก้ไข" }).first().click();
  await expect(page.getByTestId("asset-dirty")).toHaveCount(0);
  await expect(grid.locator('[data-asset-id="bld_east_teahouse_01"]')).toHaveAttribute("data-status", "draft");

  // Bulk: tick two, reject them.
  await grid.locator('[data-asset-id="bld_east_teahouse_01"] input[type="checkbox"]').check();
  await grid.locator('[data-asset-id="nat_any_pine_01"] input[type="checkbox"]').check();
  await expect(page.getByTestId("bulk-bar")).toContainText("เลือก 2 ภาพ");
  await page.getByTestId("bulk-bar").getByRole("button", { name: "ปฏิเสธ" }).click();
  await expect(grid.locator('[data-status="rejected"]')).toHaveCount(3);
  await expect(page.getByTestId("asset-dirty")).toContainText("2 ภาพ");

  if (mode === "download") {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "บันทึก manifest" }).click();
    expect((await download).suggestedFilename()).toBe("manifest.json");
    await expect(page.getByTestId("engine-notice")).toContainText("อ่านอย่างเดียว");
  }

  // The map tab is the map team's; it mounts with the library's assets.
  await page.getByRole("tab", { name: "แผนที่" }).click();
  await expect(page.getByTestId("map-editor")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/engine-map.png` });
});

test("engine: skill text editor filters, edits with a live preview, validation and save", async ({ page }) => {
  await withFixtures(page);
  await page.goto("/game/engine");
  const mode = await saveMode(page);
  await page.getByRole("tab", { name: "วิชา" }).click();
  const table = page.getByTestId("skill-table");
  await expect(table.locator("tbody tr")).toHaveCount(284);

  await page.getByTestId("skill-sect").selectOption("เส้าหลิน");
  await page.getByTestId("skill-tier").selectOption("0");
  const rows = await table.locator("tbody tr").count();
  expect(rows).toBeGreaterThan(0);
  expect(rows).toBeLessThan(10);
  await page.getByTestId("skill-kind").selectOption("skill");
  await page.getByTestId("skill-sect").selectOption("");
  await page.getByTestId("skill-tier").selectOption("");
  await page.getByTestId("skill-weapon").selectOption("music");
  for (const kind of await table.locator("tbody tr td:nth-child(6)").allTextContents()) expect(kind).toBe("เครื่องดนตรี");
  await page.getByTestId("skill-weapon").selectOption("");
  await page.getByTestId("skill-search").fill("sl_bodhi_palm");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await table.locator("tbody tr").first().click();

  const editor = page.getByTestId("skill-editor");
  await expect(editor).toHaveAttribute("data-row", "skill:sl_bodhi_palm");
  const preview = page.getByTestId("skill-preview");
  await expect(preview).toContainText("ฝ่ามือโพธิสัตว์");
  await page.getByTestId("skill-desc-input").fill("ฝ่ามือเมตตาสะท้อนพลังศัตรูกลับ");
  await expect(preview).toContainText("ฝ่ามือเมตตาสะท้อนพลังศัตรูกลับ");
  await expect(table.locator("tbody tr").first()).toContainText("ฝ่ามือเมตตาสะท้อนพลังศัตรูกลับ");
  await expect(page.getByTestId("text-dirty")).toBeVisible();

  // A name taken by another skill is an error and blocks saving.
  await page.getByTestId("skill-name-input").fill("หมัดเส้าหลิน");
  await expect(page.getByTestId("skill-issues")).toContainText("ชื่อซ้ำ");
  await expect(page.getByTestId("text-save")).toBeDisabled();
  await page.getByTestId("skill-name-input").fill("");
  await expect(page.getByTestId("skill-issues")).toContainText("ชื่อว่างไม่ได้");
  await page.getByTestId("skill-name-input").fill("ฝ่ามือโพธิสัตว์");
  await expect(page.getByTestId("skill-issues")).toHaveCount(0);
  await expect(page.getByTestId("text-save")).toBeEnabled();
  await expect(preview).toContainText("ฝ่ามือโพธิสัตว์");
  await page.screenshot({ path: `${SHOTS}/engine-skills.png` });

  if (mode === "download") {
    const download = page.waitForEvent("download");
    await page.getByTestId("text-save").click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("text-overrides.json");
    const saved = JSON.parse(await (await import("node:fs/promises")).readFile((await file.path())!, "utf8"));
    expect(saved).toEqual({ version: 1, skills: { sl_bodhi_palm: { d: "ฝ่ามือเมตตาสะท้อนพลังศัตรูกลับ" } }, arts: {} });
  }
});

test("engine: not turned in portrait, and the game links nowhere to it", async ({ page }) => {
  await withFixtures(page);
  await page.setViewportSize({ width: 700, height: 1000 });
  await page.goto("/game/engine");
  await expect(page.getByTestId("save-mode")).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).transform)).toBe("none");
  await page.screenshot({ path: `${SHOTS}/engine-portrait.png` });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#hero-name")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('a[href*="/game/engine"]')).toHaveCount(0);
  expect(await page.content()).not.toContain("/game/engine");
});
