import type {
  LocationScene,
  RouteDestination,
  RouteRef,
  RouteScene,
  Scene,
} from "../types";

// 84 locations from location.md (cities, sects, islands, terrain, caves,
// temples/palaces, mansions, taverns, NPC homes, miscellaneous, plus one new
// sect). Each leaf is a bare LocationScene with a description (Chinese name +
// note from location.md) and a single "กลับสู่แผนที่" route back to the world
// hub. Authors flesh these out by appending NPCs, additional routes, and
// onEnter effects directly to the leaf entries.
//
// Structure:
//   world_journey  ← the hub
//     ├─ cat_cities    → 4 cities
//     ├─ cat_sects     → 17 sects
//     ├─ cat_isles     → 10 islands
//     ├─ cat_terrain   → 11 mountains/cliffs
//     ├─ cat_caves     → 12 caves/valleys
//     ├─ cat_temples   → 4 temples/palaces
//     ├─ cat_mansions  → 4 mansions
//     ├─ cat_inns      → 4 taverns
//     ├─ cat_homes     → 11 NPC homes
//     └─ cat_misc      → 7 misc (incl. the new "สำนักดาบโลหิต")
//
// Each leaf has 1–4 directed-edge routes to other leaves built by the
// connectivity pass below.

// ─── Helpers ──────────────────────────────────────────────────────────

function leaf(id: string, name: string, description: string): LocationScene {
  // routes are populated below in the connectivity pass — every leaf gets
  // 1–4 directed-edge routes to other leaves plus a final "back to world map"
  // fallback. Authors can append more routes after this file mutates them.
  return { kind: "location", id, name, description, npcs: [], routes: [] };
}

function destOf(loc: LocationScene, hint?: string): RouteDestination {
  return { locationId: loc.id, label: loc.name, hint };
}

function categoryRoute(
  id: string,
  label: string,
  description: string,
  leaves: LocationScene[],
): RouteScene {
  return {
    kind: "route",
    id,
    label,
    description,
    destinations: leaves.map((l) => destOf(l)),
  };
}

// ─── Cities (4) ───────────────────────────────────────────────────────
const CITIES: LocationScene[] = [
  leaf("city_capital", "นครหลวง", "京城 · ศูนย์กลางเกม · ทอผ้า ตัดเสื้อ เกษตร"),
  leaf("city_xixia", "ซีเซี่ย", "西夏 · ขุดแร่ ล่าสัตว์ ตีเหล็ก"),
  leaf("city_dali", "ต้าหลี่", "大理 · ช่างไม้ ตัดไม้ · บ้านสกุลต้วน"),
  leaf("city_yangzhou", "หยางโจว", "扬州 · หล่อดาบ ทำอาหาร ตกปลา"),
];

// ─── Sects (17) ───────────────────────────────────────────────────────
const SECTS: LocationScene[] = [
  leaf("sect_shaolin", "วัดเส้าหลิน", "少林派 · เขาซงซาน · Tank หลัก · ชายล้วน"),
  leaf("sect_wudang", "อู่ตัง / บู๊ตึ๊ง", "武当派 · เขาอู่ตัง · กระบี่ · แลกปราณเป็นเลือด"),
  leaf("sect_emei", "ง้อไบ๊", "峨嵋派 · เขาง้อไบ๊ · หญิงล้วน · Heal ได้"),
  leaf("sect_huashan", "หัวซาน", "华山派 · เขาหัวซาน · ดาบ · ตีเหล็กไฟ"),
  leaf("sect_hengshan_south", "เฮิงซาน", "衡山派 · เขาเฮิงซาน (5 ยอด)"),
  leaf("sect_hengshan_north", "เหิงซาน", "恒山派 · เขาเหิงซาน · นักพรตหญิง · ดาบซ่อนในเครื่องดนตรี"),
  leaf("sect_songshan", "ซงซาน", "嵩山派 · เขาซงซาน · คู่แข่งเส้าหลิน"),
  leaf("sect_taishan", "ไท่ซาน", "泰山派 · เขาไท่ซาน"),
  leaf("sect_quanzhen", "ฉวนเจิน / ชวนจิน", "全真教 · พระราชวังจงหยาง · พรรคนักพรต"),
  leaf("sect_gumu", "กู่มู่ / โบราณสุสาน", "古墓派 · ใต้ดินเขาจงหนาน · วิชาหยก"),
  leaf("sect_lingjiu", "ลิ่งจิ้วกง", "灵鹫宫 · เทียนซาน · พรรคหญิงล้วน"),
  leaf("sect_beggars", "พรรคยาจก", "丐帮 · ทั่วยุทธจักร · ใหญ่ที่สุดในยุทธจักร"),
  leaf("sect_ming", "พรรคสว่างมืด (มิ่งเจี้ยว)", "明教 · ยอดกวงมิ่งติ่ง · ฝ่ายกลาง"),
  leaf("sect_xiaoyao", "พรรคสราญรมย์ (เซียวหยาว)", "逍遥派 · ลึกลับ"),
  leaf("sect_xingxiu", "สำนักดาวดึงส์ (เห็งซัว)", "星宿派 · ทะเลดาว · ดิงชุนชิว"),
  leaf("sect_xuedao", "สำนักเลือดดาบ", "血刀门 · ฝ่ายอธรรม"),
  leaf("sect_wudu", "พรรคเบญจพิษ", "五毒教 · ยูนนาน · ชนเผ่าเมี่ยว"),
];

