import { getNpcsAtLocation } from "@/lib/world/data/npcs";
import { getLocationMap } from "@/lib/world/data/location-maps";
const locs = ["city_dali","home_yideng","market_miao","mt_wuliang","pool_heilong","sect_emei","sect_tang","sect_wudu","temple_dalun","temple_tianning","cave_zhizhu","home_nanxian","inn_youjian","inn_yuelai","city_jinling","valley_hudie"];
for (const l of locs) {
  const m: any = getLocationMap(l);
  const spots = new Set((m?.npcSpots ?? []).map((s: any) => s.npcId ?? s.id));
  console.log("==", l, m ? "map" : "NOMAP");
  for (const n of getNpcsAtLocation(l)) console.log("  ", n.id, n.name, spots.has(n.id) ? "SPOT" : "-", (n as any).title ?? "", (n.tags??[]).join(","));
}
