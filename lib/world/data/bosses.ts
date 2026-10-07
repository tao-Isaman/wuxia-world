// Legendary beasts (บอส): six great animals, each waiting in its own lair.
// Their opponents live in data/opponents.ts (ti 5, beast, `boss: true`,
// `look.anim`, a pack of minions); this table says where each one waits, how
// long it stays gone after it falls, what it pays and what the inns say about
// it. Pure data + helpers: the store draws alive bosses on their lair's map
// (components/world/roaming-foes.ts), a win stamps `bossDefeatedDay`
// (store/world/actions/battle.ts) and the beast is back after `respawnDays`.
// See docs/design/foes-and-bosses.md.

import type { WorldStateData } from "../types";

export interface BossDef {
  /** = its opponent id. */
  id: string;
  name: string;
  /** Location id of its lair (a wild place with a painted map). */
  lair: string;
  /** Map % where it waits: a reachable free spot on the lair's map (scripts/test-foes.ts). */
  spot: { x: number; y: number };
  /** Days it stays gone after it falls. */
  respawnDays: number;
  /** Experience (w-exp) a win pays. */
  wExp: number;
  /** The trophy every win drops (`trophy_<boss>`, items.ts). */
  trophyItemId: string;
  /** Top gear it may drop (equipment ids, into the gear bag) and the chance of one piece. */
  gear: readonly string[];
  gearChance: number;
  /** What the inns and the wilds say about it — where it lives (lore rumor). */
  lore: string;
}

export const BOSS_RESPAWN_DAYS = 90;

export const BOSSES: readonly BossDef[] = [
  { id: "boss_golden_serpent", name: "งูยักษ์เกล็ดทองคำ", lair: "cave_jinshe", spot: { x: 82, y: 32 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 3000, trophyItemId: "trophy_golden_serpent",
    gear: ["W4", "A4"], gearChance: 0.15,
    lore: "คนเก็บสมุนไพรเล่าว่าในซอกลึกของถ้ำงูทอง มีงูยักษ์เกล็ดทองคำตัวยาวกว่าเรือสามลำนอนขดเฝ้าอยู่ งูเห่ากับงูเหลือมทั้งถ้ำเป็นบริวารของมัน" },
  { id: "boss_blood_tiger", name: "พยัคฆ์โลหิตลายคราม", lair: "valley_hudie", spot: { x: 84, y: 26 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 3400, trophyItemId: "trophy_blood_tiger",
    gear: ["W5", "B4"], gearChance: 0.15,
    lore: "พรานป่าทางใต้ไม่กล้าเข้าหุบเขาผีเสื้อเกินครึ่งทาง เขาว่ามีพยัคฆ์ลายครามขนแดงดั่งเลือดตัวโตเท่าวัว คุมเสือภูเขาทั้งหุบเหมือนแม่ทัพ" },
  { id: "boss_sword_eagle", name: "อินทรียักษ์จ้าวแห่งกระบี่", lair: "cliff_motian", spot: { x: 54, y: 24 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 3600, trophyItemId: "trophy_sword_eagle",
    gear: ["W5", "H5"], gearChance: 0.15,
    lore: "บนยอดเขามรณะมีอินทรียักษ์ปีกกว้างสามวา ขนปีกแข็งคมดั่งใบกระบี่ จอมยุทธ์ที่ขึ้นไปลองฝีมือกับมันกลับลงมาพร้อมเสื้อขาดเป็นริ้ว ๆ ทุกคน" },
  { id: "boss_sun_turtle", name: "เต่ายักษ์แบกตะวัน", lair: "isle_wuming", spot: { x: 84, y: 32 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 3200, trophyItemId: "trophy_sun_turtle",
    gear: ["A5", "H4"], gearChance: 0.15,
    lore: "ชาวประมงทะเลตะวันออกเล่าว่าเกาะไร้ชื่อขยับได้ เพราะครึ่งหนึ่งของมันคือกระดองเต่ายักษ์ที่ร้อนระอุดั่งแบกดวงตะวันไว้ ใครเข้าใกล้ผิวหนังพอง" },
  { id: "boss_blade_crab", name: "ปูวิเศษจ้าวแห่งดาบ", lair: "pool_heilong", spot: { x: 66, y: 24 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 3300, trophyItemId: "trophy_blade_crab",
    gear: ["W4", "A5"], gearChance: 0.15,
    lore: "ที่สระมังกรดำทางตะวันตก มีปูยักษ์กระดองแข็งกว่าเหล็ก ก้ามคมดั่งดาบ กระบี่ที่ฟันใส่กระดองมันสะท้อนกลับมาหาเจ้าของ ชาวบ้านจึงเรียกมันว่าจ้าวแห่งดาบ" },
  { id: "boss_flame_bull", name: "กระทิงยักษ์เขาเพลิง", lair: "peak_guangming", spot: { x: 70, y: 32 },
    respawnDays: BOSS_RESPAWN_DAYS, wExp: 4000, trophyItemId: "trophy_flame_bull",
    gear: ["W5", "B5"], gearChance: 0.15,
    lore: "คนเลี้ยงสัตว์ใต้ยอดแสงสว่างเห็นกระทิงยักษ์เขาแดงดั่งเหล็กเผาไฟ ตะกุยดินทีไรหญ้าไหม้เป็นวง ฝูงหมูป่าคลั่งวิ่งตามมันไปทั่วยอดเขา" },
];

export const BOSSES_BY_ID: ReadonlyMap<string, BossDef> = new Map(BOSSES.map((b) => [b.id, b]));
export function getBoss(id: string | null | undefined): BossDef | null {
  return (id && BOSSES_BY_ID.get(id)) || null;
}

type BossState = Pick<WorldStateData, "bossDefeatedDay" | "day">;

/** Alive = never beaten, or beaten at least `respawnDays` ago. */
export function bossAlive(state: BossState, bossId: string): boolean {
  const boss = getBoss(bossId);
  if (!boss) return false;
  const fell = state.bossDefeatedDay?.[bossId];
  return typeof fell !== "number" || state.day - fell >= boss.respawnDays;
}

/** Alive bosses waiting in this lair. */
export function bossesAt(state: BossState, locationId: string): BossDef[] {
  return BOSSES.filter((b) => b.lair === locationId && bossAlive(state, b.id));
}
