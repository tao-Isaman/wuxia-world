import { test, expect, type Page } from "@playwright/test";

async function state(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function ready(page: Page) {
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function visit(page: Page, id: string) {
  await ready(page);
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-marker-id="${id}"]`).click();
}

test("first errand leads to safe training, recovery, and an earned skill upgrade", async ({ page }) => {
  test.setTimeout(120_000);
  // Fixed randomness removes unrelated road events from this navigation regression.
  // Independent reviewer playthroughs use the ordinary, unmodified random stream.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ฝึกใหม่");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await visit(page, "route_home_player__to__city_capital");
  await expect.poll(async () => (await state(page)).currentSceneId).toBe("route_home_player__to__city_capital");
  await visit(page, "destination-0");
  await expect.poll(async () => (await state(page)).currentSceneId).toBe("city_capital");
  await visit(page, "npc-city_capital_physician_lin");
  const clinicOffer = page.getByRole("button", { name: /เสบียงยาของคลินิก/ });
  await expect(clinicOffer).toBeVisible();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-player-motion", "idle");
  // Position telemetry refreshes at 150 ms intervals. Read it after the approach
  // has stopped, rather than immediately after requesting the destination.
  await page.waitForTimeout(200);
  const originalWorld = await page.getByTestId("world-canvas").elementHandle();
  const beforeTalkX = await page.getByTestId("world-canvas").getAttribute("data-player-x");
  await clinicOffer.click();
  const conversationWorld = page.getByTestId("world-canvas");
  await expect(conversationWorld).toHaveAttribute("data-read-only", "true");
  await expect(conversationWorld.locator("canvas")).toHaveCount(1);
  expect(await originalWorld!.evaluate(node => node === document.querySelector('[data-testid="world-canvas"]'))).toBe(true);
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  await expect(conversationWorld).toHaveAttribute("data-player-x", beforeTalkX!);
  await expect(conversationWorld).not.toHaveAttribute("data-visible-props", /clinic-medicines/);
  await page.getByRole("button", { name: "ไปส่งคำขอให้นายอำเภอหวู่" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "npc-city_capital_magistrate_wu");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  await page.getByRole("button", { name: "ส่งคำขอเสบียงจากหมอหลิน" }).click();
  await page.getByRole("button", { name: "กลับไปรายงานหมอหลิน" }).click();
  await page.screenshot({ path: "test-results/screenshots/phone-after-clinic-delivery.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "npc-city_capital_physician_lin");
  await page.getByRole("button", { name: /เสบียงยาของคลินิก/ }).click();
  await page.getByRole("button", { name: "รับรางวัลเสบียงยาของคลินิก" }).click();
  await expect.poll(async () => (await state(page)).quests.qc_capital_clinic_supplies.status).toBe("done");
  const rewarded = await state(page);
  expect(rewarded.gold).toBe(80);
  expect(rewarded.wExp).toBe(20);
  expect(rewarded.inventory.herb).toBe(3);
  const receipt = page.getByTestId("quest-completion-receipt");
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText("+80");
  await expect(receipt).toContainText("+20");
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-visible-props", /clinic-medicines/);
  await receipt.getByRole("button", { name: "เดินทางต่อ", exact: true }).click({ timeout: 15_000 });
  await expect(receipt).toHaveCount(0);
  expect((await state(page)).gold).toBe(80);

  await visit(page, "service-0");
  const potion = page.getByRole("dialog").locator("li").filter({ has: page.getByText("ยาเลือดเล็ก", { exact: true }) });
  await expect(potion).toContainText("HP +30");
  await potion.getByRole("button", { name: "ซื้อ", exact: true }).click();
  expect((await state(page)).gold).toBe(30);
  expect((await state(page)).inventory.potion).toBe(1);
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await page.reload();
  await ready(page);
  const restored = await state(page);
  expect(restored.quests.qc_capital_clinic_supplies.status).toBe("done");
  expect(restored.inventory).toMatchObject({ herb: 3, potion: 1 });
  expect(restored.gold).toBe(30);
  expect(restored.wExp).toBe(20);
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-visible-props", /clinic-medicines/);
  await expect(receipt).toHaveCount(0);

  await visit(page, "service-1");
  await expect(page.getByRole("dialog")).toContainText("ศิษย์ฝึกหัดอาเฉิง");
  await expect(page.getByRole("dialog")).toContainText("แพ้ไม่เสียชีวิต");
  await page.getByRole("button", { name: "ฝึกประลองฟรี", exact: true }).click();
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-battle-background", "capital-training");
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-background-image", "/art/battle-capital-training.png");
  await page.screenshot({ path: "test-results/screenshots/training-yard-desktop.png" });
  await expect(page.getByRole("button", { name: "ตั้งรับ", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "ตั้งรับ", exact: true }).click();
  const punch = page.getByRole("button", { name: "หมัดตรง", exact: true });
  await expect(punch).toContainText("สวนกลับ +20%");
  await expect(punch).toBeEnabled();
  await punch.click();
  await expect(page.getByTestId("combat-result")).toContainText("ชัยชนะ");
  await page.getByRole("button", { name: "ดำเนินเรื่อง →" }).click();
  await ready(page);
  const trained = await state(page);
  expect(trained.currentSceneId).toBe("city_capital");
  expect(trained.pendingEncounter).toBeNull();
  expect(trained.defeatedCounts.training_capital_apprentice).toBe(1);
  expect(trained.gold).toBe(30);
  expect(trained.wExp).toBe(70);
  expect(trained.skillExp.basic_punch).toBe(20);
  expect(trained.currentHp).toBe(16);

  async function restAtRoadside() {
    await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "พักผ่อน", exact: true }).click();
    const row = page.getByRole("dialog").getByText("🌿 พักริมทาง", { exact: true }).locator("../..");
    const rest = row.getByRole("button", { name: "พักผ่อน", exact: true });
    await expect(rest).toBeEnabled();
    await rest.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await restAtRoadside();
  const firstRest = await state(page);
  expect(firstRest.stamina).toBe(firstRest.staminaMax);
  expect(firstRest.currentHp).toBe(25);
  // Full stamina must not block a second rest while HP is still injured.
  await restAtRoadside();
  expect((await state(page)).currentHp).toBe(34);
  expect((await state(page)).gold).toBe(30);

  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "วิชา", exact: true }).click();
  const upgrade = page.getByRole("button", { name: "เร่งด้วย w-exp (30)", exact: true });
  await expect(upgrade).toBeEnabled();
  await upgrade.click();
  await expect.poll(async () => (await state(page)).skillLevel.basic_punch).toBe(2);
  expect((await state(page)).wExp).toBe(40);
  const payoff = page.getByRole("region", { name: "เลื่อนขั้น หมัดตรง สำเร็จ" });
  await expect(payoff).toBeVisible();
  await expect(payoff).toContainText("พลังท่า (BP)");
  await expect(payoff).toContainText("14");
  await payoff.getByRole("button", { name: "รับทราบ", exact: true }).click();
  await expect(payoff).toHaveCount(0);
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await visit(page, "service-1");
  await expect(page.getByRole("dialog")).toContainText("ผ่านบทฝึกตั้งรับแล้ว");
  await expect(page.getByRole("button", { name: "ฝึกประลองฟรี", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await page.reload();
  await ready(page);
  const upgraded = await state(page);
  expect(upgraded.skillLevel.basic_punch).toBe(2);
  expect(upgraded.skillExp.basic_punch).toBe(0);
  expect(upgraded.wExp).toBe(40);
  expect(upgraded.inventory).toMatchObject({ herb: 3, potion: 1 });
  expect(upgraded.defeatedCounts.training_capital_apprentice).toBe(1);
  expect(errors).toEqual([]);
});
