"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Modal } from "@/components/ui/modal";
import { PagedGrid } from "@/components/ui/paged-grid";
import { useShortScreen } from "@/components/ui/use-short-screen";
import {
  MERIDIAN_COMBAT_KEYS,
  MERIDIAN_KIND_LABEL,
  MERIDIAN_RANK_MAX,
  STAT_KEYS,
  STAT_LABEL,
  getArt,
  getMeridianChart,
  getSkill,
  meridianChartBonus,
  meridianChartFullCost,
  meridianChartSpent,
  meridianNextCost,
  meridianNodeState,
  normalizeMeridianRanks,
  type MeridianBonus,
  type MeridianChart,
  type MeridianCombat,
  type MeridianKind,
  type MeridianRank,
  type PartialStats,
} from "@/lib/game";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { BACK_POINTS, MERIDIAN_POSES, poseBodyPoints, poseForChart } from "./meridian-poses";
import { BODY_POINT_LABEL, MeridianSilhouette, POSE_VIEWBOX } from "./meridian-figure";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Each kind's glow. */
export const MERIDIAN_KIND_COLOR: Record<MeridianKind, string> = {
  base: "#5fe8b8",
  combat: "#ff7a52",
  ability: "#62c6ff",
  buff: "#d9a0ff",
};

const TIER_COLOR = ["#cfc6ac", "#7fd48f", "#6fb8f2", "#c48ff0", "#f0a456", "#f06a55"];

const COMBAT_LABEL: Record<keyof MeridianCombat, string> = {
  atk: "พลังโจมตี", pd: "ป้องกันกาย", id_: "ป้องกันใน", hp: "พลังชีวิต", mp: "พลังปราณ",
  pa: "โจมตีกาย", ia: "โจมตีใน", spd: "ความเร็ว", acc: "แม่นยำ", res: "ต้านทาน",
  cri: "คริติคอล", eva: "หลบหลีก", pct_atk: "พลังโจมตี", pct_red: "ลดความเสียหาย", hp_regen: "ฟื้นพลังชีวิต",
};

function formatCombat(key: keyof MeridianCombat, v: number): string {
  if (key === "pct_atk") return `+${v}%`;
  if (key === "pct_red") return `${v}%`;
  if (key === "hp_regen") return `${v}%/ตา`;
  return `+${v}`;
}

interface BonusLine { label: string; value: string; group: "stat" | "combat" }

/** Bonus fields as Thai lines, base stats first. */
export function bonusLines(b: { stats?: PartialStats; combat?: Partial<MeridianCombat> }): BonusLine[] {
  const out: BonusLine[] = [];
  for (const k of STAT_KEYS) {
    const v = b.stats?.[k];
    if (v) out.push({ label: STAT_LABEL[k], value: `+${v}`, group: "stat" });
  }
  for (const k of MERIDIAN_COMBAT_KEYS) {
    const v = b.combat?.[k];
    if (v) out.push({ label: COMBAT_LABEL[k], value: formatCombat(k, v), group: "combat" });
  }
  return out;
}

const rankText = (r: MeridianRank) => bonusLines(r).map((l) => `${l.label} ${l.value}`).join(" · ") || "—";
const pointName = (name: string) => (name.startsWith("จุด") ? name : `จุด${name}`);

interface LearnedChart { chart: MeridianChart; ranks: number[]; opened: number; rankSum: number }