// ─── Islands (10) ─────────────────────────────────────────────────────
const ISLES: LocationScene[] = [
  leaf("isle_taohua", "เกาะดอกท้อ", "桃花岛 · บ้านฮ่วงเอี้ยะซือ · สวนดอกท้อ"),
  leaf("isle_xiake", "เกาะอัศวิน", "侠客岛 · เกาะลึกลับ · เพลงกระบี่บนผนัง"),
  leaf("isle_binghuo", "เกาะน้ำแข็งเพลิง", "冰火岛 · เกาะห่างไกล"),
  leaf("isle_yuanyang", "เกาะยกซาน (นกกระยาง)", "鸳鸯岛"),
  leaf("isle_wane", "เกาะจระเข้หมื่นตัว", "万鳄岛"),
  leaf("isle_pili", "เกาะฟ้าผ่า", "霹雳堂"),
  leaf("isle_lingshe", "เกาะงูวิเศษ", "灵蛇岛"),
  leaf("isle_boni", "เกาะโรตี", "渤泥岛"),
  leaf("isle_shenlong", "เกาะมังกรเทพ", "神龙岛 · ลัทธิมังกรเทพ"),
  leaf("isle_wuming", "เกาะไร้ชื่อ", "无名岛"),
];

// ─── Terrain: mountains & cliffs (11) ─────────────────────────────────
const TERRAIN: LocationScene[] = [
  leaf("mt_baituo", "ภูเขาขาวอูต", "白驼山"),
  leaf("mt_tiezhang", "ภูเขาเหล็กฝ่ามือ", "铁掌山 · สำนักมือเหล็ก"),
  leaf("mt_wuliang", "ภูเขาวุ่นเหลียน", "无量山"),
  leaf("mt_kunlun", "เขาคุนหลุน", "昆仑山 · สำนักคุนหลุน"),
  leaf("mt_kunlun_immortal", "นิรันดร์คุนหลุน", "昆仑仙境 · ลึกกว่าเขาคุนหลุน"),
  leaf("cliff_motian", "ยอดเขามรณะ", "摩天崖"),
  leaf("cliff_heimu", "ไม้ดำหน้าผา", "黑木崖 · ที่อยู่ตงฟางปู้ไป่"),
  leaf("cliff_yunhe", "หน้าผาหมู่ก้อน", "云鹤崖"),
  leaf("cliff_siguo", "หน้าผาหินอาถรรพ์", "思过崖 · ที่ลิ้งฮูฉงฝึกวิทยายุทธ์"),
  leaf("mt_leigu", "ป้อมหลำกู่", "擂鼓山"),
  leaf("sea_xingxiu", "เขาดาวฤกษ์ทะเล", "星宿海 · บ้านดิงชุนชิว"),
];

