"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ASSET_DIRECTIONS, type AssetEntry, type AssetStatus, type Footprint } from "@/lib/assets/types";
import { defaultFootprint, footprintFromImage, footprintToImage, parseTags, type AssetEdit } from "@/lib/engine/asset-edit";
import { CATEGORY_LABEL, REGION_LABEL, STATUS_LABEL } from "./labels";

const PREVIEW_W = 360;
const PREVIEW_H = 300;
const LAYER_LABEL: Record<AssetEntry["layer"], string> = { ground: "พื้น (ใต้ตัวละครเสมอ)", object: "วัตถุ (เรียงตามความลึก)", overhead: "เหนือหัว (บนตัวละครเสมอ)" };

interface Props {
  asset: AssetEntry;
  edited: boolean;
  onChange: (change: AssetEdit) => void;
  onRevert: () => void;
}

export function AssetDetail({ asset, edited, onChange, onRevert }: Props) {
  const [tagText, setTagText] = useState(asset.tags.join(", "));
  const [view, setView] = useState<string>(asset.image);
  const commitTags = () => { const tags = parseTags(tagText); onChange({ tags }); setTagText(tags.join(", ")); };
  const footprint = asset.footprint;
  const setFootprint = (patch: Partial<Footprint>) => footprint && onChange({ footprint: { ...footprint, ...patch } });
  const num = (value: string, fallback: number) => (Number.isFinite(Number(value)) && value.trim() !== "" ? Math.round(Number(value)) : fallback);

  return (
    <div className="eng-detail" data-testid="asset-detail" data-asset-id={asset.id}>
      <div className="eng-detail-head">
        <h2>{asset.name || asset.id}</h2>
        <code>{asset.id}</code>
        {edited && <button type="button" className="eng-link" onClick={onRevert}>คืนค่าเดิม</button>}
      </div>

      <Preview asset={asset} image={view} onFootprint={(fp) => onChange({ footprint: fp })} />
      <p className="eng-hint">✚ จุดยึด (ฐานกลาง) · กรอบแดง = พื้นที่กันทางเดิน ลากเพื่อย้าย ลากมุมเพื่อปรับขนาด</p>

      {asset.views && Object.keys(asset.views).length > 0 && (
        <div className="eng-views" data-testid="asset-views">
          {ASSET_DIRECTIONS.filter((dir) => asset.views?.[dir]).map((dir) => (
            <button key={dir} type="button" className="eng-view eng-checker" aria-pressed={view === asset.views![dir]} onClick={() => setView(asset.views![dir]!)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.views![dir]} alt={dir} loading="lazy" />
              <span>{dir}</span>
            </button>
          ))}
        </div>
      )}

      <div className="eng-status-row" role="group" aria-label="สถานะ">
        {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((status) => (
          <button key={status} type="button" className={`eng-btn eng-status-btn-${status}`} aria-pressed={asset.status === status} onClick={() => onChange({ status })}>
            {STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      <div className="eng-form">
        <label className="eng-field">
          <span>ชื่อ</span>
          <input value={asset.name} onChange={(e) => onChange({ name: e.target.value })} data-testid="asset-name" />
        </label>
        <label className="eng-field">
          <span>แท็ก (คั่นด้วย ,)</span>
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} onBlur={commitTags} onKeyDown={(e) => { if (e.key === "Enter") commitTags(); }} />
        </label>
        <label className="eng-field">
          <span>หมวดย่อย</span>
          <input value={asset.subcategory} onChange={(e) => onChange({ subcategory: e.target.value.trim() })} />
        </label>
        <label className="eng-field">
          <span>ชั้น</span>
          <select value={asset.layer} onChange={(e) => onChange({ layer: e.target.value as AssetEntry["layer"] })}>
            {(Object.keys(LAYER_LABEL) as AssetEntry["layer"][]).map((layer) => <option key={layer} value={layer}>{LAYER_LABEL[layer]}</option>)}
          </select>
        </label>
        <label className="eng-check">
          <input type="checkbox" checked={asset.flippable} onChange={(e) => onChange({ flippable: e.target.checked })} />
          <span>กลับซ้าย-ขวาได้</span>
        </label>
        <div className="eng-pair">
          <label className="eng-field"><span>กว้างบนแผนที่</span>
            <input type="number" min={1} value={asset.mapWidth} onChange={(e) => onChange({ mapWidth: Math.max(1, num(e.target.value, asset.mapWidth)) })} />
          </label>
          <label className="eng-field"><span>สูงบนแผนที่</span>
            <input type="number" min={1} value={asset.mapHeight} onChange={(e) => onChange({ mapHeight: Math.max(1, num(e.target.value, asset.mapHeight)) })} />
          </label>
        </div>
        <label className="eng-check">
          <input type="checkbox" checked={!!footprint} data-testid="asset-footprint-toggle"
            onChange={(e) => onChange({ footprint: e.target.checked ? defaultFootprint(asset) : null })} />
          <span>กันทางเดิน (footprint)</span>
        </label>
        {footprint && (
          <div className="eng-quad" data-testid="asset-footprint">
            {(["x", "y", "w", "h"] as const).map((key) => (
              <label key={key} className="eng-field"><span>{key}</span>
                <input type="number" value={footprint[key]} min={key === "w" || key === "h" ? 1 : undefined}
                  onChange={(e) => setFootprint({ [key]: key === "w" || key === "h" ? Math.max(1, num(e.target.value, footprint[key])) : num(e.target.value, footprint[key]) })} />
              </label>
            ))}
          </div>
        )}
      </div>

      <dl className="eng-facts">
        <dt>หมวด</dt><dd>{CATEGORY_LABEL[asset.category]}</dd>
        <dt>ภาค</dt><dd>{REGION_LABEL[asset.region]}</dd>
        {asset.sect && <><dt>สำนัก</dt><dd>{asset.sect}</dd></>}
        <dt>ขนาดภาพ</dt><dd>{asset.width} × {asset.height} px</dd>
        <dt>จุดยึด</dt><dd>{asset.anchorX}, {asset.anchorY}</dd>
        {asset.variantOf && <><dt>แบบของ</dt><dd><code>{asset.variantOf}</code></dd></>}
        {asset.animations && <><dt>ท่าเคลื่อนไหว</dt><dd>{Object.keys(asset.animations).join(", ")}</dd></>}
        <dt>ที่มา</dt><dd>{asset.source.tool}{asset.source.seed !== undefined ? ` · seed ${asset.source.seed}` : ""}</dd>
      </dl>
      {asset.source.prompt && <p className="eng-prompt">{asset.source.prompt}</p>}
    </div>
  );
}

type Drag = { mode: "move" | "se" | "nw"; x: number; y: number; box: Footprint };

function Preview({ asset, image, onFootprint }: { asset: AssetEntry; image: string; onFootprint: (fp: Footprint) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const w = Math.max(1, asset.width);
  const h = Math.max(1, asset.height);
  const fit = Math.min(PREVIEW_W / w, PREVIEW_H / h);
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  const box = asset.footprint ? footprintToImage(asset, asset.footprint) : null;
  const handle = Math.max(2, 6 / scale);

  const toImage = (event: ReactPointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * w, y: ((event.clientY - rect.top) / rect.height) * h };
  };
  const start = (mode: Drag["mode"]) => (event: ReactPointerEvent<SVGElement>) => {
    if (!box) return;
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    const p = toImage(event);
    drag.current = { mode, x: p.x, y: p.y, box };
  };
  const move = (event: ReactPointerEvent<SVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toImage(event);
    const dx = p.x - d.x, dy = p.y - d.y;
    const b = d.box;
    const next = d.mode === "move" ? { ...b, x: b.x + dx, y: b.y + dy }
      : d.mode === "se" ? { ...b, w: Math.max(1, b.w + dx), h: Math.max(1, b.h + dy) }
      : { x: Math.min(b.x + dx, b.x + b.w - 1), y: Math.min(b.y + dy, b.y + b.h - 1), w: Math.max(1, b.w - dx), h: Math.max(1, b.h - dy) };
    onFootprint(footprintFromImage(asset, next));
  };
  const end = () => { drag.current = null; };

  return (
    <div className="eng-preview eng-checker" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
      <div className="eng-preview-stage" style={{ width: w * scale, height: h * scale }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={asset.name} width={w * scale} height={h * scale} />
        <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} onPointerMove={move} onPointerUp={end} onPointerCancel={end} data-testid="asset-preview">
          {box && (
            <g>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} className="eng-fp" onPointerDown={start("move")} data-testid="footprint-box" />
              <rect x={box.x - handle / 2} y={box.y - handle / 2} width={handle} height={handle} className="eng-fp-handle" onPointerDown={start("nw")} />
              <rect x={box.x + box.w - handle / 2} y={box.y + box.h - handle / 2} width={handle} height={handle} className="eng-fp-handle" onPointerDown={start("se")} data-testid="footprint-handle" />
            </g>
          )}
          <g className="eng-anchor" data-testid="anchor">
            <line x1={asset.anchorX - 3 * handle} y1={asset.anchorY} x2={asset.anchorX + 3 * handle} y2={asset.anchorY} />
            <line x1={asset.anchorX} y1={asset.anchorY - 3 * handle} x2={asset.anchorX} y2={asset.anchorY + 3 * handle} />
            <circle cx={asset.anchorX} cy={asset.anchorY} r={handle / 2} />
          </g>
        </svg>
      </div>
    </div>
  );
}
