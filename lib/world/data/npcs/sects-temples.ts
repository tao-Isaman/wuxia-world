// NPCs anchored at sects, temples, palaces, mansions:
//   17 sects (sect_shaolin … sect_wudu) + sect_xueyu
//   5 temples/palaces + 4 mansions + palace_royal
//
// Owned by content agent C. Dialog scenes live in
// lib/world/data/scenes-content/sects-temples.ts; quests in
// lib/world/data/quests/sects-temples.ts.
import type { NpcDef } from "../../types";
import { NPCS_SHAOLIN } from "./sects/shaolin";
import { NPCS_WUDANG } from "./sects/wudang";
import { NPCS_EMEI } from "./sects/emei";
import { NPCS_HUASHAN } from "./sects/huashan";
import { NPCS_SONGSHAN } from "./sects/songshan";
import { NPCS_TAISHAN } from "./sects/taishan";
import { NPCS_HENGSHAN } from "./sects/hengshan";
import { NPCS_QUANZHEN } from "./sects/quanzhen";
import { NPCS_GUMU } from "./sects/gumu";
import { NPCS_LINGJIU } from "./sects/lingjiu";
import { NPCS_BEGGARS } from "./sects/beggars";
import { NPCS_MING } from "./sects/ming";
import { NPCS_XIAOYAO } from "./sects/xiaoyao";
import { NPCS_XINGXIU } from "./sects/xingxiu";
import { NPCS_WUDU } from "./sects/wudu";
import { NPCS_XUEDAO } from "./sects/xuedao";
import { NPCS_JINYIWEI } from "./sects/jinyiwei";
import { NPCS_TANG } from "./sects/tang";
import { NPCS_XUEYU } from "./sects/xueyu";
import { NPCS__OTHER } from "./sects/_other";

// Barrel for the sect content split. Per-sect files live in
// ./sects/<sectId>.ts. Adding a new sect = create a new file +
// add the import + spread below.
export const NPCS_SECTS_TEMPLES: readonly NpcDef[] = [
  ...NPCS_SHAOLIN,
  ...NPCS_WUDANG,
  ...NPCS_EMEI,
  ...NPCS_HUASHAN,
  ...NPCS_SONGSHAN,
  ...NPCS_TAISHAN,
  ...NPCS_HENGSHAN,
  ...NPCS_QUANZHEN,
  ...NPCS_GUMU,
  ...NPCS_LINGJIU,
  ...NPCS_BEGGARS,
  ...NPCS_MING,
  ...NPCS_XIAOYAO,
  ...NPCS_XINGXIU,
  ...NPCS_WUDU,
  ...NPCS_XUEDAO,
  ...NPCS_JINYIWEI,
  ...NPCS_TANG,
  ...NPCS_XUEYU,
  ...NPCS__OTHER,
];
