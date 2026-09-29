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

// These exports have uneven authored gutters, rather than equal 4×4 cells.
// Edges sit inside transparent gaps between whole poses (alpha threshold 32,
// matching atlas measurement). Keep all arms, shoes and raised hands intact.
export const CHARACTER_SHEET_LAYOUTS: Partial<Record<CharacterId, CharacterSheetLayout>> = {
  m1: { width: 1199, height: 1312, columns: [0, 306, 602, 918, 1199], rows: [0, 335, 657, 967, 1312] },
  m2: { width: 1199, height: 1312, columns: [0, 308, 600, 935, 1199], rows: [0, 343, 664, 970, 1312], regions: {
    // The fist of victory and the distant attack shoe share source row 969.
    10: [[600, 664, 88, 306], [688, 664, 247, 305]],
    14: [[600, 970, 88, 342], [688, 969, 247, 343]],
  } },
  m3: { width: 948, height: 1659, columns: [0, 239, 472, 716, 948], rows: [0, 428, 829, 1209, 1659],
    rowColumns: { 2: [0, 239, 472, 743, 948], 3: [0, 239, 472, 700, 948] } },
  m4: { width: 1199, height: 1312, columns: [0, 314, 593, 919, 1199], rows: [0, 331, 658, 962, 1312] },
  f1: { width: 1199, height: 1312, columns: [0, 312, 603, 927, 1199], rows: [0, 335, 658, 957, 1312] },
  f2: { width: 948, height: 1659, columns: [0, 250, 476, 711, 948], rows: [0, 439, 841, 1221, 1659],
    rowColumns: { 2: [0, 245, 461, 730, 948] }, regions: {
      // The punch reaches farther right than the next pose's trailing robe.
      // A step through the empty gutter keeps both complete at their own height.
      10: [[461, 841, 283, 159], [461, 1000, 269, 221]],
      11: [[744, 841, 204, 159], [730, 1000, 218, 221]],
    } },
  f3: { width: 1199, height: 1312, columns: [0, 320, 615, 920, 1199], rows: [0, 340, 657, 962, 1312] },
  f4: { width: 1199, height: 1312, columns: [0, 319, 605, 915, 1199], rows: [0, 332, 658, 971, 1312], regions: {
    // As with m2, the intact fingertip sits beside an earlier pose's shoe.
    10: [[605, 658, 109, 313], [714, 658, 201, 312]],
    14: [[605, 971, 109, 341], [714, 970, 201, 342]],
  } },
  elder: { width: 1199, height: 1312, columns: [0, 313, 611, 925, 1199], rows: [0, 334, 656, 958, 1312] },
  monk: { width: 1199, height: 1312, columns: [0, 316, 611, 939, 1199], rows: [0, 333, 655, 956, 1312] },
  merchant: { width: 1073, height: 1466, columns: [0, 272, 535, 826, 1073], rows: [0, 374, 731, 1067, 1466] },
  bandit: { width: 1199, height: 1312, columns: [0, 302, 615, 945, 1199], rows: [0, 331, 657, 960, 1312] },
  wang: { width: 1199, height: 1312, columns: [0, 324, 606, 933, 1199], rows: [0, 357, 667, 963, 1312] },
  feng: { width: 1199, height: 1312, columns: [0, 319, 605, 918, 1199], rows: [0, 340, 661, 964, 1312] },
  qing: { width: 1254, height: 1254, columns: [0, 314, 627, 941, 1254], rows: [0, 318, 631, 917, 1254] },
};
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
