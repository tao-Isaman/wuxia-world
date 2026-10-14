import { test, expect } from "@playwright/test";

// The profile on a phone on its side: every worn piece reads in one line, a
// picked piece lists its stats one per row, and each combat stat explains
// itself when tapped (the gear tab once squeezed four lines into each card and
// left only the Thai tone marks showing).
test.use({ viewport: { width: 1000, height: 450 }, hasTouch: true, isMobile: true });

test("the gear tab reads in rows and every stat explains what it does", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ตรวจอุปกรณ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.playerBuild.equipment = {
      W: "W5~en:7,pa:20,cri:9,stat:STR:6,fam_dmg:sword:15",
      A: "eq_t0_a_iron~pd:8", H: "eq_t0_h_iron~res:3", B: "eq_t0_b_iron",
      BR: ["eq_t0_br_iron~pa:3", "eq_t0_br_iron~ia:4"], R: ["eq_t0_r_copper", null], C: ["eq_t0_c_cloth~wexp:8", null],
    };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "โปรไฟล์", exact: true }).click();
  await page.getByRole("tablist", { name: "ข้อมูลตัวละคร" }).getByRole("tab", { name: "อุปกรณ์" }).click();

  // Ten one-line slots, none taller than its button; the summed bonuses below.
  const slots = page.locator("[data-gear-slot]");
  await expect(slots).toHaveCount(10);
  const clipped = await slots.evaluateAll((nodes) => nodes.filter((node) => {
    const name = node.querySelector(".profile-gear-name") as HTMLElement;
    return name.scrollHeight > node.clientHeight;
  }).length);
  expect(clipped).toBe(0);
  await expect(page.locator('[data-gear-slot="W-x"]')).toContainText("+7 ดาบมังกรเทพ");
  await expect(page.locator('[data-gear-slot="R-1"]')).toContainText("ว่าง");
  await expect(page.locator('[data-gear-slot="R-1"]')).toBeDisabled();
  const total = page.getByTestId("gear-total");
  await expect(total).toContainText("พลังโจมตี");
  await page.screenshot({ path: "test-results/screenshots/profile-gear.png" });

  // A picked piece: base stats, the enhancement and the options, each a row.
  await page.locator('[data-gear-slot="W-x"]').click();
  const piece = page.getByTestId("gear-piece");
  await expect(piece).toContainText("ดาบมังกรเทพ");
  await expect(piece).toContainText("ค่าพื้นฐาน");
  await expect(piece).toContainText("เสริมพลัง +7");
  await expect(piece).toContainText("ออฟชั่นเสริม");
  await expect(piece.locator(".profile-gear-affixes li")).toHaveCount(4);
  await expect(piece.locator(".profile-gear-affixes li", { hasText: "กระบวนท่าสายกระบี่" })).toContainText("+15%");
  await page.screenshot({ path: "test-results/screenshots/profile-gear-piece.png" });
  await page.getByRole("button", { name: "ดูผลรวม" }).click();
  await expect(total).toBeVisible();

  // A combat stat explains what it does and where it comes from.
  await page.locator('[data-derived="Cri"]').click();
  const card = page.locator(".profile-explain");
  await expect(card).toContainText("ติดคริติคอล");
  await expect(card).toContainText("มาจากค่าพลัง");
  await expect(card).toContainText("กำลัง ×1");
  await page.screenshot({ path: "test-results/screenshots/profile-derived-hint.png" });
  await page.mouse.click(300, 400);

  // A base stat says what one point of it raises.
  await page.getByRole("tablist", { name: "ข้อมูลตัวละคร" }).getByRole("tab", { name: "ค่าพลัง" }).click();
  await page.locator(".profile-stat").first().click();
  await expect(page.locator(".profile-feeds")).toContainText("พลังชีวิต +3");
  expect(errors).toEqual([]);
});