// ชีพจร — three landscape columns: the learned charts; the silhouette in a
// training pose with the chart's points joined in order (hover / tap a point
// for its ranks, open or raise the picked one); the chart's total bonus, the
// points to spend, its description and requirement.
export function MeridianPopup({ open, onClose }: Props) {
  const build = useWorldStore((s) => s.playerBuild);
  const points = useWorldStore((s) => s.meridianPoints ?? 0);
  const openMeridianNode = useWorldStore((s) => s.openMeridianNode);
  const short = useShortScreen();

  const charts = useMemo<LearnedChart[]>(() => {
    const out: LearnedChart[] = [];
    for (const [id, stored] of Object.entries(build?.meridians ?? {})) {
      const chart = getMeridianChart(id);
      if (!chart) continue;
      const ranks = normalizeMeridianRanks(chart, stored);
      out.push({ chart, ranks, opened: ranks.filter((r) => r > 0).length, rankSum: ranks.reduce((a, b) => a + b, 0) });
    }
    return out.sort((a, b) => b.chart.ti - a.chart.ti || a.chart.name.localeCompare(b.chart.name, "th"));
  }, [build?.meridians]);

  const [chartId, setChartId] = useState<string | null>(null);
  const current = charts.find((c) => c.chart.id === chartId) ?? charts[0] ?? null;
  useEffect(() => { if (!open) setChartId(null); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="☯ ชีพจร" fill>
      {!current ? (
        <MeridianEmpty points={points} />
      ) : (
        <div className="menu-cols meridian-cols" data-testid="meridian-screen">
          <section className="menu-col meridian-list" aria-label="แผนภาพชีพจรที่เรียนแล้ว">
            <div className="menu-col-head">
              <span className="menu-col-title">แผนภาพชีพจร ({charts.length})</span>
            </div>
            <div className="meridian-points-chip" data-testid="meridian-points" data-points={points}>
              <span>แต้มชีพจร</span><b>{points}</b>
            </div>
            <PagedGrid items={charts} itemKey={(c) => c.chart.id} cellWidth={200} cellHeight={short ? 44 : 56} gap={4}
              focusKey={current.chart.id} label="รายการแผนภาพชีพจร"
              render={(c) => (
                <button type="button" className="meridian-chart-row" aria-pressed={c.chart.id === current.chart.id}
                  data-chart-id={c.chart.id} onClick={() => setChartId(c.chart.id)}
                  style={{ "--kind": MERIDIAN_KIND_COLOR[c.chart.kind], "--tier": TIER_COLOR[c.chart.ti] } as CSSProperties}>
                  <span className="meridian-tier">T{c.chart.ti}</span>
                  <span className="meridian-chart-row-text">
                    <span>{c.chart.name}</span>
                    <small>เปิด {c.opened}/{c.chart.nodes.length} จุด · ขั้น {c.rankSum}/{c.chart.nodes.length * MERIDIAN_RANK_MAX}</small>
                    <i className="meridian-chart-bar" aria-hidden="true"><i style={{ width: `${(c.rankSum / (c.chart.nodes.length * MERIDIAN_RANK_MAX)) * 100}%` }} /></i>
                  </span>
                </button>
              )} />
          </section>

          <MeridianStage key={current.chart.id} entry={current} points={points}
            onOpen={(i) => {
              const result = openMeridianNode(current.chart.id, i);
              if (!result.ok) { toast("warn", result.reason); return; }
              const node = current.chart.nodes[i];
              toast("success", result.rank === 1 ? `เปิด${pointName(node.name)}แล้ว` : `${pointName(node.name)} ขึ้นขั้น ${result.rank}`);
            }} />

          <MeridianSummary entry={current} points={points} build={build} />
        </div>
      )}
    </Modal>
  );
}

function MeridianEmpty({ points }: { points: number }) {
  const pose = MERIDIAN_POSES.lotus;
  return (
    <div className="menu-cols meridian-empty-cols" data-testid="meridian-empty">
      <section className="menu-col meridian-stage-col" aria-hidden="true">
        <div className="meridian-stage meridian-stage--empty">
          <svg className="meridian-svg meridian-empty-figure" viewBox={POSE_VIEWBOX} preserveAspectRatio="xMidYMid meet">
            <MeridianSilhouette pose={pose} idPrefix="mer-empty" />
          </svg>
        </div>
      </section>
      <section className="menu-col menu-col--scroll meridian-empty-text">
        <h3 className="meridian-title">ยังไม่ได้เรียนแผนภาพชีพจร</h3>
        <div className="meridian-points-chip" data-testid="meridian-points" data-points={points}>
          <span>แต้มชีพจร</span><b>{points}</b>
        </div>
        <ul className="meridian-howto">
          <li><b>แต้มชีพจร</b> ได้มาทุกครั้งที่วิชาฝีมือหรือลมปราณเลื่อนขั้น — ขั้นละ 1 แต้ม</li>
          <li><b>แผนภาพชีพจร</b> หาได้จากร้านหนังสือในเมือง ของที่ศัตรูทิ้งไว้ และรางวัลภารกิจ ยิ่งขั้นสูงยิ่งหายาก</li>
          <li>อ่านแผนภาพจาก <b>ย่าม</b> ได้เมื่อเรียนวิชาที่แผนภาพนั้นต้องการครบแล้ว</li>
          <li>เปิดจุดชีพจรตามลำดับ จุดละ 3 ขั้น — แต่ละขั้นเพิ่มค่าสถานะ ค่าการต่อสู้ หรือความสามารถพิเศษ</li>
        </ul>
      </section>
    </div>
  );
}

function MeridianStage({ entry, points, onOpen }: { entry: LearnedChart; points: number; onOpen: (index: number) => void }) {
  const { chart, ranks } = entry;
  const pose = useMemo(() => poseForChart(chart), [chart]);
  const spots = useMemo(() => poseBodyPoints(pose), [pose]);
  const color = MERIDIAN_KIND_COLOR[chart.kind];
  const firstOpen = () => {
    const i = chart.nodes.findIndex((_, k) => meridianNodeState(chart, ranks, k) === "open");
    return i >= 0 ? i : 0;
  };
  const [selected, setSelected] = useState<number>(firstOpen);
  const [hover, setHover] = useState<number | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const tipIndex = hover ?? (tipOpen ? selected : null);

  const nodes = chart.nodes.map((node, i) => {
    const [x, y] = spots[node.at];
    return { node, i, x, y, rank: ranks[i] ?? 0, state: meridianNodeState(chart, ranks, i), back: BACK_POINTS.has(node.at) };
  });
  const sel = nodes[selected] ?? nodes[0];
  const selCost = meridianNextCost(chart, ranks, sel.i);
  const canOpen = sel.state === "open" && selCost !== null && points >= selCost;
  const prevName = sel.i > 0 ? pointName(chart.nodes[sel.i - 1].name) : "";
  const actionLabel = sel.state === "max" ? "เปิดถึงขั้นสูงสุดแล้ว"
    : sel.rank === 0 ? `เปิดจุด · ${selCost} แต้ม` : `เสริมขั้น ${sel.rank + 1} · ${selCost} แต้ม`;
  const note = sel.state === "locked" ? `ต้องเปิด${prevName}ก่อน`
    : sel.state === "open" && selCost !== null && points < selCost ? `แต้มชีพจรไม่พอ (มี ${points})` : "";

  return (
    <section className="menu-col meridian-stage-col" aria-label="แผนภาพ" style={{ "--kind": color } as CSSProperties}>
      <div className="meridian-stage-head">
        <h3 className="meridian-title" data-testid="meridian-chart-name">ชีพจร{chart.name}</h3>
        <span className="meridian-stage-meta">
          <span className="meridian-tier" style={{ "--tier": TIER_COLOR[chart.ti] } as CSSProperties}>T{chart.ti}</span>
          <span>{MERIDIAN_KIND_LABEL[chart.kind]}</span>
        </span>
      </div>
      <div className="meridian-stage" onClick={() => setTipOpen(false)}>
        <div className="meridian-figure" data-pose={pose.id} data-testid="meridian-figure">
          <svg className="meridian-svg" viewBox={POSE_VIEWBOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <MeridianSilhouette pose={pose} idPrefix={`mer-${chart.id}`} />
            <defs>
              <filter id="mer-line-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {nodes.slice(1).map((n) => {
              const a = nodes[n.i - 1];
              const lit = n.rank > 0;
              const d = `M${a.x} ${a.y} L${n.x} ${n.y}`;
              return lit ? (
                <g key={n.i} className="meridian-line meridian-line--lit" filter="url(#mer-line-glow)">
                  <path d={d} stroke={color} strokeWidth={1.4 + Math.min(n.rank, a.rank) * 0.5} />
                  <path d={d} className="meridian-flow" stroke="#fff8e0" strokeWidth={1.2} />
                </g>
              ) : (
                <path key={n.i} d={d} className={`meridian-line${a.rank > 0 ? " meridian-line--next" : ""}`} stroke={a.rank > 0 ? color : "#e8d8b0"} strokeWidth={1.1} />
              );
            })}
          </svg>
          {nodes.map((n) => (
            <button key={n.i} type="button"
              className={`meridian-node meridian-node--${n.state} meridian-node--r${n.rank}${n.back ? " meridian-node--back" : ""}`}
              style={{ left: `${(n.x / 240) * 100}%`, top: `${(n.y / 320) * 100}%` }}
              aria-pressed={n.i === sel.i}
              aria-label={`${pointName(n.node.name)} ขั้น ${n.rank}/${MERIDIAN_RANK_MAX}${n.state === "locked" ? " (ยังเปิดไม่ได้)" : ""}`}
              data-node-index={n.i} data-rank={n.rank} data-state={n.state}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") setHover(n.i); }}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(n.i)} onBlur={() => setHover(null)}
              onClick={(e) => { e.stopPropagation(); setSelected(n.i); setTipOpen(true); }}>
              <span className="meridian-node-core" />
              <span className="meridian-node-num" aria-hidden="true">{n.i + 1}</span>
            </button>
          ))}
          {tipIndex !== null && nodes[tipIndex] && (
            <NodeTip chart={chart} ranks={ranks} index={tipIndex} x={nodes[tipIndex].x} y={nodes[tipIndex].y} points={points} />
          )}
        </div>
        <span className="meridian-pose-name">{pose.name}</span>
      </div>
      <div className="meridian-action" data-testid="meridian-action">
        <div className="meridian-action-text">
          <strong>{pointName(sel.node.name)}</strong>
          <span className="meridian-pips" aria-label={`ขั้น ${sel.rank}/${MERIDIAN_RANK_MAX}`}>
            {[1, 2, 3].map((r) => <i key={r} className={r <= sel.rank ? "on" : ""} />)}
          </span>
          {note && <small className="meridian-action-note">{note}</small>}
        </div>
        <button type="button" className="meridian-open-btn" data-testid="meridian-open" disabled={!canOpen} onClick={() => onOpen(sel.i)}>
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

function NodeTip({ chart, ranks, index, x, y, points }: { chart: MeridianChart; ranks: number[]; index: number; x: number; y: number; points: number }) {
  const node = chart.nodes[index];
  const rank = ranks[index] ?? 0;
  const state = meridianNodeState(chart, ranks, index);
  const cost = meridianNextCost(chart, ranks, index);
  const right = x > 120;
  const below = y < 110;
  return (
    <div className={`meridian-tip${right ? " meridian-tip--left" : ""}${below ? " meridian-tip--below" : ""}`} role="tooltip" data-testid="meridian-tip"
      style={{ left: `${(x / 240) * 100}%`, top: `${(y / 320) * 100}%` }}>
      <div className="meridian-tip-head">
        <strong>{pointName(node.name)}</strong>
        <small>จุดที่ {index + 1}/{chart.nodes.length} · {BODY_POINT_LABEL[node.at]}{BACK_POINTS.has(node.at) ? " (ด้านหลัง)" : ""}</small>
      </div>
      <ol className="meridian-tip-ranks">
        {node.ranks.map((r, k) => (
          <li key={k} className={k + 1 <= rank ? "done" : k + 1 === rank + 1 ? "next" : ""}>
            <span>ขั้น {k + 1}</span><span>{rankText(r)}</span>
          </li>
        ))}
      </ol>
      <div className="meridian-tip-foot">
        {state === "max" ? "เปิดถึงขั้นสูงสุดแล้ว"
          : state === "locked" ? `ต้องเปิด${pointName(chart.nodes[index - 1].name)}ก่อน`
          : `ขั้นต่อไปใช้ ${cost} แต้ม${cost !== null && points < cost ? " (แต้มไม่พอ)" : ""}`}
      </div>
    </div>
  );
}

function MeridianSummary({ entry, points, build }: { entry: LearnedChart; points: number; build: ReturnType<typeof useWorldStore.getState>["playerBuild"] }) {
  const { chart, ranks } = entry;
  const total: MeridianBonus = meridianChartBonus(chart, ranks);
  const lines = bonusLines(total);
  const stats = lines.filter((l) => l.group === "stat");
  const combat = lines.filter((l) => l.group === "combat");
  const full = bonusLines(meridianChartBonus(chart, chart.nodes.map(() => MERIDIAN_RANK_MAX)));
  const spent = meridianChartSpent(chart, ranks), fullCost = meridianChartFullCost(chart);
  const learnedSkills = new Set(build?.learnedSkillIds ?? []), learnedArts = new Set(build?.learnedArtIds ?? []);
  const reqs = [
    ...(chart.requires.skills ?? []).map((id) => ({ id, name: getSkill(id)?.n ?? id, ok: learnedSkills.has(id), kind: "วิชา" })),
    ...(chart.requires.arts ?? []).map((id) => ({ id, name: getArt(id)?.n ?? id, ok: learnedArts.has(id), kind: "ลมปราณ" })),
  ];
  return (
    <section className="menu-col menu-col--scroll meridian-summary" aria-label="ผลรวมของชีพจร" data-testid="meridian-summary">
      <div className="menu-col-head"><span className="menu-col-title">ผลจากชีพจรนี้</span></div>
      <div className="meridian-points-chip meridian-points-chip--wide">
        <span>แต้มชีพจรคงเหลือ</span><b>{points}</b>
      </div>
      <div className="meridian-spent">ใช้ไปแล้ว {spent} / {fullCost} แต้ม</div>
      {lines.length === 0 ? (
        <p className="meridian-muted">ยังไม่ได้เปิดจุดใด — เมื่อเปิดเต็มทุกจุดจะได้ {full.map((l) => `${l.label} ${l.value}`).join(" · ")}</p>
      ) : (
        <>
          {stats.length > 0 && <BonusTable title="ค่าสถานะพื้นฐาน" lines={stats} testId="meridian-total-stats" />}
          {combat.length > 0 && <BonusTable title="ค่าการต่อสู้" lines={combat} testId="meridian-total-combat" />}
        </>
      )}
      <p className="meridian-desc">{chart.description}</p>
      <div className="meridian-reqs">
        <span className="meridian-reqs-title">วิชาที่ต้องเรียนก่อน</span>
        {reqs.map((r) => (
          <span key={`${r.kind}-${r.id}`} className={`meridian-req${r.ok ? " ok" : ""}`}>{r.ok ? "✓" : "✗"} {r.name} <small>{r.kind}</small></span>
        ))}
      </div>
    </section>
  );
}

function BonusTable({ title, lines, testId }: { title: string; lines: BonusLine[]; testId: string }) {
  return (
    <div className="meridian-bonus" data-testid={testId}>
      <span className="meridian-bonus-title">{title}</span>
      <dl>
        {lines.map((l) => (
          <div key={l.label + l.value}><dt>{l.label}</dt><dd>{l.value}</dd></div>
        ))}
      </dl>
    </div>
  );
}

/** Is there a point the hero can open or raise right now? (HUD badge) */
export function meridianActionable(meridians: Readonly<Record<string, readonly number[]>> | undefined, points: number): boolean {
  if (points <= 0 || !meridians) return false;
  for (const [id, stored] of Object.entries(meridians)) {
    const chart = getMeridianChart(id);
    if (!chart) continue;
    const ranks = normalizeMeridianRanks(chart, stored);
    for (let i = 0; i < chart.nodes.length; i++) {
      if (meridianNodeState(chart, ranks, i) !== "open") continue;
      const cost = meridianNextCost(chart, ranks, i);
      if (cost !== null && cost <= points) return true;
    }
  }
  return false;
}
