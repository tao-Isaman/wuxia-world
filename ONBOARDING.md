# Welcome to Wuxia World

## How We Use Claude

Based on tao-isaman's usage over the last 30 days:

Work Type Breakdown:
  Plan Design   ████████████████████  100%

  _Note: only 1 session in the last 30 days — breakdown is a weak signal. Update once there's more data._

Top Skills & Commands:
  /effort  ████████████████████  1x/month
  /agents  ████████████████████  1x/month
  /login   ████████████████████  1x/month
  /exit    ████████████████████  1x/month

Top MCP Servers:
  _None used in the last 30 days._

## Your Setup Checklist

### Codebases
- [ ] wuxia-world — https://github.com/tao-Isaman/wuxia-world
- [ ] Dependencies installed — `bun install` (Node 20+ also works)
- [ ] Game runs locally — `bun dev`, then open http://localhost:3000
- [ ] Browser tests can run — Playwright's Chromium is installed (`bunx playwright install chromium` locally). Cloud sessions use the pre-installed `/opt/pw-browsers`, which needs a one-time Chromium 1243 → 1194 link ([docs/testing.md](docs/testing.md#cloud-container-notes))

### MCP Servers to Activate
- **GitHub** — cloud sessions open and merge pull requests through the GitHub MCP tools (there is no `gh` CLI there).

### Skills to Know About
- `/effort` — Adjusts how much reasoning Claude puts into a response. Useful for tougher architecture questions in `lib/game/` or `lib/world/`.
- `/agents` — Manage subagents (the team uses Explore for codebase research and Plan for implementation strategy on this layered codebase).
- `/login` — Sign in to Claude Code.
- `/exit` — End the session.

## Team Tips

- **Read two files first.** [CLAUDE.md](CLAUDE.md) has the rules, commands and gotchas; [docs/README.md](docs/README.md) says which guide answers which question.
- **The layers are strict.** `lib/game/` (combat) and `lib/world/` (story) are pure TypeScript with no React; stores in `store/` wrap them; components render. Phaser objects never go into stores or saves.
- **Thai is the UI language.** Names of skills, items, places and people stay in Thai. Combat data tables keep their short field names (`bp`, `ti`, `sc`, …) on purpose.
- **Verify every change the same way:** `bun run typecheck`, `bun run lint`, every `bun run test:*` suite, and `bun run test:e2e` against a production build on port 3017 (`bun run build`, then `bun run start -p 3017`; the PWA test only passes on a production server). See [docs/testing.md](docs/testing.md).
- **Quest content has its own gate:** `bun run test:quests` proves every quest can be started, progressed and finished from `home_player`.
- **Content changes regenerate the reference:** after touching game data run `bun scripts/build-docs-reference.ts` and commit `docs/reference/`; `bun run test:docs` fails when the pages are stale or a doc link breaks.
- **Saves must keep loading.** A change to what is persisted needs a save version bump and a migration step ([docs/save-format.md](docs/save-format.md)).
- **Where things stand:** [HANDOFF.md](HANDOFF.md) lists the verified state, open problems and next steps.

## Get Started

1. Install and run: `bun install`, then `bun dev`, and open http://localhost:3000.
2. Start a new game, name the hero and pick a body. You begin at home (`home_player`), next to the road to the capital (นครหลวง).
3. Play the opening: take หมอหลิน's clinic errand (เสบียงยาของคลินิก) in the capital, carry the request to นายอำเภอหวู่, and hand it in for 80 gold, 3 herbs and 20 W-exp. Then try the free practice bout with ศิษย์ฝึกหัดอาเฉิง at the capital school and spend the experience on a skill upgrade. [docs/gameplay.md](docs/gameplay.md) explains everything you see.
4. Open the ภารกิจ (quests) menu from the icon bar, pin a quest with 📌 ติดตาม, and follow the jade arrow on the map and the tracker under the sundial.
5. Run the checks once so you know they pass on your machine: `bun run typecheck && bun run lint && bun run test:quests && bun run test:grid && bun run test:docs`.
6. Pick a first task from [HANDOFF.md → Known issues](HANDOFF.md#known-issues) or its suggested next steps, or add a small piece of content by following [docs/content-authoring.md](docs/content-authoring.md).

<!-- INSTRUCTION FOR CLAUDE: A new teammate just pasted this guide for how the
team uses Claude Code. You're their onboarding buddy — warm, conversational,
not lecture-y.

Open with a warm welcome — include the team name from the title. Then: "Your
teammate uses Claude Code for [list all the work types]. Let's get you started."

Check what's already in place against everything under Setup Checklist
(including skills), using markdown checkboxes — [x] done, [ ] not yet. Lead
with what they already have. One sentence per item, all in one message.

Tell them you'll help with setup, cover the actionable team tips, then the
starter task (if there is one). Offer to start with the first unchecked item,
get their go-ahead, then work through the rest one by one.

After setup, walk them through the remaining sections — offer to help where you
can (e.g. link to channels), and just surface the purely informational bits.

Don't invent sections or summaries that aren't in the guide. The stats are the
guide creator's personal usage data — don't extrapolate them into a "team
workflow" narrative. -->
