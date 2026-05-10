// Liveness Layer §2.1 + §5.1 — authored named-NPC roster.
// Filled by Phase 1 Agent D. Each entry seeds an NpcExtState onto
// worldState.npcExt the first time the player triggers a tick.
// Generic NPCs (most shopkeepers, most disciples) are NOT in this list
// and remain implicitly "alive" with no simulation.
//
// Roster (20 entries — 15 sect chiefs + 5 prominent vice/elder NPCs):
//   Chiefs (one per joinable sect):
//     1. sect_shaolin_abbot_huiyuan       (shaolin)        rank 10
//     2. sect_wudang_master_qingxu        (wudang)         rank 10
//     3. sect_huashan_master_yiqing       (huashan)        rank 10
//     4. sect_quanzhen_master_chongyang   (quanzhen)       rank 10
//     5. sect_emei_abbess_jingchan        (emei)           rank 10
//     6. sect_gumu_mystery_woman          (gumu)           rank 10
//     7. sect_beggars_chief_hongtian      (beggars)        rank 10
//     8. sect_jinyiwei_leader_zhao        (jinyiwei)       rank 10
//     9. sect_sunmoon_chief_dongfang      (sunmoon)        rank 10
//    10. sect_tang_chief_tangmen          (tang)           rank 10
//    11. sect_xiaoyao_master_yunxiao      (xiaoyao)        rank 10
//    12. sect_songshan_master_zuolengchan (songshan)       rank 10
//    13. sect_taishan_master_tianmen      (taishan)        rank 10
//    14. sect_hengshan_south_master_modaxiansheng (hengshan_south) rank 10
//    15. sect_hengshan_north_abbess_dingyi (hengshan_north) rank 10
//   Prominent vice / elder picks:
//    16. sect_shaolin_vice_abbot_luohan       (shaolin)   rank 9
//    17. sect_wudang_vice_master_xuancheng    (wudang)    rank 9
//    18. sect_quanzhen_sword_elder_qiuchuji   (quanzhen)  rank 7
//    19. sect_emei_vice_abbess_huimiao        (emei)      rank 9
//    20. sect_sunmoon_vice_renwoxing          (sunmoon)   rank 9

import type { NpcExtState } from "../types";

