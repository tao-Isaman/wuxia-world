// ─── Hand-curated route table ─────────────────────────────────────────
// Every connection between two leaves on the world map. Each route gets
// its own pair of fixed thematic labels — `fromA` is what the player sees
// when standing at `a`, `fromB` is what they see at `b`. Labels are pure
// path / area names ("ลำคลองใหญ่", "ป่าทางตะวันออก", "ทุ่งหิมะ") — they
// never include the destination's location name. The destination's name
// shows up only in the route-confirmation screen description, not the
// button label.
//
// To add a new route: append a `LocationRoute` object with both labels.
// To rename a route, just edit `fromA` / `fromB`. The graph builder in
// lib/world/data/world-map.ts dedupes by (a, b) ids so the order of
// entries here doesn't matter.

export interface LocationRoute {
  a: string;
  b: string;
  // Label shown on the route button when the player is standing at `a`.
  fromA: string;
  // Label shown on the route button when the player is standing at `b`.
  fromB: string;
  // Optional supporting hint — shown in small print under each label.
  hintA?: string;
  hintB?: string;
}

export const LOCATION_ROUTES: readonly LocationRoute[] = [
  // ─── Capital region (central — Henan / Shanxi axis) ──────────────
  { a: "city_capital", b: "city_yangzhou", fromA: "ลำคลองใหญ่",      fromB: "ลำคลองใหญ่",      hintA: "เส้นทางการค้าสายตะวันออกเฉียงใต้" },
  { a: "city_capital", b: "city_changan",  fromA: "ทางหลวงราชา",     fromB: "ทางหลวงราชา" },
  { a: "city_capital", b: "palace_royal",  fromA: "ระเบียงวัง",       fromB: "ตรอกในวัง" },
  { a: "palace_royal", b: "sect_jinyiwei", fromA: "ตำหนักเสื้อแพร",   fromB: "ระเบียงในวัง",   hintA: "ที่พำนักขององครักษ์ราชสำนัก", hintB: "ทางออกสู่พระราชวังหลวง" },
  { a: "city_capital", b: "sect_jinyiwei", fromA: "ตรอกองครักษ์",     fromB: "ตรอกออกสู่นคร",  hintA: "ตรอกที่ทหารเสื้อแพรเดินตรวจ" },
  { a: "city_capital", b: "inn_yuelai",    fromA: "ตรอกเก่า",         fromB: "ตรอกเก่า" },
  { a: "city_capital", b: "sect_songshan", fromA: "ทางขึ้นเขา",       fromB: "ทางลงเขา" },
  { a: "city_capital", b: "home_player",   fromA: "ทางกลับบ้าน",      fromB: "ทางออกจากบ้าน" },
  { a: "city_capital", b: "village_qigu",  fromA: "ทุ่งเหนือ",        fromB: "ทุ่งใต้",        hintA: "ทุ่งและไร่นาทอดยาว" },
  { a: "temple_tianning", b: "palace_royal", fromA: "ระเบียงวัง",     fromB: "ระเบียงวิหาร" },

  // ─── Northwest frontier (Western Xia / desert) ───────────────────
  { a: "city_xixia", b: "desert_ruins",       fromA: "ทะเลทราย",        fromB: "เส้นทางย้อนเมือง", hintA: "ทรายร้างและซากปรักหักพัง" },
  { a: "city_xixia", b: "tribe_huizu",        fromA: "เส้นทางคาราวาน", fromB: "เส้นทางคาราวาน" },
  { a: "city_xixia", b: "mt_baituo",          fromA: "ทางขึ้นเขา",      fromB: "ทางลงเขา" },
  { a: "city_xixia", b: "home_miaoren",       fromA: "ตรอกชายแดน",     fromB: "ตรอกชายแดน" },
  { a: "city_xixia", b: "home_tianboguang",   fromA: "ค่ายชายแดน",     fromB: "ค่ายชายแดน" },
  { a: "city_xixia", b: "home_hufei",         fromA: "ตรอกเก่าชายแดน",  fromB: "ตรอกเก่าชายแดน" },
  { a: "desert_ruins", b: "tribe_huizu",      fromA: "เนินทราย",        fromB: "เนินทราย" },
  { a: "desert_ruins", b: "sect_xuedao",      fromA: "ทรายเลือด",       fromB: "ทรายเลือด" },
  { a: "desert_ruins", b: "sect_xueyu",       fromA: "ซากปรักหักพัง",   fromB: "ซากปรักหักพัง" },
  { a: "desert_ruins", b: "home_tianboguang", fromA: "ดงทราย",          fromB: "ดงทราย" },
  { a: "desert_ruins", b: "village_noname",   fromA: "ทรายเงียบสงัด",   fromB: "ทรายเงียบสงัด" },
  { a: "tribe_huizu", b: "mt_baituo",         fromA: "ทางสายลม",        fromB: "ทางสายลม" },
  { a: "sect_xueyu", b: "sect_xuedao",        fromA: "ทางสายเลือด",     fromB: "ทางสายเลือด" },

  // ─── Southwest (Yunnan / Sichuan / Tibetan) ─────────────────────
  { a: "city_dali", b: "sect_emei",       fromA: "ลำธารหุบเขา",     fromB: "ลำธารหุบเขา" },
  { a: "city_dali", b: "sect_wudu",       fromA: "ป่าพิษ",           fromB: "ป่าพิษ" },
  { a: "city_dali", b: "village_meihua",  fromA: "ดงดอกเหมย",        fromB: "ดงดอกเหมย",       hintA: "ต้นเหมยขึ้นริมทาง" },
  { a: "city_dali", b: "mt_wuliang",      fromA: "ทางขึ้นเขา",       fromB: "ทางลงเขา" },
  { a: "city_dali", b: "home_yideng",     fromA: "ลำธารใต้",         fromB: "ลำธารใต้" },
  { a: "city_dali", b: "temple_dalun",    fromA: "ทางทิเบต",          fromB: "ทางทิเบต" },
  { a: "city_dali", b: "market_miao",     fromA: "ทุ่งเมี่ยว",        fromB: "ทุ่งเมี่ยว" },
  { a: "city_dali", b: "pool_heilong",    fromA: "หนองมังกร",         fromB: "หนองมังกร" },
  { a: "sect_emei", b: "village_meihua",  fromA: "ทางลงเขา",          fromB: "ทางขึ้นเขา" },
  { a: "sect_emei", b: "home_yideng",     fromA: "ลำธารป่า",          fromB: "ลำธารป่า" },
  { a: "sect_wudu", b: "market_miao",     fromA: "ป่าเขตเมี่ยว",     fromB: "ป่าเขตเมี่ยว" },
  { a: "sect_wudu", b: "mt_wuliang",      fromA: "ป่ารกชัฏ",         fromB: "ป่ารกชัฏ" },
  { a: "sect_wudu", b: "pool_heilong",    fromA: "หนองพิษ",          fromB: "หนองพิษ" },
  { a: "temple_dalun", b: "mt_kunlun",    fromA: "ทางขึ้นเขา",        fromB: "ทางลงเขา" },

  // ─── Western (Shaanxi / Chang'an) ────────────────────────────────
  { a: "city_changan", b: "sect_huashan",     fromA: "ทางขึ้นเขา",     fromB: "ทางลงเขา" },
  { a: "city_changan", b: "sect_quanzhen",    fromA: "ป่าจงหนาน",     fromB: "ป่าจงหนาน" },
  { a: "city_changan", b: "sect_gumu",        fromA: "ทางลงสุสาน",    fromB: "ทางขึ้นจากใต้ดิน" },
  { a: "city_changan", b: "palace_zhongyang", fromA: "เนินวัง",        fromB: "เนินวัง" },
  { a: "city_changan", b: "village_huashan",  fromA: "ทุ่งเชิงเขา",   fromB: "ทุ่งเชิงเขา" },
  { a: "city_changan", b: "cliff_siguo",      fromA: "ทางสู่หน้าผา",   fromB: "ทางลงจากหน้าผา" },
  { a: "city_changan", b: "mt_leigu",         fromA: "ทุ่งกลอง",       fromB: "ทุ่งกลอง" },
  { a: "sect_huashan", b: "cliff_siguo",      fromA: "ทางขึ้นหน้าผา",  fromB: "ทางลงจากหน้าผา" },
  { a: "sect_huashan", b: "village_huashan",  fromA: "ทางลงเขา",       fromB: "ทางขึ้นเขา" },
  { a: "sect_quanzhen", b: "palace_zhongyang", fromA: "ระเบียงวัง",    fromB: "ระเบียงวัง" },
  { a: "sect_quanzhen", b: "sect_gumu",       fromA: "ทางลงสู่ใต้ดิน", fromB: "ทางขึ้นจากใต้ดิน" },
  { a: "sect_quanzhen", b: "home_nanxian",    fromA: "ลำธารหุบเขา",   fromB: "ลำธารหุบเขา" },
  { a: "sect_quanzhen", b: "inn_heluo",       fromA: "ทางลงเขา",       fromB: "ทางขึ้นเขา" },
  { a: "sect_gumu", b: "palace_zhongyang",    fromA: "ทางขึ้นวัง",     fromB: "ทางลงสุสาน" },
  { a: "sect_gumu", b: "cave_yangguo",        fromA: "อุโมงค์โบราณ",   fromB: "อุโมงค์โบราณ" },

  // ─── Eastern (lower Yangtze — Yangzhou / Suzhou / Jinling) ──────
  { a: "city_yangzhou", b: "city_suzhou",     fromA: "ลำน้ำใต้",        fromB: "ลำน้ำเหนือ" },
  { a: "city_yangzhou", b: "city_jinling",    fromA: "แม่น้ำใหญ่",     fromB: "แม่น้ำใหญ่" },
  { a: "city_yangzhou", b: "villa_meizhuang", fromA: "ดงดอกท้อ",        fromB: "ดงดอกท้อ" },
  { a: "city_yangzhou", b: "village_wuxia",   fromA: "ปากแม่น้ำ",      fromB: "ปากแม่น้ำ" },
  { a: "city_yangzhou", b: "inn_gaosheng",    fromA: "ตรอกริมน้ำ",     fromB: "ตรอกริมน้ำ" },
  { a: "city_yangzhou", b: "villa_fuwei",     fromA: "ตรอกค้าขาย",     fromB: "ตรอกค้าขาย" },
  { a: "city_suzhou", b: "city_jinling",      fromA: "ลำคลองริมเขา",   fromB: "ลำคลองริมเขา" },
  { a: "city_suzhou", b: "villa_yanzi",       fromA: "ทะเลสาบนกแอ่น", fromB: "ทะเลสาบนกแอ่น" },
  { a: "city_suzhou", b: "village_wuxia",     fromA: "ปากลำธาร",       fromB: "ปากลำธาร" },
  { a: "city_suzhou", b: "isle_taohua",       fromA: "ท่าเรือดอกท้อ",  fromB: "ท่าเรือดอกท้อ", hintA: "ขึ้นเรือออกสู่ทะเลตะวันออก" },
  { a: "city_suzhou", b: "inn_youjian",       fromA: "ตรอกริมทะเลสาบ", fromB: "ตรอกริมทะเลสาบ" },
  { a: "city_jinling", b: "villa_meizhuang",  fromA: "ดงดอกท้อใต้",   fromB: "ดงดอกท้อใต้" },
  { a: "city_jinling", b: "inn_heluo",        fromA: "ตรอกราชธานี",    fromB: "ตรอกราชธานี" },

  // ─── Central sects (Songshan / Taishan / Hengshan cluster) ──────
  { a: "sect_shaolin", b: "sect_songshan",    fromA: "เนินยอดเขา",     fromB: "เนินยอดเขา" },
  { a: "sect_songshan", b: "sect_taishan",    fromA: "ทางตะวันออก",   fromB: "ทางตะวันตก" },
  { a: "sect_songshan", b: "village_taishan", fromA: "เนินเชิงเขา",   fromB: "เนินเชิงเขา" },
  { a: "sect_songshan", b: "sect_hengshan_south", fromA: "ทางใต้ผ่านเขา", fromB: "ทางเหนือผ่านเขา" },
  { a: "sect_songshan", b: "sect_hengshan_north", fromA: "ทางเหนือผ่านเขา", fromB: "ทางใต้ผ่านเขา" },
  { a: "sect_taishan", b: "village_taishan",  fromA: "ทางลงเขา",       fromB: "ทางขึ้นเขา" },
  { a: "sect_taishan", b: "cliff_yunhe",      fromA: "หน้าผาก้อนเมฆ", fromB: "หน้าผาก้อนเมฆ" },
  { a: "sect_taishan", b: "sect_hengshan_north", fromA: "ป่าเหนือ",   fromB: "ป่าใต้" },
  { a: "sect_hengshan_south", b: "village_hengshan", fromA: "ทางลงเขา", fromB: "ทางขึ้นเขา" },
  { a: "sect_hengshan_south", b: "mt_tiezhang", fromA: "ทางเขาเหล็ก", fromB: "ทางเขาเหล็ก" },

  // ─── Hubei / Daoist mountains (Wudang / Xiaoyao) ────────────────
  { a: "sect_wudang", b: "sect_xiaoyao",      fromA: "ป่าเซน",         fromB: "ป่าเซน" },
  { a: "sect_wudang", b: "home_chengying",    fromA: "ลำธารใต้",       fromB: "ลำธารใต้" },
  { a: "sect_xiaoyao", b: "valley_baihua",    fromA: "ดงดอกไม้",       fromB: "ดงดอกไม้" },
  { a: "sect_xiaoyao", b: "cave_zixiu",       fromA: "อุโมงค์ลับ",     fromB: "อุโมงค์ลับ" },
  { a: "sect_xiaoyao", b: "mt_leigu",         fromA: "ทุ่งกลอง",       fromB: "ทุ่งกลอง" },
  { a: "sect_xiaoyao", b: "villa_yanzi",      fromA: "ลำธารนกแอ่น",  fromB: "ลำธารนกแอ่น" },

  // ─── Xingxiu / Star Sea ─────────────────────────────────────────
  { a: "sect_xingxiu", b: "sea_xingxiu",      fromA: "ทะเลดาว",         fromB: "ทะเลดาว" },
  { a: "sect_xingxiu", b: "mt_kunlun",        fromA: "ทางขึ้นเขา",     fromB: "ทางลงเขา" },

  // ─── Beggars (home_hong / players) ──────────────────────────────
  { a: "sect_beggars", b: "home_hong",        fromA: "ตรอกพรรค",       fromB: "ตรอกพรรค" },
  { a: "sect_beggars", b: "home_yanji",       fromA: "ตรอกพี่น้อง",    fromB: "ตรอกพี่น้อง" },
  { a: "sect_beggars", b: "inn_gaosheng",     fromA: "ตรอกโรงเตี๊ยม",  fromB: "ตรอกโรงเตี๊ยม" },
  { a: "home_hong", b: "home_player",         fromA: "ตรอกบ้าน",        fromB: "ตรอกบ้าน" },

  // ─── Ming sect (Guangming Ding / Heimu) ─────────────────────────
  { a: "sect_ming", b: "peak_guangming",      fromA: "ทางขึ้นยอด",     fromB: "ทางลงยอด" },
  { a: "sect_ming", b: "cliff_heimu",         fromA: "ป่ามืด",          fromB: "ป่ามืด" },
  { a: "sect_ming", b: "home_chengkun",       fromA: "ตรอกพรรค",       fromB: "ตรอกพรรค" },
  { a: "peak_guangming", b: "mt_kunlun",      fromA: "เนินภูเขา",      fromB: "เนินภูเขา" },
  { a: "peak_guangming", b: "cliff_heimu",    fromA: "หน้าผามืด",      fromB: "หน้าผามืด" },
  { a: "peak_guangming", b: "home_chengkun",  fromA: "ทางลงยอด",       fromB: "ทางขึ้นยอด" },

  // ─── Far west (Tianshan / Kunlun / Lingjiu) ─────────────────────
  { a: "sect_lingjiu", b: "mt_kunlun",        fromA: "ทางหิมะ",         fromB: "ทางหิมะ" },
  { a: "sect_lingjiu", b: "mt_baituo",        fromA: "ทุ่งหิมะ",        fromB: "ทุ่งหิมะ" },
  { a: "mt_kunlun", b: "mt_kunlun_immortal",  fromA: "ทางลึก",          fromB: "ทางออก" },
  { a: "mt_kunlun", b: "mt_baituo",           fromA: "เนินหิมะตะวันตก", fromB: "เนินหิมะตะวันออก" },

  // ─── Islands (Donghai chain) ────────────────────────────────────
  { a: "isle_taohua", b: "isle_xiake",        fromA: "ทะเลตะวันออก",   fromB: "ทะเลตะวันตก" },
  { a: "isle_taohua", b: "isle_yuanyang",     fromA: "ทะเลใต้",        fromB: "ทะเลเหนือ" },
  { a: "isle_xiake", b: "isle_wuming",        fromA: "ทะเลกลาง",       fromB: "ทะเลกลาง" },
  { a: "isle_xiake", b: "isle_binghuo",       fromA: "ทะเลเหนือ",       fromB: "ทะเลใต้" },
  { a: "isle_binghuo", b: "isle_shenlong",    fromA: "ทะเลน้ำแข็ง",    fromB: "ทะเลน้ำแข็ง" },
  { a: "isle_yuanyang", b: "isle_pili",       fromA: "ทะเลฟ้าผ่า",      fromB: "ทะเลฟ้าผ่า" },
  { a: "isle_wane", b: "isle_lingshe",        fromA: "ทะเลงู",          fromB: "ทะเลงู" },
  { a: "isle_wane", b: "isle_boni",           fromA: "ทะเลใต้ฝั่ง",     fromB: "ทะเลใต้ฝั่ง" },
  { a: "isle_pili", b: "isle_lingshe",        fromA: "ทะเลกลางมหาสมุทร", fromB: "ทะเลกลางมหาสมุทร" },
  { a: "isle_boni", b: "isle_wuming",         fromA: "ทะเลปลายฟ้า",    fromB: "ทะเลปลายฟ้า" },
  { a: "isle_shenlong", b: "isle_wuming",     fromA: "ทะเลมังกร",       fromB: "ทะเลมังกร" },

  // ─── Caves / valleys ────────────────────────────────────────────
  { a: "valley_jueqing", b: "valley_jueqing_bottom", fromA: "ทางลงสู่ใต้", fromB: "ทางขึ้นจากใต้" },
  { a: "valley_jueqing", b: "cave_yangguo",   fromA: "อุโมงค์ลับ",     fromB: "อุโมงค์ลับ" },
  { a: "cave_yangguo", b: "home_chengying",   fromA: "ลำธารใต้",       fromB: "ลำธารใต้" },
  { a: "cave_bingcan", b: "cave_jinshe",      fromA: "อุโมงค์ทอง",     fromB: "อุโมงค์ทอง" },
  { a: "cave_jinshe", b: "cave_treasure",     fromA: "อุโมงค์สมบัติ",  fromB: "อุโมงค์สมบัติ" },
  { a: "cave_treasure", b: "cave_chuangwang", fromA: "ห้องลับ",         fromB: "ห้องลับ" },
  { a: "cave_treasure", b: "cliff_motian",    fromA: "ทางขึ้นยอด",     fromB: "ทางลงสู่ใต้" },
  { a: "cave_chuangwang", b: "cliff_yunhe",   fromA: "อุโมงค์เก่า",    fromB: "อุโมงค์เก่า" },
  { a: "cave_zhizhu", b: "valley_hudie",      fromA: "ลำธารผีเสื้อ",   fromB: "ลำธารผีเสื้อ" },
  { a: "valley_hudie", b: "home_xuemuhua",    fromA: "ตรอกแพทย์",      fromB: "ตรอกแพทย์" },
  { a: "valley_hudie", b: "villa_yaowang",    fromA: "สวนสมุนไพร",     fromB: "สวนสมุนไพร" },
  { a: "cave_tangshi", b: "cave_zixiu",       fromA: "อุโมงค์โบราณ",   fromB: "อุโมงค์โบราณ" },

  // ─── Mansions / villas ──────────────────────────────────────────
  { a: "villa_yaowang", b: "home_xuemuhua",   fromA: "สวนสมุนไพรใหญ่", fromB: "สวนสมุนไพรใหญ่" },

  // ─── Cliffs ─────────────────────────────────────────────────────
  { a: "cliff_motian", b: "home_beichou",     fromA: "ทางลงเชิงเขา",   fromB: "ทางขึ้นยอด" },
  { a: "cliff_yunhe", b: "home_beichou",      fromA: "ลำธารหุบเขา",   fromB: "ลำธารหุบเขา" },

  // ─── Lingxiao / royal palace ────────────────────────────────────
  { a: "city_lingxiao", b: "mt_baituo",       fromA: "ทุ่งหิมะใต้",    fromB: "ทุ่งหิมะใต้" },
  { a: "palace_royal", b: "inn_yuelai",       fromA: "ตรอกในวัง",      fromB: "ตรอกในวัง" },

  // ─── Villages (radial connections) ──────────────────────────────
  { a: "village_qigu", b: "village_noname",   fromA: "ทุ่งเหนือ",       fromB: "ทุ่งใต้" },
  { a: "village_qigu", b: "home_yanji",       fromA: "ตรอกบ้าน",        fromB: "ตรอกบ้าน" },
];
