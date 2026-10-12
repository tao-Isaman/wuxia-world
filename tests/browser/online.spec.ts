import { test, expect, type Browser, type Page } from "@playwright/test";

// Online (docs/online.md): two players in two separate browsers sign up,
// stand on the same map and see each other walk in real time; an account's
// characters live on the server (select, create, switch, delete, resume).
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

async function newContext(browser: Browser) {
  return browser.newContext({
    storageState: { cookies: [], origins: [{ origin: "http://127.0.0.1:3017", localStorage: [
      { name: "wuxia-random-events", value: "off" },
      { name: "wuxia-dialog-instant", value: "on" },
      { name: "wuxia-game-server", value: SERVER },
    ] }] },
    viewport: { width: 1280, height: 800 },
  });
}

/** Step 2 on the select screen: a new character, then into the world. */
async function createHero(page: Page, hero: string, gender: "ชาย" | "หญิง") {
  await page.getByTestId("character-new").click();
  await page.locator("#hero-name").fill(hero);
  await page.getByRole("button", { name: gender, exact: true }).click();
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

/** A fresh browser (own storage) with a new hero, signed up online. */
async function player(browser: Browser, hero: string, gender: "ชาย" | "หญิง", username: string): Promise<Page> {
  const context = await newContext(browser);
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
  // Step 2: the account's characters (none yet), then a new one.
  await expect(page.getByTestId("character-select")).toBeVisible();
  await expect(page.getByTestId("online-username")).toHaveText(username);
  await expect(page.getByTestId("character-card")).toHaveCount(0);
  await createHero(page, hero, gender);
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
  // Logged in: the account's character is waiting on the server.
  const card = page.getByTestId("character-card");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("เฉินจิ้ง");
  await card.getByTestId("character-play").click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("hero-form")).toHaveCount(0);
  await page.context().close();
});

test("characters on the server: two heroes on one account, switch, resume after a reload and from another browser, delete", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  test.setTimeout(180_000);
  const id = `dan_${run}`.slice(0, 20);
  const page = await player(browser, "ซ่งอวิ๋น", "ชาย", id);
  const hud = page.getByTestId("online-button");
  // The first save reaches the server.
  await hud.click();
  await expect(page.getByTestId("online-character")).toHaveAttribute("data-save-status", "saved", { timeout: 20_000 });
  // A second hero: back to the list, a new one.
  await page.getByTestId("change-character").click();
  await expect(page.getByTestId("character-card")).toHaveCount(1);
  await expect(page.getByTestId("character-card")).toContainText("ซ่งอวิ๋น");
  await createHero(page, "เหลียนฮวา", "หญิง");
  // A reload comes back to the hero last played.
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByTestId("online-button").click();
  await expect(page.getByTestId("online-character")).toContainText("เหลียนฮวา");
  // Another browser, same account: both heroes are there.
  const other = await (await newContext(browser)).newPage();
  await other.goto("/");
  const account = other.getByTestId("account-form");
  await account.getByRole("tab", { name: "มีบัญชีแล้ว" }).click();
  await account.locator("#account-username").fill(id);
  await account.locator("#account-password").fill("secret-pass");
  await account.getByTestId("account-submit").click();
  await expect(other.getByTestId("character-card")).toHaveCount(2);
  // Delete one (after a confirmation).
  const doomed = other.getByTestId("character-card").filter({ hasText: "ซ่งอวิ๋น" });
  await doomed.getByTestId("character-delete").click();
  await other.getByRole("dialog").getByRole("button", { name: "ลบถาวร" }).click();
  await expect(other.getByTestId("character-card")).toHaveCount(1);
  await expect(other.getByTestId("character-card")).toContainText("เหลียนฮวา");
  await other.context().close();
  await page.context().close();
});

