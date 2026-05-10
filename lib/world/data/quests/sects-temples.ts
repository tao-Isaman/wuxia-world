import type { QuestDef } from "../../types";

// Side quests owned by content agent C — anchored to NPCs at sects,
// temples, palaces, and mansions. Pairs with
// lib/world/data/npcs/sects-temples.ts and
// lib/world/data/scenes-content/sects-temples.ts.
//
// This file is now a BARREL — per-sect quest definitions live in
// ./sects/<sectId>.ts. Adding a new sect = create the file + add an
// import + spread below. Splitting was done by
// scripts/split-sects-file.ts on 2026-05-10.
import { QUESTS_SHAOLIN } from "./sects/shaolin";
import { QUESTS_WUDANG } from "./sects/wudang";
import { QUESTS_EMEI } from "./sects/emei";
import { QUESTS_HUASHAN } from "./sects/huashan";
import { QUESTS_SONGSHAN } from "./sects/songshan";
import { QUESTS_TAISHAN } from "./sects/taishan";
import { QUESTS_HENGSHAN_SOUTH } from "./sects/hengshan_south";
import { QUESTS_HENGSHAN_NORTH } from "./sects/hengshan_north";
import { QUESTS_QUANZHEN } from "./sects/quanzhen";
import { QUESTS_GUMU } from "./sects/gumu";
import { QUESTS_BEGGARS } from "./sects/beggars";
import { QUESTS_MING } from "./sects/ming";
import { QUESTS_XIAOYAO } from "./sects/xiaoyao";
import { QUESTS_JINYIWEI } from "./sects/jinyiwei";
import { QUESTS_TANG } from "./sects/tang";
import { QUESTS_SUNMOON } from "./sects/sunmoon";
import { QUESTS__OTHER } from "./sects/_other";

// Barrel for the sect content split. Per-sect files live in
// ./sects/<sectId>.ts. Adding a new sect = create a new file +
// add the import + spread below.
export const QUESTS_SECTS_TEMPLES: readonly QuestDef[] = [
  ...QUESTS_SHAOLIN,
  ...QUESTS_WUDANG,
  ...QUESTS_EMEI,
  ...QUESTS_HUASHAN,
  ...QUESTS_SONGSHAN,
  ...QUESTS_TAISHAN,
  ...QUESTS_HENGSHAN_SOUTH,
  ...QUESTS_HENGSHAN_NORTH,
  ...QUESTS_QUANZHEN,
  ...QUESTS_GUMU,
  ...QUESTS_BEGGARS,
  ...QUESTS_MING,
  ...QUESTS_XIAOYAO,
  ...QUESTS_JINYIWEI,
  ...QUESTS_TANG,
  ...QUESTS_SUNMOON,
  ...QUESTS__OTHER,
];
