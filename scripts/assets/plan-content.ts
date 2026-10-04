/**
 * What the asset library contains: the hand-written subject lists that
 * build-asset-plan.ts turns into PixelLab jobs (docs/assets.md). Data only.
 *
 * Each subject is one KIND of thing ([key, Thai name, English subject, …]);
 * a v2 job draws 16 (or 4 / 64) designs of it and the curation keeps the
 * clearly different ones.
 */

export type ArtRegion = "heartland" | "east" | "south" | "north" | "west";
export const ART_REGIONS: readonly ArtRegion[] = ["heartland", "east", "south", "north", "west"];

/** How an asset stands on the map: decides its footprint and layer at import. */
export type AssetKind =
  | "building"   // footprint: lower ~30 % of the base, 80 % wide
  | "solid"      // small base box
  | "tall"       // narrow base box (posts, statues, poles)
  | "tree"       // trunk box
  | "flat"       // no footprint, ground layer (rugs, plots, puddles, flowers)
  | "low"        // walk-through decoration on the object layer (grass, small plants)
  | "overhead"   // always over characters (hanging lanterns, banners strung overhead)
  | "actor"      // characters / monsters
  | "tile" | "icon" | "fx" | "ui";

export const REGION_LOOK: Record<ArtRegion, string> = {
  heartland: "imperial central-plains style: grey clay roof tiles, dark red lacquered pillars, grey brick, carved wooden lattice",
  east: "Jiangnan water-town style: whitewashed walls, black tile roofs with upturned eaves, dark timber, canal-side stone",
  south: "Dali and Miao southwest style: bamboo and timber stilt construction, Bai white walls with painted borders, tropical",
  north: "northern frontier and Xixia style: rammed-earth walls, rough weathered timber, felt and hide, dusty",
  west: "western desert and high-mountain style: flat-roofed stone and mud-brick, prayer flags, weathered sandstone",
};
export const REGION_THAI: Record<ArtRegion, string> = { heartland: "ภาคกลาง", east: "ตะวันออก", south: "ใต้", north: "เหนือ", west: "ตะวันตก" };

// [key, Thai, English subject, subcategory, mapWidth (map units)]
export type BuildingSubject = [string, string, string, string, number];

