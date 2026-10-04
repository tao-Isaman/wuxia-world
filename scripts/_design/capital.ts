import { writeFileSync } from "fs";
import { Design } from "./lib";
const out = process.argv[2];
const d = new Design("city_capital", "til_heartland_brick_dirt_07");
const CITY = "kit_heartland_wall_city_greybrick";

// ── Paving: grey brick (Wang) over packed earth. Vertex rects [i0, j0, i1, j1], vertex = (32i, 32j). ──
const rects: [number, number, number, number][] = [
  [14, 3, 16, 19],   // the imperial avenue: south gate → yamen
  [1, 15, 28, 17],   // the artisans' street (spawn)
  [12, 8, 18, 12],   // the market square
  [12, 6, 18, 8],    // yamen forecourt
  [1, 2, 25, 3],     // north street under the wall
  [2, 1, 3, 3], [8, 1, 9, 3], [23, 1, 24, 3], // into the three north gates
  [0, 7, 12, 8],     // west street to the qigu gate
  [19, 5, 30, 6],    // east street to the yangzhou gate
  [19, 12, 30, 13],  // east street to the jinyiwei gate
  [3, 17, 4, 19],    // lane to the south-west gate
  [8, 3, 9, 7],      // north–south lane from the north gate to the west street
];
d.wang("til_heartland_brick_dirt", (i, j) => rects.some(([a, b, c, e]) => i >= a && i <= c && j >= b && j <= e));

// ── City wall with gates at the exits ──
d.kitLine(CITY, [[0, 1], [29, 1], [29, 19], [0, 19], [0, 1]]);
d.gate(CITY, 1, 1); d.gate(CITY, 7, 1); d.gate(CITY, 22, 1);
d.gate(CITY, 2, 19); d.gate(CITY, 13, 19);
d.kitErase(CITY, [[0, 7], [0, 8], [29, 5], [29, 12], [27, 19], [28, 19]]);

// ── North: the yamen, a wine shop, a drum tower, the west market hall ──
d.add("bld_heartland_yamen_01", 470, 180);
d.add("prp_heartland_stone_lion_02", 548, 214, { scale: 0.8 });
d.add("bld_heartland_wine_shop_01", 640, 168, { scale: 0.75 });
d.add("bld_landmark_drum_tower_01", 885, 128, { scale: 0.6 });
d.add("bld_heartland_teahouse_02", 175, 226, { scale: 0.8 });     // ตลาดนครหลวง: the general store
d.add("prp_heartland_incense_burner_02", 330, 176, { scale: 0.9 });
d.add("nat_temperate_pine_05", 58, 168, { scale: 0.8 });
d.add("nat_temperate_blossom_tree_06", 340, 132, { scale: 0.7 });

// ── North-east: the tea house (rest), tables, the black-market corner ──
d.add("bld_heartland_teahouse_01", 735, 236, { scale: 0.85 });
d.add("prp_interior_dining_table_03", 650, 292, { scale: 0.75 });
d.add("prp_interior_guqin_table_02", 790, 330, { scale: 0.8 });   // chess table
d.add("prp_heartland_crates_sacks_05", 912, 278, { scale: 0.9 });
d.add("prp_heartland_barrels_02", 918, 352, { scale: 0.8 });
d.add("prp_heartland_street_lantern_06", 835, 290, { scale: 0.9 });
d.add("nat_temperate_willow_02", 880, 240, { scale: 0.75 });

// ── The market square ──
d.add("prp_heartland_market_stall_03", 602, 276, { scale: 0.85 });
d.add("prp_heartland_market_stall_06", 380, 302, { scale: 0.85 });
d.add("prp_heartland_market_stall_02", 640, 362, { scale: 0.85 });
d.add("prp_heartland_well_05", 480, 350, { scale: 0.9 });
d.add("prp_heartland_stone_lion_05", 424, 430, { scale: 0.85 });
d.add("prp_heartland_stone_lion_05", 536, 430, { scale: 0.85, flip: true });
d.add("prp_heartland_handcart_03", 545, 330, { scale: 0.8 });

// ── The artisans' street (stalls behind each artisan) and the west block ──
d.add("bld_heartland_smithy_01", 200, 448, { scale: 0.75 });         // forge
d.add("prp_heartland_market_stall_05", 336, 452, { scale: 0.7 });    // alchemy
d.add("prp_heartland_market_stall_07", 412, 452, { scale: 0.7 });    // tailoring
d.add("prp_heartland_market_stall_01", 584, 452, { scale: 0.7 });    // kitchen
d.add("prp_heartland_market_stall_08", 691, 452, { scale: 0.7 });    // jewellery
d.add("prp_heartland_market_stall_04", 797, 452, { scale: 0.7 });    // charms
d.add("prp_heartland_water_vat_03", 262, 450, { scale: 0.8 });
d.add("nat_temperate_willow_05", 70, 440, { scale: 0.8 });
d.add("nat_temperate_maple_02", 30, 330, { scale: 0.75 });
d.add("nat_temperate_maple_05", 110, 320, { scale: 0.7 });
d.add("nat_temperate_bush_03", 280, 380);
d.add("nat_temperate_blossom_tree_04", 880, 440, { scale: 0.8 });
for (const x of [440, 520]) for (const y of [150, 250]) d.add("prp_heartland_street_lantern_07", x, y, { scale: 0.8 });

// ── South: tournament notices, the horse station, the quarry gap ──
d.add("prp_heartland_notice_board_01", 345, 548, { scale: 0.9 });
d.add("sct_songshan_alliance_flag", 422, 552, { scale: 0.9 });
d.add("sct_jinyiwei_horse_post", 620, 552);
d.add("prp_heartland_haystack_02", 660, 566, { scale: 0.8 });
d.add("prp_heartland_handcart_05", 535, 568, { scale: 0.8 });
d.add("nat_temperate_boulder_02", 848, 588, { scale: 0.8 });
d.add("nat_temperate_boulder_05", 935, 600, { scale: 0.8 });
d.add("prp_heartland_haystack_06", 210, 566, { scale: 0.8 });
d.add("nat_temperate_bush_01", 260, 580);

writeFileSync(out + ".json", JSON.stringify(d.file(), null, 1));
const issues = d.check();
console.log(d.list.length, "placements;", issues.length, "issues", issues.map((i) => `${i.reason}:${i.anchor.id}:${i.placementId ? d.list.find((p) => p.id === i.placementId)?.asset : ""}`).join(" | "));
await d.render(out + ".png", { markers: true });
await d.render(out + "-fp.png", { markers: true, footprints: true, scale: 1 });
