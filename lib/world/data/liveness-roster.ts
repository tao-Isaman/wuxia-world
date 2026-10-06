// Liveness 2.0 — who the simulated people are beyond their numbers: the
// temper and sex of the original twenty (named-npcs.ts), the ten wanderers
// who travel the world on their own (npcs/wanderers.ts), and the name pools
// generated disciples, newcomers and heirs are drawn from.

import type { NpcExtState, NpcTemper, SectId } from "../types";

export interface RosterPerson {
  gender: "male" | "female";
  temper: NpcTemper;
}

const t = (righteous: number, ambition: number, wanderlust: number, loyalty: number): NpcTemper =>
  ({ righteous, ambition, wanderlust, loyalty });

/** The original twenty: masters and their seconds. Chiefs are loyal and rarely leave home. */
export const NAMED_TEMPERS: Readonly<Record<string, RosterPerson>> = {
  sect_shaolin_abbot_huiyuan: { gender: "male", temper: t(0.9, 0.2, 0.1, 1) },
  sect_shaolin_vice_abbot_luohan: { gender: "male", temper: t(0.7, 0.6, 0.2, 0.8) },
  sect_wudang_master_qingxu: { gender: "male", temper: t(0.9, 0.2, 0.2, 1) },
  sect_wudang_vice_master_xuancheng: { gender: "male", temper: t(0.6, 0.6, 0.3, 0.8) },
  sect_huashan_master_yiqing: { gender: "male", temper: t(0.5, 0.6, 0.3, 0.9) },
  sect_quanzhen_master_chongyang: { gender: "male", temper: t(0.8, 0.3, 0.2, 1) },
  sect_quanzhen_sword_elder_qiuchuji: { gender: "male", temper: t(0.6, 0.6, 0.5, 0.7) },
  sect_emei_abbess_jingchan: { gender: "female", temper: t(0.8, 0.3, 0.1, 1) },
  sect_emei_vice_abbess_huimiao: { gender: "female", temper: t(0.6, 0.6, 0.3, 0.8) },
  sect_gumu_mystery_woman: { gender: "female", temper: t(0.3, 0.2, 0.2, 1) },
  sect_beggars_chief_hongtian: { gender: "male", temper: t(0.8, 0.3, 0.7, 1) },
  sect_jinyiwei_leader_zhao: { gender: "male", temper: t(-0.2, 0.9, 0.3, 0.9) },
  sect_sunmoon_chief_dongfang: { gender: "male", temper: t(-0.5, 0.9, 0.2, 1) },
  sect_sunmoon_vice_renwoxing: { gender: "male", temper: t(-0.6, 0.95, 0.4, 0.25) },
  sect_tang_chief_tangmen: { gender: "male", temper: t(0, 0.5, 0.1, 1) },
  sect_xiaoyao_master_yunxiao: { gender: "male", temper: t(0.3, 0.3, 0.5, 1) },
  sect_songshan_master_zuolengchan: { gender: "male", temper: t(-0.1, 0.95, 0.3, 0.9) },
  sect_taishan_master_tianmen: { gender: "male", temper: t(0.6, 0.3, 0.1, 1) },
  sect_hengshan_south_master_modaxiansheng: { gender: "male", temper: t(0.6, 0.2, 0.5, 1) },
  sect_hengshan_north_abbess_dingyi: { gender: "female", temper: t(0.8, 0.3, 0.2, 1) },
};

/** The ten who travel: no sect seat ties them down. Authored NpcDefs in npcs/wanderers.ts. */
export const WANDERER_DEFAULTS: Readonly<Record<string, NpcExtState>> = {
  wander_li_changfeng: wanderer("city_changan", 62, 34, "male", t(0.6, 0.5, 0.9, 0.5), "m2", ["wander_hei_ying"]),
  wander_su_linger: wanderer("inn_yuelai", 46, 21, "female", t(0.7, 0.7, 0.5, 0.8), "f2"),
  wander_chen_dafu: wanderer("city_yangzhou", 12, 46, "male", t(0.2, 0.4, 1, 0.4), "m4"),
  wander_sun_yao: wanderer("city_jinling", 30, 38, "female", t(0.9, 0.2, 0.8, 0.8), "f3"),
  wander_yunhe: wanderer("temple_tianning", 71, 58, "male", t(0.5, 0.2, 0.7, 0.6), "m3"),
  wander_hei_ying: wanderer("cliff_heimu", 66, 31, "male", t(-0.8, 0.8, 0.7, 0.1), "m4", ["wander_li_changfeng"]),
  wander_wang_xiaohu: wanderer("village_noname", 16, 17, "male", t(0.5, 0.9, 0.4, 0.8), "m2"),
  wander_bai_yutang: wanderer("city_suzhou", 55, 28, "male", t(-0.2, 0.6, 0.9, 0.3), "m3"),
  wander_huo_tianlong: wanderer("cliff_motian", 84, 71, "male", t(0.3, 0.4, 0.6, 0.5), "m4", ["sect_songshan_master_zuolengchan"]),
  wander_liu_wenxin: wanderer("city_dali", 40, 26, "female", t(0.6, 0.6, 0.7, 0.6), "f4"),
};