// ─── Caves & valleys (12) ─────────────────────────────────────────────
const CAVES: LocationScene[] = [
  leaf("valley_jueqing", "หุบเขาตัดใจ", "绝情谷"),
  leaf("valley_jueqing_bottom", "ก้นหุบเขาตัดใจ", "绝情谷底 · ลึกกว่าอีกชั้น"),
  leaf("cave_bingcan", "ถ้ำน้ำแข็งไหม", "冰蚕秘洞"),
  leaf("cave_jinshe", "ถ้ำงูทอง", "金蛇洞 · สมบัติงูทอง"),
  leaf("cave_zhizhu", "ถ้ำแมงมุม", "蜘蛛洞"),
  leaf("valley_hudie", "ถ้ำหุบเขาผีเสื้อ", "蝴蝶谷 · หมอพเนจร"),
  leaf("cave_tangshi", "ถ้ำบทกวีถัง", "唐诗山洞"),
  leaf("cave_yangguo", "ถ้ำหยางกั้ว", "杨过山洞"),
  leaf("cave_treasure", "คลังสมบัติลับ", "藏宝洞"),
  leaf("cave_chuangwang", "สมบัติราชาโจร", "闯王宝藏"),
  leaf("valley_baihua", "หุบเขาร้อยดอกไม้", "百花谷"),
  leaf("cave_zixiu", "ถ้ำฝึกวิทยายุทธ์", "自修山洞 · เฉพาะ JY Online"),
];

// ─── Temples / palaces / fortresses (4) ──────────────────────────────
const TEMPLES: LocationScene[] = [
  leaf("temple_dalun", "วิหารล้อลม", "大轮寺"),
  leaf("temple_tianning", "วิหารหลวงจีนสวรรค์", "天宁寺"),
  leaf("palace_zhongyang", "พระราชวังจงหยาง", "重阳宫 · ที่อยู่ฉวนเจินเจี้ยว"),
  leaf("city_lingxiao", "เมืองลิ้งเซียว", "凌霄城"),
];

// ─── Mansions / villas (4) ────────────────────────────────────────────
const MANSIONS: LocationScene[] = [
  leaf("villa_yanzi", "คุ้มนกนางแอ่น", "燕子坞 · ตระกูลม่อหยง"),
  leaf("villa_yaowang", "คุ้มสมุนไพร", "药王庄"),
  leaf("villa_meizhuang", "ดงดอกท้อ", "梅庄 · สี่อรหันต์ดอกท้อ"),
  leaf("villa_fuwei", "บ้านค้าขายโฝวเวย", "福威镖局"),
];

// ─── Inns / taverns (4) ───────────────────────────────────────────────
const INNS: LocationScene[] = [
  leaf("inn_yuelai", "โรงเตี๊ยมยั่วไหล", "悦来客栈 · กลางเกม"),
  leaf("inn_youjian", "โรงเตี๊ยมมีหว่าง", "有间客栈"),
  leaf("inn_gaosheng", "โรงเตี๊ยมเก้าอี้สูง", "高升客栈"),
  leaf("inn_heluo", "โรงเตี๊ยมห้วอลั่ว", "河洛客栈"),
];

// ─── NPC homes (11) ───────────────────────────────────────────────────
const HOMES: LocationScene[] = [
  leaf("home_hong", "บ้านโฮ่งชีก๋ง", "洪七公居 · โฮ่งชีก๋ง (หัวหน้ายาจก)"),
  leaf("home_hufei", "บ้านฮูเฝย์", "胡斐居 · ฮูเฝย์"),
  leaf("home_chengkun", "บ้านเฉิงคุน", "成昆居 · เฉิงคุน"),
  leaf("home_xuemuhua", "บ้านแพทย์น้ำจืด", "薛慕华居 · เซวี่ยมู่หัว"),
  leaf("home_nanxian", "บ้านหนานเสียน", "南贤居 · หนานเสียน"),
  leaf("home_yideng", "บ้านอีตัง", "一灯居 · อีตัง (หนานตี้)"),
  leaf("home_tianboguang", "บ้านนักรบชายแดน", "田伯光居 · เถียนป๋อกวง"),
  leaf("home_miaoren", "บ้านมยง", "苗人凤居 · เหมียวเหรินเฟิง"),
  leaf("home_chengying", "บ้านเฉิงอิ๋ง", "程瑛居"),
  leaf("home_yanji", "บ้านหยานจี", "阎基居"),
  leaf("home_beichou", "บ้านเป่ยฉิว", "北丑居"),
];

