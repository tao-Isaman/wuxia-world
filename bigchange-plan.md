# bigchange v0.1 — implementation plan

Date: 2026-05-10. Source spec: `bigchange.md`.

## Decisions on the 8 open questions

1. **NPC tick timing** — SYNC, inside `advanceTime` every 7 world days. Determinism + save.
2. **Rumor de-duplication** — Collapse when `(aboutNpcId, source, refersToEventRef.eventType)` already exists in pool created within last 7 days. Bump existing `weight` by +1 instead of pushing a duplicate.
3. **Dead NPC quest handling** — Active quests whose `giverNpcId` dies → auto-fail with toast `"ผู้ให้ภารกิจ {name} เสียชีวิต — ภารกิจหยุดลง"`. New `npcStatus(id, status)` Condition lets new quests/scenes gate on alive/dead. No automatic "successor" transfer in v1.
4. **Player echo trigger** — Hardcoded list of 5 action ids: `duel_win_named`, `sect_join`, `sect_leave_or_betray`, `quest_major_complete`, `sect_rank_up`. Major quest = quest with `isMajor: true` flag (new optional QuestDef field).
5. **Save migration** — v17 → v18 lazy fill: empty arrays for `rumorPool/Archive/SeenLog`, empty `npcExt` map (filled on first tick from authored roster defaults).
6. **Localization** — Thai-only. Templates use Thai phrases, no i18n abstraction.
7. **Rumor weight tuning** — Hardcoded in template (`weight: 1-10`); event-importance booster ×2 when target NPC `sectRank ≤ 3` OR event in {`death_combat`, `master_art`, `betray_sect`}.
8. **Cross-NPC causation** — Killer must be a real `NpcId` for chain events (killer power +5).

## Scope cuts for v1 (defer the rest)

- **20 named NPCs** (low end of 20-40 spec range) — picked from existing sect leaders + main quest givers.
- **30 lore rumors** (low end of 60-100) — distributed across 6 main regions.
- **1-2 templates per event** (low end of 2-3) — variety lands in v2.
- **NPC-NPC duel resolver, NPC theft, faction split** — already deferred per spec §1.3.

## Phasing

### Phase 0 — Foundation (main thread)
- Extend `lib/world/types.ts` with `NpcExtState, NpcGoal, NpcEvent, NpcEventLog, Rumor, RumorChannel, Region, LeadTarget`.
- Add to `WorldStateData`: `rumorPool, rumorArchive, rumorSeenLog, npcExt`.
- Add 3 new `SceneEffect` variants + 3 new `Condition` variants (stub dispatchers — return no-op / false).
- Bump store version to **v18** with migration filling defaults.
- Skeleton files: `lib/world/npc-tick.ts`, `lib/world/rumor-engine.ts`, `lib/world/data/regions.ts`, `lib/world/data/named-npcs.ts`, `lib/world/data/rumor-templates.ts`, `lib/world/data/lore-rumors.ts` (empty exports so agents fill them in parallel without race).

### Phase 1 — Parallel agents (4)
- **Agent A: NPC tick engine** — Implement `npc-tick.ts`: per-NPC tick (aging/death/power/goal/event roll), throttle ≤ 4 ticks per advanceTime call, named-roster bootstrap.
- **Agent B: Rumor engine** — Implement `rumor-engine.ts`: rumor generation per event type, distortion roll, region propagation (+1/14 days for echo, +1/7 for player), expiry + archive compression, soft 200 / hard 500 cap.
- **Agent C: Region taxonomy + channel mapping** — Author `regions.ts`: 6 regions (`heartland, north, south, west, east, jianghu_wild`); each location → 1 region; per-channel matrix (`inn → [inn, market, wilderness]`, etc.).
- **Agent D: Named NPC roster** — Pick 20 named NPCs from existing data; author each one's `NpcExtState` (power 0-100, age, status, currentLocation, homeLocation, sect, sectRank, 1-2 goals, 0-3 rivals/allies). Output to `named-npcs.ts`.

### Phase 2 — Parallel agents (3)
- **Agent E: Templates content** — Author `rumor-templates.ts`: 12 event types × 1-2 templates + 5 player-echo actions × 1-2 templates + 5 warning templates. Plus `lore-rumors.ts`: 30 hand-authored lore rumors across 6 regions, with 5 carrying `leadsTo`.
- **Agent F: UI integration** — Inn / market / sect-hall "ฟังข่าวลือ" choice + popup component, passive entry-rumor banner, NPC encyclopedia status integration, rumor blockquote styling.
- **Agent G: Wire dispatchers + tick hook** — Implement the 3 SceneEffect cases + 3 Condition cases (no longer stubs). Hook `tickAllNamedNpcs()` into `advanceTime` between day-loops. Add `firePlayerEcho` calls inside the 5 player-action store actions.

### Phase 3 — Verify (main thread)
- Typecheck + lint + audit.
- Smoke test: run `advanceTime(90)` from a test entry point; assert ≥ 3 NPC events fired + ≥ 5 rumors in pool.
- Update `CLAUDE.md` with the new Liveness Layer section.
- Save / load cycle.

## File layout

```
lib/world/
  types.ts                         (extend)
  npc-tick.ts                      NEW (Agent A)
  rumor-engine.ts                  NEW (Agent B)
  effects.ts                       (extend dispatchers — Agent G)
  conditions.ts                    (extend evaluators — Agent G)
  data/
    regions.ts                     NEW (Agent C)
    named-npcs.ts                  NEW (Agent D)
    rumor-templates.ts             NEW (Agent E)
    lore-rumors.ts                 NEW (Agent E)

store/world-store.ts               (extend — Phase 0 + Agent G)

components/world/
  popups/rumor-popup.tsx           NEW (Agent F)
  rumor-banner.tsx                 NEW (Agent F)
  popups/profile-popup.tsx         (extend NPC list — Agent F)
```