function wanderer(home: string, power: number, age: number, gender: "male" | "female", temper: NpcTemper,
  body: string, rivals: string[] = []): NpcExtState {
  return {
    power, age, status: "alive", currentLocation: home, homeLocation: home, sect: null, sectRank: 0,
    goals: [],
    rivals, allies: [], lastTickDay: 1, eventHistory: [], gender, temper, body,
  };
}

/** Sects an NPC of each bent would knock on. Shaolin takes men only; Emei, north Hengshan and Gumu women only. */
export const UPRIGHT_SECTS: readonly SectId[] = ["shaolin", "wudang", "emei", "huashan", "quanzhen", "beggars",
  "songshan", "taishan", "hengshan_south", "hengshan_north", "gumu"];
export const CROOKED_SECTS: readonly SectId[] = ["sunmoon", "tang", "xiaoyao", "jinyiwei"];
export const MALE_ONLY_SECTS: ReadonlySet<SectId> = new Set(["shaolin"]);
export const FEMALE_ONLY_SECTS: ReadonlySet<SectId> = new Set(["emei", "hengshan_north", "gumu"]);
/** Monks and nuns do not marry. */
export const CELIBATE_SECTS: ReadonlySet<SectId> = new Set(["shaolin", "emei", "hengshan_north", "quanzhen", "wudang"]);

// ─── Names for generated people ────────────────────────────────────────
export const SURNAMES = ["หลี่", "หวัง", "จาง", "หลิว", "เฉิน", "หยาง", "จ้าว", "หวง", "โจว", "อู๋", "สวี", "ซุน",
  "หู", "จู", "เกา", "หลิน", "เหอ", "กัว", "หม่า", "หลัว", "เหลียง", "ซ่ง", "เจิ้ง", "เซี่ย", "หาน", "ถัง", "เฝิง",
  "ตง", "เซียว", "เฉา", "หยวน", "ไป๋", "ฉิน", "เหยียน", "ลู่", "เว่ย", "ซู", "เยี่ย", "ฟาง", "ตู้"];
export const MALE_GIVEN = ["เทียนหลง", "อวิ๋นเฟย", "จื่อเฉิง", "เฟิงอี้", "เหวินเจี๋ย", "ห่าวหราน", "ฉางชิง", "ซูเหอ",
  "หมิงหยวน", "จิ้งเทียน", "ชิงเฟิง", "อี้ฟาน", "หย่งเจิ้ง", "ไห่หลาน", "เสวียนจี", "ป๋อเหวิน", "ซื่อหาว", "เทียนอวี่",
  "จวินหลิน", "เซิงเหยา", "หลางเย่ว์", "ฉีซาน", "ผิงอัน", "เจิ้นหัว"];
export const FEMALE_GIVEN = ["หลิงเอ๋อ", "ซิ่วอิง", "เยว่หรู", "ชิงเหลียน", "อวี้เจิน", "ม่านหลี่", "เสี่ยวหลาน", "ฉิงอี",
  "เหมยเซียง", "ซูเหยียน", "อวิ๋นซาง", "จื่อเวย", "ลี่หัว", "ปิงซิน", "เฟยเหยียน", "หรูเซวี่ย", "ไฉ่เตี๋ย", "อิงเยว่"];
/** Buddhist names for Shaolin monks and Emei / north Hengshan nuns. */
export const DHARMA_NAMES = ["ฮุ่ยหมิง", "จิ้งคง", "อู้เจิน", "เสวียนจิ้ง", "หยวนเจวี๋ย", "ฮุ่ยอัน", "ไท่เหอ", "ชิงซิน",
  "ฉือหาง", "เจวี๋ยหยวน", "หมิงจิ้ง", "คงเหวิน"];
/** Costume sheets with four-way walks (m1 / f1 are the heroes' own). */
export const MALE_BODIES = ["m2", "m3", "m4"];
export const FEMALE_BODIES = ["f2", "f3", "f4"];

export const POWER_TIER_LABEL = ["ไร้ฝีมือ", "ฝีมือพอตัว", "ชำนาญ", "ยอดฝีมือ", "ปรมาจารย์"] as const;
/** A person's standing by power (0–100), matching opponent tiers 0–4. */
export function powerTier(power: number): 0 | 1 | 2 | 3 | 4 {
  return power >= 80 ? 4 : power >= 60 ? 3 : power >= 40 ? 2 : power >= 20 ? 1 : 0;
}

/** How a liveness rank reads (10 = the seat, 9 = second, 7–8 elders). */
export function rankTitle(rank: number, sectName: string | null): string {
  if (!sectName) return "จอมยุทธ์อิสระ";
  // "สำนักสกุลถัง" reads "เจ้าสำนักสกุลถัง", not "เจ้าสำนักสำนักสกุลถัง".
  if (sectName.startsWith("สำนัก")) sectName = sectName.slice("สำนัก".length);
  if (rank >= 10) return `เจ้าสำนัก${sectName}`;
  if (rank >= 9) return `รองเจ้าสำนัก${sectName}`;
  if (rank >= 7) return `ผู้อาวุโส${sectName}`;
  if (rank >= 4) return `ศิษย์พี่${sectName}`;
  return `ศิษย์${sectName}`;
}
