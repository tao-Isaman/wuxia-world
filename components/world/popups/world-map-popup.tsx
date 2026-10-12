"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { WAYPOINT_FLAG, activeGuide } from "@/lib/world";
import {
  ATLAS_IMAGE, ATLAS_REGIONS, ATLAS_SIZE, HEARTLAND_CIRCLE, PLACE_KIND_LABEL, REGION_LABEL, ROAD_TYPE_LABEL,
  atlasNeighbours, atlasPlace, atlasPlaces, atlasPosition, atlasRoads, atlasRoute, positionPoint, regionBounds,
  regionLabelPoint, regionPolygon, routingOrigin, type AtlasPlace, type AtlasRegion, type PlaceKind,
} from "@/lib/world/world-atlas";
import type { RouteMapType } from "@/lib/world/data/route-maps";
import { pageRect, toPagePoint } from "@/lib/ui/landscape";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const KIND_STYLE: Record<PlaceKind, { color: string; glyph: string }> = {
  city: { color: "#a23b2a", glyph: "🏯" }, sect: { color: "#2f5d8a", glyph: "☯" }, village: { color: "#7a5a2e", glyph: "🏘" },
  home: { color: "#8a6d3b", glyph: "🏠" }, inn: { color: "#b5651d", glyph: "🏮" }, temple: { color: "#b8862b", glyph: "🔔" },
  villa: { color: "#7d5a7a", glyph: "🏡" }, cave: { color: "#4a4036", glyph: "🕳" }, isle: { color: "#2f7f8f", glyph: "🏝" },
  peak: { color: "#55616b", glyph: "⛰" }, water: { color: "#3577a0", glyph: "💧" }, desert: { color: "#b98a3e", glyph: "🏜" },
  camp: { color: "#8a5a3a", glyph: "⛺" },
};

const REGION_TINT: Record<AtlasRegion, string> = {
  heartland: "#d9a441", north: "#5b7fa6", south: "#4f9a6a", east: "#c0583a", west: "#b8873a",
};

const ROAD_STYLE: Record<RouteMapType | "sea", { color: string; width: number; dash?: string }> = {
  highway: { color: "#6b3d14", width: 3.2 }, country: { color: "#80602f", width: 2.4 },
  forest: { color: "#41603a", width: 2.4, dash: "7 4" }, mountain: { color: "#33302c", width: 2.4, dash: "2.5 4" },
  gorge: { color: "#5a4636", width: 2.4, dash: "9 3 2 3" }, lane: { color: "#8f704a", width: 1.8 },
  coast: { color: "#24617d", width: 2.4, dash: "1 6" }, sea: { color: "#24617d", width: 2.4, dash: "1 6" },
};

/** Names always shown; the rest appear as the map is zoomed in. */
const ALWAYS_NAMED: ReadonlySet<PlaceKind> = new Set(["city", "sect"]);
const MIN_VIEW_WIDTH = 220;

type View = { cx: number; cy: number; w: number };
type Filter = "all" | AtlasRegion;

