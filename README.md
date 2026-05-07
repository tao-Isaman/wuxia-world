# กำลังภายใน — Battle Sim

Thai-language wuxia / martial-arts text-RPG with a 1v1 turn-based battle layer. The world is a network of cities, sects, mountains, valleys, islands and homes; the combat sim drops in whenever a fight is triggered.

Built with **Next.js 15 + React 19 + TypeScript + Zustand + Tailwind v3.4 + shadcn/ui**, runs on **Bun** (Node 20+ also works). UI ships an ink-wash + pixel-art Y2K wuxia aesthetic — Charm calligraphic display font over Sarabun body, cream paper background, vermilion seal accents, pixel-bordered chrome.

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
- **Hunt-boost mechanic** — when the player has an active "kill X enemies" quest stage AND the target spawns in the current zone, the encounter rate jumps from 15 % → **80 %** and the pool is restricted to the target. Treasure / meet bands are suppressed during a hunt. Falls back to the normal cadence when no target fits the zone.
- **Location categories** — every leaf has one or more tags (city / village / sect / mountain / forest / cave / river / temple / etc.) inferred from its id prefix, used to gate the practice action and to apply skill-type XP bonuses (forest → yang/external, cave → yin/soft, mountain → balance/hard, river → internal).
- **Dialogs** with branching choices, gated by flags / quests / traits / NPC relationships.
- **Quests** with a numbered stage checklist + a final "รับรางวัล" step shown in the **📋 ภารกิจ** menu tab. Three sub-tabs (กำลังทำ / สำเร็จ / ละทิ้ง). Active quests can be cancelled inline.
- **Cities** carry a market (full general store), an inn (food + 12-hour rest), a martial-school hall (`สำนักยุทธิ์`) selling tier 0–1 ยุทธจักร skills + arts (sect-specific styles must be learned at the parent sect), and **all 6 craft artisans** (forge / alchemy / tailoring / chef / jewelry / accessory).
- **Inns** at non-city inn locations carry a smaller food-focused shop.
- **Villages** carry a tiny stall + free roadside rest + one craft artisan (when configured).
- **Sects** carry one thematic artisan where lore fits (e.g. หัวซาน = swordsmith, ง้อไบ๊ = alchemist).

### Combat (battle sim)

- **1v1 ATB-style** turn order with real-time gauge animation. Speed differences feel natural (2:1 SPD ≈ 2:1 turn count, not 5:1).
- **10 unified slots** per build, holding either a move skill or an inner skill (with `art:` prefix).
- **90+ move skills** across 5 tiers + a beast-move family (`bst_*` claws / fangs / venoms used by hunt-only opponents). Sects: เส้าหลิน, อู่ตัง, ฉวนเจิน, กู่มู่, หัวซาน, พรรคยาจก, พรรคสว่างมืด, พรรคสราญรมย์, สำนักดาวดึงส์, พรรคเบญจพิษ, สำนักดาบโลหิต, ยุทธจักร (catch-all).
- **45 inner skills** (กำลังภายใน) across 5 tiers with active + passive, scaled stats and HP/MP per level.
- **25 weapon families** of equipment (`W / A / H / B / BR / R / C` slots with multi-slot bracelets, rings, charms).
- **Mastery** — each skill counts toward its weapon family's mastery (cap 200), scales the family's per-skill damage multiplier. Profile shows raw points + multiplier.
- **45 opponents** in 5 tiers including 10 hunt-only beasts that spawn through hunting resources only — tuned weaker than tier-equivalent random-event beasts so hunting stays a sustainable grind.

### Player progression

- **Per-stat xp** for each of STR / AGI / POW / VIT / DEX / LUK / DEF / INT, earned by activity (physical skill use → STR; gathering → VIT; cultural → INT; hard crafts → DEX; etc.). Auto-levels when full; cost scales with the *base* stat.
- **Per-skill xp (move skills)** — earned per use in a winning battle. Auto-levels when full; level scales `bp` from 50 % → 100 % AND each skill's stat contribution (`sk.st`) by the same curve.
- **Per-art xp (inner skills)** — parallel pool tracked in `artExp[id]`. Each art active fired in a winning battle banks xp; auto-levels at the cap. **Cost curve = 2× the move-skill cost** at the same tier. Cap at level 10.
- **W-exp** — global pool earned from any action; spend to skip the per-skill or per-art grind via "เร่งด้วย w-exp" buttons.
- **Skill type-conflict** — every skill / art carries philosophical tags (yin / yang / hard / soft / internal / external / balance). Once you have > 4 typed entries learned, any axis dominated by > 60 % halves (or zeros, for internal ↔ external) the contribution of opposing-type skills.
- **5 reputation traits** — ความดี / ความเลว / ความหยิ่งยโส / ความถ่อมตน / ชื่อเสียง. Adjusted by quest choices and sparring; readable by quest conditions.
- **NPC relationships** — quests / sparring move per-NPC standing.
- **Action log** — last 100 events (rest, gather, craft, buy, sell, use, learn, combat, quest).