// ─── Misc + the new "สำนักดาบโลหิต" (7) ───────────────────────────────
const MISC: LocationScene[] = [
  leaf("desert_ruins", "ทะเลทรายร้าง", "沙漠废墟"),
  leaf("tribe_huizu", "ชนเผ่าหุยซู", "回族部落"),
  leaf("market_miao", "ตลาดชาวเมี่ยว", "苗族集市 · เฉพาะ JY Online"),
  leaf("pool_heilong", "มังกรดำสระน้ำ", "黑龙潭"),
  leaf("peak_guangming", "ยอดแสงสว่าง", "光明顶 · มิ่งเจี้ยว"),
  leaf("home_player", "คฤหาสน์ตนเอง", "自宅 · บ้านของผู้เล่น"),
  leaf("sect_xueyu", "สำนักดาบโลหิต", "ฝ่ายอธรรม · สำนักใหม่"),
];

// All leaf locations across every category — the spawn pool for entering
// world_journey. The hub's onEnter picks one at random and redirects there
// so the player always lands at a fresh place. The hub's `routes` are kept
// as a fallback / authoring reference but are not normally rendered (the
// redirect fires before the location screen draws).
const ALL_LEAVES: LocationScene[] = [
  ...CITIES,
  ...SECTS,
  ...ISLES,
  ...TERRAIN,
  ...CAVES,
  ...TEMPLES,
  ...MANSIONS,
  ...INNS,
  ...HOMES,
  ...MISC,
];

const LEAVES_BY_ID = new Map(ALL_LEAVES.map((l) => [l.id, l] as const));

// ─── Connectivity graph ───────────────────────────────────────────────
// Each leaf gets 1–4 directed-edge routes to other leaves so a player can
// travel between locations without bouncing through the world map.
//
// The graph is built in three passes:
//   1. Hand-curated edges for obvious geographic / thematic pairs from
//      location.md (e.g., shaolin and songshan both sit on เขาซงซาน).
//   2. Deterministic random fill — for each leaf, top up to a target
//      degree using a seeded PRNG so the layout stays stable across
//      reloads. Degree caps at 4 to keep the location screen readable.
//   3. Connectivity guarantee — every leaf must end up with at least one
//      outbound edge; isolated leaves get attached to the lowest-degree
//      neighbour we can find.
//
// After the graph is built we generate one RouteScene per directed edge
// (`route_<src>__to__<dst>`) and rewrite each leaf's `routes` array to
// reference its outgoing edges plus a final "back to world map" fallback.

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAND_EDGES: ReadonlyArray<readonly [string, string]> = [
  // Mountains shared between sects / locations
  ["sect_shaolin", "sect_songshan"], // both at เขาซงซาน
  ["sect_quanzhen", "palace_zhongyang"], // 全真教 lives at 重阳宫
  ["sect_xingxiu", "sea_xingxiu"], // ดิงชุนชิว's home + seat
  ["valley_jueqing", "valley_jueqing_bottom"], // upper / lower
  ["mt_kunlun", "mt_kunlun_immortal"], // outer / inner
  ["sect_huashan", "cliff_siguo"], // 思过崖 sits on 华山
  ["sect_ming", "peak_guangming"], // 明教 at 光明顶
  ["sect_xueyu", "sect_xuedao"], // both blood-blade sects
  ["sect_wudu", "city_dali"], // 五毒教 in ยูนนาน, near ต้าหลี่
  ["sect_emei", "city_dali"], // ง้อไบ๊ near ต้าหลี่
  ["sect_gumu", "sect_quanzhen"], // 古墓 below 终南山, 全真 above
  // Flagship cities link to nearby landmarks
  ["city_capital", "city_yangzhou"],
  ["city_capital", "inn_yuelai"],
  ["city_yangzhou", "villa_meizhuang"], // ดงดอกท้อ (สี่อรหันต์) by 扬州
  ["city_xixia", "desert_ruins"], // ทะเลทราย near ซีเซี่ย
  ["tribe_huizu", "city_xixia"],
  ["market_miao", "sect_wudu"],
  // Player home is the home base — link to the capital
  ["home_player", "city_capital"],
];