/** 10 building kinds per region; each v2 call at 128 px gives 4 designs. */
export const BUILDINGS: Record<ArtRegion, BuildingSubject[]> = {
  heartland: [
    ["courtyard_house", "บ้านสี่ประสาน", "a grey-brick courtyard house (siheyuan) with a tiled gate", "house", 200],
    ["teahouse", "โรงน้ำชา", "a two-storey teahouse with a balcony and paper lanterns", "shop", 190],
    ["inn", "โรงเตี๊ยม", "a two-storey roadside inn with a hanging cloth sign (no letters) and a stable shed", "inn", 210],
    ["wine_shop", "ร้านสุรา", "a small tavern with wine jars stacked outside and a fluttering pennant", "shop", 160],
    ["pharmacy", "ร้านขายยา", "a medicine shop with herb drawers visible through the open front", "shop", 160],
    ["smithy", "โรงตีเหล็ก", "a blacksmith's forge shed with a chimney, anvil and glowing furnace", "workshop", 160],
    ["yamen", "ศาลาว่าการ", "a magistrate's yamen hall with a red gate, drum stand and stone steps", "government", 230],
    ["shop_row", "ร้านค้า", "a row of two small shopfronts with cloth awnings", "shop", 200],
    ["shrine_hall", "ศาลเจ้า", "a small Buddhist shrine hall with a red door and incense burner in front", "temple", 170],
    ["granary", "ยุ้งฉาง", "a raised wooden granary storehouse with a tiled roof", "storage", 160],
  ],
  east: [
    ["water_house", "บ้านริมคลอง", "a whitewashed water-town house with horse-head gables and stone steps down to a canal", "house", 190],
    ["canal_teahouse", "โรงน้ำชาริมน้ำ", "a two-storey canal-side teahouse with wooden balconies over the water", "shop", 190],
    ["inn", "โรงเตี๊ยม", "a Jiangnan inn with white walls, black tiles and a courtyard gate", "inn", 210],
    ["silk_shop", "ร้านผ้าไหม", "a silk shop with bolts of coloured silk on racks at the open front", "shop", 160],
    ["garden_pavilion", "ศาลาสวน", "a hexagonal garden pavilion with upturned eaves on a stone platform", "pavilion", 130],
    ["boathouse", "โรงเรือ", "a wooden boathouse on stilts over the water with a small boat moored", "dock", 170],
    ["arched_bridge", "สะพานโค้ง", "an arched stone canal bridge with low railings", "bridge", 200],
    ["paifang", "ซุ้มประตูเผ่ฟาง", "a carved stone memorial archway (paifang) with three openings", "gate", 180],
    ["water_mill", "โรงสีน้ำ", "a timber water mill with a big water wheel", "workshop", 170],
    ["tea_house_small", "ร้านชาเล็ก", "a small one-storey teahouse with bamboo blinds and a black tile roof", "shop", 150],
  ],
  south: [
    ["stilt_house", "เรือนใต้ถุนสูง", "a bamboo and timber stilt house with a thatched roof and a ladder", "house", 180],
    ["bai_house", "บ้านชาวไป๋", "a Bai white-walled house with painted blue borders and a grey tile roof", "house", 190],
    ["drum_tower", "หอกลองชาวเมี่ยว", "a tall multi-eaved wooden Miao drum tower", "tower", 140],
    ["wind_rain_bridge", "สะพานลมฝน", "a covered wooden wind-and-rain bridge with small pavilions on top", "bridge", 220],
    ["stilt_granary", "ยุ้งข้าวใต้ถุน", "a small granary raised on wooden stilts with a thatched roof", "storage", 120],
    ["dali_temple", "วัดต้าหลี่", "a southern Buddhist temple hall with a white pagoda behind it", "temple", 200],
    ["market_hut", "เพิงตลาด", "an open-sided bamboo market hut with a palm-leaf roof", "shop", 140],
    ["bamboo_teahouse", "โรงน้ำชาไม้ไผ่", "a bamboo teahouse on a raised deck with hanging lanterns", "shop", 170],
    ["herbalist_hut", "กระท่อมหมอยา", "a herbalist's wooden hut with drying herbs hanging under the eaves", "house", 150],
    ["hunter_lodge", "กระท่อมพราน", "a jungle hunter's log lodge with animal hides and a palm roof", "house", 150],
  ],
  north: [
    ["earth_house", "บ้านดินอัด", "a rammed-earth house with a flat timber roof and small windows", "house", 180],
    ["watchtower", "หอสังเกตการณ์", "a timber frontier watchtower on a rammed-earth base", "tower", 110],
    ["yurt", "กระโจมสักหลาด", "a round white felt yurt tent with a wooden door", "tent", 130],
    ["stable", "คอกม้า", "an open timber stable with a hay loft and hitching rail", "farm", 180],
    ["fort_gate", "ประตูป้อมชายแดน", "a frontier fort gate in a rammed-earth wall with a wooden gatehouse", "gate", 220],
    ["caravanserai", "โรงเตี๊ยมกองคาราวาน", "a fortified roadside caravan inn with an earthen courtyard wall", "inn", 230],
    ["barracks", "ค่ายทหาร", "a long low timber barracks with weapon racks by the door", "military", 220],
    ["forge", "โรงตีเหล็กชายแดน", "a frontier blacksmith shed of rough timber with a stone furnace", "workshop", 160],
    ["log_cabin", "กระท่อมไม้ซุงหิมะ", "a snow-covered log cabin with a smoking chimney", "house", 160],
    ["storehouse", "โรงเก็บเสบียง", "a sturdy timber storehouse with a sod roof", "storage", 160],
  ],
  west: [
    ["stone_house", "บ้านหินหลังคาเรียบ", "a flat-roofed stone house with small windows and prayer flags on the roof", "house", 180],
    ["mudbrick_house", "บ้านอิฐดิน", "a mud-brick desert house with a flat roof and a wooden ladder to the roof", "house", 170],
    ["caravanserai", "คาราวานเซราย", "a desert caravanserai with thick mud walls and an arched gate", "inn", 240],
    ["monastery", "อารามหิมาลัย", "a whitewashed Himalayan monastery hall with a red-brown parapet", "temple", 230],
    ["stupa", "สถูปขาว", "a white chorten stupa on a square stone base", "temple", 110],
    ["stone_tower", "หอหินเฝ้าระวัง", "a tall square stone watchtower of stacked slate", "tower", 110],
    ["nomad_tent", "กระโจมขนจามรี", "a black yak-hair nomad tent with ropes and stakes", "tent", 150],
    ["domed_hall", "หอโดมเผ่าหุย", "a small domed prayer hall of the Hui tribe with an arched door", "temple", 170],
    ["oasis_well", "ศาลาบ่อน้ำโอเอซิส", "an oasis well house with a wooden pulley under a small roof", "well", 110],
    ["trade_post", "สถานีการค้า", "a desert trading post with a cloth awning over stacked goods", "shop", 180],
  ],
};

