// What a won fight pays by the kind of foe (pure; store/world/spoils.ts rolls
// the rest). See docs/design/foes-and-bosses.md § Spoils.
import type { OpponentDef, Rumor, WorldStateData } from "./types";
import { getBoss, type BossDef } from "./data/bosses";
import { regionOf } from "./data/regions";
import { getScene } from "./data/scenes";

/**
 * Experience (w-exp) for a win: people 40 + 20 × tier, beasts 80 + 60 × tier,
 * a legendary beast its own `wExp` (3,000–4,000). No opponent: the old flat 50.
 */
export function victoryWExp(opponent: Pick<OpponentDef, "id" | "ti" | "category" | "boss"> | null | undefined): number {
  if (!opponent) return 50;
  const boss = opponent.boss ? getBoss(opponent.id) : null;
  if (boss) return boss.wExp;
  const ti = opponent.ti ?? 0;
  return opponent.category === "beast" ? 80 + 60 * ti : 40 + 20 * ti;
}

/** Move / art use xp multiplier: beasts and bosses teach twice as much. */
export function moveXpMultiplier(opponent: Pick<OpponentDef, "category" | "boss"> | null | undefined): number {
  return opponent && (opponent.boss || opponent.category === "beast") ? 2 : 1;
}

/** Beasts carry no purse. */
export function dropsGold(opponent: Pick<OpponentDef, "category"> | null | undefined): boolean {
  return opponent?.category !== "beast";
}

/** Days the news of a fallen legendary beast lasts (big news). */
export const BOSS_RUMOR_DAYS = 40;

/**
 * A legendary beast fell to the hero: stamp the day (it is back after
 * `respawnDays`) and spread the news — a loud rumor from its lair's region
 * that reaches every region within ten days. Returns the boss, or null.
 */
export function bossSlain(state: WorldStateData, bossId: string): BossDef | null {
  const boss = getBoss(bossId);
  if (!boss) return null;
  state.bossDefeatedDay = { ...(state.bossDefeatedDay ?? {}), [boss.id]: state.day };
  const place = getScene(boss.lair);
  const where = place?.kind === "location" ? place.name : boss.lair;
  const rumor: Rumor = {
    id: `rumor_boss_${boss.id}_${state.day}`,
    text: `ข่าวสะพัดไปทั่วยุทธภพ — ${boss.name}แห่ง${where}ถูกปราบแล้ว! ว่ากันว่าผู้ลงมือเป็นจอมยุทธ์ผู้หนึ่งที่ขึ้นไปเพียงลำพัง`,
    source: "player_echo",
    createdDay: state.day,
    expiresDay: state.day + BOSS_RUMOR_DAYS,
    truth: "true",
    region: regionOf(boss.lair),
    channel: "inn",
    about: boss.lair,
    refersToEvent: null,
    leadsTo: null,
    prerequisites: [],
    weight: 12,
  };
  state.rumorPool = [...(state.rumorPool ?? []).filter((r) => r.id !== rumor.id), rumor];
  return boss;
}
