"use client";
/* eslint-disable @next/next/no-img-element -- asset images are arbitrary public URLs drawn at map scale */
/**
 * The map editor's view: the painting at fit size (wheel zoom, drag pan),
 * the placed objects drawn with the game's geometry and depth rule
 * (lib/assets/placement-geometry.ts), footprints, the map's own collision,
 * read-only markers, and the pointer gestures: select, box-select, move,
 * click-to-place and drop-from-palette.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { AssetEntry, Placement } from "@/lib/assets/types";
import {
  MAP_HEIGHT, MAP_WIDTH, byDepth, characterDepth, heroDepth, placementGeometry, type MapRect, type PlacementGeometry,
} from "@/lib/assets/placement-geometry";
import type { WorldFootprint } from "@/lib/stage/world-navigation";
import type { MapAnchor } from "@/lib/stage/map-anchors";
import { clampToMap, snap } from "./model";
import { cellAt, cellLine, snapToKit } from "@/lib/assets/kits";
import styles from "./map-editor.module.css";

export interface LabelledAnchor extends MapAnchor { label: string; issue?: string }

export interface StageProps {
  image: string;
  placements: readonly Placement[];
  assets: ReadonlyMap<string, AssetEntry>;
  selected: ReadonlySet<string>;
  anchors: readonly LabelledAnchor[];
  collision: readonly WorldFootprint[];
  flagged: ReadonlySet<string>;
  show: { collision: boolean; footprints: boolean; markers: boolean };
  grid: number | null;
  armed: AssetEntry | null;
  /** The kit brush: paint (or erase) grid cells of `cell` map units. */
  brush: { cell: number; erase: boolean } | null;
  /** A brush stroke reached new cells; `start` is the first call of a stroke. */
  onBrush: (cells: { col: number; row: number }[], erase: boolean, start: boolean) => void;
  onSelect: (ids: string[], mode: "replace" | "add" | "toggle") => void;
  onMove: (ids: ReadonlySet<string>, dx: number, dy: number) => void;
  onPlace: (asset: AssetEntry, x: number, y: number, keepArmed: boolean) => void;
  onDropAsset: (assetId: string, x: number, y: number) => void;
}

type Drag =
  | { kind: "move"; start: { x: number; y: number }; ids: ReadonlySet<string>; moved: boolean }
  | { kind: "box"; start: { x: number; y: number }; additive: boolean }
  | { kind: "pan"; start: { x: number; y: number }; pan: { x: number; y: number } }
  | { kind: "brush"; last: { col: number; row: number }; erase: boolean };

const MISSING_SIZE = 32;

/** Where a placement stands while dragged by (dx, dy), snapped to the grid like the commit will be. */
export function movedPoint(p: { x: number; y: number }, dx: number, dy: number, grid: number | null) {
  return clampToMap(snap(p.x + dx, grid), snap(p.y + dy, grid));
}

