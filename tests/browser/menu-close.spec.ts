import { test, expect, type Page } from "@playwright/test";

// Every menu section's ✕ sits in the panel's top-right corner: no text may
// lie under it (a column head, the bag's purse, an empty screen's title),
// on a phone held sideways or on a desktop.

const SECTIONS = ["โปรไฟล์", "ย่าม", "วิชา", "อาชีพ", "ภารกิจ", "สำนัก", "บันทึก", "จดหมาย", "ชีพจร", "แผนที่"];

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

/** The text leaves that overlap the close button (a few px of grace on each side). */
function textUnderClose(page: Page) {
  return page.evaluate(() => {
    const close = document.querySelector(".hud-menu-close")?.getBoundingClientRect();
    if (!close) return ["(no close button)"];
    const hits: string[] = [];
    const panel = document.querySelector(".hud-menu-panel");
    if (!panel) return hits;
    // The drawn text itself (a range over each text node), not its box with padding.
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!(node.textContent ?? "").trim() || node.parentElement?.closest(".hud-menu-close")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width && r.right > close.left + 6 && r.left < close.right - 6 && r.bottom > close.top + 6 && r.top < close.bottom - 6) {
          hits.push((node.textContent ?? "").trim().slice(0, 24));
          break;
        }
      }
    }
    return hits;
  });
}

for (const viewport of [{ width: 667, height: 375 }, { width: 740, height: 360 }, { width: 844, height: 390 }, { width: 915, height: 412 }, { width: 390, height: 844 }, { width: 1280, height: 720 }]) {
  test(`menu ✕ covers no text (${viewport.width}×${viewport.height})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await start(page);
    for (const name of SECTIONS) {
      await page.locator(".hud-iconbar").getByRole("button", { name, exact: true }).click();
      await expect(page.locator(".hud-menu-close")).toBeVisible();
      await page.waitForTimeout(400);
      expect(await textUnderClose(page), name).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.locator(".hud-menu-close")).toHaveCount(0);
    }
  });
}