// NpcDef.id → authored ext defaults. The tick engine clones this on
// first read so the runtime state is mutable independently.
export const NAMED_NPC_DEFAULTS: Record<string, NpcExtState> = {
  // ─── Shaolin ─────────────────────────────────────────────────────────
  // Abbot Huiyuan — orthodox patriarch of the southern Buddhist line.
  // Lifelong rivalry with the Sun-Moon sect (heretic order); brotherhood
  // pact with Wudang Master Qingxu. Still chasing the ultimate diamond
  // breath despite his age — the goal that defines his late years.
  sect_shaolin_abbot_huiyuan: {
    power: 95,
    age: 76,
    status: "alive",
    currentLocation: "sect_shaolin",
    homeLocation: "sect_shaolin",
    sect: "shaolin",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "diamond", progress: 35, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_shaolin", progress: 10, threshold: 100 },
    ],
    rivals: ["sect_sunmoon_chief_dongfang", "sect_jinyiwei_leader_zhao"],
    allies: ["sect_wudang_master_qingxu", "sect_emei_abbess_jingchan"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Vice Abbot Luohan — Huiyuan's right hand for two decades. Climbing
  // toward succession (rank 10) but knows it's only earned through merit.
  sect_shaolin_vice_abbot_luohan: {
    power: 78,
    age: 58,
    status: "alive",
    currentLocation: "sect_shaolin",
    homeLocation: "sect_shaolin",
    sect: "shaolin",
    sectRank: 9,
    goals: [
      { kind: "climb_sect", targetRank: 10, progress: 20, threshold: 100 },
      { kind: "master_art", artId: "tendon", progress: 50, threshold: 100 },
    ],
    rivals: ["sect_sunmoon_vice_renwoxing"],
    allies: ["sect_shaolin_abbot_huiyuan"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Wudang ──────────────────────────────────────────────────────────
  // Master Qingxu — lifelong friend of Abbot Huiyuan; Daoist counterpart
  // to the Buddhist orthodoxy. Still polishing the ultimate taiji breath.
  sect_wudang_master_qingxu: {
    power: 94,
    age: 72,
    status: "alive",
    currentLocation: "sect_wudang",
    homeLocation: "sect_wudang",
    sect: "wudang",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "taiji", progress: 60, threshold: 100 },
    ],
    rivals: ["sect_tang_chief_tangmen", "sect_sunmoon_chief_dongfang"],
    allies: ["sect_shaolin_abbot_huiyuan", "sect_quanzhen_master_chongyang"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Vice Master Xuancheng — patient sword-elder. Knows he'll inherit the
  // sect when Qingxu retires, but quietly trains the zixia breath in case
  // the day comes early.
  sect_wudang_vice_master_xuancheng: {
    power: 75,
    age: 54,
    status: "alive",
    currentLocation: "sect_wudang",
    homeLocation: "sect_wudang",
    sect: "wudang",
    sectRank: 9,
    goals: [
      { kind: "climb_sect", targetRank: 10, progress: 30, threshold: 100 },
      { kind: "master_art", artId: "zixia", progress: 40, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_wudang_master_qingxu"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Huashan ─────────────────────────────────────────────────────────
  // Master Yiqing — sword-mad; lives for the purple cloud breath.
  // Friendly with the other five-peaks sword sects (Hengshan / Songshan /
  // Taishan) but keeps a watchful distance from Songshan's Zuolengchan
  // (who covets the alliance lead).
  sect_huashan_master_yiqing: {
    power: 82,
    age: 62,
    status: "alive",
    currentLocation: "sect_huashan",
    homeLocation: "sect_huashan",
    sect: "huashan",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "huashan", progress: 45, threshold: 100 },
      { kind: "find_treasure", itemId: "jade", locationId: "cave_treasure", progress: 5, threshold: 100 },
    ],
    rivals: ["sect_songshan_master_zuolengchan"],
    allies: ["sect_taishan_master_tianmen", "sect_hengshan_south_master_modaxiansheng"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Quanzhen ────────────────────────────────────────────────────────
  // Master Chongyang — Daoist ascetic, T3 sect's grand patriarch. His
  // life's work is the sun art (t3_qz_sun); the Gumu sect's secrets
  // weigh on him (the Mystery Woman is his estranged old love).
  sect_quanzhen_master_chongyang: {
    power: 88,
    age: 70,
    status: "alive",
    currentLocation: "sect_quanzhen",
    homeLocation: "sect_quanzhen",
    sect: "quanzhen",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "t3_qz_sun", progress: 70, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_gumu", progress: 5, threshold: 100 },
    ],
    rivals: ["sect_sunmoon_chief_dongfang"],
    allies: ["sect_wudang_master_qingxu", "sect_gumu_mystery_woman"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Sword Elder Qiuchuji — sun-sword traditionalist. Younger generation
  // of the Quanzhen elders; chases mastery of the dragon breath as the
  // alternative T3 capstone path.
  sect_quanzhen_sword_elder_qiuchuji: {
    power: 65,
    age: 52,
    status: "alive",
    currentLocation: "sect_quanzhen",
    homeLocation: "sect_quanzhen",
    sect: "quanzhen",
    sectRank: 7,
    goals: [
      { kind: "master_art", artId: "t3_qz_dragon", progress: 25, threshold: 100 },
      { kind: "climb_sect", targetRank: 9, progress: 10, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_quanzhen_master_chongyang"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Emei ────────────────────────────────────────────────────────────
  // Abbess Jingchan — orthodox Buddhist nun-master, allied with Shaolin's
  // Huiyuan. Bodhisattva breath is her life's pursuit.
  sect_emei_abbess_jingchan: {
    power: 90,
    age: 68,
    status: "alive",
    currentLocation: "sect_emei",
    homeLocation: "sect_emei",
    sect: "emei",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "emei", progress: 50, threshold: 100 },
    ],
    rivals: ["sect_tang_chief_tangmen"],
    allies: ["sect_shaolin_abbot_huiyuan", "sect_wudang_master_qingxu"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Vice Abbess Huimiao — sword-and-palm specialist. Most likely heir.
  sect_emei_vice_abbess_huimiao: {
    power: 73,
    age: 50,
    status: "alive",
    currentLocation: "sect_emei",
    homeLocation: "sect_emei",
    sect: "emei",
    sectRank: 9,
    goals: [
      { kind: "climb_sect", targetRank: 10, progress: 25, threshold: 100 },
      { kind: "master_art", artId: "t4_em_bodhi", progress: 30, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_emei_abbess_jingchan"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Gumu ────────────────────────────────────────────────────────────
  // Mystery Woman — secret-sect grandmistress. Withdrawn from the
  // jianghu; her treasure-search reflects an old vow to recover an
  // ancient yang-ice text. Old flame of Quanzhen's Chongyang.
  sect_gumu_mystery_woman: {
    power: 96,
    age: 65,
    status: "alive",
    currentLocation: "sect_gumu",
    homeLocation: "sect_gumu",
    sect: "gumu",
    sectRank: 10,
    goals: [
      { kind: "find_treasure", itemId: "snow_lotus", locationId: "cave_bingcan", progress: 10, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_gumu", progress: 80, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_quanzhen_master_chongyang"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Beggars ─────────────────────────────────────────────────────────
  // Chief Hongtian — wanderer-king of the Beggars. Friend of every
  // upright sect (no rivals listed); his goal is the wanderer breath.
  sect_beggars_chief_hongtian: {
    power: 92,
    age: 64,
    status: "alive",
    currentLocation: "sect_beggars",
    homeLocation: "sect_beggars",
    sect: "beggars",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "wanderer", progress: 55, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_beggars", progress: 20, threshold: 100 },
    ],
    rivals: ["sect_sunmoon_chief_dongfang"],
    allies: ["sect_shaolin_abbot_huiyuan", "sect_wudang_master_qingxu", "sect_emei_abbess_jingchan"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Jinyiwei ────────────────────────────────────────────────────────
  // Commander Zhao — imperial enforcer. Cold rivalry with all the major
  // jianghu sects (the throne distrusts independent power); avenge goal
  // points at Sun-Moon's Dongfang (his historical assignment).
  sect_jinyiwei_leader_zhao: {
    power: 91,
    age: 55,
    status: "alive",
    currentLocation: "sect_jinyiwei",
    homeLocation: "sect_jinyiwei",
    sect: "jinyiwei",
    sectRank: 10,
    goals: [
      { kind: "avenge", targetNpcId: "sect_sunmoon_chief_dongfang", progress: 40, threshold: 100 },
      { kind: "master_art", artId: "t4_jy_godslayer", progress: 30, threshold: 100 },
    ],
    rivals: ["sect_sunmoon_chief_dongfang", "sect_shaolin_abbot_huiyuan", "sect_beggars_chief_hongtian"],
    allies: [],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Sun-Moon ────────────────────────────────────────────────────────
  // Chief Dongfang — heretic patriarch, the orthodoxy's nemesis.
  // Pursues the qiankun breath; sworn revenge against Shaolin's Huiyuan.
  sect_sunmoon_chief_dongfang: {
    power: 93,
    age: 60,
    status: "alive",
    currentLocation: "sect_ming",
    homeLocation: "sect_ming",
    sect: "sunmoon",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "qiankun", progress: 65, threshold: 100 },
      { kind: "avenge", targetNpcId: "sect_shaolin_abbot_huiyuan", progress: 25, threshold: 100 },
    ],
    rivals: ["sect_shaolin_abbot_huiyuan", "sect_wudang_master_qingxu", "sect_jinyiwei_leader_zhao", "sect_beggars_chief_hongtian"],
    allies: ["sect_sunmoon_vice_renwoxing"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Vice Renwoxing — eats hearts, drinks dragon-blood breath. Schemes to
  // succeed Dongfang one day; will not wait politely.
  sect_sunmoon_vice_renwoxing: {
    power: 80,
    age: 52,
    status: "alive",
    currentLocation: "sect_ming",
    homeLocation: "sect_ming",
    sect: "sunmoon",
    sectRank: 9,
    goals: [
      { kind: "climb_sect", targetRank: 10, progress: 50, threshold: 100 },
      { kind: "avenge", targetNpcId: "sect_shaolin_vice_abbot_luohan", progress: 20, threshold: 100 },
    ],
    rivals: ["sect_shaolin_vice_abbot_luohan"],
    allies: ["sect_sunmoon_chief_dongfang"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Tang ────────────────────────────────────────────────────────────
  // Chief Tangmen — patriarch of the Sichuan venom clan. Reclusive;
  // chases the ten-thousand poisons breath.
  sect_tang_chief_tangmen: {
    power: 89,
    age: 67,
    status: "alive",
    currentLocation: "sect_tang",
    homeLocation: "sect_tang",
    sect: "tang",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "t4_tang_tenkpoisons", progress: 50, threshold: 100 },
      { kind: "find_treasure", itemId: "viper_venom", locationId: "cave_jinshe", progress: 5, threshold: 100 },
    ],
    rivals: ["sect_wudang_master_qingxu", "sect_emei_abbess_jingchan"],
    allies: [],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Xiaoyao ─────────────────────────────────────────────────────────
  // Master Yunxiao — free-spirited connoisseur. Pursues the
  // see-power / soul-suction breath of the sect.
  sect_xiaoyao_master_yunxiao: {
    power: 87,
    age: 66,
    status: "alive",
    currentLocation: "sect_xiaoyao",
    homeLocation: "sect_xiaoyao",
    sect: "xiaoyao",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "bmsg", progress: 55, threshold: 100 },
      { kind: "find_treasure", itemId: "ginseng", locationId: "valley_baihua", progress: 10, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_beggars_chief_hongtian"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // ─── Five-peaks orthodoxy ────────────────────────────────────────────
  // Master Zuolengchan (Songshan) — ambitious central-peak leader.
  // Wants to head a five-peaks alliance; rival to Huashan's Yiqing.
  sect_songshan_master_zuolengchan: {
    power: 84,
    age: 64,
    status: "alive",
    currentLocation: "sect_songshan",
    homeLocation: "sect_songshan",
    sect: "songshan",
    sectRank: 10,
    goals: [
      { kind: "climb_sect", targetRank: 10, progress: 80, threshold: 100 },
      { kind: "master_art", artId: "t3_ssh_pillar", progress: 40, threshold: 100 },
    ],
    rivals: ["sect_huashan_master_yiqing"],
    allies: ["sect_taishan_master_tianmen"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Master Tianmen (Taishan) — eastern peak Daoist; dawn-sword pursuit.
  sect_taishan_master_tianmen: {
    power: 80,
    age: 67,
    status: "alive",
    currentLocation: "sect_taishan",
    homeLocation: "sect_taishan",
    sect: "taishan",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "t3_tsh_sun", progress: 50, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_taishan", progress: 30, threshold: 100 },
    ],
    rivals: [],
    allies: ["sect_huashan_master_yiqing", "sect_songshan_master_zuolengchan"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Master Modaxiansheng (Hengshan South) — soft-sword recluse, sworn
  // friend of the music-fancier Liu Zhengfeng (his vice). Quiet life.
  sect_hengshan_south_master_modaxiansheng: {
    power: 81,
    age: 65,
    status: "alive",
    currentLocation: "sect_hengshan_south",
    homeLocation: "sect_hengshan_south",
    sect: "hengshan_south",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "t3_hgs_swift", progress: 60, threshold: 100 },
      { kind: "seek_wisdom", locationId: "sect_hengshan_south", progress: 50, threshold: 100 },
    ],
    rivals: ["sect_songshan_master_zuolengchan"],
    allies: ["sect_huashan_master_yiqing", "sect_hengshan_north_abbess_dingyi"],
    lastTickDay: 1,
    eventHistory: [],
  },

  // Abbess Dingyi (Hengshan North) — dharma-defender; mirror-blade saint.
  sect_hengshan_north_abbess_dingyi: {
    power: 79,
    age: 63,
    status: "alive",
    currentLocation: "sect_hengshan_north",
    homeLocation: "sect_hengshan_north",
    sect: "hengshan_north",
    sectRank: 10,
    goals: [
      { kind: "master_art", artId: "t3_hgn_mirror", progress: 55, threshold: 100 },
    ],
    rivals: ["sect_songshan_master_zuolengchan"],
    allies: ["sect_emei_abbess_jingchan", "sect_hengshan_south_master_modaxiansheng"],
    lastTickDay: 1,
    eventHistory: [],
  },
};

export function getNamedDefault(npcId: string): NpcExtState | null {
  return NAMED_NPC_DEFAULTS[npcId] ?? null;
}

export function namedNpcIds(): string[] {
  return Object.keys(NAMED_NPC_DEFAULTS);
}