### Activities

- **🧘 Practice (ฝึกฝน)** — at sect / mountain / forest / cave / river / temple locations the player can spend 30 stamina + 6 ชั่วยาม to bank xp on a chosen skill or art. **+30 % xp** when the skill's `types` overlap with the location's category (e.g., yang skills in forest, internal skills near rivers).
- **Gather / Hunt** — 18 life skills (mining / woodcutting / hunting / fishing / herbalism / venom / reading / music / drawing / writing / chess / begging / forge / tailoring / jewelry / alchemy / chef / accessory). Mastery 1–5 per skill; gather success rolls scale with mastery vs resource level.
- **Craft (artisan-gated)** — 6 craft professions require **a learned recipe + the player to be at an artisan of the matching profession**. Buy recipes at any artisan of that craft; basic recipes are sold by every artisan, specialty recipes are unique to specific cities (xixia → steel sword, suzhou → silk robe, dali → poison & big potion, jinling → jade amulet, capital → moon-cake, yangzhou → silk fan, changan → warrior's belt). Other recipes (mining / hunting / herbalism / drawing / writing) keep the legacy "craft inline" behavior.

### UX

- **Wuxia ink-on-paper UI** — cream paper background with a paper-noise texture, ink-black foreground, vermilion seal accents, jade highlights. Charm display font on proper-noun labels and headers; Sarabun on dialog and body. Pixel-bordered Panel chrome via `border-image` 9-slice; pixel-bevel WuxiaButton via stacked `box-shadow`. Light mode only (dark mode was dropped). Mobile + desktop responsive.
- **Status bar + Menu bar** — always-on top chrome. Status bar shows segmented HP / MP / Stamina bars (classic-JRPG `pixel` mode on Progress) + day/time + gold + w-exp. Menu bar collapses to a 3-col grid on mobile, 6-col on `sm+`.
- **Tabs in the menu bar** — 👤 โปรไฟล์ · 🎒 ของในย่าม · 🥋 วิชาฝีมือ (manages BOTH move skills and arts in one slot system) · 🌾 วิชาชีพ · 📋 ภารกิจ · 📜 บันทึก.
- **Toast notifications** at the top of the screen for every action result.
- **Loading overlay** flashes briefly during gather / craft / rest / practice for tactile feedback.
- **Persistent saves** via Zustand persist middleware (localStorage). Schema migration chain handles version bumps (currently world-store v14).
- **Game-over screen** on fatal battle loss; "เริ่มใหม่" wipes the world slice (character builds are independent).

## Project layout

```
app/                     Next.js app router
  page.tsx               World game (renders <WorldScreen />)
  layout.tsx             Loads Charm + Sarabun via next/font/google
  globals.css            Wuxia palette, paper texture, .pixel/.frame-pixel utils
  debug/page.tsx         Dev sandbox (free-form battle, character setup)

lib/
  game/                  Pure combat engine (no React, no I/O)
    data/                SKILLS, ARTS, EQUIPMENT, TIERS, sect list
    types.ts             Discriminated unions for all combat effects
    derive.ts            Stat derivation; skill stats scale by bpMultiplier(lv)
    battle.ts            ATB + damage formula; tracks skillUses + artUses
    effects.ts           Self / enemy / passive effect dispatchers
    skill-conflict.ts    > 60 % type-conflict modifier system
    leveling.ts          Per-skill bp / mg, art level cap + xpToNextArtLevel (2×)
    slots.ts             Slot encoding (skill id vs "art:<id>")
    ai.ts                Simple AI

  world/                 Pure world / story engine
    location-categories.ts  Inferred category tags + practice eligibility + bonus
    data/
      scenes.ts          Tutorial scenes
      world-map.ts       7 cities + 7 villages + 17 sects + ... = ~85 leaves
      location-routes.ts Hand-curated edge list with per-direction labels
      sects.ts           Canonical sect list + sort order
      opponents.ts       45 enemies in 5 tiers (35 + 10 hunt-only beasts)
      npcs.ts            NPC registry (talk / spar)
      items.ts           Items with category + price + use effect
      shops.ts           Per-location shop catalogues
      sect-halls.ts      Per-city tier 0–1 ยุทธจักร skill / art offerings
      artisans.ts        Per-location craft NPCs (forge/alchemy/tailoring/chef/jewelry/accessory)
      recipes.ts         Crafting recipes (with `basic` flag for shared staples)
      resources.ts       Gather + hunt nodes (hunt nodes use weak hunt_* beasts)
      random-events.ts   Fight / treasure / meet pool, hunt-boost when kill quest is active
      quests.ts          Quest definitions
    types.ts             Scene union, conditions, effects, traits, etc.
    effects.ts           SceneEffect dispatcher + collectActiveHuntTargets
    conditions.ts        Condition evaluator
    validate.ts          Save-rehydrate sanity pass
    battle-bridge.ts     World ↔ battle subscription glue
    stat-progression.ts  Per-stat xp helpers + LUK roll formula

store/
  character-store.ts     /debug A & B character builds (persisted, v2)
  battle-store.ts        Runtime battle state (NOT persisted) — tracks skillUses + artUses
  world-store.ts         World state (persisted, v14) — practiceSkill, levelUpArtFromWExp,
                         buyRecipe, hunt-target boost, location categories, learnedRecipeIds
  loading-store.ts       300 ms loading-overlay flash
  toast-store.ts         Top-of-screen toast stack

components/
  ui/                    shadcn primitives (Button, Card, Combobox, Modal, ...)
    wuxia/               Wuxia primitives — Panel (pixel border), WuxiaButton (bevel),
                         OrnamentDivider
  game/                  BattleArena, BattleLog, SkillSlots, EquipmentSlots, ...
  world/                 WorldScreen, LocationView, RouteView, DialogDisplay,
                         StatusBar, MenuBar, EncounterScreen, RestPanel,
                         GameOverScreen, ToastStack, LoadingOverlay,
                         popups/ (Profile, Inventory, MoveSkills, LifeSkills,
                                  QuestLog, ActionLog, NpcInteraction, Shop,
                                  SectHall, Artisan, Practice)
```

## Authoring tips

The cheapest content loop:

- **New skill** → append to `lib/game/data/skills.ts` (compact field shorthand: `sc` / `ti` / `w` / `mg` / `bp` / `p` / `f` / `dm` / `se` / `ee` / `types`).
- **New inner skill** → same in `lib/game/data/arts.ts` (`sc` / `ti` / `tp` / `types` / `stats` / `hL` / `mL` / `act` / `pas`).
- **New location** → add a `leaf("id", "name", "desc")` in the matching array in `world-map.ts`, then **at least one** entry in `location-routes.ts` so it's reachable. Console will warn if a leaf has no explicit route.
- **New shop / sect hall / NPC / opponent / quest / item / recipe** → append to its registry in `lib/world/data/`. Most have a `getX(id)` helper for lookups.
- **New artisan** → append to `SINGLE_PROFESSION_ARTISANS` in `artisans.ts`. To give a city's existing artisan a unique recipe, append a row to `CITY_SPECIALTIES` (one line: `{ city, prof, recipeId, price }`). Basic recipes (RecipeDef.basic === true) auto-fan-out to every matching artisan, so you only declare specialties.
- **New quest scene effect / condition** → variant in `lib/world/types.ts` + case in `effects.ts` / `conditions.ts`. TS exhaustiveness flags missed dispatchers.
- **Teach the player a new skill / recipe mid-game** → drop a `{ t: "learnSkill", skillId: "..." }` (or `learnArt`) in any quest / NPC dialog. Recipes are bought through the artisan popup; they can also be granted via store action `buyRecipe` if you wire a custom dialog effect.

## License & credits

Wuxia / 武林 source material — Jin Yong (金庸) and Gu Long (古龙) novels, plus the *9 Yin* / *JY Online* MMOs — informed many of the sect, skill, and inner-art names. The `demo.html` prototype that seeded the combat formula was hand-written by the author; the rebuild ports those numbers as faithfully as possible.

The repo is a single-author personal project; treat the code as work-in-progress. CLAUDE.md captures the architectural conventions if you want to contribute.