/** 15 landmark kinds (v2 160 px, 4 designs each): region "any" unless given. */
export const LANDMARKS: [string, string, string, string, number, ArtRegion | "any"][] = [
  ["imperial_city_gate", "ประตูเมืองหลวง", "a massive imperial city gate tower with a red gate, grey brick wall and a double-eaved gatehouse", "gate", 320, "heartland"],
  ["frontier_city_gate", "ประตูเมืองชายแดน", "a frontier city gate of rammed earth and stone with a timber gate tower", "gate", 300, "north"],
  ["palace_hall", "ท้องพระโรง", "a grand imperial palace hall with golden-yellow glazed roof tiles, red walls and white marble terrace", "palace", 360, "heartland"],
  ["palace_gate", "ประตูวัง", "an imperial palace gate hall with golden roof tiles and five red doors", "palace", 300, "heartland"],
  ["seven_storey_pagoda", "เจดีย์เจ็ดชั้น", "a seven-storey octagonal wooden pagoda with upturned eaves", "pagoda", 150, "any"],
  ["brick_pagoda", "เจดีย์อิฐ", "a tall square brick pagoda with many close eaves", "pagoda", 140, "any"],
  ["sect_main_hall", "หอใหญ่สำนัก", "a martial sect's main hall on a stone terrace with wide steps and incense burner", "sect_hall", 300, "any"],
  ["monastery_hall", "วิหารใหญ่", "a great Buddhist monastery hall with a double-eaved roof and yellow walls", "temple", 300, "any"],
  ["taoist_temple", "อารามเต๋า", "a Taoist temple hall with dark green glazed tiles on a mountain terrace", "temple", 280, "any"],
  ["bell_tower", "หอระฆัง", "a square bell tower with a big bronze bell inside, on a brick base", "tower", 170, "any"],
  ["drum_tower", "หอกลอง", "a drum tower with a huge red drum, on a brick base", "tower", 170, "any"],
  ["grand_paifang", "ซุ้มประตูใหญ่", "a grand five-bay painted wooden memorial archway with glazed roofs", "gate", 260, "any"],
  ["marble_bridge", "สะพานหินอ่อน", "a white marble arched bridge with carved balustrades", "bridge", 260, "heartland"],
  ["fortress_wall", "กำแพงป้อม", "a section of crenellated fortress wall with a small corner tower", "wall", 280, "any"],
  ["arena_stage", "เวทีประลอง", "a raised wooden martial arts tournament stage (leitai) with flags at the corners", "arena", 260, "any"],
];

// [key, Thai, English subject, subcategory, kind, mapWidth, size px]
export type PropSubject = [string, string, string, string, AssetKind, number, number?];

const TOWN_COMMON: PropSubject[] = [
  ["market_stall", "แผงตลาด", "a market stall with a cloth awning and goods on the counter", "stall", "solid", 90, 84],
  ["street_lantern", "เสาโคมไฟ", "a street lantern on a wooden post", "lantern", "tall", 30],
  ["barrels", "ถังไม้", "wooden barrels, a small group", "container", "solid", 40],
  ["crates_sacks", "ลังและกระสอบ", "a pile of wooden crates and grain sacks", "container", "solid", 50],
  ["handcart", "รถเข็น", "a wooden two-wheeled handcart with cargo", "vehicle", "solid", 70],
  ["well", "บ่อน้ำ", "a stone water well with a wooden pulley frame", "well", "solid", 60],
  ["notice_board", "ป้ายประกาศ", "a wooden notice board with blank paper notices", "sign", "tall", 50],
  ["water_vat", "โอ่งน้ำ", "a large glazed water vat or urn", "container", "solid", 35],
  ["pottery", "เครื่องปั้นดินเผา", "clay pottery jars and pots, a small group", "container", "solid", 40],
];
const TOWN_SPECIAL: Record<ArtRegion, PropSubject[]> = {
  heartland: [
    ["stone_lion", "สิงโตหิน", "a carved stone guardian lion on a pedestal", "statue", "tall", 45],
    ["sedan_chair", "เกี้ยว", "a red lacquered sedan chair with carrying poles", "vehicle", "solid", 60],
    ["incense_burner", "กระถางธูป", "a bronze incense burner cauldron on legs", "religious", "solid", 40],
  ],
  east: [
    ["rowboat", "เรือพาย", "a small wooden canal rowboat (wupeng boat) with a black awning", "boat", "solid", 90, 84],
    ["umbrella_stand", "ร่มกระดาษ", "oiled-paper umbrellas, open and closed, on a stand", "decor", "solid", 35],
    ["lotus_tub", "อ่างบัว", "a stone tub with lotus leaves and flowers", "plant", "solid", 40],
  ],
  south: [
    ["bamboo_baskets", "ตะกร้าไม้ไผ่", "woven bamboo baskets of tropical fruit", "container", "solid", 40],
    ["silver_stall", "แผงเครื่องเงินเมี่ยว", "a Miao silver-jewellery stall with a palm-leaf awning", "stall", "solid", 80, 84],
    ["buffalo_cart", "เกวียนควาย", "a wooden buffalo cart without the animal", "vehicle", "solid", 80],
  ],
  north: [
    ["hitching_post", "เสาผูกม้า", "a hitching post with a saddle and bridle hung on it", "farm", "tall", 45],
    ["firewood_pile", "กองฟืน", "a stacked firewood pile under a little snow", "material", "solid", 50],
    ["sledge", "เลื่อนหิมะ", "a wooden sledge loaded with furs", "vehicle", "solid", 70],
  ],
  west: [
    ["prayer_wheel", "กงล้อมนตร์", "a large bronze prayer wheel in a small wooden frame", "religious", "solid", 40],
    ["mani_stones", "กองหินมณี", "a pile of carved mani stones with a pole of prayer flags", "religious", "solid", 50],
    ["camel_packs", "สัมภาระอูฐ", "camel saddle bags and bundled caravan goods on the ground", "container", "solid", 50],
  ],
};
export const TOWN_PROPS: Record<ArtRegion, PropSubject[]> = Object.fromEntries(
  ART_REGIONS.map((r) => [r, [...TOWN_COMMON, ...TOWN_SPECIAL[r]]]),
) as Record<ArtRegion, PropSubject[]>;