const adj = new Map<string, Set<string>>();
for (const l of ALL_LEAVES) adj.set(l.id, new Set());

function addEdge(a: string, b: string): boolean {
  if (a === b) return false;
  const aAdj = adj.get(a);
  const bAdj = adj.get(b);
  if (!aAdj || !bAdj) return false;
  if (aAdj.has(b)) return false;
  aAdj.add(b);
  bAdj.add(a);
  return true;
}

for (const [a, b] of HAND_EDGES) addEdge(a, b);

const MAX_DEGREE = 4;
const rng = makeRng(0xc0ffee42);

for (let i = 0; i < ALL_LEAVES.length; i++) {
  const src = ALL_LEAVES[i]!;
  const srcAdj = adj.get(src.id)!;
  // Target between 1 and 4 edges. Hand-curated edges count toward this.
  const target = 1 + Math.floor(rng() * MAX_DEGREE);
  let attempts = 0;
  while (srcAdj.size < target && attempts < 200) {
    attempts++;
    const j = Math.floor(rng() * ALL_LEAVES.length);
    const dst = ALL_LEAVES[j]!;
    if (dst.id === src.id) continue;
    if (srcAdj.has(dst.id)) continue;
    const dstAdj = adj.get(dst.id)!;
    if (dstAdj.size >= MAX_DEGREE) continue;
    addEdge(src.id, dst.id);
  }
}

// Connectivity guarantee — no isolated leaves.
for (const lf of ALL_LEAVES) {
  if (adj.get(lf.id)!.size > 0) continue;
  let best: LocationScene | null = null;
  for (const cand of ALL_LEAVES) {
    if (cand.id === lf.id) continue;
    const candDeg = adj.get(cand.id)!.size;
    if (best === null || candDeg < adj.get(best.id)!.size) best = cand;
  }
  if (best) addEdge(lf.id, best.id);
}

// One RouteScene per directed edge. Naming: route_<src>__to__<dst>.
function edgeRouteId(srcId: string, dstId: string): string {
  return `route_${srcId}__to__${dstId}`;
}

// Compass directions. Each undirected edge gets a single axis assignment so
// that going "ทางเหนือ" from A to B forces the reverse trip B→A to be
// "ทางใต้" — never the same direction. Without this, both endpoints could
// label the same edge as "north", which would let the player loop by walking
// "north" repeatedly.
type Dir = "N" | "S" | "E" | "W";
const DIRS: readonly Dir[] = ["N", "S", "E", "W"];
const OPPOSITE: Record<Dir, Dir> = { N: "S", S: "N", E: "W", W: "E" };

const DIR_INFO: Record<Dir, { label: string; hint: string }> = {
  N: { label: "ทางเหนือ", hint: "เส้นทางมุ่งสู่ทิศเหนือ" },
  S: { label: "ทางใต้", hint: "เส้นทางมุ่งสู่ทิศใต้" },
  E: { label: "ทางตะวันออก", hint: "เส้นทางมุ่งสู่ทิศตะวันออก" },
  W: { label: "ทางตะวันตก", hint: "เส้นทางมุ่งสู่ทิศตะวันตก" },
};

// Backtracking assignment: pick a direction d at endpoint a for each
// undirected edge (a, b) such that a has not used d yet and b has not used
// the opposite of d yet. Edges are sorted by sum of endpoint degrees (most
// constrained first) so the tight edges get assigned before the surrounding
// directions are used up. With max degree 4 = number of directions, plain
// greedy can paint itself into a corner — backtracking always finds a valid
// assignment when one exists. If backtracking ever fails (graph too dense to
// 4-edge-colour with paired-opposite constraint), the still-unassigned edges
// fall back to a numbered label downstream.
const dirOf = new Map<string, Map<string, Dir>>(); // src -> dst -> direction at src
const usedAt = new Map<string, Set<Dir>>();
for (const l of ALL_LEAVES) {
  dirOf.set(l.id, new Map());
  usedAt.set(l.id, new Set());
}

