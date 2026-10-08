import { test, expect, type Browser, type Page } from "@playwright/test";

// Online (docs/online.md): two players in two separate browsers sign up,
// stand on the same map and see each other walk in real time.
// Needs the game server running: `bun run server:dev` (wrangler dev on :8787),
// or GAME_SERVER_URL pointing at one. Skipped when none answers.
const SERVER = (process.env.GAME_SERVER_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const run = Date.now().toString(36);

async function serverUp(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/** A fresh browser (own storage) with a new hero, signed up online. */
async function player(browser: Browser, hero: string, gender: "ชาย" | "หญิง", username: string): Promise<Page> {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:3017", localStorage: [
      { name: "wuxia-random-events", value: "off" },
      { name: "wuxia-dialog-instant", value: "on" },
      { name: "wuxia-game-server", value: SERVER },
    ] }] },
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("/");
  // Step 1: an account. No hero form until signed in.
  const account = page.getByTestId("account-form");
  await expect(account).toHaveAttribute("data-mode", "register");
  await expect(page.getByTestId("hero-form")).toHaveCount(0);
  await account.locator("#account-username").fill(username);
  await account.locator("#account-password").fill("secret-pass");
  await account.locator("#account-password-confirm").fill("secret-pass");
  await account.getByTestId("account-submit").click();
  // Step 2: the character, under the account's name.
  await expect(page.getByTestId("hero-form")).toBeVisible();
  await expect(page.getByTestId("online-username")).toHaveText(username);
  await page.locator("#hero-name").fill(hero);
  await page.getByRole("button", { name: gender, exact: true }).click();
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("online-button")).toHaveAttribute("data-online-status", "online", { timeout: 20_000 });
  return page;
}

/** Where the page draws another player (map units), or null. */
async function remoteAt(page: Page, id: string): Promise<[number, number] | null> {
  const raw = await page.getByTestId("world-canvas").getAttribute("data-remote-players");
  const entry = (JSON.parse(raw ?? "[]") as [string, number, number][]).find(([who]) => who === id);
  return entry ? [entry[1], entry[2]] : null;
}

test("two players online see each other walk on the same map", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  test.setTimeout(180_000);
  const annId = `ann_${run}`.slice(0, 20);
  const bobId = `bob_${run}`.slice(0, 20);
  const ann = await player(browser, "หลี่เหยียน", "หญิง", annId);
  const bob = await player(browser, "จางเฟิง", "ชาย", bobId);

  // Both start at home: each draws the other, by name, in gold.
  await expect.poll(() => remoteAt(ann, bobId), { timeout: 20_000 }).not.toBeNull();
  await expect.poll(() => remoteAt(bob, annId), { timeout: 20_000 }).not.toBeNull();
  await expect(ann.getByTestId("online-button").locator(".hud-icon-badge")).toHaveText("1");

  // Bob walks east; Ann sees him go, live.
  const before = (await remoteAt(ann, bobId))!;
  const bobCanvas = bob.getByTestId("world-canvas");
  const bobStart = Number(await bobCanvas.getAttribute("data-player-x"));
  await bobCanvas.focus();
  await bob.keyboard.down("d");
  await bob.waitForTimeout(1200);
  await bob.keyboard.up("d");
  const bobEnd = Number(await bobCanvas.getAttribute("data-player-x"));
  expect(bobEnd).toBeGreaterThan(bobStart + 20);
  await expect.poll(async () => (await remoteAt(ann, bobId))?.[0] ?? 0, { timeout: 10_000 }).toBeGreaterThan(before[0] + 20);
  // Where Ann sees him settles on where he really stands.
  await expect.poll(async () => Math.abs(((await remoteAt(ann, bobId))?.[0] ?? 0) - bobEnd), { timeout: 10_000 }).toBeLessThan(3);
  await ann.screenshot({ path: "test-results/screenshots/online-two-players.png" });

  // Bob closes his game: he leaves Ann's map.
  await bob.context().close();
  await expect.poll(() => remoteAt(ann, bobId), { timeout: 20_000 }).toBeNull();
  await ann.context().close();
});

test("a saved token the server no longer accepts (a new server key) asks to log in again", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  const id = `old_${run}`.slice(0, 20);
  // A token that looks valid in this browser (unexpired) but that the server never signed.
  const stale = { state: { username: id, token: "eyJzdWIiOiJ4IiwiZXhwIjo5OTk5OTk5OTk5OTk5fQ.c2lnbmF0dXJl", expires: Date.now() + 86_400_000 }, version: 1 };
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:3017", localStorage: [
      { name: "wuxia-random-events", value: "off" },
      { name: "wuxia-game-server", value: SERVER },
      { name: "wuxia-online-v1", value: JSON.stringify(stale) },
    ] }] },
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("/");
  const account = page.getByTestId("account-form");
  await expect(account).toBeVisible({ timeout: 20_000 });
  await expect(account).toHaveAttribute("data-mode", "login");
  await expect(account.locator("#account-username")).toHaveValue(id);
  await context.close();
});

test("online flow: account first; a returning player logs in straight back to their game; signing out asks again", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  test.setTimeout(120_000);
  const id = `cat_${run}`.slice(0, 20);
  const page = await player(browser, "เฉินจิ้ง", "หญิง", id);
  // Signing out from the HUD goes back to step 1 — the save stays.
  await page.getByTestId("online-button").click();
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  const account = page.getByTestId("account-form");
  await expect(account).toBeVisible();
  // This browser knows the account: log in is the first tab, the name filled in.
  await expect(account).toHaveAttribute("data-mode", "login");
  await expect(account.locator("#account-username")).toHaveValue(id);
  await account.locator("#account-password").fill("wrong-pass");
  await account.getByTestId("account-submit").click();
  await expect(account.getByRole("alert")).toContainText("ไม่ถูกต้อง");
  await account.locator("#account-password").fill("secret-pass");
  await account.getByTestId("account-submit").click();
  // Logged in with a save: no character step, straight into the world.
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("hero-form")).toHaveCount(0);
  await page.context().close();
});