export const VILLAGE_PROPS: Record<ArtRegion, PropSubject[]> = {
  heartland: [
    ["haystack", "กองฟาง", "a round haystack", "farm", "solid", 50],
    ["farm_tools", "เครื่องมือทำนา", "farm tools leaning together: hoe, rake, sickle and a basket", "farm", "solid", 40],
    ["wood_fence", "รั้วไม้", "a short section of rustic wooden fence", "fence", "solid", 70],
    ["chicken_coop", "เล้าไก่", "a small wooden chicken coop with chickens", "farm", "solid", 50],
    ["scarecrow", "หุ่นไล่กา", "a scarecrow in a straw hat", "farm", "tall", 35],
    ["veg_plot", "แปลงผัก", "a small vegetable garden plot with rows of cabbages", "farm", "flat", 70],
  ],
  east: [
    ["rice_racks", "ราวตากข้าว", "a bamboo rice-drying rack with sheaves", "farm", "solid", 60],
    ["fishing_nets", "ตากอวน", "fishing nets drying on bamboo poles", "fishing", "solid", 60],
    ["duck_pen", "คอกเป็ด", "a little reed duck pen with ducks", "farm", "solid", 55],
    ["bamboo_fence", "รั้วไผ่", "a short section of woven bamboo fence", "fence", "solid", 70],
    ["fish_baskets", "ข้องปลา", "woven fish traps and baskets", "fishing", "solid", 35],
    ["mulberry_basket", "ตะกร้าเลี้ยงไหม", "flat bamboo trays of silkworms on a stand", "farm", "solid", 50],
  ],
  south: [
    ["rice_terrace_plot", "แปลงนาขั้นบันได", "a small flooded rice paddy plot with green seedlings", "farm", "flat", 80],
    ["bamboo_water_pipe", "รางน้ำไม้ไผ่", "a bamboo water pipe on forked sticks", "farm", "solid", 60],
    ["pig_pen", "คอกหมู", "a bamboo pig pen with a pig", "farm", "solid", 60],
    ["bamboo_fence", "รั้วไผ่", "a short section of split-bamboo fence", "fence", "solid", 70],
    ["beehive_logs", "รังผึ้งท่อนไม้", "log beehives on a wooden stand", "farm", "solid", 40],
    ["drying_chilies", "พริกตากแห้ง", "strings of red chilies and corn drying on a rack", "farm", "solid", 45],
  ],
  north: [
    ["hay_bales", "ฟางมัด", "stacked hay bales", "farm", "solid", 50],
    ["sheep_pen", "คอกแกะ", "a wooden sheep pen with sheep", "farm", "solid", 70],
    ["log_fence", "รั้วซุง", "a short section of split-log fence", "fence", "solid", 70],
    ["water_trough", "รางน้ำสัตว์", "a wooden water trough for animals", "farm", "solid", 50],
    ["drying_hides", "ราวตากหนัง", "animal hides stretched on a wooden frame", "farm", "solid", 50],
    ["firewood_axe", "ตอไม้ผ่าฟืน", "a chopping stump with an axe and split logs", "farm", "solid", 40],
  ],
  west: [
    ["yak_dung_wall", "กองมูลจามรีตากแห้ง", "a low wall of drying yak-dung cakes", "farm", "solid", 60],
    ["goat_pen", "คอกแพะ", "a stone goat pen with goats", "farm", "solid", 70],
    ["stone_fence", "รั้วหิน", "a short dry-stone wall section", "fence", "solid", 70],
    ["clay_oven", "เตาดินอบแป้ง", "a round clay bread oven", "farm", "solid", 40],
    ["loom", "กี่ทอผ้า", "a simple wooden floor loom with a half-woven rug", "craft", "solid", 50],
    ["date_baskets", "ตะกร้าอินทผลัม", "baskets of dried dates and apricots", "container", "solid", 40],
  ],
};