// แผนที่โลก — the painted map of the jianghu (public/maps/world-atlas.webp,
// painted to the world coordinates) with every place, the roads and sea lanes
// between them, the five regions, where the hero is, the tracked quest's
// place and a planner: pick a place to see the way there, step by step, and
// set it as the guide arrow's destination (นำทาง). Drag / pinch / wheel to
// move and zoom; the region tabs frame one region.
export function WorldMapPopup({ open, onClose }: Props) {
  const state = useWorldStore();
  const setFlag = useWorldStore((s) => s._setFlag);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const [view, setView] = useState<View>({ cx: ATLAS_SIZE.width / 2, cy: ATLAS_SIZE.height / 2, w: ATLAS_SIZE.width });

  const places = atlasPlaces();
  const roads = atlasRoads();
  const visited = useMemo(() => new Set(state.visitedLocationIds), [state.visitedLocationIds]);
  const position = atlasPosition(state);
  const here = positionPoint(position);
  const origin = routingOrigin(position);
  const questTarget = activeGuide(state)?.locationId ?? null;
  const rawWaypoint = state.flags[WAYPOINT_FLAG];
  const waypoint = typeof rawWaypoint === "string" && rawWaypoint ? rawWaypoint : null;
  const target = selected ?? null;
  const route = useMemo(() => (origin && target && origin !== target ? atlasRoute(origin, target) : null), [origin, target]);

  // The box's layout size (unaffected by the landscape turn).
  useEffect(() => {
    if (!open) return;
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: Math.max(1, el.offsetWidth), h: Math.max(1, el.offsetHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  const ratio = size.h / size.w;
  const fullWidth = Math.max(ATLAS_SIZE.width, ATLAS_SIZE.height / ratio);
  const clamp = (v: View): View => {
    const w = Math.min(fullWidth, Math.max(MIN_VIEW_WIDTH, v.w));
    const h = w * ratio;
    const cx = w >= ATLAS_SIZE.width ? ATLAS_SIZE.width / 2 : Math.min(ATLAS_SIZE.width - w / 2, Math.max(w / 2, v.cx));
    const cy = h >= ATLAS_SIZE.height ? ATLAS_SIZE.height / 2 : Math.min(ATLAS_SIZE.height - h / 2, Math.max(h / 2, v.cy));
    return { cx, cy, w };
  };
  const shown = clamp(view);
  const viewH = shown.w * ratio;
  const viewBox = `${shown.cx - shown.w / 2} ${shown.cy - viewH / 2} ${shown.w} ${viewH}`;
  /** Map units per screen pixel: keeps markers and labels one size while zooming. */
  const k = shown.w / size.w;
  const zoom = fullWidth / shown.w;
  /** Screen pixels per map unit: small names show once there is room for them. */
  const density = 1 / k;

  // Opening: frame the hero.
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setFilter("all");
    const point = positionPoint(atlasPosition(useWorldStore.getState()));
    setView(point ? { cx: point.x, cy: point.y, w: ATLAS_SIZE.width * 0.62 } : { cx: ATLAS_SIZE.width / 2, cy: ATLAS_SIZE.height / 2, w: ATLAS_SIZE.width });
  }, [open]);

  const frameRegion = (next: Filter) => {
    setFilter(next);
    setSelected(null);
    if (next === "all") { setView({ cx: ATLAS_SIZE.width / 2, cy: ATLAS_SIZE.height / 2, w: fullWidth }); return; }
    const b = regionBounds(next);
    setView({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, w: Math.max(b.w, b.h / ratio) });
  };
  const focus = (id: string) => {
    const place = atlasPlace(id);
    setSelected(id);
    if (place) setView((v) => ({ cx: place.x, cy: place.y, w: Math.min(clamp(v).w, ATLAS_SIZE.width * 0.5) }));
  };
  const zoomBy = (factor: number) => setView((v) => ({ ...clamp(v), w: clamp(v).w / factor }));

  // ─── Drag, pinch and wheel ─────────────────────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);
  const toUnits = (page: { x: number; y: number }) => {
    const rect = box.current ? pageRect(box.current) : { left: 0, top: 0 };
    return { x: shown.cx - shown.w / 2 + (page.x - rect.left) * k, y: shown.cy - viewH / 2 + (page.y - rect.top) * k };
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, toPagePoint(e.clientX, e.clientY));
    if (pointers.current.size === 1) dragged.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const before = pointers.current.get(e.pointerId);
    if (!before) return;
    const now = toPagePoint(e.clientX, e.clientY);
    if (pointers.current.size === 1) {
      const dx = now.x - before.x, dy = now.y - before.y;
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        if (Math.hypot(dx, dy) > 1) dragged.current = true;
        setView((v) => { const c = clamp(v); return { ...c, cx: c.cx - dx * k, cy: c.cy - dy * k }; });
      }
    } else if (pointers.current.size === 2) {
      const [other] = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
      const was = Math.hypot(before.x - other.x, before.y - other.y), is = Math.hypot(now.x - other.x, now.y - other.y);
      if (was > 0 && is > 0) { dragged.current = true; zoomBy(is / was); }
    }
    pointers.current.set(e.pointerId, now);
  };
  const onPointerUp = (e: ReactPointerEvent) => { pointers.current.delete(e.pointerId); };
  const onWheel = (e: ReactWheelEvent) => {
    const at = toUnits(toPagePoint(e.clientX, e.clientY));
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    setView((v) => {
      const c = clamp(v);
      const w = c.w / factor;
      // Keep the point under the cursor where it is.
      return { cx: at.x + (c.cx - at.x) * (w / c.w), cy: at.y + (c.cy - at.y) * (w / c.w), w };
    });
  };
  const pick = (id: string) => { if (!dragged.current) setSelected((cur) => (cur === id ? null : id)); };

  const setWaypoint = (id: string | null) => {
    setFlag(WAYPOINT_FLAG, id ?? "");
    if (id) toast("success", `ตั้งจุดหมายที่${atlasPlace(id)?.name ?? ""}แล้ว · ลูกศรนำทางจะชี้ทางให้`);
    else toast("info", "ยกเลิกจุดหมายบนแผนที่แล้ว");
  };

  const routePoints = route && origin ? [origin, ...route.map((s) => s.to)].map((id) => atlasPlace(id)).filter(Boolean) as AtlasPlace[] : [];
  const pathKeys = new Set(route?.map((s) => [s.from, s.to].sort().join("|")) ?? []);

  return (
    <Modal open={open} onClose={onClose} title="🗺 แผนที่โลก" fill>
      <div className="atlas" data-testid="world-map">
        <div className="atlas-main">
          <div className="menu-tabs atlas-tabs" role="tablist" aria-label="ภูมิภาค">
            <button type="button" role="tab" aria-selected={filter === "all"} onClick={() => frameRegion("all")}>ทั้งแผ่นดิน</button>
            {ATLAS_REGIONS.map((r) => (
              <button key={r} type="button" role="tab" aria-selected={filter === r} onClick={() => frameRegion(r)} data-region-tab={r}>
                <i style={{ background: REGION_TINT[r] }} aria-hidden="true" />{REGION_LABEL[r]}
              </button>
            ))}
          </div>
          <div ref={box} className="atlas-view" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}>
            <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="แผนที่โลก" data-zoom={zoom.toFixed(2)}>
              <rect x={-2000} y={-2000} width={ATLAS_SIZE.width + 4000} height={ATLAS_SIZE.height + 4000} className="atlas-margin" />
              <image href={ATLAS_IMAGE} x={0} y={0} width={ATLAS_SIZE.width} height={ATLAS_SIZE.height} preserveAspectRatio="none" />

              {/* Regions: the heartland circle round the capital, the compass quarters beyond it. */}
              <g className="atlas-regions">
                {(["north", "south", "east", "west"] as const).map((r) => {
                  const poly = regionPolygon(r);
                  const { cx, cy, r: radius } = HEARTLAND_CIRCLE;
                  const d = `M${poly.map((p) => `${p.x} ${p.y}`).join(" L")} Z M${cx - radius} ${cy} a${radius} ${radius} 0 1 0 ${radius * 2} 0 a${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;
                  return <path key={r} d={d} fillRule="evenodd" fill={REGION_TINT[r]}
                    className={filter === "all" ? "atlas-region" : filter === r ? "atlas-region atlas-region--on" : "atlas-region atlas-region--off"}
                    strokeWidth={2 * k} />;
                })}
                <circle cx={HEARTLAND_CIRCLE.cx} cy={HEARTLAND_CIRCLE.cy} r={HEARTLAND_CIRCLE.r} fill={REGION_TINT.heartland}
                  className={filter === "all" ? "atlas-region" : filter === "heartland" ? "atlas-region atlas-region--on" : "atlas-region atlas-region--off"}
                  strokeWidth={2 * k} />
                {ATLAS_REGIONS.map((r) => {
                  const p = regionLabelPoint(r);
                  return <text key={r} x={p.x} y={p.y} className="atlas-region-name" fontSize={r === "heartland" ? 34 : 46}
                    opacity={filter === "all" || filter === r ? (zoom > 2.6 ? 0.25 : 0.82) : 0.3}>{REGION_LABEL[r]}</text>;
                })}
              </g>

              {/* Roads (both ends visited: full ink) and sea lanes. */}
              <g className="atlas-roads">
                {roads.map((road) => {
                  const a = atlasPlace(road.a)!, b = atlasPlace(road.b)!;
                  const style = ROAD_STYLE[road.sea ? "sea" : road.type];
                  const known = visited.has(road.a) && visited.has(road.b);
                  const onPath = pathKeys.has(`${road.a}|${road.b}`);
                  return <g key={`${road.a}|${road.b}`} opacity={onPath ? 1 : known ? 0.9 : 0.55}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="atlas-road-halo" strokeWidth={(style.width + 2.4) * k} />
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={style.color} strokeWidth={style.width * k}
                      strokeDasharray={style.dash?.split(" ").map((n) => Number(n) * k).join(" ")} strokeLinecap="round" />
                  </g>;
                })}
              </g>

              {/* The way to the picked place. */}
              {routePoints.length > 1 && (
                <g className="atlas-route" data-testid="world-map-route">
                  <polyline points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")} className="atlas-route-halo" strokeWidth={9 * k} />
                  <polyline points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")} className="atlas-route-line" strokeWidth={4.5 * k}
                    strokeDasharray={`${12 * k} ${8 * k}`} />
                </g>
              )}

              {/* Places. */}
              <g className="atlas-places">
                {places.map((place) => {
                  const style = KIND_STYLE[place.kind];
                  const r = (place.kind === "city" ? 11 : place.kind === "sect" ? 9.5 : 8) * k;
                  const been = visited.has(place.id);
                  const isSel = selected === place.id;
                  const isHere = position.kind === "place" && position.id === place.id;
                  const dimmed = filter !== "all" && place.region !== filter;
                  const named = ALWAYS_NAMED.has(place.kind) || density >= 0.95 || isSel || isHere || place.id === questTarget || place.id === waypoint
                    || (filter !== "all" && !dimmed && density >= 0.7);
                  return (
                    <g key={place.id} transform={`translate(${place.x} ${place.y})`} className="atlas-place" data-atlas-place={place.id}
                      data-visited={been ? "true" : "false"} opacity={dimmed ? 0.35 : 1} onClick={() => pick(place.id)}
                      role="button" aria-label={place.name}>
                      <circle r={r * 2.1} fill="transparent" />
                      {isSel && <circle r={r + 5 * k} className="atlas-selected" strokeWidth={2.5 * k} />}
                      <circle r={r} fill={style.color} className={been ? "atlas-dot" : "atlas-dot atlas-dot--new"} strokeWidth={2 * k}
                        strokeDasharray={been ? undefined : `${3 * k} ${2 * k}`} opacity={been ? 1 : 0.7} />
                      <text className="atlas-glyph" fontSize={r * 1.15} dy={r * 0.4}>{style.glyph}</text>
                      {place.station && <text className="atlas-badge" x={r * 0.95} y={-r * 0.65} fontSize={9 * k}>🐎</text>}
                      {place.ferry && <text className="atlas-badge" x={-r * 0.95} y={-r * 0.65} fontSize={9 * k}>⛵</text>}
                      {place.id === questTarget && <text className="atlas-badge" y={-r - 4 * k} fontSize={15 * k}>📌</text>}
                      {place.id === waypoint && place.id !== questTarget && <text className="atlas-badge" y={-r - 4 * k} fontSize={15 * k}>🧭</text>}
                      {named && <text className={`atlas-name${been ? "" : " atlas-name--new"}`} y={r + 13 * k} fontSize={12.5 * k}
                        strokeWidth={3.2 * k}>{place.name}</text>}
                    </g>
                  );
                })}
              </g>

              {/* The hero. */}
              {here && (
                <g transform={`translate(${here.x} ${here.y})`} className="atlas-hero" data-testid="world-map-hero" pointerEvents="none">
                  <circle r={16 * k} className="atlas-hero-pulse" />
                  <path d={`M0 ${-2 * k} L${-7 * k} ${-16 * k} A${8 * k} ${8 * k} 0 1 1 ${7 * k} ${-16 * k} Z`} className="atlas-hero-pin" strokeWidth={1.6 * k} />
                  <circle cy={-20 * k} r={3 * k} fill="#fff7e6" />
                  <text y={-34 * k} className="atlas-hero-label" fontSize={12 * k} strokeWidth={3.2 * k}>เจ้าอยู่ที่นี่</text>
                </g>
              )}
            </svg>
            <div className="atlas-zoom" onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => zoomBy(1.4)} aria-label="ซูมเข้า">＋</button>
              <button type="button" onClick={() => zoomBy(1 / 1.4)} aria-label="ซูมออก">－</button>
              <button type="button" onClick={() => here && setView((v) => ({ ...clamp(v), cx: here.x, cy: here.y }))} aria-label="ไปที่ตำแหน่งของข้า" title="ตำแหน่งของข้า">◎</button>
            </div>
          </div>
        </div>
        <aside className="atlas-side menu-col menu-col--scroll" aria-label="รายละเอียดแผนที่">
          <AtlasSide selected={selected} filter={filter} origin={origin} position={position} route={route} visited={visited}
            questTarget={questTarget} waypoint={waypoint} onFocus={focus} onWaypoint={setWaypoint} onClear={() => setSelected(null)} />
        </aside>
      </div>
    </Modal>
  );
}

function placeName(id: string | null | undefined) {
  return atlasPlace(id)?.name ?? "ที่ไม่มีบนแผนที่";
}

function AtlasSide({ selected, filter, origin, position, route, visited, questTarget, waypoint, onFocus, onWaypoint, onClear }: {
  selected: string | null; filter: Filter; origin: string | null; position: ReturnType<typeof atlasPosition>;
  route: ReturnType<typeof atlasRoute>; visited: ReadonlySet<string>; questTarget: string | null; waypoint: string | null;
  onFocus: (id: string) => void; onWaypoint: (id: string | null) => void; onClear: () => void;
}) {
  const whereAmI = position.kind === "road"
    ? <>กำลังเดินทาง <b>{placeName(position.from)}</b> → <b>{placeName(position.to)}</b></>
    : position.kind === "place" ? <>เจ้าอยู่ที่ <b>{placeName(position.id)}</b> · {REGION_LABEL[atlasPlace(position.id)!.region]}</>
      : <>เจ้าอยู่นอกแผนที่ใหญ่</>;
  const place = atlasPlace(selected);

  if (place) {
    const neighbours = atlasNeighbours(place.id);
    const ferryGold = route?.reduce((sum, s) => sum + (s.ferry?.gold ?? 0), 0) ?? 0;
    const atHere = origin === place.id;
    return (
      <div className="atlas-detail" data-testid="world-map-detail" data-place={place.id}>
        <div className="menu-col-head">
          <span className="menu-col-title">{KIND_STYLE[place.kind].glyph} {place.name}</span>
          <button type="button" className="atlas-close" onClick={onClear} aria-label="ปิดรายละเอียด">✕</button>
        </div>
        <p className="atlas-kicker">{PLACE_KIND_LABEL[place.kind]} · {REGION_LABEL[place.region]}</p>
        <div className="atlas-tags">
          <span className={visited.has(place.id) ? "atlas-tag atlas-tag--ok" : "atlas-tag"}>{visited.has(place.id) ? "เคยไปแล้ว" : "ยังไม่เคยไป"}</span>
          {place.station && <span className="atlas-tag">🐎 สถานีพักม้า</span>}
          {place.ferry && <span className="atlas-tag">⛵ ท่าเรือ</span>}
          {place.id === questTarget && <span className="atlas-tag atlas-tag--quest">📌 ภารกิจที่ติดตาม</span>}
        </div>
        {place.description && <p className="atlas-desc">{place.description}</p>}

        <h4>เส้นทางจากตำแหน่งของเจ้า</h4>
        {atHere ? <p className="atlas-note">เจ้าอยู่ที่นี่แล้ว</p>
          : !route ? <p className="atlas-note">ยังไม่มีทางไปที่นี่จากตำแหน่งของเจ้า</p>
            : (
              <>
                <p className="atlas-note">{route.length} ช่วงทาง{ferryGold > 0 ? ` · ค่าเรือรวม ${ferryGold} ตำลึง` : ""}</p>
                <ol className="atlas-steps" data-testid="world-map-steps">
                  {route.map((step) => (
                    <li key={step.from + step.to}>
                      <button type="button" onClick={() => onFocus(step.to)}>
                        <span>{step.ferry ? "⛵" : "🚶"} {step.road}</span>
                        <b>→ {placeName(step.to)}</b>
                        <small>{step.direction ? `ทาง${step.direction}` : ""}{step.ferry ? ` · ${step.ferry.gold} ตำลึง` : ` · ${ROAD_TYPE_LABEL[step.type]}`}</small>
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
        {!atHere && route && (waypoint === place.id
          ? <Button size="sm" variant="outline" onClick={() => onWaypoint(null)} data-testid="world-map-unset">ยกเลิกนำทาง</Button>
          : <Button size="sm" onClick={() => onWaypoint(place.id)} data-testid="world-map-navigate">🧭 นำทางไปที่นี่</Button>)}

        <h4>ทางเชื่อมต่อ ({neighbours.length})</h4>
        {neighbours.length === 0 ? <p className="atlas-note">ไม่มีทางเดินออกจากที่นี่ — ต้องอาศัยเรือ</p> : (
          <ul className="atlas-links">
            {neighbours.map(({ id, road }) => (
              <li key={id}>
                <button type="button" onClick={() => onFocus(id)}>
                  <span>{road.sea ? "⛵" : "🚶"} {(road.a === place.id ? road.labelA : road.labelB) || ROAD_TYPE_LABEL[road.type]}</span>
                  <b>{placeName(id)}</b>
                  <small>{road.sea ? "ทางเรือ · ต้องจ้างคนเรือ" : ROAD_TYPE_LABEL[road.type]}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (filter !== "all") {
    const members = atlasPlaces().filter((p) => p.region === filter);
    const been = members.filter((p) => visited.has(p.id)).length;
    const kinds = [...new Set(members.map((p) => p.kind))];
    return (
      <div className="atlas-detail" data-testid="world-map-region">
        <div className="menu-col-head"><span className="menu-col-title"><i className="atlas-swatch" style={{ background: REGION_TINT[filter] }} />{REGION_LABEL[filter]}</span></div>
        <p className="atlas-kicker">สำรวจแล้ว {been}/{members.length} แห่ง</p>
        {kinds.map((kind) => (
          <div key={kind} className="atlas-group">
            <h4>{KIND_STYLE[kind].glyph} {PLACE_KIND_LABEL[kind]}</h4>
            <ul className="atlas-chips">
              {members.filter((p) => p.kind === kind).map((p) => (
                <li key={p.id}><button type="button" className={visited.has(p.id) ? "" : "atlas-chip--new"} onClick={() => onFocus(p.id)}>{p.name}</button></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="atlas-detail" data-testid="world-map-overview">
      <div className="menu-col-head"><span className="menu-col-title">ยุทธภพ</span></div>
      <p className="atlas-where">📍 {whereAmI}</p>
      {questTarget && <button type="button" className="atlas-jump" onClick={() => onFocus(questTarget)}>📌 ภารกิจ: {placeName(questTarget)}</button>}
      {waypoint && <button type="button" className="atlas-jump" onClick={() => onFocus(waypoint)}>🧭 จุดหมาย: {placeName(waypoint)}</button>}
      <p className="atlas-note">แตะสถานที่เพื่อดูรายละเอียด ทางเชื่อมต่อ และเส้นทางจากตำแหน่งของเจ้า · ลากเพื่อเลื่อน หมุนล้อหรือถ่างนิ้วเพื่อซูม</p>
      <h4>สัญลักษณ์</h4>
      <ul className="atlas-legend">
        {(Object.keys(KIND_STYLE) as PlaceKind[]).map((kind) => (
          <li key={kind}><i style={{ background: KIND_STYLE[kind].color }}>{KIND_STYLE[kind].glyph}</i>{PLACE_KIND_LABEL[kind]}</li>
        ))}
        <li><i className="atlas-legend-plain">🐎</i>สถานีพักม้า</li>
        <li><i className="atlas-legend-plain">⛵</i>ท่าเรือ (คนเรือ)</li>
      </ul>
      <h4>เส้นทาง</h4>
      <ul className="atlas-legend atlas-legend--roads">
        {(["highway", "country", "forest", "mountain", "gorge", "lane", "sea"] as const).map((type) => {
          const style = ROAD_STYLE[type];
          return <li key={type}><svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" stroke={style.color}
            strokeWidth={style.width} strokeDasharray={style.dash} strokeLinecap="round" /></svg>{type === "sea" ? "ทางเรือ" : ROAD_TYPE_LABEL[type]}</li>;
        })}
      </ul>
    </div>
  );
}
