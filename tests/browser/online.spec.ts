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
  // The title screen offers the online sign-up beside the new hero.
  const panel = page.getByTestId("online-panel");
  await panel.locator("#online-username").fill(username);
  await panel.locator("#online-password").fill("secret-pass");
  await panel.getByRole("button", { name: "สมัครบัญชี" }).click();
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