export const INTERIOR_PROPS: PropSubject[] = [
  ["bed", "เตียง", "a canopy bed with curtains (seen from above at an angle)", "bed", "solid", 90, 84],
  ["dining_table", "โต๊ะอาหาร", "a square wooden dining table with four stools", "table", "solid", 70],
  ["armchair", "เก้าอี้ไม้", "a carved rosewood armchair", "chair", "solid", 30],
  ["cabinet", "ตู้ไม้", "a tall lacquered wooden cabinet", "storage", "solid", 45],
  ["scroll_shelf", "ชั้นวางม้วนคัมภีร์", "a bookshelf with scrolls and bound books", "storage", "solid", 55],
  ["folding_screen", "ฉากกั้น", "a painted folding screen with landscape paintings", "decor", "solid", 70],
  ["writing_desk", "โต๊ะเขียนหนังสือ", "a writing desk with brushes, ink stone and paper", "table", "solid", 60],
  ["guqin_table", "โต๊ะพิณ", "a low table with a guqin zither on it", "table", "solid", 55],
  ["ancestral_altar", "แท่นบูชาบรรพชน", "an ancestral altar table with tablets, candles and offerings", "religious", "solid", 60],
  ["chest", "หีบ", "a wooden storage chest with brass fittings", "storage", "solid", 40],
  ["rug", "พรม", "a patterned rug on the floor", "rug", "flat", 90],
  ["floor_cushions", "เบาะรองนั่ง", "round meditation floor cushions", "seat", "flat", 30],
  ["tea_table", "โต๊ะน้ำชา", "a low tea table with a teapot and cups", "table", "solid", 45],
  ["brazier", "เตาถ่านผิงไฟ", "a bronze charcoal brazier", "heater", "solid", 30],
  ["dressing_table", "โต๊ะเครื่องแป้ง", "a dressing table with a bronze mirror", "table", "solid", 50],
  ["medicine_cabinet", "ตู้ยา", "a medicine cabinet with many small drawers", "storage", "solid", 55],
  ["weapon_rack", "ชั้นวางอาวุธ", "an indoor weapon rack with swords and spears", "weapon", "solid", 55],
  ["vase", "แจกัน", "a tall porcelain vase", "decor", "solid", 20],
  ["potted_plant", "ไม้กระถาง", "a potted plant or bonsai in a ceramic pot", "plant", "solid", 25],
  ["candle_stand", "เชิงเทียน", "a standing candle lamp", "light", "tall", 20],
  ["bathtub", "อ่างอาบน้ำไม้", "a round wooden bathtub with a bucket", "bath", "solid", 50],
  ["kitchen_stove", "เตาครัว", "a brick kitchen stove with a wok and steamer baskets", "kitchen", "solid", 70],
  ["hanging_scroll", "ภาพแขวน", "a hanging scroll painting of mountains (no writing)", "decor", "flat", 30],
];