const undirectedEdges: [string, string][] = [];
const seenEdge = new Set<string>();
for (const [a, neighbours] of adj) {
  for (const b of neighbours) {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    undirectedEdges.push(a < b ? [a, b] : [b, a]);
  }
}
// Sort by tightness (sum of endpoint degrees, descending). Lex order is the
// tiebreaker so reloads see the same assignment.
undirectedEdges.sort((x, y) => {
  const dx = adj.get(x[0])!.size + adj.get(x[1])!.size;
  const dy = adj.get(y[0])!.size + adj.get(y[1])!.size;
  if (dx !== dy) return dy - dx;
  if (x[0] !== y[0]) return x[0].localeCompare(y[0]);
  return x[1].localeCompare(y[1]);
});

function assignDirections(idx: number): boolean {
  if (idx >= undirectedEdges.length) return true;
  const [a, b] = undirectedEdges[idx]!;
  const usedA = usedAt.get(a)!;
  const usedB = usedAt.get(b)!;
  for (const d of DIRS) {
    if (usedA.has(d)) continue;
    if (usedB.has(OPPOSITE[d])) continue;
    dirOf.get(a)!.set(b, d);
    dirOf.get(b)!.set(a, OPPOSITE[d]);
    usedA.add(d);
    usedB.add(OPPOSITE[d]);
    if (assignDirections(idx + 1)) return true;
    dirOf.get(a)!.delete(b);
    dirOf.get(b)!.delete(a);
    usedA.delete(d);
    usedB.delete(OPPOSITE[d]);
  }
  return false;
}

assignDirections(0);

const EDGE_ROUTES: RouteScene[] = [];

for (const src of ALL_LEAVES) {
  // Sort outbound edges by direction order (N → S → E → W) so the location
  // screen always lists routes in a predictable compass order.
  const dstIds = [...adj.get(src.id)!];
  dstIds.sort((x, y) => {
    const dx = dirOf.get(src.id)!.get(x);
    const dy = dirOf.get(src.id)!.get(y);
    const ix = dx ? DIRS.indexOf(dx) : DIRS.length;
    const iy = dy ? DIRS.indexOf(dy) : DIRS.length;
    if (ix !== iy) return ix - iy;
    return x.localeCompare(y);
  });

  const outRoutes: RouteRef[] = [];
  let unassignedCount = 0;
  for (const dstId of dstIds) {
    const dst = LEAVES_BY_ID.get(dstId)!;
    const rid = edgeRouteId(src.id, dst.id);
    const dir = dirOf.get(src.id)!.get(dst.id);
    const info = dir
      ? DIR_INFO[dir]
      : {
          label: `เส้นทางที่ ${++unassignedCount}`,
          hint: "เส้นทางออกจากที่นี่",
        };
    outRoutes.push({
      routeSceneId: rid,
      label: info.label,
      hint: info.hint,
    });
    EDGE_ROUTES.push({
      kind: "route",
      id: rid,
      label: `${info.label}จาก${src.name}`,
      description: `เส้นทาง${info.label}ที่ทอดออกจาก${src.name} ปลายทางคือ...`,
      destinations: [
        { locationId: dst.id, label: dst.name, hint: dst.description },
      ],
    });
  }
  src.routes = outRoutes;
}

// ─── World hub ────────────────────────────────────────────────────────
const WORLD_HUB: LocationScene = {
  kind: "location",
  id: "world_journey",
  name: "ยุทธจักร — แผนที่โลก",
  description:
    "เจ้ายืนอยู่บนสี่แยกแห่งยุทธภพ มองเห็นเส้นทางสู่ดินแดนต่าง ๆ ทั่วทั้งแผ่นดิน เลือกทางที่จะไป",
  npcs: [],
  routes: [
    { routeSceneId: "cat_cities", label: "🏙 เมืองหลัก (4)", hint: "ศูนย์กลางการค้าและการปกครอง" },
    { routeSceneId: "cat_sects", label: "⚔ สำนักและพรรค (17)", hint: "ที่ตั้งของสำนักวิทยายุทธ์" },
    { routeSceneId: "cat_isles", label: "🏝 เกาะ (10)", hint: "เกาะแก่งกลางมหาสมุทร" },
    { routeSceneId: "cat_terrain", label: "🏔 ภูเขาและหน้าผา (11)", hint: "เขาสูงและหน้าผาสำคัญ" },
    { routeSceneId: "cat_caves", label: "🕳 ถ้ำและหุบเขา (12)", hint: "ถ้ำลับและหุบเขาห่างไกล" },
    { routeSceneId: "cat_temples", label: "🏛 วัด · วัง · ป้อม (4)", hint: "ศาสนสถานและที่หลวง" },
    { routeSceneId: "cat_mansions", label: "🏠 คุ้มและคฤหาสน์ (4)", hint: "ตระกูลขุนนางในบู๊ลิ้ม" },
    { routeSceneId: "cat_inns", label: "🍵 โรงเตี๊ยม (4)", hint: "จุดพักการเดินทาง" },
    { routeSceneId: "cat_homes", label: "👤 บ้าน NPC (11)", hint: "บ้านของยอดยุทธในตำนาน" },
    { routeSceneId: "cat_misc", label: "🌍 อื่น ๆ (7)", hint: "สถานที่หลากหลาย" },
  ],
  onEnter: [{ t: "gotoRandom", sceneIds: ALL_LEAVES.map((l) => l.id) }],
};

