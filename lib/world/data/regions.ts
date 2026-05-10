// Liveness Layer §3.4 — region taxonomy + channel mapping.
// Filled by Phase 1 Agent C. Each location id is hand-assigned to one of
// 6 regions; rumor distribution + channel filters use this map.

import type { Region, RumorChannel } from "../types";

// LocationId → Region. Authored map. Locations not in the map default to
// JIANGHU_DEFAULT_REGION at lookup time.
export const LOCATION_REGION: Record<string, Region> = {
  // ─── Heartland (capital + central plains) ───────────────────────────
  // Capital and the largest cities of the central plains, plus the royal
  // palace and the player's starter home. Generic central inns also live
  // here so newbie rumors land in the heartland by default.
  city_capital: "heartland",
  city_changan: "heartland", // 长安 — old western capital, now central
  city_jinling: "heartland", // 金陵 — old southern capital, central plains
  city_yangzhou: "heartland", // 扬州 — central plains river city
  palace_royal: "heartland", // 皇宫 — sits beside the capital
  home_player: "heartland", // starter location — neutral central placement
  inn_yuelai: "heartland", // 悦来客栈 — generic mid-game inn
  inn_youjian: "heartland", // 有间客栈 — generic inn
  village_noname: "heartland", // generic central village
  village_qigu: "heartland", // generic central village

  // ─── North (peaks + northern sects) ─────────────────────────────────
  // The great northern mountain ranges, the Quanzhen / Wudang / Songshan /
  // Taishan sects, and the surrounding villages and lookout cliffs.
  sect_quanzhen: "north", // 全真教 — Mt. Zhongnan peaks
  sect_wudang: "north", // 武当派 — Mt. Wudang
  sect_songshan: "north", // 嵩山派 — Mt. Songshan
  sect_taishan: "north", // 泰山派 — Mt. Taishan
  sect_lingjiu: "north", // 灵鹫宫 — Tianshan, far north
  village_taishan: "north", // village under Taishan
  palace_zhongyang: "north", // 重阳宫 — Quanzhen home palace
  mt_leigu: "north", // 擂鼓山 — northern peak
  cliff_motian: "north", // 摩天崖 — northern cliff
  cliff_yunhe: "north", // 云鹤崖 — northern cliff
  cave_bingcan: "north", // 冰蚕秘洞 — ice-silkworm cave (cold = north)
  isle_binghuo: "north", // 冰火岛 — far-north ice/fire isle
  inn_gaosheng: "north", // 高升客栈 — northern road inn
  home_hong: "north", // 洪七公 — wandered north often, but central; place north for variety
  home_chengkun: "north", // 成昆 — antagonist tied to Mingjiao schemes (north→west axis)

  // ─── South (Shaolin + Emei + southern temples) ──────────────────────
  // Shaolin sits on Songshan technically but its narrative weight is
  // southern; Emei and the two Hengshan sects + southern villages and
  // temples round out the south.
  sect_shaolin: "south", // 少林派 — central-south by tradition
  sect_emei: "south", // 峨嵋派 — Mt. Emei (Sichuan south)
  sect_hengshan_south: "south", // 衡山派 — southern Hengshan (Hunan)
  sect_hengshan_north: "south", // 恒山派 — Shanxi, but grouped south
  sect_xueyu: "south", // 血雨刀派 — new evil sect, south assignment
  village_hengshan: "south",
  village_meihua: "south", // plum-blossom village — southern flavor
  city_dali: "south", // 大理 — Yunnan, classic south
  temple_dalun: "south", // 大轮寺 — southern temple
  temple_tianning: "south", // 天宁寺 — southern temple
  home_yideng: "south", // 一灯 (南帝) — the Southern Emperor
  home_xuemuhua: "south", // 薛慕华 — physician of Hudie Valley (southern)
  valley_hudie: "south", // 蝴蝶谷 — southern healing valley
  villa_yaowang: "south", // 药王庄 — southern herbalist mansion

  // ─── West (Huashan + Kunlun + Gumu frontier) ────────────────────────
  // Western frontier sects and mountain ranges, including the Huashan
  // sword sect, Kunlun + the immortal peak, and the Gumu underground.
  sect_huashan: "west", // 华山派 — Mt. Huashan
  sect_gumu: "west", // 古墓派 — under Mt. Zhongnan, west of Quanzhen
  village_huashan: "west",
  mt_kunlun: "west", // 昆仑山 — far western range
  mt_kunlun_immortal: "west", // 昆仑仙境 — even deeper west
  mt_baituo: "west", // 白驼山 — White Camel Mountain (western desert)
  mt_wuliang: "west", // 无量山 — Yunnan-west borderland
  desert_ruins: "west", // 沙漠废墟 — western desert
  tribe_huizu: "west", // 回族部落 — Hui tribes (NW frontier)
  cliff_siguo: "west", // 思过崖 — Linghu Chong's cliff (Huashan-adjacent)
  cave_yangguo: "west", // 杨过山洞 — Yang Guo cave (near Gumu)
  villa_meizhuang: "west", // 梅庄 — western plum villa
  city_xixia: "west", // 西夏 — western Xia kingdom

  // ─── East (Tang + Ming + Jinyiwei + coastal isles) ──────────────────
  // Eastern coast and seas: the Tang clan, Sunmoon (Ming) cult, the
  // imperial Jinyiwei, the Suzhou economic center, plus most of the
  // outlying offshore islands and pirate coves.
  sect_tang: "east", // 唐门 — Sichuan, but treat as eastern in our taxonomy
  sect_ming: "east", // 日月神教 — Mingjiao, east
  sect_jinyiwei: "east", // 锦衣卫 — imperial guard, east near capital
  sect_xiaoyao: "east", // 逍遥派 — eastern ranges
  city_suzhou: "east", // 苏州 — eastern Jiangnan
  villa_yanzi: "east", // 燕子坞 — Murong mansion, eastern Jiangnan
  villa_fuwei: "east", // 福威镖局 — eastern escort agency
  isle_taohua: "east", // 桃花岛 — east of the Yellow Sea coast
  isle_xiake: "east", // 侠客岛 — far east mystery isle
  isle_yuanyang: "east", // 鸳鸯岛
  isle_pili: "east", // 霹雳堂
  isle_lingshe: "east", // 灵蛇岛
  isle_shenlong: "east", // 神龙岛 — Dragon Isle, east
  inn_heluo: "east", // 河洛客栈 — Heluo river-road inn (eastern)
  cave_jinshe: "east", // 金蛇洞 — golden snake cave (east coast Jin Yong lore)
  peak_guangming: "east", // 光明顶 — Mingjiao HQ
  home_chengying: "east", // 程瑛 — eastern lyric
  village_wuxia: "east", // riverside village near eastern delta

  // ─── Jianghu wild (catch-all wilderness, generic anchors) ───────────
  // Caves, isolated valleys, peripheral villages, and the more eccentric
  // sects that don't fit a single compass region. Anything not listed
  // above falls through to jianghu_wild via regionOf().
  sect_xingxiu: "jianghu_wild", // 星宿派 — sea of stars, isolated
  sect_xuedao: "jianghu_wild", // 血刀门 — wandering evil sect
  sect_wudu: "jianghu_wild", // 五毒教 — Miao tribes, far frontier
  sect_beggars: "jianghu_wild", // 丐帮 — everywhere, no single region
  city_lingxiao: "jianghu_wild", // 凌霄城 — sky city, isolated
  market_miao: "jianghu_wild", // Miao market
  pool_heilong: "jianghu_wild", // 黑龙潭 — Black Dragon Pool
  sea_xingxiu: "jianghu_wild", // 星宿海 — far frontier sea
  cliff_heimu: "jianghu_wild", // 黑木崖 — legendary cliff, neutral
  valley_jueqing: "jianghu_wild", // 绝情谷
  valley_jueqing_bottom: "jianghu_wild", // 绝情谷底
  valley_baihua: "jianghu_wild", // 百花谷
  cave_zhizhu: "jianghu_wild", // 蜘蛛洞
  cave_tangshi: "jianghu_wild", // 唐诗山洞
  cave_treasure: "jianghu_wild", // 藏宝洞
  cave_chuangwang: "jianghu_wild", // 闯王宝藏
  cave_zixiu: "jianghu_wild", // 自修山洞
  mt_tiezhang: "jianghu_wild", // 铁掌山
  isle_wane: "jianghu_wild", // 万鳄岛 — crocodile isle
  isle_boni: "jianghu_wild", // 渤泥岛
  isle_wuming: "jianghu_wild", // 无名岛 — nameless isle
  home_hufei: "jianghu_wild", // 胡斐 — wandering swordsman
  home_nanxian: "jianghu_wild",
  home_tianboguang: "jianghu_wild", // 田伯光 — frontier brigand
  home_miaoren: "jianghu_wild", // 苗人凤 — frontier hero
  home_yanji: "jianghu_wild", // 阎基
  home_beichou: "jianghu_wild", // 北丑
};

export const JIANGHU_DEFAULT_REGION: Region = "jianghu_wild";

export function regionOf(locationId: string | null | undefined): Region {
  if (!locationId) return JIANGHU_DEFAULT_REGION;
  return LOCATION_REGION[locationId] ?? JIANGHU_DEFAULT_REGION;
}

// Adjacency graph for region propagation. Used by rumor-engine to
// expand a rumor outward over time. "global" sits at the center and
// connects to every region.
export const REGION_NEIGHBORS: Record<Region, readonly Region[]> = {
  heartland: ["north", "south", "west", "east"],
  north: ["heartland", "west", "east"],
  south: ["heartland", "west", "east"],
  west: ["heartland", "north", "south"],
  east: ["heartland", "north", "south"],
  jianghu_wild: ["heartland"],
  global: ["heartland", "north", "south", "west", "east", "jianghu_wild"],
};

// Per-channel filter — which channels does each scene-channel category
// admit? Inn pulls a wide mix; sect halls only see internal news.
export const CHANNEL_ADMITS: Record<RumorChannel, readonly RumorChannel[]> = {
  inn: ["inn", "market", "wilderness"],
  market: ["market", "inn"],
  sect_internal: ["sect_internal"],
  wilderness: ["wilderness"],
};