// Nature: [key, Thai, subject, subcategory, kind, mapWidth, size]
export type Biome = "temperate" | "bamboo" | "desert" | "snow" | "swamp" | "coast";
export const BIOME_REGION: Record<Biome, ArtRegion | "any"> = { temperate: "heartland", bamboo: "east", desert: "west", snow: "north", swamp: "south", coast: "east" };
export const BIOME_THAI: Record<Biome, string> = { temperate: "ป่าเขตอบอุ่น", bamboo: "ป่าไผ่", desert: "ทะเลทราย", snow: "หิมะ", swamp: "หนองน้ำ/ป่าร้อนชื้น", coast: "ชายฝั่ง" };
export const NATURE: Record<Biome, PropSubject[]> = {
  temperate: [
    ["pine", "ต้นสน", "a gnarled Chinese pine tree", "tree", "tree", 110, 84],
    ["willow", "ต้นหลิว", "a weeping willow tree", "tree", "tree", 110, 84],
    ["blossom_tree", "ต้นท้อ/เหมย", "a plum or peach blossom tree in flower", "tree", "tree", 100, 84],
    ["maple", "ต้นเมเปิล", "a maple tree with red and golden leaves", "tree", "tree", 100, 84],
    ["bush", "พุ่มไม้", "a leafy green bush", "bush", "low", 40],
    ["boulder", "ก้อนหินใหญ่", "a mossy grey boulder", "rock", "solid", 45],
    ["wildflowers", "ดอกไม้ป่า", "a small clump of wildflowers", "flower", "flat", 20, 40],
  ],
  bamboo: [
    ["bamboo_clump", "กอไผ่", "a tall clump of green bamboo", "bamboo", "tree", 70, 84],
    ["bamboo_grove", "ดงไผ่", "a dense cluster of bamboo stalks with leaves", "bamboo", "tree", 100, 84],
    ["bamboo_young", "หน่อไผ่และไผ่อ่อน", "young bamboo shoots and small bamboo", "bamboo", "low", 30],
    ["fern", "เฟิร์น", "a lush fern plant", "bush", "low", 35],
    ["mossy_rock", "หินมอส", "a moss-covered rock", "rock", "solid", 40],
    ["fallen_log", "ขอนไม้ล้ม", "a fallen mossy log with mushrooms", "log", "solid", 60],
    ["forest_floor", "พืชคลุมดินป่าไผ่", "a small patch of bamboo leaves, mushrooms and pebbles on the forest floor", "ground", "flat", 25, 40],
  ],
  desert: [
    ["poplar", "ต้นป็อปลาร์ทะเลทราย", "a desert poplar (huyang) tree with a twisted trunk", "tree", "tree", 100, 84],
    ["dead_tree", "ต้นไม้ตาย", "a dead bleached desert tree", "tree", "tree", 90, 84],
    ["saxaul_shrub", "พุ่มไม้ทะเลทราย", "a dry desert shrub (saxaul or tamarisk)", "bush", "low", 40],
    ["sandstone", "หินทราย", "a weathered red sandstone rock", "rock", "solid", 50],
    ["bones", "โครงกระดูก", "bleached animal bones and a skull half buried in sand", "bones", "flat", 40],
    ["oasis_reeds", "พงอ้อโอเอซิส", "a clump of oasis reeds and grass", "bush", "low", 35],
    ["desert_pebbles", "ก้อนกรวดทะเลทราย", "a few small desert stones and a tuft of dry grass", "ground", "flat", 20, 40],
  ],
  snow: [
    ["snow_pine", "สนหิมะ", "a snow-covered fir tree", "tree", "tree", 90, 84],
    ["frozen_tree", "ต้นไม้น้ำแข็ง", "a bare tree coated with frost and icicles", "tree", "tree", 90, 84],
    ["snow_rock", "หินหิมะ", "a rock capped with snow", "rock", "solid", 45],
    ["ice_crystal", "ผลึกน้ำแข็ง", "a cluster of blue ice crystals", "crystal", "solid", 35],
    ["snow_bush", "พุ่มไม้หิมะ", "a small bush under snow", "bush", "low", 35],
    ["snow_mound", "กองหิมะ", "a snow drift mound", "ground", "low", 50],
    ["snow_lotus", "บัวหิมะ", "a snow lotus flower among rocks", "flower", "flat", 20, 40],
  ],
  swamp: [
    ["banana_tree", "ต้นกล้วย", "a banana plant with big leaves", "tree", "tree", 80, 84],
    ["palm", "ต้นปาล์ม", "a tropical palm tree", "tree", "tree", 90, 84],
    ["swamp_tree", "ต้นไม้หนองน้ำ", "a gnarled swamp tree with hanging moss and roots in water", "tree", "tree", 100, 84],
    ["giant_fern", "เฟิร์นยักษ์", "a giant tropical fern", "bush", "low", 50],
    ["reeds", "ต้นกก", "a clump of swamp reeds and cattails", "bush", "low", 35],
    ["lotus_pads", "ใบบัว", "floating lotus pads with a pink lotus flower", "water_plant", "flat", 40],
    ["tropical_flowers", "ดอกไม้ป่าร้อนชื้น", "a small clump of bright tropical flowers", "flower", "flat", 20, 40],
  ],
  coast: [
    ["coast_pine", "สนชายฝั่ง", "a windswept coastal pine tree", "tree", "tree", 100, 84],
    ["coco_palm", "ต้นมะพร้าว", "a leaning coconut palm", "tree", "tree", 90, 84],
    ["sea_rock", "หินชายทะเล", "a dark sea rock with barnacles", "rock", "solid", 50],
    ["driftwood", "ขอนไม้ลอยน้ำ", "a piece of bleached driftwood", "log", "flat", 50],
    ["beach_grass", "หญ้าชายหาด", "a tuft of beach grass", "bush", "low", 30],
    ["tide_pool", "แอ่งน้ำทะเล", "a small tide pool among rocks", "water", "flat", 50],
    ["shells", "เปลือกหอย", "a seashell, starfish or small coral on sand", "ground", "flat", 15, 40],
  ],
};

