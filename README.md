# กำลังภายใน — Battle Sim

Thai-language wuxia / martial-arts text-RPG with a 1v1 turn-based battle layer. The world is a network of cities, sects, mountains, valleys, islands and homes; the combat sim drops in whenever a fight is triggered.

Built with **Next.js 15 + React 19 + TypeScript + Zustand + Tailwind v3.4 + shadcn/ui**, runs on **Bun** (Node 20+ also works).

## Quick start

```bash
bun install
bun dev          # http://localhost:3000
```

Other commands:

```bash
bun run build       # next build
bun start           # run production build
bun run lint        # ESLint flat config
bun run typecheck   # tsc --noEmit
```

The starter location is the player's home (`home_player`), which connects to the capital (`city_capital`). From there the world opens up.

## What's in the game

### World (text-RPG layer)

- **~85 locations** organised by category — 7 cities, 7 villages, 17 sects, 10 isles, 11 mountains/cliffs, 12 caves/valleys, 5 temples/palaces, 4 mansions, 4 inns, 11 NPC homes, plus misc.
- **Hand-curated routes** — every connection between two locations is in `lib/world/data/location-routes.ts`, with its own per-direction Thai label like "ลำคลองใหญ่" or "ทางขึ้นเขา". No procedural generation.
- **Travel costs** — moving between a location and a route costs 10 stamina + 1–2 ชั่วยาม. Cities and inns offer paid rest; temples / palaces a free half restore; every other location offers free roadside rest.
- **Random encounters** — 15 % chance per location entry, with a fight-or-flee screen. Pool is filtered by zone (cities never spawn beasts; wild zones favour beasts; sects / temples carry the supernatural pool) and weighted by tier (tier-0 chaff is common, tier-4 legendary foes are rare).
- **Dialogs** with branching choices, gated by flags / quests / traits / NPC relationships.
- **Quests** with stages, status (active / done / failed), and trigger conditions.
- **Cities** carry a market (full general store), an inn (food + 12-hour rest), and a martial-school hall (`สำนักยุทธิ์ประจำเมือง`) selling tier 0–1 move + inner skills, with each city offering a different roster.
- **Inns** at non-city inn locations carry a smaller food-focused shop.
- **Villages** carry a tiny stall + free roadside rest.

### Combat (battle sim)

- **1v1 ATB-style** turn order with real-time gauge animation. Speed differences feel natural (2:1 SPD ≈ 2:1 turn count, not 5:1).
- **10 unified slots** per build, holding either a move skill or an inner skill (with `art:` prefix).
- **80+ move skills** across 5 tiers, organised by sect: เส้าหลิน, อู่ตัง, ฉวนเจิน, กู่มู่, หัวซาน, พรรคยาจก, พรรคสว่างมืด, พรรคสราญรมย์, สำนักดาวดึงส์, พรรคเบญจพิษ, สำนักดาบโลหิต, ยุทธจักร (catch-all).
- **45 inner skills** (กำลังภายใน) across 5 tiers with active + passive, scaled stats and HP/MP per level.
- **25 weapon families** of equipment (`W / A / H / B / BR / R / C` slots with multi-slot bracelets, rings, charms).
- **Mastery** — each skill counts toward its weapon family's mastery (cap 200), scales the family's per-skill damage multiplier.

### Player progression

- **Per-stat xp** for each of STR / AGI / POW / VIT / DEX / LUK / DEF / INT, earned by activity (physical skill use → STR; gathering → VIT; cultural → INT; etc.). Auto-levels when full; cost scales with the *base* stat.
- **Per-skill xp** for every move skill, earned per use in a winning battle. Auto-levels when full; level scales `bp` from 50 % → 100 % over levels 1–10.
- **W-exp** — global pool earned from any action; spend to skip the per-skill grind.
- **Skill type-conflict** — every skill / art carries philosophical tags (yin / yang / hard / soft / internal / external / balance). Once you have > 4 typed entries learned, any axis dominated by > 60 % halves (or zeros, for internal ↔ external) the contribution of opposing-type skills.
- **5 reputation traits** — ความดี / ความเลว / ความหยิ่งยโส / ความถ่อมตน / ชื่อเสียง. Adjusted by quest choices and sparring; readable by quest conditions.
- **NPC relationships** — quests / sparring move per-NPC standing.
- **Action log** — last 100 events (rest, gather, craft, buy, sell, use, learn, combat).

### UX

