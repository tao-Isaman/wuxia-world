// ─── Hand-curated route table ─────────────────────────────────────────
// Every connection between two leaves on the world map. Replaces the
// previous random-fill fallback so each route reflects actual geography
// or wuxia lore rather than RNG.
//
// Edges are undirected — a single entry `["a", "b"]` adds the route in
// both directions. Duplicates (same pair listed twice) are silently
// deduped by the graph builder in lib/world/data/world-map.ts.
//
// Authoring rule: every leaf should appear in at least one edge here so
// it stays reachable. The `cat_*` category routes from world hub also
// link every leaf via its category, but explicit nearby connections are
// what give the map its geographic feel.

export const LOCATION_ROUTES: ReadonlyArray<readonly [string, string]> = [
  // ─── Capital region (central — Henan / Shanxi axis) ──────────────
  ["city_capital", "city_yangzhou"],          // east-west grand canal
  ["city_capital", "city_changan"],           // east-west to old capital
  ["city_capital", "city_jinling"],           // capital ↔ southern capital
  ["city_capital", "palace_royal"],           // imperial palace inside city
  ["city_capital", "palace_royal"],           // (duplicate-safe — see file note)
  ["city_capital", "inn_yuelai"],             // famous inn at the capital
  ["city_capital", "temple_tianning"],
  ["city_capital", "city_lingxiao"],          // northern frontier town
  ["city_capital", "sect_shaolin"],           // south to Songshan range
  ["city_capital", "sect_songshan"],
  ["city_capital", "sect_taishan"],           // east to Taishan
  ["city_capital", "sect_hengshan_north"],    // northwest to Hengshan north
  ["city_capital", "mt_tiezhang"],
  ["city_capital", "village_qigu"],           // small village to the north
  ["city_capital", "cliff_motian"],
  ["city_capital", "home_player"],            // player's home connects here

  // ─── Northwest frontier (Western Xia / desert) ───────────────────
  ["city_xixia", "desert_ruins"],
  ["city_xixia", "tribe_huizu"],
  ["city_xixia", "mt_baituo"],
  ["city_xixia", "home_miaoren"],
  ["city_xixia", "home_tianboguang"],
  ["city_xixia", "home_hufei"],
  ["desert_ruins", "tribe_huizu"],
  ["desert_ruins", "sect_xuedao"],
  ["desert_ruins", "sect_xueyu"],
  ["desert_ruins", "home_tianboguang"],
  ["desert_ruins", "village_noname"],
  ["tribe_huizu", "mt_baituo"],
  ["sect_xueyu", "sect_xuedao"],

  // ─── Southwest (Yunnan / Sichuan / Tibetan) ─────────────────────
  ["city_dali", "sect_emei"],
  ["city_dali", "sect_wudu"],
  ["city_dali", "village_meihua"],
  ["city_dali", "mt_wuliang"],
  ["city_dali", "home_yideng"],
  ["city_dali", "temple_dalun"],
  ["city_dali", "market_miao"],
  ["city_dali", "pool_heilong"],
  ["sect_emei", "village_meihua"],
  ["sect_emei", "home_yideng"],
  ["sect_wudu", "market_miao"],
  ["sect_wudu", "mt_wuliang"],
  ["sect_wudu", "pool_heilong"],
  ["temple_dalun", "mt_kunlun"],

  // ─── Western (Shaanxi / Chang'an) ────────────────────────────────
  ["city_changan", "sect_huashan"],
  ["city_changan", "sect_quanzhen"],
  ["city_changan", "sect_gumu"],
  ["city_changan", "palace_zhongyang"],
  ["city_changan", "village_huashan"],
  ["city_changan", "cliff_siguo"],
  ["city_changan", "mt_leigu"],
  ["sect_huashan", "cliff_siguo"],
  ["sect_huashan", "village_huashan"],
  ["sect_quanzhen", "palace_zhongyang"],
  ["sect_quanzhen", "sect_gumu"],
  ["sect_quanzhen", "home_nanxian"],
  ["sect_quanzhen", "inn_heluo"],
  ["sect_gumu", "palace_zhongyang"],
  ["sect_gumu", "cave_yangguo"],

  // ─── Eastern (lower Yangtze — Yangzhou / Suzhou / Jinling) ──────
  ["city_yangzhou", "city_suzhou"],
  ["city_yangzhou", "city_jinling"],
  ["city_yangzhou", "villa_meizhuang"],
  ["city_yangzhou", "village_wuxia"],
  ["city_yangzhou", "inn_gaosheng"],
  ["city_yangzhou", "villa_fuwei"],
  ["city_suzhou", "city_jinling"],
  ["city_suzhou", "villa_yanzi"],
  ["city_suzhou", "village_wuxia"],
  ["city_suzhou", "isle_taohua"],
  ["city_suzhou", "inn_youjian"],
  ["city_jinling", "villa_meizhuang"],
  ["city_jinling", "inn_heluo"],

  // ─── Central sects (Songshan / Taishan / Hengshan cluster) ──────
  ["sect_shaolin", "sect_songshan"],          // both at Mt Songshan
  ["sect_songshan", "sect_taishan"],
  ["sect_songshan", "village_taishan"],
  ["sect_songshan", "sect_hengshan_south"],
  ["sect_songshan", "sect_hengshan_north"],
  ["sect_taishan", "village_taishan"],
  ["sect_taishan", "cliff_yunhe"],
  ["sect_taishan", "sect_hengshan_north"],
  ["sect_hengshan_south", "village_hengshan"],
  ["sect_hengshan_south", "mt_tiezhang"],
  ["sect_hengshan_north", "sect_taishan"],

  // ─── Hubei / Daoist mountains (Wudang / Xiaoyao) ────────────────
  ["sect_wudang", "city_capital"],
  ["sect_wudang", "sect_xiaoyao"],
  ["sect_wudang", "home_chengying"],
  ["sect_xiaoyao", "valley_baihua"],
  ["sect_xiaoyao", "cave_zixiu"],
  ["sect_xiaoyao", "mt_leigu"],
  ["sect_xiaoyao", "villa_yanzi"],

  // ─── Xingxiu / Star Sea (far southwest of Tianshan) ─────────────
  ["sect_xingxiu", "sea_xingxiu"],
  ["sect_xingxiu", "mt_kunlun"],

  // ─── Beggars (home_hong / players) ──────────────────────────────
  ["sect_beggars", "home_hong"],
  ["sect_beggars", "home_yanji"],
  ["sect_beggars", "inn_gaosheng"],
  ["home_hong", "home_player"],

  // ─── Ming sect (Guangming Ding / Heimu) ─────────────────────────
  ["sect_ming", "peak_guangming"],
  ["sect_ming", "cliff_heimu"],
  ["sect_ming", "home_chengkun"],
  ["peak_guangming", "mt_kunlun"],
  ["peak_guangming", "cliff_heimu"],
  ["peak_guangming", "home_chengkun"],

  // ─── Far west (Tianshan / Kunlun / Lingjiu) ─────────────────────
  ["sect_lingjiu", "mt_kunlun"],
  ["sect_lingjiu", "mt_baituo"],
  ["mt_kunlun", "mt_kunlun_immortal"],
  ["mt_kunlun", "mt_baituo"],

  // ─── Islands (Donghai chain — east coast outward) ───────────────
  ["isle_taohua", "isle_xiake"],
  ["isle_taohua", "isle_yuanyang"],
  ["isle_xiake", "isle_wuming"],
  ["isle_xiake", "isle_binghuo"],
  ["isle_binghuo", "isle_shenlong"],
  ["isle_yuanyang", "isle_pili"],
  ["isle_wane", "isle_lingshe"],
  ["isle_wane", "isle_boni"],
  ["isle_pili", "isle_lingshe"],
  ["isle_boni", "isle_wuming"],
  ["isle_shenlong", "isle_wuming"],

  // ─── Caves / valleys (treasure / qi-cultivation network) ────────
  ["valley_jueqing", "valley_jueqing_bottom"],
  ["valley_jueqing", "cave_yangguo"],
  ["cave_yangguo", "home_chengying"],
  ["cave_bingcan", "cave_jinshe"],
  ["cave_jinshe", "cave_treasure"],
  ["cave_treasure", "cave_chuangwang"],
  ["cave_treasure", "cliff_motian"],
  ["cave_chuangwang", "cliff_yunhe"],
  ["cave_zhizhu", "valley_hudie"],
  ["valley_hudie", "home_xuemuhua"],
  ["valley_hudie", "villa_yaowang"],
  ["cave_tangshi", "cave_zixiu"],

  // ─── Mansions / villas (Yanzi Wu / Yaowang / Plum / Fuwei) ──────
  ["villa_yaowang", "home_xuemuhua"],

  // ─── Cliffs (Motian / Heimu / Yunhe / Siguo) ────────────────────
  ["cliff_motian", "home_beichou"],
  ["cliff_yunhe", "home_beichou"],

  // ─── Lingxiao / Tianning (capital outskirts) ────────────────────
  ["city_lingxiao", "mt_baituo"],
  ["palace_royal", "inn_yuelai"],

  // ─── Villages (radial connections to themed neighbours) ─────────
  ["village_qigu", "village_noname"],
  ["village_qigu", "home_yanji"],
];