// Icons: [key, Thai, subject, subcategory]
export const ICONS: [string, string, string, string][] = [
  ["jian_sword", "กระบี่", "a Chinese straight double-edged sword (jian)", "weapon"],
  ["dao_sabre", "ดาบ", "a Chinese curved sabre (dao)", "weapon"],
  ["spear", "ทวน", "a Chinese spear or polearm with a red tassel", "weapon"],
  ["staff", "ไม้พลอง", "a fighting staff or bamboo staff", "weapon"],
  ["fan_weapon", "พัด", "a steel-ribbed folding fan", "weapon"],
  ["hidden_weapons", "อาวุธลับ", "throwing darts, flying knives or poison needles", "weapon"],
  ["whip_chain", "แส้และโซ่", "a whip or a chain weapon with a dart", "weapon"],
  ["robe_armor", "เสื้อเกราะ", "a martial artist's robe or light armour", "armor"],
  ["helmet_hat", "หมวก", "a hat, helmet or headband", "armor"],
  ["boots", "รองเท้า", "a pair of cloth or leather boots", "armor"],
  ["bracers_belt", "สนับแขนและเข็มขัด", "leather bracers or a martial belt", "armor"],
  ["ring", "แหวน", "a ring with a gem", "accessory"],
  ["amulet", "เครื่องราง", "a jade pendant or amulet on a cord", "accessory"],
  ["potion", "ยาเลือด", "a medicine bottle or gourd of healing elixir", "potion"],
  ["pills", "ยาเม็ด", "a box or jar of medicinal pills", "potion"],
  ["herb", "สมุนไพร", "a medicinal herb or root (ginseng, lingzhi mushroom)", "herb"],
  ["ore", "แร่", "a chunk of raw ore (iron, copper, silver, gold)", "material"],
  ["ingot", "แท่งโลหะ", "a metal ingot or bar", "material"],
  ["wood", "ไม้", "a bundle of wood or a log section", "material"],
  ["animal_part", "ชิ้นส่วนสัตว์", "an animal part: claw, fang, pelt or snake skin", "material"],
  ["fish", "ปลา", "a fish (carp, eel, dragon fish)", "food"],
  ["dish", "อาหาร", "a bowl or plate of Chinese food", "food"],
  ["scroll", "คัมภีร์", "a rolled martial arts scroll with a ribbon", "book"],
  ["book", "ตำรา", "a thread-bound martial arts manual", "book"],
  ["valuable", "ของมีค่า", "a treasure: jade piece, gold ingot or ancient coin", "valuable"],
  ["key_token", "กุญแจและป้ายคำสั่ง", "an old key or a command token plaque", "quest"],
  ["instrument", "เครื่องดนตรี", "a musical instrument: flute, pipa or small zither", "tool"],
  ["tool", "เครื่องมือ", "a tool: pickaxe, axe, sickle or fishing rod", "tool"],
  ["venom", "พิษ", "a poison vial or venom jar with a skull mark", "venom"],
  ["cloth", "ผ้า", "a bolt of silk, a spool of thread or leather", "material"],
];

export const FX: [string, string, string, number][] = [
  ["flame_burst", "เปลวเพลิง", "a burst of orange flame", 6],
  ["lightning", "สายฟ้า", "a crackling blue-white lightning bolt", 6],
  ["ice_shards", "เกล็ดน้ำแข็ง", "a spray of ice shards", 6],
  ["sword_qi", "ปราณกระบี่", "a glowing crescent sword-qi slash arc", 6],
  ["palm_wave", "คลื่นฝ่ามือ", "a golden palm-shaped wave of inner energy", 6],
  ["poison_cloud", "หมอกพิษ", "a green poison mist cloud", 6],
  ["smoke_puff", "ควัน", "a puff of grey smoke or dust", 6],
  ["hit_spark", "ประกายกระทบ", "an impact spark star", 6],
  ["heal_aura", "รัศมีรักษา", "a soft green healing aura of light motes", 6],
  ["blood_splash", "เลือดสาด", "a small dark-red blood splash", 6],
];
export const UI: [string, string, string, number, number][] = [
  ["frame", "กรอบ", "an ornate lacquered wooden frame border with gold corners", 64, 6],
  ["button", "ปุ่ม", "a rectangular lacquer and gold game button (blank, no text)", 64, 6],
  ["medallion", "เหรียญตรา", "a round bronze or jade medallion badge with a cloud motif", 42, 8],
  ["scroll_banner", "แถบม้วนกระดาษ", "a blank parchment scroll banner", 64, 6],
  ["seal_stamp", "ตราประทับ", "a red square seal stamp mark (no readable writing)", 42, 6],
  ["gauge_orb", "ลูกแก้วพลัง", "a glass orb gauge filled with red or blue liquid", 42, 6],
];

