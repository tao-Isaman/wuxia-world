// NPC ambient dialogs + quest beats for sects, temples, palaces, and
// mansions. Owned by content agent C.
import type { Scene } from "../../types";
import { SCENES_SHAOLIN } from "./sects/shaolin";
import { SCENES_WUDANG } from "./sects/wudang";
import { SCENES_EMEI } from "./sects/emei";
import { SCENES_HUASHAN } from "./sects/huashan";
import { SCENES_SONGSHAN } from "./sects/songshan";
import { SCENES_TAISHAN } from "./sects/taishan";
import { SCENES_HENGSHAN_SOUTH } from "./sects/hengshan_south";
import { SCENES_HENGSHAN_NORTH } from "./sects/hengshan_north";
import { SCENES_QUANZHEN } from "./sects/quanzhen";
import { SCENES_GUMU } from "./sects/gumu";
import { SCENES_LINGJIU } from "./sects/lingjiu";
import { SCENES_BEGGARS } from "./sects/beggars";
import { SCENES_MING } from "./sects/ming";
import { SCENES_XIAOYAO } from "./sects/xiaoyao";
import { SCENES_XINGXIU } from "./sects/xingxiu";
import { SCENES_WUDU } from "./sects/wudu";
import { SCENES_XUEDAO } from "./sects/xuedao";
import { SCENES_TANG } from "./sects/tang";
import { SCENES_XUEYU } from "./sects/xueyu";
import { SCENES_SUNMOON } from "./sects/sunmoon";
import { SCENES__OTHER } from "./sects/_other";

// Barrel for the sect content split. Per-sect files live in
// ./sects/<sectId>.ts. Adding a new sect = create a new file +
// add the import + spread below.
export const SCENES_SECTS_TEMPLES: readonly Scene[] = [
  ...SCENES_SHAOLIN,
  ...SCENES_WUDANG,
  ...SCENES_EMEI,
  ...SCENES_HUASHAN,
  ...SCENES_SONGSHAN,
  ...SCENES_TAISHAN,
  ...SCENES_HENGSHAN_SOUTH,
  ...SCENES_HENGSHAN_NORTH,
  ...SCENES_QUANZHEN,
  ...SCENES_GUMU,
  ...SCENES_LINGJIU,
  ...SCENES_BEGGARS,
  ...SCENES_MING,
  ...SCENES_XIAOYAO,
  ...SCENES_XINGXIU,
  ...SCENES_WUDU,
  ...SCENES_XUEDAO,
  ...SCENES_TANG,
  ...SCENES_XUEYU,
  ...SCENES_SUNMOON,
  ...SCENES__OTHER,
];
