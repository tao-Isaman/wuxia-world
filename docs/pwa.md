# PWA — install and offline play

The game is an installable Progressive Web App. It runs full screen from the home screen and reloads offline once visited, because saves live in `localStorage` and a service worker caches the page and the art.

## Contents

- [Files](#files)
- [Manifest and page metadata](#manifest-and-page-metadata)
- [Service worker](#service-worker)
- [Registration and build ids](#registration-and-build-ids)
- [The install button](#the-install-button)
- [Icons](#icons)
- [Testing](#testing)
- [Known issues](#known-issues)

## Files

| File | Role |
| --- | --- |
| `app/manifest.ts` | the web app manifest, served at `/manifest.webmanifest` |
| `app/layout.tsx` | `metadata` (title, Apple web-app tags, icons) and `viewport` (`viewport-fit=cover`, theme colour) |
| `public/sw.js` | the hand-written service worker |
| `components/pwa.tsx` | `PwaRegister` (mounted in the layout), `InstallGameButton`, `isStandalone` |
| `next.config.ts` | the build id and the no-cache headers for `/sw.js` |
| `app/pwa.css` | install button and hint, standalone overscroll, notch margins |
| `public/pwa/` | install icons; `scripts/build-pwa-icons.ts` makes them |

## Manifest and page metadata

`app/manifest.ts`:

| Field | Value |
| --- | --- |
| `id`, `scope` | `/` |
| `name` / `short_name` | กำลังภายใน — ยุทธภพ / กำลังภายใน |
| `lang` | `th` |
| `start_url` | `/?source=pwa` |
| `display` | `fullscreen` (with `display_override` fullscreen → standalone; iOS uses standalone) |
| `orientation` | `any` — the HUD adapts to both |
| `background_color` / `theme_color` | `#10201b` / `#140a07` |
| `categories` | games, entertainment |
| `icons` | 192 and 512 (`any`), 512 maskable |

`app/layout.tsx` adds:

- the page title and description;
- `appleWebApp` (capable, title, `black-translucent` status bar);
- a 192 px icon and a 180 px Apple touch icon;
- no telephone-number detection;
- a `viewport` with `viewportFit: "cover"`, so the HUD can use `env(safe-area-inset-*)` around notches.

## Service worker

`public/sw.js` uses three caches:

| Cache | Holds | Strategy |
| --- | --- | --- |
| `shell-<v>` | page navigations; pre-caches `/`, `/manifest.webmanifest` and the 192 / 512 icons at install | **network first** (with navigation preload), cached on success. Offline: the same page (ignoring the query), else `/`, else a 503 "ออฟไลน์อยู่ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่" |
| `static-<v>` | `/_next/static/…` (content-hashed JS and CSS) | **cache first** |
| `assets-v1` | `/art/`, `/maps/`, `/npcs/`, `/player/`, `/icons/`, `/fonts/`, `/pwa/`, `/progress.json`, `/manifest.webmanifest` | **stale-while-revalidate**, trimmed oldest-first to **900** entries; shared across deploys |

- **Install** pre-caches the shell and calls `skipWaiting`.
- **Activate** deletes every other cache (old deploys), enables navigation preload and claims open pages.
- **Ignored requests:** non-GET, `Range` requests (media) and other origins.
- **Update message:** posting `"skipWaiting"` to the worker activates a waiting version.

## Registration and build ids

`PwaRegister` (`components/pwa.tsx`) registers the worker **only in production builds**, after the page `load` event:

```ts
navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`, { scope: "/" })
```

- **Build id.** `next.config.ts` sets `NEXT_PUBLIC_BUILD_ID` to the first 12 characters of `VERCEL_GIT_COMMIT_SHA`, else `Date.now()` in base 36. Each deploy therefore registers a new worker URL, whose caches replace the old ones.
- **No stale worker.** `/sw.js` is served with `Cache-Control: no-cache, no-store, must-revalidate`, so browsers always check for a new worker.
- **Keeping saves.** When the game runs installed (`display-mode` standalone or fullscreen, or iOS `navigator.standalone`), it calls `navigator.storage.persist()` so the browser keeps the save.

## The install button

`InstallGameButton` shows up in two places: as a pill on the title screen ("⬇ ติดตั้งเกมลงเครื่อง") and as an icon in the HUD icon bar ("⬇ ติดตั้ง").

| Situation | Behaviour |
| --- | --- |
| Chrome / Android fired `beforeinstallprompt` | the event is captured once, globally; the button opens the native prompt |
| iPhone / iPad (including iPadOS reporting `MacIntel` with touch), not installed | the button toggles a hint: "แตะปุ่ม แชร์ (□↑) ของ Safari แล้วเลือก เพิ่มไปยังหน้าจอโฮม เพื่อเล่นแบบเต็มจอ" |
| already installed, or a browser that never offers a prompt | nothing renders |

`appinstalled` clears the captured prompt.

## Icons

`bun scripts/build-pwa-icons.ts` draws the icons from the hero still `public/player/m1.png`: a jade disc with a gold rim and a nearest-neighbour bust.

| File | Size |
| --- | --- |
| `public/pwa/apple-touch-icon.png` | 180 |
| `public/pwa/icon-192.png` | 192 |
| `public/pwa/icon-512.png` | 512 |
| `public/pwa/icon-maskable-512.png` | 512, face kept inside the maskable safe zone |

The script uses `sharp`, which arrives through Next.js rather than `package.json`.

## Testing

`tests/browser/pwa.spec.ts` checks:

- the manifest (fullscreen, a maskable icon, every icon reachable);
- the `<link rel="manifest">`;
- that a service worker becomes **active** within 30 s;
- that an offline reload still reaches the world.

It **only passes against a production server** — the worker never registers in `next dev`:

```bash
bun run build
bun run start -p 3017
bun run test:e2e tests/browser/pwa.spec.ts
```

See [testing.md](testing.md#running-e2e-against-a-production-build).

## Known issues

- **`/progress` fills the asset cache.** The page polls `/progress.json?t=<now>` every 5 seconds, and each unique URL matches the asset rule. With the worker active, every poll adds a cache entry, and after 900 entries real art starts to be evicted.

  Fix it by dropping `/progress.json` from `ASSET_PATHS` or ignoring its query string.
- **Offline only works for visited places.** A place the player has never visited has no cached painting until they go there online.