export function MapStage(props: StageProps) {
  const { image, placements, assets, selected, anchors, collision, flagged, show, grid, armed, brush } = props;
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 640 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [delta, setDelta] = useState<{ dx: number; dy: number } | null>(null);
  const [box, setBox] = useState<MapRect | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<Drag | null>(null);
  const spaceHeld = useRef(false);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setSize({ width: Math.max(1, element.clientWidth), height: Math.max(1, element.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // A new painting starts at fit size.
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [image]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) spaceHeld.current = true; };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeld.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const fit = Math.min(size.width / MAP_WIDTH, size.height / MAP_HEIGHT);
  const scale = fit * zoom;
  const offset = { x: (size.width - MAP_WIDTH * scale) / 2 + pan.x, y: (size.height - MAP_HEIGHT * scale) / 2 + pan.y };

  /** Viewport point → map units. */
  function toMap(clientX: number, clientY: number) {
    const rect = layer.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width * MAP_WIDTH, y: (clientY - rect.top) / rect.height * MAP_HEIGHT };
  }

  // Geometry as the game draws it, with the selection shifted while dragged.
  const drawn = useMemo(() => {
    const items: (PlacementGeometry & { missing?: boolean })[] = [];
    for (const placement of placements) {
      const moving = delta && selected.has(placement.id);
      const at = moving ? { ...placement, ...movedPoint(placement, delta.dx, delta.dy, grid) } : placement;
      const asset = assets.get(placement.asset);
      if (asset) { items.push(placementGeometry(at, asset)); continue; }
      const half = MISSING_SIZE / 2;
      items.push({ id: at.id, asset: at.asset, image: "", x: at.x, y: at.y, width: MISSING_SIZE, height: MISSING_SIZE,
        originX: 0.5, originY: 1, flip: false, box: { left: at.x - half, top: at.y - MISSING_SIZE, right: at.x + half, bottom: at.y },
        layer: "object", depth: characterDepth(at.y), footprint: null, solids: [], blocks: false, missing: true });
    }
    return items;
  }, [placements, assets, selected, delta, grid]);

  // Characters sort among the objects exactly like the game (feet y); signs float above.
  type Item = { key: string; depth: number; node: React.ReactNode };
  const items: Item[] = drawn.map((g) => ({ key: g.id, depth: g.depth, node: (
    <div key={g.id} data-placement-id={g.id} data-asset-id={g.asset} data-layer={g.layer}
      className={`${styles.placed} ${selected.has(g.id) ? styles.selected : ""} ${flagged.has(g.id) ? styles.flagged : ""} ${g.missing ? styles.missing : ""}`}
      style={{ left: g.box.left, top: g.box.top, width: g.width, height: g.height }}
      title={g.missing ? `ไม่พบภาพ ${g.asset}` : `${assets.get(g.asset)?.name ?? g.asset} · ${g.id}`}>
      {g.missing ? <span>?</span> : <img src={g.image} alt="" draggable={false} style={g.flip ? { transform: "scaleX(-1)" } : undefined} />}
    </div>) }));
  if (show.markers) for (const anchor of anchors) {
    const person = anchor.kind === "npc" || anchor.kind === "spawn";
    items.push({ key: anchor.id, depth: anchor.kind === "npc" ? characterDepth(anchor.y) : anchor.kind === "spawn" ? heroDepth(anchor.y) : 8000,
      node: (
        <div key={anchor.id} className={`${styles.anchor} ${styles[`anchor_${anchor.kind}`]} ${anchor.issue ? styles.anchorIssue : ""}`}
          data-anchor-id={anchor.id} style={{ left: anchor.x, top: anchor.y }} title={anchor.issue ?? anchor.label}>
          {person ? <span className={styles.figure} /> : <span className={styles.pin} />}
          <span className={styles.anchorLabel}>{anchor.issue ? "⚠ " : ""}{anchor.label}</span>
        </div>) });
  }
  const ordered = byDepth(items);

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!layer.current) return;
    const point = toMap(event.clientX, event.clientY);
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-placement-id]");
    frame.current?.focus({ preventScroll: true });
    if (event.button === 1 || (event.button === 0 && (spaceHeld.current || event.altKey))) {
      drag.current = { kind: "pan", start: { x: event.clientX, y: event.clientY }, pan };
    } else if (event.button !== 0) {
      return;
    } else if (armed) {
      // Kit pieces stand on their set's grid.
      const at = armed.kit ? snapToKit(armed.kit, point.x, point.y) : { x: snap(point.x, grid), y: snap(point.y, grid) };
      props.onPlace(armed, at.x, at.y, event.shiftKey);
      return;
    } else if (brush) {
      const cell = cellAt(brush.cell, point.x, point.y);
      const erase = brush.erase || event.shiftKey;
      drag.current = { kind: "brush", last: cell, erase };
      props.onBrush([cell], erase, true);
    } else if (target) {
      const id = target.dataset.placementId!;
      const additive = event.shiftKey || event.ctrlKey || event.metaKey;
      let ids: ReadonlySet<string> = selected;
      if (additive) {
        props.onSelect([id], "toggle");
        if (selected.has(id)) return;
        ids = new Set([...selected, id]);
      } else if (!selected.has(id)) {
        props.onSelect([id], "replace");
        ids = new Set([id]);
      }
      drag.current = { kind: "move", start: point, ids, moved: false };
    } else {
      drag.current = { kind: "box", start: point, additive: event.shiftKey };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!layer.current) return;
    const point = toMap(event.clientX, event.clientY);
    setHover(point);
    const current = drag.current;
    if (!current) return;
    if (current.kind === "brush") {
      const cell = cellAt(brush?.cell ?? 32, point.x, point.y);
      if (cell.col === current.last.col && cell.row === current.last.row) return;
      props.onBrush(cellLine(current.last, cell).slice(1), current.erase, false);
      current.last = cell;
    } else if (current.kind === "pan") {
      setPan({ x: current.pan.x + event.clientX - current.start.x, y: current.pan.y + event.clientY - current.start.y });
    } else if (current.kind === "move") {
      const dx = point.x - current.start.x, dy = point.y - current.start.y;
      if (!current.moved && Math.hypot(dx, dy) * scale < 3) return;
      current.moved = true;
      setDelta({ dx, dy });
    } else {
      setBox({ left: Math.min(current.start.x, point.x), top: Math.min(current.start.y, point.y),
        right: Math.max(current.start.x, point.x), bottom: Math.max(current.start.y, point.y) });
    }
  }
  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current) return;
    if (current.kind === "move") {
      if (current.moved && delta) props.onMove(current.ids, delta.dx, delta.dy);
      setDelta(null);
    } else if (current.kind === "box") {
      setBox(null);
      const area = box && (box.right - box.left) * scale > 3 && (box.bottom - box.top) * scale > 3 ? box : null;
      if (!area) { if (!current.additive) props.onSelect([], "replace"); return; }
      // Anything whose anchor or drawn box overlaps the rectangle.
      const hit = drawn.filter((g) => g.box.right > area.left && g.box.left < area.right && g.box.bottom > area.top && g.box.top < area.bottom)
        .map((g) => g.id);
      props.onSelect(hit, current.additive ? "add" : "replace");
    }
  }
  // Wheel zoom needs a non-passive listener so the page doesn't scroll too.
  const wheelRef = useRef<(event: WheelEvent) => void>(() => {});
  wheelRef.current = wheel;
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const listener = (event: WheelEvent) => { event.preventDefault(); wheelRef.current(event); };
    element.addEventListener("wheel", listener, { passive: false });
    return () => element.removeEventListener("wheel", listener);
  }, []);
  function wheel(event: WheelEvent) {
    if (!frame.current) return;
    const rect = frame.current.getBoundingClientRect();
    const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const nextZoom = Math.min(8, Math.max(0.5, zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
    zoomTo(nextZoom, cursor);
  }
  /** Zoom keeping the map point under `cursor` (frame px) still. */
  function zoomTo(nextZoom: number, cursor = { x: size.width / 2, y: size.height / 2 }) {
    const at = { x: (cursor.x - offset.x) / scale, y: (cursor.y - offset.y) / scale };
    const nextScale = fit * nextZoom;
    const centred = { x: (size.width - MAP_WIDTH * nextScale) / 2, y: (size.height - MAP_HEIGHT * nextScale) / 2 };
    setZoom(nextZoom);
    setPan({ x: cursor.x - at.x * nextScale - centred.x, y: cursor.y - at.y * nextScale - centred.y });
  }
  function drop(event: React.DragEvent<HTMLDivElement>) {
    const id = event.dataTransfer.getData("application/x-asset-id");
    if (!id || !layer.current) return;
    event.preventDefault();
    const point = toMap(event.clientX, event.clientY);
    props.onDropAsset(id, snap(point.x, grid), snap(point.y, grid));
  }

  const strokes = 1 / scale;
  return (
    <div className={styles.stageWrap}>
      <div ref={frame} className={`${styles.stage} ${armed || brush ? styles.armed : ""}`} tabIndex={0} data-testid="map-editor-stage"
        data-zoom={zoom.toFixed(2)} data-brush={brush ? (brush.erase ? "erase" : "paint") : undefined} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={pointerUp} onPointerLeave={() => setHover(null)}
        onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-asset-id")) event.preventDefault(); }} onDrop={drop}>
        <div ref={layer} className={styles.layer} data-testid="map-editor-layer"
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT, transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            ["--inverse-scale" as string]: String(1 / scale) }}>
          <img className={styles.painting} src={image} alt="" draggable={false} />
          {ordered.map((item) => item.node)}
          <svg className={styles.overlay} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width={MAP_WIDTH} height={MAP_HEIGHT}>
            {brush && <>
              <defs><pattern id="map-editor-kit-grid" width={brush.cell} height={brush.cell} patternUnits="userSpaceOnUse">
                <path d={`M ${brush.cell} 0 L 0 0 0 ${brush.cell}`} fill="none" stroke="rgba(226,189,106,0.35)" strokeWidth={strokes} />
              </pattern></defs>
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-editor-kit-grid)" />
              {hover && (() => { const c = cellAt(brush.cell, hover.x, hover.y); return (
                <rect x={c.col * brush.cell} y={c.row * brush.cell} width={brush.cell} height={brush.cell}
                  className={brush.erase ? styles.brushCellErase : styles.brushCell} strokeWidth={1.5 * strokes} data-testid="kit-brush-cell" />); })()}
            </>}
            {grid && !brush && <>
              <defs><pattern id="map-editor-grid" width={grid} height={grid} patternUnits="userSpaceOnUse">
                <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={strokes} />
              </pattern></defs>
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-editor-grid)" />
            </>}
            {show.collision && collision.map((shape, index) => shape.kind === "rect"
              ? <rect key={index} x={shape.left} y={shape.top} width={shape.right - shape.left} height={shape.bottom - shape.top}
                className={styles.baseSolid} strokeWidth={strokes} />
              : <ellipse key={index} cx={shape.x} cy={shape.y} rx={shape.radiusX} ry={shape.radiusY} className={styles.baseSolid} strokeWidth={strokes} />)}
            {show.footprints && drawn.map((g) => g.solids.map((rect, i) => (
              <rect key={`${g.id}:${i}`} data-footprint={g.id} x={rect.left} y={rect.top} width={rect.right - rect.left}
                height={rect.bottom - rect.top} className={g.blocks ? styles.footprint : styles.footprintOpen}
                strokeWidth={1.5 * strokes} />
            )))}
            {drawn.filter((g) => selected.has(g.id)).map((g) => (
              <g key={g.id}>
                <rect x={g.box.left} y={g.box.top} width={g.width} height={g.height} className={styles.selectBox} strokeWidth={1.5 * strokes} />
                <circle cx={g.x} cy={g.y} r={3 * strokes} className={styles.anchorDot} />
              </g>
            ))}
            {box && <rect x={box.left} y={box.top} width={box.right - box.left} height={box.bottom - box.top} className={styles.marquee} strokeWidth={strokes} />}
          </svg>
        </div>
      </div>
      <div className={styles.stageBar}>
        <button type="button" onClick={() => zoomTo(Math.max(0.5, zoom / 1.25))} aria-label="ซูมออก">−</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>พอดีจอ</button>
        <button type="button" onClick={() => zoomTo(Math.min(8, zoom * 1.25))} aria-label="ซูมเข้า">+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <span className={styles.coords}>{hover ? `x ${Math.round(hover.x)} · y ${Math.round(hover.y)}` : "—"}</span>
        <span className={styles.hint}>{armed ? `คลิกเพื่อวาง “${armed.name}” · Shift วางต่อ · Esc ยกเลิก`
          : brush ? (brush.erase ? "แปรงลบ: คลิก/ลากบนช่องเพื่อเอาชิ้นออก · Esc เลิกใช้แปรง" : "แปรงต่อกัน: คลิก/ลากเพื่อวาง ชิ้นจะต่อกันเอง · Shift+ลาก ลบ · Esc เลิกใช้แปรง")
          : "ลากเพื่อเลือกหลายชิ้น · Space/Alt+ลาก หรือปุ่มกลางเพื่อเลื่อน · ล้อเมาส์ซูม"}</span>
      </div>
    </div>
  );
}
