// Portraits for generated people (Liveness 2.0's disciples, heirs and
// newcomers, `npcExt[id].dynamic`). Nobody painted them, so each borrows a
// painted bust from public/npcs/ that fits: their school first, then their sex
// and their age band. The pick is a hash of their id, so a person keeps the same
// face while they stay in one age band, and gets an older one as they age.
//
// The pools below were sorted by eye from the portraits (sex, apparent age).
// Sect pools use the school's own minor members (disciples, guards, elders);
// the sectless pool uses travellers, villagers and guests. Key characters
// (the thirty simulated people, the main story's people) are left out.
import type { SectId } from "../types";

export type AgeBand = "young" | "adult" | "old";
type Sex = "male" | "female";
type Entry = readonly [portraitId: string, sex: Sex, band: AgeBand];

/** Under 30 young, 30–54 adult, 55 and older old. */
export function ageBand(age: number): AgeBand {
  return age < 30 ? "young" : age < 55 ? "adult" : "old";
}

const m = (id: string, band: AgeBand): Entry => [id, "male", band];
const f = (id: string, band: AgeBand): Entry => [id, "female", band];

export const SECT_PORTRAITS: Readonly<Record<SectId, readonly Entry[]>> = {
  beggars: [
    m("sect_beggars_disciple_dawei", "young"), m("sect_beggars_disciple_xiaohu", "young"), m("sect_beggars_junior_xiaomao", "young"),
    m("sect_beggars_head_disciple_renhua", "adult"), m("sect_beggars_vice_chief_lifang", "adult"),
    m("sect_beggars_brawler_jiu", "old"), m("sect_beggars_fist_elder_wudao", "old"), m("sect_beggars_intel_elder_yunsi", "old"), m("sect_beggars_staff_elder_qicheng", "old"),
  ],
  emei: [
    f("sect_emei_disciple_xiaoyu", "young"), f("sect_emei_gatekeeper_lingxin", "young"), f("sect_emei_junior_disciple_yujie", "young"),
    f("sect_emei_nun_qingyu", "young"), f("sect_emei_head_disciple_zhihui", "young"),
    f("sect_emei_sword_elder_qingxin", "adult"),
    f("sect_emei_healer_elder_yuxin", "old"), f("sect_emei_palm_elder_huiyu", "old"),
  ],
  gumu: [f("sect_gumu_disciple_lengyue", "young")],
  hengshan_north: [
    f("sect_hengshan_north_nun2_yilin", "young"), f("sect_hengshan_north_nun_jingxin", "young"),
    f("sect_hengshan_north_vice_yihe", "adult"),
    f("sect_hengshan_north_elder_yiqing", "old"),
  ],
  hengshan_south: [
    m("sect_hengshan_south_disciple2_qingfeng", "young"), m("sect_hengshan_south_disciple_yuepan", "young"),
    m("sect_hengshan_south_vice_liuzhengfeng", "adult"),
    m("sect_hengshan_south_elder_luge", "old"),
  ],
  huashan: [
    m("sect_huashan_disciple_jianyi", "young"), m("sect_huashan_disciple_xiaoyun", "young"), m("sect_huashan_head_disciple_zhongming", "young"),
    m("sect_huashan_vice_master_zifeng", "adult"),
    m("sect_huashan_sword_elder_qingsong", "old"),
  ],
  jinyiwei: [m("sect_jinyiwei_soldier_lu", "adult"), m("sect_jinyiwei_soldier_qin", "adult")],
  quanzhen: [
    m("sect_quanzhen_disciple_chongxu", "young"), m("sect_quanzhen_disciple_yangzi", "young"),
    m("sect_quanzhen_vice_master_mayu", "adult"),
    m("sect_quanzhen_inner_elder_yaolan", "old"),
  ],
  shaolin: [
    m("sect_shaolin_disciple_xuanji", "young"),
    m("sect_shaolin_head_disciple_yuanquan", "adult"), m("sect_shaolin_dharma_guardian_huimiao", "adult"),
    m("sect_shaolin_elder_faming", "old"), m("sect_shaolin_staff_master_juti", "old"), m("sect_shaolin_zen_master_xianren", "old"),
  ],
  songshan: [
    m("sect_songshan_disciple2_yangzhong", "young"), m("sect_songshan_disciple_lifeng", "young"),
    m("sect_songshan_vice_lubai", "adult"),
    m("sect_songshan_elder_dingmian", "old"),
  ],
  sunmoon: [
    m("sect_sunmoon_disciple_lanfenghuang", "young"), m("sect_sunmoon_head_disciple_yilin", "young"), f("sect_sunmoon_junior_xiaoyu", "young"),
    m("sect_ming_envoy_huozhi", "adult"),
    m("sect_sunmoon_balance_elder_qudongfeng", "old"), m("sect_sunmoon_sun_elder_zuolengchan", "old"), m("sect_ming_elder_zhuying", "old"),
  ],
  taishan: [
    m("sect_taishan_disciple2_jingyang", "young"),
    m("sect_taishan_disciple_kunwu", "adult"), m("sect_taishan_vice_yuyangzi", "adult"),
    m("sect_taishan_elder_chiyangzi", "old"),
  ],
  tang: [
    m("sect_tang_disciple_tangtao", "young"), m("sect_tang_head_disciple_tanglin", "young"), m("sect_tang_junior_tangxiu", "young"),
    m("sect_tang_vice_tangshanhu", "adult"), m("sect_tang_chase_elder_tangrong", "adult"),
    m("sect_tang_blade_elder_tangshibi", "old"), m("sect_tang_venom_elder_tangzhongtian", "old"),
  ],
  wudang: [
    m("sect_wudang_disciple_qingfeng", "young"), m("sect_wudang_disciple_qingxin", "young"), m("sect_wudang_disciple_yujian", "young"),
    m("sect_wudang_head_disciple_zhirong", "adult"),
    m("sect_wudang_inner_elder_baochun", "old"), m("sect_wudang_sword_elder_lingyu", "old"),
  ],
  xiaoyao: [
    m("sect_xiaoyao_disciple_jiumozhi", "young"), m("sect_xiaoyao_head_disciple_aliao", "young"), f("sect_xiaoyao_junior_xiaolan", "young"),
    m("sect_xiaoyao_vice_tianshan", "adult"),
    m("sect_xiaoyao_blade_elder_xiaorang", "old"), m("sect_xiaoyao_palm_elder_libai", "old"), m("sect_xiaoyao_sword_elder_wuyazi", "old"),
  ],
};