test("a fight on the server: staged there, played here, judged there before the world goes on", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  test.setTimeout(180_000);
  const page = await player(browser, "หลิวเฟิง", "ชาย", `eve_${run}`.slice(0, 20));
  await page.getByTestId("online-button").click();
  await expect(page.getByTestId("online-character")).toHaveAttribute("data-save-status", "saved", { timeout: 20_000 });
  // Stand the hero, made strong, before a thief: written to the server's save, then reloaded.
  const stored = await page.evaluate(async (server) => {
    const online = JSON.parse(localStorage.getItem("wuxia-online-v1")!).state as { token: string; characterId: string };
    const headers = { authorization: `Bearer ${online.token}`, "content-type": "application/json" };
    const path = `${server}/characters/${online.characterId}/save`;
    const { rev, save } = await (await fetch(path, { headers })).json();
    const state = save.state;
    state.playerBuild.stats = Object.fromEntries(Object.keys(state.playerBuild.stats).map((k: string) => [k, 900]));
    state.currentHp = 99_999;
    state.currentMp = 99_999;
    state.pendingBattle = { opponentId: "petty_thief", onWin: state.currentSceneId, onLose: state.currentSceneId };
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const put = await fetch(path, { method: "PUT", headers, body: JSON.stringify({ rev, version: save.version, state }) });
    return { ok: put.ok, gold: state.gold as number };
  }, SERVER);
  expect(stored.ok).toBe(true);
  await page.reload();
  const briefing = page.getByTestId("battle-briefing");
  await expect(briefing).toBeVisible({ timeout: 60_000 });
  await briefing.getByRole("button", { name: /เข้าต่อสู้/ }).click();
  await page.getByRole("button", { name: "อัตโนมัติ" }).click();
  const result = page.getByTestId("combat-result");
  await expect(result).toHaveAttribute("data-outcome", "ally", { timeout: 90_000 });
  // The server's verdict brings the spoils; only then does the story go on.
  await expect(page.getByTestId("victory-spoils")).toBeVisible({ timeout: 20_000 });
  await result.getByRole("button", { name: /ดำเนินเรื่อง/ }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("combat-result")).toHaveCount(0);
  await page.context().close();
});

/** Rewrite this character's save on the server (then reload): `edit` changes the state. */
async function editSave(page: Page, edit: string) {
  const ok = await page.evaluate(async ([server, body]) => {
    const online = JSON.parse(localStorage.getItem("wuxia-online-v1")!).state as { token: string; characterId: string };
    const headers = { authorization: `Bearer ${online.token}`, "content-type": "application/json" };
    const path = `${server}/characters/${online.characterId}/save`;
    const { rev, save } = await (await fetch(path, { headers })).json();
    const state = save.state;
    new Function("state", body)(state);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return (await fetch(path, { method: "PUT", headers, body: JSON.stringify({ rev, version: save.version, state }) })).ok;
  }, [SERVER, edit] as const);
  expect(ok).toBe(true);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("online-button")).toHaveAttribute("data-online-status", "online", { timeout: 20_000 });
}

/** Open a HUD menu section by its label. */
const openMenu = (page: Page, label: string) => page.locator(".hud-iconbar").getByRole("button", { name: label, exact: true }).click();