// Connector — village → world hub. Referenced from village.routes in scenes.ts.
const VILLAGE_TO_WORLD: RouteScene = {
  kind: "route",
  id: "village_to_world",
  label: "ออกเดินทางสู่ยุทธภพ",
  description:
    "เส้นทางใหญ่นำเจ้าออกจากหมู่บ้านสู่โลกกว้าง เจ้ายืนอยู่บนทางแยกที่ผู้คนต่างเดินทางไปทั่วบู๊ลิ้ม",
  destinations: [
    { locationId: "world_journey", label: "ยุทธจักร — แผนที่โลก", hint: "เริ่มผจญภัย" },
  ],
};

// ─── Category routes — derived from each leaf array ───────────────────
const CATEGORY_ROUTES: RouteScene[] = [
  categoryRoute("cat_cities", "ทางสู่เมืองหลัก", "เส้นทางสายหลักเชื่อมเมืองใหญ่ของแผ่นดิน", CITIES),
  categoryRoute("cat_sects", "ทางสู่สำนักและพรรค", "เส้นทางสู่สำนักวิทยายุทธ์ทั่วยุทธจักร", SECTS),
  categoryRoute("cat_isles", "ทางสู่เกาะกลางสมุทร", "ท่าเรือออกสู่เกาะลี้ลับต่าง ๆ", ISLES),
  categoryRoute("cat_terrain", "ทางสู่ภูเขาและหน้าผา", "เส้นทางขึ้นเขาสู่ยอดและหน้าผาสำคัญ", TERRAIN),
  categoryRoute("cat_caves", "ทางสู่ถ้ำและหุบเขา", "เส้นทางลับสู่ถ้ำและหุบเขาห่างไกล", CAVES),
  categoryRoute("cat_temples", "ทางสู่วัดและวัง", "เส้นทางสู่ศาสนสถานและที่ของหลวง", TEMPLES),
  categoryRoute("cat_mansions", "ทางสู่คุ้มและคฤหาสน์", "เส้นทางสู่ตระกูลขุนนางในบู๊ลิ้ม", MANSIONS),
  categoryRoute("cat_inns", "ทางสู่โรงเตี๊ยม", "เส้นทางสู่จุดพักการเดินทาง", INNS),
  categoryRoute("cat_homes", "ทางสู่บ้าน NPC", "เส้นทางสู่บ้านของยอดยุทธในตำนาน", HOMES),
  categoryRoute("cat_misc", "ทางสู่ดินแดนอื่น ๆ", "เส้นทางสู่สถานที่อื่นในแผ่นดิน", MISC),
];

// ─── Public export ────────────────────────────────────────────────────
// Combined: hub + all routes (return + village + per-category + per-edge) +
// all leaves. scenes.ts spreads this into SCENES.
export const WORLD_MAP_SCENES: Scene[] = [
  WORLD_HUB,
  VILLAGE_TO_WORLD,
  ...CATEGORY_ROUTES,
  ...EDGE_ROUTES,
  ...CITIES,
  ...SECTS,
  ...ISLES,
  ...TERRAIN,
  ...CAVES,
  ...TEMPLES,
  ...MANSIONS,
  ...INNS,
  ...HOMES,
  ...MISC,
];
