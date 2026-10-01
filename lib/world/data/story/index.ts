// Story content barrel: every sect file exports its lineage quests
// (LineageSpec[]) and story sagas (StoryArcSpec[]). Pure data — content files
// import types only, so this module never pulls a registry in.
//
// Add a sect file: export `LINEAGE` and `ARCS` from it, import it here and
// spread both. `bun run test:story` checks coverage and every reference.
import type { LineageSpec, StoryArcSpec, StoryOpponentSpec } from "../../story/types";
import * as wudang from "./wudang";
import * as wudang_more from "./wudang_more";
import * as shaolin from "./shaolin";
import * as shaolin_arts from "./shaolin_arts";
import * as emei from "./emei";
import * as emei_arts from "./emei_arts";
import * as huashan from "./huashan";
import * as songshan from "./songshan";
import * as taishan from "./taishan";
import * as hengshan_south from "./hengshan_south";
import * as hengshan_north from "./hengshan_north";
import * as quanzhen from "./quanzhen";
import * as gumu from "./gumu";
import * as beggars from "./beggars";
import * as beggars_arts from "./beggars_arts";
import * as sunmoon from "./sunmoon";
import * as xiaoyao from "./xiaoyao";
import * as outsiders from "./outsiders";
import * as jinyiwei from "./jinyiwei";
import * as jinyiwei_arts from "./jinyiwei_arts";
import * as tang from "./tang";
import * as tang_arts from "./tang_arts";

const SECT_FILES: readonly { LINEAGE: readonly LineageSpec[]; ARCS: readonly StoryArcSpec[] }[] = [
  wudang,
  wudang_more,
  shaolin,
  shaolin_arts,
  emei,
  emei_arts,
  huashan,
  songshan,
  taishan,
  hengshan_south,
  hengshan_north,
  quanzhen,
  gumu,
  beggars,
  beggars_arts,
  sunmoon,
  xiaoyao,
  outsiders,
  jinyiwei,
  jinyiwei_arts,
  tang,
  tang_arts,
];

export const LINEAGE_SPECS: readonly LineageSpec[] = SECT_FILES.flatMap((f) => f.LINEAGE);
export const STORY_ARC_SPECS: readonly StoryArcSpec[] = SECT_FILES.flatMap((f) => f.ARCS);
/**
 * Prologue trials: older sect "art quests" that used to hand out these T4
 * arts directly. They now open the saga instead — chapter 1 also needs the
 * trial done. reward id → trial quest id.
 */
export const SAGA_PROLOGUES: Readonly<Record<string, string>> = {
  tendon: "qst_shaolin_art_legendary",
  t4_em_bodhi: "qst_emei_art_bodhi",
  t4_huashan_purple: "qst_huashan_art_purplecloud",
  t4_bg_thousandcrowd: "qst_beggars_art_thousandcrowd",
  t4_jy_godslayer: "qst_jinyiwei_art_godslayer",
  t4_tang_tenkpoisons: "qst_tang_art_tenkpoisons",
  qiankun: "qst_sunmoon_art_qiankun",
};

export const STORY_OPPONENT_SPECS: readonly StoryOpponentSpec[] = STORY_ARC_SPECS.flatMap((a) => a.opponents ?? []);