test("between players: map chat with bubbles, a tap opens the card, friends, a party with its chat, and a letter with gold", async ({ browser }) => {
  test.skip(!(await serverUp()), `no game server at ${SERVER} (bun run server:dev)`);
  test.setTimeout(300_000);
  const annId = `sa_${run}`.slice(0, 20);
  const bobId = `sb_${run}`.slice(0, 20);
  const ann = await player(browser, "เหมยอิง", "หญิง", annId);
  // Ann has a purse to post from.
  await editSave(ann, "state.gold = 500;");
  const bob = await player(browser, "ซ่งหลาง", "ชาย", bobId);
  await expect.poll(() => remoteAt(ann, bobId), { timeout: 20_000 }).not.toBeNull();
  await expect.poll(() => remoteAt(bob, annId), { timeout: 20_000 }).not.toBeNull();

  // Map chat: Enter opens the box; the line reaches Bob's feed and floats over Ann's head on his map.
  await ann.getByTestId("world-canvas").focus();
  await ann.keyboard.press("Enter");
  const annChat = ann.getByTestId("chat-box");
  await expect(annChat).toBeVisible();
  await ann.getByTestId("chat-input").fill("สวัสดีสหายร่วมทาง");
  await ann.getByTestId("chat-input").press("Enter");
  await expect(bob.getByTestId("chat-feed")).toContainText("สวัสดีสหายร่วมทาง", { timeout: 10_000 });
  await expect.poll(async () => Number(await bob.getByTestId("world-canvas").getAttribute("data-chat-bubbles")), { timeout: 10_000 }).toBeGreaterThan(0);
  await expect(annChat.getByTestId("chat-list")).toContainText("สวัสดีสหายร่วมทาง");
  await bob.screenshot({ path: "test-results/screenshots/online-chat-bubble.png" });
  await ann.screenshot({ path: "test-results/screenshots/online-chat-box.png" });
  // Typing does not walk the hero.
  const x = await ann.getByTestId("world-canvas").getAttribute("data-player-x");
  await ann.getByTestId("chat-input").type("dddd");
  await ann.waitForTimeout(400);
  expect(await ann.getByTestId("world-canvas").getAttribute("data-player-x")).toBe(x);
  await ann.getByTestId("chat-input").fill("");
  await ann.getByTestId("chat-input").press("Escape");
  await expect(annChat).toHaveCount(0);

  // Bob taps Ann on the map: her card; he asks to be friends.
  const canvas = bob.getByTestId("world-canvas");
  const box = (await canvas.boundingBox())!;
  const spots = JSON.parse((await canvas.getAttribute("data-remote-screen")) ?? "[]") as [string, number, number][];
  const spot = spots.find(([id]) => id === annId)!;
  await bob.mouse.click(box.x + spot[1], box.y + spot[2]);
  const card = bob.getByTestId("player-card");
  await expect(card).toHaveAttribute("data-player", annId);
  await bob.screenshot({ path: "test-results/screenshots/online-player-card.png" });
  await card.getByTestId("card-befriend").click();
  await bob.keyboard.press("Escape");

  // Ann accepts in สหาย (its badge counts the request).
  await expect(ann.locator(".hud-iconbar").getByRole("button", { name: "สหาย", exact: true }).locator(".hud-icon-badge")).toHaveText("1", { timeout: 10_000 });
  await openMenu(ann, "สหาย");
  await ann.getByTestId("friend-requests").getByTestId("friend-accept").click();
  await expect(ann.getByTestId("friend-list")).toContainText("ซ่งหลาง");
  // …and asks Bob into a party.
  await ann.getByTestId("friend-list").locator(`[data-friend="${bobId}"]`).getByRole("button", { name: "ชวนเข้าคณะ" }).click();
  await ann.keyboard.press("Escape");
  await openMenu(bob, "สหาย");
  await bob.getByTestId("party-invites").getByTestId("party-accept").click();
  await expect(bob.getByTestId("party-members")).toContainText("เหมยอิง");
  await bob.screenshot({ path: "test-results/screenshots/online-friends.png" });
  await bob.keyboard.press("Escape");
  // Both see the other in the party frame, and the name tag turns to the party colour.
  await expect(ann.getByTestId("party-frame")).toContainText("ซ่งหลาง", { timeout: 10_000 });
  await expect(bob.getByTestId("party-frame")).toContainText("เหมยอิง");
  await expect(ann.getByTestId("party-frame").locator(`[data-member="${bobId}"]`)).toHaveAttribute("data-near", "true");
  await expect(ann.getByTestId("world-canvas")).toHaveAttribute("data-party-tags", bobId, { timeout: 10_000 });

  // Party chat.
  await bob.getByTestId("chat-button").click();
  await bob.getByTestId("chat-tab-party").click();
  await bob.getByTestId("chat-input").fill("ออกเดินทางกันเถิด");
  await bob.getByTestId("chat-input").press("Enter");
  await expect(ann.getByTestId("chat-feed")).toContainText("ออกเดินทางกันเถิด", { timeout: 10_000 });
  await bob.getByTestId("chat-input").press("Escape");

  // A letter with 100 ตำลึง: Ann pays the parcel and the postage; Bob takes it when he chooses.
  const goldOf = (page: Page) => page.evaluate(async (server) => {
    const online = JSON.parse(localStorage.getItem("wuxia-online-v1")!).state as { token: string; characterId: string };
    const { save } = await (await fetch(`${server}/characters/${online.characterId}/save`, { headers: { authorization: `Bearer ${online.token}` } })).json();
    return save.state.gold as number;
  }, SERVER);
  const bobBefore = await goldOf(bob);
  await openMenu(ann, "จดหมาย");
  await ann.getByTestId("letters-tab-write").click();
  await ann.getByTestId("mail-to").fill(bobId);
  await ann.getByTestId("mail-text").fill("ค่าเดินทางสำหรับสหาย");
  await ann.getByTestId("mail-kind-gold").click();
  await ann.getByTestId("mail-gold").fill("100");
  await ann.getByTestId("mail-send").click();
  await expect(ann.getByTestId("mail-compose")).toHaveCount(0, { timeout: 20_000 });
  await ann.keyboard.press("Escape");
  await expect(bob.locator(".hud-iconbar").getByRole("button", { name: "จดหมาย", exact: true }).locator(".hud-icon-badge")).toHaveText("1", { timeout: 10_000 });
  await openMenu(bob, "จดหมาย");
  await bob.getByTestId("letters-tab-players").click();
  await bob.getByTestId("mail-list").getByRole("button").first().click();
  await expect(bob.getByTestId("mail-open")).toContainText("ค่าเดินทางสำหรับสหาย");
  await bob.screenshot({ path: "test-results/screenshots/online-mail.png" });
  await bob.getByTestId("mail-claim").click();
  await expect(bob.getByTestId("mail-claimed")).toBeVisible({ timeout: 10_000 });
  await bob.keyboard.press("Escape");
  // The gold is in Bob's save on the server, and out of Ann's.
  await expect.poll(() => goldOf(bob), { timeout: 20_000 }).toBe(bobBefore + 100);
  await expect.poll(() => goldOf(ann), { timeout: 20_000 }).toBe(390);
  await ann.screenshot({ path: "test-results/screenshots/online-social.png" });
  await ann.context().close();
  await bob.context().close();
});