/** Top-down Wang tilesets, 6 per region: [key, Thai, lower terrain, upper terrain, transition]. 16 tiles each. */
export const TILESETS: Record<ArtRegion, [string, string, string, string, string][]> = {
  heartland: [
    ["grass_dirt", "หญ้า-ทางดิน", "packed brown dirt road", "short green meadow grass", "grass tufts at the road edge"],
    ["grass_paving", "หญ้า-ลานหินเทา", "grey square stone paving slabs", "short green grass", "grass growing between stones"],
    ["river_bank", "แม่น้ำ-ตลิ่งหญ้า", "calm blue-green river water", "grassy river bank", "muddy shore with pebbles"],
    ["farmland", "ไร่นา-หญ้า", "tilled brown farmland soil in rows", "short green grass", "field edge"],
    ["brick_dirt", "ลานอิฐ-ดิน", "bare earth", "grey brick courtyard floor", "worn brick edge"],
    ["pond_stone", "สระน้ำ-ขอบหิน", "dark green pond water with lily pads", "grey stone pond edge", "mossy stone lip"],
  ],
  east: [
    ["canal", "คลอง-เขื่อนหิน", "green canal water", "bluestone embankment paving", "wet stone steps"],
    ["bluestone_moss", "หินฟ้า-มอส", "mossy lawn", "bluestone slab street paving", "moss in cracks"],
    ["lotus_mud", "สระบัว-โคลน", "lotus pond water", "dark mud bank", "reeds at the water's edge"],
    ["paddy", "นาข้าว-คันนา", "flooded rice paddy with seedlings", "grassy field dike", "muddy dike edge"],
    ["pebble_lawn", "ทางกรวด-สนามหญ้า", "neat green garden lawn", "grey garden pebble path", "pebbles in grass"],
    ["beach_sea", "ทะเล-หาดทราย", "blue sea water with small waves", "pale sand beach", "wet sand and foam"],
  ],
  south: [
    ["jungle_soil", "ดินป่า-หญ้าร้อนชื้น", "dark red jungle soil", "lush tropical grass", "roots and fallen leaves"],
    ["swamp_mud", "หนองน้ำ-โคลน", "murky green swamp water", "dark mud", "reedy mud edge"],
    ["clay_path", "ทางดินแดง-หญ้า", "red clay earth path", "lush green grass", "grass over red clay"],
    ["terrace_paddy", "นาขั้นบันได", "terraced rice paddy water", "green terrace grass", "earthen terrace wall"],
    ["bamboo_floor", "พื้นป่าไผ่-ดิน", "brown earth", "carpet of dry bamboo leaves", "scattered leaves"],
    ["stream_pebbles", "ลำธาร-กรวด", "clear shallow stream water", "rounded river pebbles", "wet pebbles"],
  ],
  north: [
    ["snow_dirt", "หิมะ-ดินแข็ง", "frozen brown dirt", "white snow", "patchy snow"],
    ["steppe", "ทุ่งหญ้าแห้ง-ดิน", "dusty dirt track", "dry yellow steppe grass", "sparse grass tufts"],
    ["rammed_earth", "ลานดินอัด-หญ้า", "short steppe grass", "packed rammed-earth ground", "trodden earth edge"],
    ["ice_snow", "ทะเลสาบน้ำแข็ง-หิมะ", "frozen blue lake ice", "snowy shore", "cracked ice edge"],
    ["rock_snow", "หินผา-หิมะ", "grey rocky ground", "snow cover", "snow on rocks"],
    ["mud_grass", "โคลน-หญ้าแห้ง", "wet brown mud", "dry grass", "muddy grass edge"],
  ],
  west: [
    ["sand_rock", "ทราย-พื้นหิน", "rocky desert ground", "golden desert sand", "sand drifting over rocks"],
    ["dune_oasis", "เนินทราย-หญ้าโอเอซิส", "oasis grass", "rippled sand dune", "sparse grass in sand"],
    ["cracked_earth", "ดินแตกระแหง-ทราย", "pale sand", "cracked dry earth", "dusty crack edge"],
    ["oasis_water", "น้ำโอเอซิส-ทราย", "blue oasis water", "warm sand", "damp sand shore"],
    ["scree_alpine", "หินกรวดภูเขา-หญ้าอัลไพน์", "grey mountain scree gravel", "short alpine grass", "gravel in grass"],
    ["snow_gravel", "หิมะ-กรวด", "dark gravel", "high-mountain snow", "thin snow over gravel"],
  ],
};
