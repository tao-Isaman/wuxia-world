import { test, expect } from "@playwright/test";

test("installable PWA: manifest, service worker and an offline reload into the world", async ({ page, context }) => {
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("fullscreen");
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true);
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).status()).toBe(200);

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 30_000 });
  await page.reload();
  await page.locator("#hero-name").fill("ออฟไลน์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  await context.setOffline(true);
  await page.reload();
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await context.setOffline(false);
});