- **Toast notifications** at the top of the screen for every action result (buy / sell / rest / gather / craft / use / learn / combat).
- **Loading overlay** flashes briefly during gather / craft / rest for tactile feedback.
- **Persistent saves** via Zustand persist middleware (localStorage). Schema migration chain handles version bumps.
- **Game-over screen** on fatal battle loss; "เริ่มใหม่" wipes the world slice (character builds are independent).

## Project layout

```
app/                     Next.js app router
  page.tsx               World game (renders <WorldScreen />)
  debug/page.tsx         Dev sandbox (free-form battle, character setup)

lib/
  game/                  Pure combat engine (no React, no I/O)
    data/                SKILLS, ARTS, EQUIPMENT, TIERS, sect list
    types.ts             Discriminated unions for all combat effects
    derive.ts            Stat derivation + skill-level / conflict scaling
    battle.ts            ATB + damage formula + skill / art resolution
    effects.ts           Self / enemy / passive effect dispatchers
    skill-conflict.ts    > 60 % type-conflict modifier system
    leveling.ts          Per-skill bp / mg level scaling, xp curve
    slots.ts             Slot encoding (skill id vs "art:<id>")
    ai.ts                Simple AI

  world/                 Pure world / story engine
    data/
      scenes.ts          Tutorial scenes
      world-map.ts       7 cities + 7 villages + 17 sects + ... = ~85 leaves
      location-routes.ts Hand-curated edge list with per-direction labels
      sects.ts           Canonical sect list + sort order
      opponents.ts       35 enemies in 5 tiers with category + drops
      npcs.ts            NPC registry (talk / spar)
      items.ts           Items with category + price + use effect
      shops.ts           Per-location shop catalogues
      sect-halls.ts      Per-city tier 0–1 skill / art offerings
      recipes.ts         Crafting recipes
      resources.ts       Gather nodes
      random-events.ts   Fight / treasure / meet pool, zone-filtered
      quests.ts          Quest definitions
    types.ts             Scene union, conditions, effects, traits, etc.
    effects.ts           SceneEffect dispatcher
    conditions.ts        Condition evaluator
    validate.ts          Save-rehydrate sanity pass
    battle-bridge.ts     World ↔ battle subscription glue
    stat-progression.ts  Per-stat xp helpers + LUK roll formula

store/
  character-store.ts     /debug A & B character builds (persisted)
  battle-store.ts        Runtime battle state (NOT persisted)
  world-store.ts         World state — scenes, quests, inventory, ... (persisted, v11)
  loading-store.ts       300 ms loading-overlay flash
  toast-store.ts         Top-of-screen toast stack

components/
  ui/                    shadcn primitives (Button, Card, Combobox, Modal, ...)
  game/                  BattleArena, BattleLog, SkillSlots, EquipmentSlots, ...
  world/                 WorldScreen, LocationView, RouteView, DialogDisplay,
                         StatusBar, MenuBar, EncounterScreen, RestPanel,
                         GameOverScreen, ToastStack, LoadingOverlay,
                         popups/ (Profile, Inventory, MoveSkills, InnerSkills,
                                  LifeSkills, ActionLog, NpcInteraction, Shop,
                                  SectHall)
```

## Authoring tips

The cheapest content loop:

- **New skill** → append to `lib/game/data/skills.ts` (compact field shorthand: `sc` / `ti` / `w` / `mg` / `bp` / `p` / `f` / `dm` / `se` / `ee` / `types`).
- **New inner skill** → same in `lib/game/data/arts.ts` (`sc` / `ti` / `tp` / `types` / `stats` / `hL` / `mL` / `act` / `pas`).
- **New location** → add a `leaf("id", "name", "desc")` in the matching array in `world-map.ts`, then **at least one** entry in `location-routes.ts` so it's reachable. Console will warn if a leaf has no explicit route.
- **New shop / sect hall / NPC / opponent / quest / item / recipe** → append to its registry in `lib/world/data/`. Most have a `getX(id)` helper for lookups.
- **New quest scene effect / condition** → variant in `lib/world/types.ts` + case in `effects.ts` / `conditions.ts`. TS exhaustiveness flags missed dispatchers.
- **Teach the player a new skill mid-game** → drop a `{ t: "learnSkill", skillId: "..." }` (or `learnArt`) in any quest / NPC dialog. Auto-slots into the first empty slot.

## License & credits

Wuxia / 武林 source material — Jin Yong (金庸) and Gu Long (古龙) novels, plus the *9 Yin* / *JY Online* MMOs — informed many of the sect, skill, and inner-art names. The `demo.html` prototype that seeded the combat formula was hand-written by the author; the rebuild ports those numbers as faithfully as possible.

The repo is a single-author personal project; treat the code as work-in-progress. CLAUDE.md captures the architectural conventions if you want to contribute.