/** Travellers, villagers and guests: the faces of the sectless (and of any school short of one). */
export const SECTLESS_PORTRAITS: readonly Entry[] = [
  m("home_chengkun_disciple_chen", "young"), m("home_tianboguang_blade_tian", "young"), m("vil_meihua_musician_chen", "young"),
  m("villa_fuwei_young_lin", "young"), m("village_huashan_dreamer_yang", "young"), m("wld_hong_adventurer_luo", "young"),
  m("sect_xingxiu_disciple_dushou", "young"), m("sect_xuedao_blade_xuelang", "young"),
  m("home_miaoren_master_miao", "adult"), m("vil_meihua_hunter_bao", "adult"), m("villa_fuwei_escort_shi", "adult"),
  m("village_taishan_pilgrim_chen", "adult"), m("wld_bingcan_scholar_wei", "adult"), m("home_xuemuhua_doctor_xue", "adult"),
  m("sect_xueyu_master_chiying", "adult"), m("vil_wuxia_fisherman_deng", "adult"),
  m("home_hufei_guest_jiu", "old"), m("home_tianboguang_soldier_chen", "old"), m("vil_hengshan_elder_wu", "old"),
  m("village_huashan_teacher_ling", "old"), m("wld_desert_collector_mo", "old"), m("wld_jueqing_elder_lin", "old"),
  m("wld_kunlun_exile_qiu", "old"), m("home_xuemuhua_guest_kang", "old"),
  f("city_dali_herbalist_bai", "young"), f("city_suzhou_weaver_mei", "young"), f("home_chengying_cousin_lu", "young"),
  f("home_hufei_guest_yuan", "young"), f("vil_qigu_herbalist_mei", "young"), f("wld_jinshe_beasttamer_xu", "young"),
  f("sect_lingjiu_lady_zixia", "young"),
  f("inn_youjian_keeper_mei", "adult"), f("sect_wudu_miao_aman", "adult"),
  f("village_noname_whip_qiao", "old"), f("village_taishan_granny_die", "old"),
];

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * The portrait id a generated person borrows: their school's pool, else the
 * sectless one, narrowed to their sex and age band (a band with no face falls
 * back to any age of their sex).
 */
export function generatedPortraitId(npcId: string, who: { sect: SectId | null; gender?: Sex; age: number }): string {
  const sex: Sex = who.gender ?? "male";
  const band = ageBand(who.age);
  const pools = [who.sect ? SECT_PORTRAITS[who.sect] ?? [] : [], SECTLESS_PORTRAITS];
  for (const strict of [true, false]) {
    for (const pool of pools) {
      const fit = pool.filter(([, s, b]) => s === sex && (!strict || b === band));
      if (fit.length) return fit[hash(npcId) % fit.length]![0];
    }
  }
  return SECTLESS_PORTRAITS[hash(npcId) % SECTLESS_PORTRAITS.length]![0];
}
