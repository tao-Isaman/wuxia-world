/** Serializable artwork metadata; safe to import in React and pure tests. */
export const PLAYER_CHARACTER_IDS = ["m1", "m2", "m3", "m4", "f1", "f2", "f3", "f4"] as const;
export const CHARACTER_IDS = [...PLAYER_CHARACTER_IDS, "elder", "monk", "merchant", "bandit", "feng", "wang", "qing"] as const;
export type CharacterId = typeof CHARACTER_IDS[number];
export type CharacterMotion = "idle" | "walk" | "walkNorth" | "walkSouth" | "attack" | "hurt" | "guard" | "victory" | "defeat";
export const CHARACTER_GRID = 4;
export const CHARACTER_FRAME_SIZE = 128;
export const CHARACTER_FEET_Y = 120;
export interface CharacterSheetLayout {
  width: number;
  height: number;
  columns: readonly [number, number, number, number, number];
  rows: readonly number[];
  rowColumns?: Readonly<Record<number, CharacterSheetLayout["columns"]>>;
  /** Rectangular pieces of one intact pose, in original source coordinates. */
  regions?: Readonly<Record<number, readonly (readonly [x: number, y: number, width: number, height: number])[]>>;
}

// The twelve "readability v2" sheets (heroes m1–m4/f1–f4 and the elder, monk,
// merchant and bandit archetypes) are re-packed onto exact equal 4×4 cells by
// scripts/repack-character-sheet.ts and need no layout. These remaining exports
// have uneven authored gutters. Edges sit inside transparent gaps between whole
// poses (alpha threshold 32, matching atlas measurement).
export const CHARACTER_SHEET_LAYOUTS: Partial<Record<CharacterId, CharacterSheetLayout>> = {
  wang: { width: 1199, height: 1312, columns: [0, 324, 606, 933, 1199], rows: [0, 357, 667, 963, 1312] },
  feng: { width: 1199, height: 1312, columns: [0, 319, 605, 918, 1199], rows: [0, 340, 661, 964, 1312] },
  qing: { width: 1254, height: 1254, columns: [0, 314, 627, 941, 1254], rows: [0, 318, 631, 917, 1254] },
};
// m4/f2/f3/f4 still walk north/south on their v1 supplements (no v2 exists yet);
// the loader calibrates them to the v2 standing height.
export const CHARACTER_DIRECTION_LAYOUTS: Partial<Record<CharacterId, CharacterSheetLayout>> = {
  m4: { width: 1536, height: 1024, columns: [0, 384, 768, 1152, 1536], rows: [0, 490, 1024] },
};
export const CHARACTER_CLIPS: Record<CharacterMotion, { frames: readonly number[]; fps: number; repeat: number }> = {
  idle: { frames: [0, 1, 2, 3], fps: 4, repeat: -1 },
  walk: { frames: [4, 5, 6, 7], fps: 8, repeat: -1 },
  walkNorth: { frames: [16, 17, 18, 19], fps: 8, repeat: -1 },
  walkSouth: { frames: [20, 21, 22, 23], fps: 8, repeat: -1 },
  attack: { frames: [8, 9, 10, 11], fps: 10, repeat: 0 },
  hurt: { frames: [12], fps: 6, repeat: 0 },
  guard: { frames: [13], fps: 4, repeat: -1 },
  victory: { frames: [14], fps: 4, repeat: -1 },
  defeat: { frames: [15], fps: 4, repeat: -1 },
};
export function characterId(value: string): CharacterId {
  return CHARACTER_IDS.includes(value as CharacterId) ? value as CharacterId : "m1";
}
export function characterSheet(id: string): string { return `/art/characters/${characterId(id)}.png`; }
export function hasDirectionalSheet(id: CharacterId): boolean { return (PLAYER_CHARACTER_IDS as readonly string[]).includes(id); }

/** NPCs share costume archetypes; authored portraits and dialogue art stay unique. */
export function npcCharacterId(id: string): CharacterId {
  id = id.replace(/^npc-/, "");
  // Match the opening NPCs' authored portraits: young ivory/jade healer,
  // bearded dark-robed magistrate. Do not cast Lin as the elderly archetype.
  if (id === "city_capital_physician_lin") return "m3";
  if (id === "city_capital_magistrate_wu") return "m4";
  if (id === "training_capital_apprentice") return "m2";
  if (id === "spy_capital_feng" || id === "spar_spy_feng") return "feng";
  if (id === "merchant_wang") return "wang";
  if (id === "city_capital_clerk_qing") return "qing";
  if (id === "evil_capital_blackmarket_zhou") return "bandit";
  if (/sect_songshan_vice/.test(id)) return "m4";
  if (/sect_songshan_disciple2/.test(id)) return "m2";
  if (/sect_songshan_disciple/.test(id)) return "m3";
  if (/emei|gumu|hengshan_north|lingjiu|woman|lady|nun|weaver|herbalist_mei|spy_dali_mei|liuying|server_xiu/.test(id)) return /gumu|nun/.test(id) ? "f3" : "f1";
  if (/lanfenghuang|yilin|xiaolan|miao_aman|tangxiu/.test(id)) return "f2";
  if (/shaolin|monk|abbot/.test(id)) return "monk";
  if (/thug|bandit|thief|robber|assassin/.test(id)) return "bandit";
  if (/elder|master|physician|doctor|abbess/.test(id)) return "elder";
  if (/magistrate|official/.test(id)) return "m3";
  if (/bartender|innkeeper/.test(id)) return "m4";
  if (/merchant|magistrate|official|keeper|bartender|chef/.test(id)) return "merchant";
  if (/brawler|beggar/.test(id)) return "m2";
  if (/scholar|taishan|quanzhen/.test(id)) return "m3";
  if (/hunter|guard|soldier|assassin|jinyiwei|tang|travell|fisherman|blacksmith/.test(id)) return "m4";
  return /sect_|swordsman|disciple|spar_/.test(id) ? "m1" : "merchant";
}
