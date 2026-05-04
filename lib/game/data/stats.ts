import type { StatKey, StatBlock } from "../types";
import { STAT_KEYS } from "../types";

export const STAT_LABEL: Record<StatKey, string> = {
  STR: "กำลัง",
  AGI: "ความเร็ว",
  POW: "ภายใน",
  VIT: "ร่างกาย",
  DEX: "เฉียบคม",
  LUK: "โชค",
  DEF: "ป้องกัน",
  INT: "ฉลาด",
};

export const STAT_BUDGET = 200;

export const DEFAULT_STATS: StatBlock = {
  STR: 1,
  AGI: 1,
  POW: 1,
  VIT: 1,
  DEX: 1,
  LUK: 1,
  DEF: 1,
  INT: 1,
};

export { STAT_KEYS };
