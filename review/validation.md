# Integration validation — 2026-09-29

Current preview: http://127.0.0.1:3017 · journal: http://127.0.0.1:3017/progress

## Verified foundation

- Wave 10 production build and TypeScript pass. Latest bundle: main route 471 kB first-load JS, progress route 111 kB. Narrative followups to the latest whole-game review await a subsequent rebuild.
- ESLint has no errors and six existing warnings (unused values and skill-list memo dependencies).
- `bun run test:runtime`: 10 checks pass.
- `bun run test:combat`: 12 combat-action/effect checks pass.
- `bun run test:navigation`: 11 collision/path plus seven restored-dialogue placement checks pass.
- `bun run test:opening`: clinic reward, preparation, ordinary starter training victory, nonfatal loss/recovery, earned upgrade and all five spy greeting exits pass. All fifteen job previews remain optional.
- `bun run test:rumors`: authored lore initialization, v18/v19 hydration, selection gates and heard history pass. Generation-time formatting also passes all 104 template/truth combinations and real NPC/sect actions without unresolved token warnings; existing saved text is not rewritten.
- `bun run test:investigation`: real clerk/map registration, interview, one key loan, explicit retrieval, exact reward, lost loan recovery and legacy stages 0/1/2 pass.
- `bun scripts/audit-content.ts`: 155 NPCs, 276 unique quests, 986 scenes; references resolve. Duplicate NPC/quest IDs now fail the audit; one identical duplicate quest entry was removed without changing its surviving ID.
- `git diff --check`: passes.

## Production browser coverage

Chromium, one worker, desktop 1440×900 and emulated phone 390×844 / 844×390. Tests use a real production server on port 3017. No tests ran concurrently with production compilation.

All eleven browser cases pass together on the wave 10 production build in 2.6 minutes. The opening passed in 48.4 seconds, including phone guide placement after delivery and the new school-yard background. The checks verify the same world canvas survives local dialogue, keyboard movement stays suspended, the clinic prop appears after delivery and remains after reload. They require the receipt to show actual amounts, accept Continue without changing rewards, and remain absent after reload; earned-upgrade acknowledgment is inspected and dismissed. Pure tests run the real store's accept/deliver/claim subscription path, including duplicate claim, remount and reset.

The dialogue regression verifies Lin/Wu authored replies and an unrelated monk meeting that must clear the previous local speaker. The investigation regression reaches the capital from a new game through visible controls, hears one of four available rumors, completes interview/key/chest/reward steps, reloads mid-dialogue on phone, and checks saved history and exactly-once rewards. Extended assertions now prove the restored hero stands beside Qing, faces him, remains above the dialogue panel, and ignores movement input during dialogue. The chest opens immediately while the same canvas survives, and remains open after reload. Actual screenshots confirm these changes.

A new renderer fixture verifies the capital street is selected from matching saved origin/return context, survives rotation without replacing the canvas, and keeps actions visible in portrait/landscape. This fixture edits only its local test save and is not represented as ordinary play. The separate background suite exercises actual store travel/encounter/training and hydration.

`node review/verify-lazy-art.cjs` passes on production: all eight title choices paint using base sheets without requesting directions, entering the world requests the selected hero's supplement, and the capital requests no extra directional sheets for stationary NPCs. All fifteen gallery characters render while an explicit north-walk selection loads all eight hero supplements. No browser errors. Default title defers 6,439,449 bytes; browsing both genders defers 12,215,050 bytes until those poses are needed.

Coverage: all eight player bodies and cardinal walk/idle poses; reduced motion; WebGL retry; keyboard/touch movement; menu pause; travel and NPC interaction; save reload and v18 migration; creature atlas; combat impact/completion; touch stat disclosure; viewport rotation; Continue with battle log open; guided quest → purchase → training → recovery at full stamina → earned upgrade → reload.

The deterministic opening test fixes randomness only to remove unrelated road events. Independent reviewers used ordinary controls without edited saves/stats/randomness for their main playthroughs.

## Independent review evidence

- [World review](world-final-critic.md): home/capital movement, scale, foreground depth, night lighting, and four phone interaction endpoints. Initial HUD/identity/approach defects were fixed and directly rechecked.
- [Ordinary opening review](opening-final-critic.md): completed quest, useful purchase, taught tactical duel, earned upgrade, potion use and reload. No functional blocker. Reference preference still favored richer character presence and progression payoff.
- [Wave 7 whole-game review](wave7-whole-critic.md): untouched-save opening, purchase, training, upgrade and reload succeed. References remain preferred; the largest gap was detached dialogue and an unchanging square. Also found indirect goodbye navigation, without forced quest acceptance.
- [Wave 8 whole-game review](wave8-whole-critic.md): ordinary opening, combat, purchase and upgrade pass. The next investigation was undiscoverable, rumors empty, two replies repeated greetings and random meetings retained the previous speaker. Wave 9 addresses these findings with actual clerk/chest interactions, rumor integration and reply/continuity fixes.
- [Fresh atlas review](atlas-fresh-critic.md): all 304 rendered poses have complete silhouettes without neighboring fragments. At production scale, faces/hands and dark costumes lose definition against the detailed terrain; commercial reference still preferred. The reviewer did not infer animation quality from static strips.
- [Wave 9 whole-game review](wave9-whole-critic.md): fresh ordinary play completes both quests, supplies, practice, upgrade and reload; both palace exits work. The reviewer still prefers the references for character/event staging. Its closed-chest, small portrait, overflow-cue and palace wording findings inform wave 10. A new fresh visual reviewer is inspecting actual wave 10 output and an isolated hero-readability candidate; verdict pending.

## Scope and limits

Only Chromium/emulated phones have been exercised; no physical device, Safari or Firefox certification. Only home/capital have fully authored solid footprints and foreground occlusion. The wider campaign, all quests, all builds and all encounters have not been played or balanced end to end. Existing content audits are not substitutes for that work. No new audio system was added.

Reference comparisons use official screenshots, with source manifests under `review/baseline/`. Required coordination context and recognizable interfaces prevent scientifically blind comparison. No claim that critics unanimously preferred this game, or that it matches a commercial game's entire scope. Reviewers' unresolved criticisms remain visible in the journal.

Original generated PNG assets are included under `public/art/`; full prompts and provenance are documented there. Review screenshots and browser traces stay local and are ignored by git.
