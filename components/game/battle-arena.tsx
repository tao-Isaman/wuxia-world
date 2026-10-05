"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseSlotId } from "@/lib/game";
import {
  activeUnit,
  aimableFor,
  cellKey,
  describeGrid,
  predictOrder,
  reachableFor,
  sameCell,
  slotGrid,
  slotReady,
  targetsFor,
  unitById,
  type Cell,
  type GridBattleState,
  type GridUnit,
  type UnitLook,
} from "@/lib/game/grid";
import { fleeChance } from "@/lib/game/combat-actions";
import { isPlayerTurn, useBattleStore } from "@/store/battle-store";
import { useCharacterStore } from "@/store/character-store";
import { BattleLog } from "./battle-log";
import { BattleCanvas } from "./battle-canvas";
import { CharacterPreview } from "./character-preview";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import { buffBadgeLabel, debuffBadgeLabel, describeBuff, describeDebuff } from "./buff-descriptions";
import { hexColor, statusKey, statusStyle } from "@/lib/ui/status-catalog";
import { SkillIcon, ArtIcon } from "./skill-icon";
import { SoundButton } from "@/components/sound-button";
import type { GridBattleUi } from "@/lib/stage/grid-battle-runtime";
import { Bot, Check, Footprints, Hourglass, X } from "lucide-react";
import "@/app/grid-battle.css";

const TIMELINE_LENGTH = 8;

// ─── Small pieces ──────────────────────────────────────────────────────
/** A unit's face for the timeline / info card, drawn from its own look. */
function UnitPortrait({ look }: { look: UnitLook }) {
  if (look.kind === "creature") {
    const f = Math.max(0, Math.min(7, look.frame));
    return <span className="gb-creature" aria-hidden="true"
      style={{ backgroundPosition: `${(f % 4) * 100 / 3}% ${Math.floor(f / 4) * 100}%` }} />;
  }
  if (look.still) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className="gb-still" aria-hidden="true"><img src={look.still} alt="" draggable={false} /></span>;
  }
  return <CharacterPreview id={look.characterId} framing="bust" />;
}

function TurnTimeline({ state, onPick }: { state: GridBattleState; onPick: (id: string) => void }) {
  const order = state.phase === "over" ? [] : predictOrder(state, TIMELINE_LENGTH);
  if (!order.length) return null;
  const names = order.map((id) => unitById(state, id)?.name ?? id);
  return <ol className="gb-timeline" aria-label={`ลำดับการลงมือ: ${names.join(" → ")}`} data-testid="turn-timeline">
    {order.map((id, index) => {
      const unit = unitById(state, id);
      if (!unit) return null;
      return <li key={`${id}-${index}`} data-team={unit.team} data-active={index === 0 && state.activeId === id ? "true" : undefined}>
        <button type="button" onClick={() => onPick(id)} aria-label={`ดู ${unit.name}`} title={unit.name}>
          <UnitPortrait look={unit.look} />
        </button>
      </li>;
    })}
  </ol>;
}

function Meter({ value, max, kind, label }: { value: number; max: number; kind: "hp" | "mp"; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return <div className="gb-meter" data-kind={kind}>
    <span className="gb-meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <i style={{ width: `${pct}%` }} />
    </span>
    <small>{value}/{max} {kind === "hp" ? "HP" : "MP"}</small>
  </div>;
}

/** Records of one kind (rage stacks of one element) as one chip: the latest record, the count, the longest timer. */
function groupStatus<T extends { t: string; el?: string; u: number }>(records: readonly T[]) {
  const groups: { record: T; count: number; turns: number }[] = [];
  for (const r of records) {
    const found = groups.find((g) => statusKey(g.record) === statusKey(r));
    if (found) { found.count++; found.turns = Math.max(found.turns, r.u); found.record = r; }
    else groups.push({ record: r, count: 1, turns: r.u });
  }
  return groups;
}

function UnitCard({ unit, onClose }: { unit: GridUnit; onClose: () => void }) {
  const { buffs, debuffs, stk, stkV } = unit.status;
  return <section className="gb-unit-card" data-team={unit.team} aria-label={`ข้อมูล ${unit.name}`} data-testid="unit-card">
    <header>
      <span className="gb-unit-face"><UnitPortrait look={unit.look} /></span>
      <div>
        <strong>{unit.name}</strong>
        <small>{unit.team === "ally" ? "ฝ่ายเรา" : "ฝ่ายศัตรู"}{unit.alive ? ` · เดิน ${unit.move} ช่อง · SPD ${unit.derived.Spd}` : " · ล้มลงแล้ว"}</small>
      </div>
      <button type="button" onClick={onClose} aria-label="ปิดข้อมูล"><X size={16} aria-hidden="true" /></button>
    </header>
    <Meter value={unit.hp} max={unit.derived.HP} kind="hp" label={`พลังชีวิต ${unit.name}`} />
    {unit.derived.MP > 0 && <Meter value={unit.mp} max={unit.derived.MP} kind="mp" label={`พลังปราณ ${unit.name}`} />}
    {(buffs.length > 0 || debuffs.length > 0 || stk > 0) && <div className="gb-buffs" data-testid="unit-statuses">
      {groupStatus(buffs).map(({ record: b, count, turns }) => {
        const desc = describeBuff(b);
        const style = statusStyle(b, "buff");
        const timed = b.t !== "buff_riposte" && b.t !== "shield" && b.t !== "ward";
        return <InfoPopover key={statusKey(b)} contentClassName="max-w-[240px]"
          trigger={<span className="gb-chip" data-kind="buff" data-status={statusKey(b)} style={{ "--st": hexColor(style.color) } as React.CSSProperties}>
            {buffBadgeLabel(b)}{count > 1 ? ` ×${count}` : ""}{timed ? ` (${turns})` : ""}</span>}>
          <div className="space-y-1 text-xs"><div className="font-bold text-emerald-700">{desc.title}{count > 1 ? ` ×${count}` : ""}</div>
            <div className="text-muted-foreground">{desc.detail}</div></div>
        </InfoPopover>;
      })}
      {groupStatus(debuffs).map(({ record: d, count, turns }) => {
        const desc = describeDebuff(d);
        const style = statusStyle(d, "debuff");
        return <InfoPopover key={statusKey(d)} contentClassName="max-w-[240px]"
          trigger={<span className="gb-chip" data-kind="debuff" data-status={statusKey(d)} style={{ "--st": hexColor(style.color) } as React.CSSProperties}>
            {debuffBadgeLabel(d)}{count > 1 ? ` ×${count}` : ""} ({turns})</span>}>
          <div className="space-y-1 text-xs"><div className="font-bold text-rose-700">{desc.title}</div>
            <div className="text-muted-foreground">{desc.detail}</div></div>
        </InfoPopover>;
      })}
      {stk > 0 && <span className="gb-chip" data-kind="stack" style={{ "--st": hexColor(statusStyle({ t: "stack_atk" }, "buff").color) } as React.CSSProperties}>ATK+{stk * stkV}%</span>}
    </div>}
  </section>;
}

interface SlotView {
  slot: number;
  name: string;
  icon: React.ReactNode;
  range: string;
  cd: number;
  mp: number;
  mpShort: boolean;
  ready: boolean;
  inReach: boolean;
}

function slotViews(state: GridBattleState, unit: GridUnit | undefined): SlotView[] {
  if (!unit) return [];
  const out: SlotView[] = [];
  unit.build.skillIds.forEach((raw, slot) => {
    if (!raw) return;
    const info = parseSlotId(raw);
    const profile = slotGrid(raw);
    if (!info || !profile) return;
    const cd = unit.cd[slot] ?? 0;
    const ready = slotReady(state, unit.id, slot);
    const inReach = ready && aimableFor(state, unit.id, slot).some((c) => targetsFor(state, unit.id, slot, c).length > 0);
    if (info.kind === "art") {
      const cost = info.art.act?.c ?? 0;
      out.push({ slot, name: info.art.n, icon: <ArtIcon art={info.art} size={30} />, range: describeGrid(profile),
        cd, mp: cost, mpShort: unit.mp < cost, ready, inReach });
    } else {
      out.push({ slot, name: info.skill.n, icon: <SkillIcon skill={info.skill} size={30} />, range: describeGrid(profile),
        cd, mp: 0, mpShort: false, ready, inReach });
    }
  });
  return out;
}

// ─── Arena ─────────────────────────────────────────────────────────────
interface BattleArenaProps {
  // "free"  — /debug battle tab. User can configure builds and reset freely.
  // "world" — embedded in WorldScreen. No reset; "ดำเนินเรื่อง" closes the
  //           seam via onContinue, which resolves to the world's onWin/onLose.
  mode?: "free" | "world";
  onContinue?: () => void;
}

interface Selection { key: string; slot: number | null; aimed: Cell | null }

export function BattleArena({ mode = "free", onContinue }: BattleArenaProps) {
  const state = useBattleStore((s) => s.state);
  const auto = useBattleStore((s) => s.auto);
  const start = useBattleStore((s) => s.start);
  const reset = useBattleStore((s) => s.reset);
  const setupA = useCharacterStore((s) => s.builds.A);
  const setupB = useCharacterStore((s) => s.builds.B);

  const [animating, setAnimating] = useState(false);
  const builds = useBattleStore((s) => s.builds);
  // Playback progress belongs to one battle (start() replaces `builds`).
  const [played, setPlayed] = useState<{ builds: typeof builds; seq: number }>({ builds: null, seq: 0 });
  const playedSeq = played.builds === builds ? played.seq : 0;
  const [hover, setHover] = useState<Cell | null>(null);
  const [inspect, setInspect] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [rendererDown, setRendererDown] = useState(false);
  const [rawSelection, setSelection] = useState<Selection>({ key: "", slot: null, aimed: null });

  // A selection belongs to one turn of one unit; a new turn clears it.
  const turnKey = state ? `${state.activeId}:${state.turn}` : "";
  const selection = rawSelection.key === turnKey ? rawSelection : { key: turnKey, slot: null, aimed: null };
  const lastSeq = state?.events.length ? state.events[state.events.length - 1].seq : 0;
  const caughtUp = playedSeq >= lastSeq && !animating;
  const myTurn = !!state && caughtUp && isPlayerTurn(state, auto);
  const active = state ? activeUnit(state) : null;
  const leader = state?.units.find((u) => u.leader) ?? state?.units.find((u) => u.team === "ally");
  const controlled = active && active.team === "ally" ? active : leader;

  const refs = useRef({ state, myTurn, selection, inspect });
  refs.current = { state, myTurn, selection, inspect };

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  // If the stage can't run, keep the battle moving without animation.
  useEffect(() => {
    if (!rendererDown || !state || state.phase === "over" || isPlayerTurn(state, auto)) return;
    const timer = setTimeout(() => useBattleStore.getState().step(), 350);
    return () => clearTimeout(timer);
  }, [rendererDown, state, auto]);

  const clearSelection = useCallback(() => setSelection({ key: turnKey, slot: null, aimed: null }), [turnKey]);

  const confirm = useCallback((slot: number, cell: Cell) => {
    if (useBattleStore.getState().act(slot, cell)) {
      setSelection({ key: "", slot: null, aimed: null });
      setHover(null);
    } else setNotice("ไม่มีเป้าหมายในพื้นที่นี้");
  }, []);

  const selectSlot = useCallback((slot: number) => {
    const { state: s, myTurn: mine, selection: sel } = refs.current;
    if (!s || !mine) return;
    const unit = activeUnit(s);
    if (!unit || !slotReady(s, unit.id, slot)) return;
    if (sel.slot === slot) { setSelection({ key: turnKey, slot: null, aimed: null }); return; }
    const profile = slotGrid(unit.build.skillIds[slot]);
    // Self skills aim at the caster's own tile straight away; otherwise
    // pre-aim when exactly one tile hits something (tap it or ยืนยัน).
    let aimed: Cell | null = null;
    if (profile?.target === "self") aimed = { ...unit.pos };
    else {
      const hits = aimableFor(s, unit.id, slot).filter((c) => targetsFor(s, unit.id, slot, c).length > 0);
      if (hits.length === 1) aimed = hits[0];
      else if (!hits.length) setNotice("ยังไม่มีเป้าในระยะ · เดินเข้าใกล้ก่อน");
    }
    setSelection({ key: turnKey, slot, aimed });
  }, [turnKey]);

  const onTap = useCallback((cell: Cell | null, unitId: string | null, pointerType: string) => {
    const { state: s, myTurn: mine, selection: sel, inspect: open } = refs.current;
    if (!s) return;
    const unit = mine ? activeUnit(s) : null;
    if (cell && unit) {
      if (sel.slot !== null) {
        const aim = aimableFor(s, unit.id, sel.slot);
        if (aim.some((c) => sameCell(c, cell))) {
          if (pointerType === "mouse" || (sel.aimed && sameCell(sel.aimed, cell))) confirm(sel.slot, cell);
          else setSelection({ ...sel, aimed: cell });
          return;
        }
        if (!unitId) { setSelection({ key: sel.key, slot: null, aimed: null }); return; }
      } else if (!sameCell(cell, unit.pos) && reachableFor(s, unit.id).has(cellKey(cell))) {
        useBattleStore.getState().move(cell);
        return;
      }
    }
    setInspect(unitId && unitId !== open ? unitId : null);
  }, [confirm]);

  const onAnim = useCallback((playing: boolean) => setAnimating(playing), []);
  const onPlayed = useCallback((seq: number) => {
    if (seq === Number.MAX_SAFE_INTEGER) setRendererDown(true);
    setPlayed({ builds: useBattleStore.getState().builds, seq });
  }, []);

  const doWait = useCallback(() => { if (refs.current.myTurn) useBattleStore.getState().wait(); }, []);
  const doFlee = useCallback(() => { if (refs.current.myTurn) useBattleStore.getState().flee(); }, []);
  const toggleAuto = useCallback(() => {
    const store = useBattleStore.getState();
    store.setAuto(!store.auto);
    setSelection({ key: "", slot: null, aimed: null });
  }, []);

  const slots = useMemo(() => (state ? slotViews(state, controlled ?? undefined) : []), [state, controlled]);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  // Hotkeys: 1–9 slots, W wait, A auto, Esc cancel, Enter confirm.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = e.key.toLowerCase();
      if (/^[1-9]$/.test(key)) {
        const view = slotsRef.current[Number(key) - 1];
        if (view) { e.preventDefault(); selectSlot(view.slot); }
      } else if (key === "w") { e.preventDefault(); doWait(); }
      else if (key === "a") { e.preventDefault(); toggleAuto(); }
      else if (key === "escape") { setSelection({ key: "", slot: null, aimed: null }); setInspect(null); }
      else if (key === "enter") {
        const sel = refs.current.selection;
        if (sel.slot !== null && sel.aimed) { e.preventDefault(); confirm(sel.slot, sel.aimed); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectSlot, doWait, toggleAuto, confirm]);

  const ui: GridBattleUi = useMemo(() => ({
    slot: myTurn ? selection.slot : null,
    aimed: myTurn ? selection.aimed : null,
    hover,
    inspect,
  }), [myTurn, selection.slot, selection.aimed, hover, inspect]);

  if (!state) {
    if (mode === "world") {
      return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">กำลังเริ่มการต่อสู้...</CardContent></Card>;
    }
    return <Card><CardContent className="p-8 text-center space-y-4">
      <p className="text-sm text-muted-foreground">ตั้งค่าตัวละครและเลือกวิชาก่อน</p>
      <Button size="lg" onClick={() => start(setupA, setupB)}>⚔ เริ่มการต่อสู้</Button>
    </CardContent></Card>;
  }

  const over = state.phase === "over";
  const resultReady = over && (caughtUp || rendererDown);
  const selected = slots.find((v) => v.slot === selection.slot);
  const inspected = inspect ? unitById(state, inspect) : undefined;
  const enemyName = state.units.find((u) => u.team === "enemy")?.name ?? "คู่ต่อสู้";
  const fleeOdds = leader ? Math.round(fleeChance(leader.derived.Spd,
    Math.max(0, ...state.units.filter((u) => u.alive && u.team === "enemy").map((u) => u.derived.Spd)))) : 0;

  const lastEvent = state.events[state.events.length - 1];
  const playingName = !caughtUp && lastEvent && "unitId" in lastEvent ? unitById(state, lastEvent.unitId)?.name : undefined;
  const headline = resultReady ? "การประลองสิ้นสุด"
    : myTurn && active ? selected ? `เล็งเป้า · ${selected.name}` : `ถึงตา ${active.name}${state.phase === "moved" ? " · เลือกกระบวนท่า" : ""}`
    : active && active.team === "ally" && auto ? `อัตโนมัติ · ${active.name}`
    : active ? `${active.name} กำลังลงมือ` : playingName ? `${playingName} กำลังลงมือ` : "รอจังหวะ...";
  const statusPhase = resultReady ? "over" : myTurn ? "player" : active?.team === "enemy" ? "enemy" : "waiting";
  const hint = notice ?? (myTurn ? selected
    ? selection.aimed ? "แตะช่องเดิมอีกครั้ง หรือกด ยืนยัน" : "แตะช่องสีแดงเพื่อเล็ง"
    : state.phase === "turn" ? "แตะช่องสีฟ้าเพื่อเดิน · หรือเลือกกระบวนท่า" : "เลือกกระบวนท่า หรือ รอ" : null);

  const winnerLabel = state.escaped ? "หนีรอด" : state.winnerTeam === "ally" ? "ชัยชนะ" : "พ่ายแพ้";
  const winnerLine = state.escaped ? `${leader?.name ?? "จอมยุทธ์"} ถอยหนีจาก ${enemyName}`
    : state.winnerTeam === "ally" ? `${leader?.name ?? "ฝ่ายเรา"} ชนะ` : `${enemyName} ชนะ`;

  return (
    <div className="battle-arena grid-battle" data-mode={mode} data-testid="grid-battle">
      <header className="gb-status combat-status" data-testid="combat-status" data-phase={statusPhase}>
        <span role="status" aria-live="polite"><i aria-hidden="true" /><strong>{headline}</strong></span>
        <TurnTimeline state={state} onPick={(id) => setInspect(id)} />
        <small className="gb-turn">ตาที่ {Math.max(1, state.turn + (over ? 0 : 1))}</small>
        <button type="button" className="gb-log-toggle" onClick={() => setShowLog((v) => !v)} aria-expanded={showLog}
          aria-controls="combat-log-drawer" aria-label="บันทึกการต่อสู้">
          <span aria-hidden="true">📜</span>
        </button>
        <SoundButton className="hud-icon combat-sound" />
      </header>

      <div className="gb-field">
        <BattleCanvas mode={mode} ui={ui} onTap={onTap} onHover={setHover} onAnim={onAnim} onPlayed={onPlayed} />
        {myTurn && active && <div key={turnKey} className="gb-callout" aria-hidden="true"><span>ถึงตาเจ้า</span></div>}
        {inspected && <UnitCard unit={inspected} onClose={() => setInspect(null)} />}
        {hint && !resultReady && <p className="gb-hint" aria-live="polite" data-notice={notice ? "true" : undefined}>{hint}</p>}
        {showLog && <div id="combat-log-drawer" className="gb-log-drawer" role="region" aria-label="บันทึกการต่อสู้">
          <BattleLog log={state.log} />
        </div>}
      </div>

      <section className="gb-bar" aria-label="กระบวนท่าต่อสู้">
        {resultReady ? (
          <div className="gb-result" data-testid="combat-result" data-outcome={state.escaped ? "escaped" : state.winnerTeam ?? "none"}>
            <div><span>{winnerLabel}</span><strong>{winnerLine}</strong><small>ประลอง {state.turn} ตา</small></div>
            {mode === "world" ? <Button onClick={() => onContinue?.()}>ดำเนินเรื่อง →</Button> :
              <div className="flex gap-2"><Button onClick={() => start(setupA, setupB)}>เริ่มใหม่</Button>
                <Button variant="outline" onClick={reset}>Reset</Button></div>}
          </div>
        ) : <>
          <div className="gb-skills" role="group" aria-label={`กระบวนท่าของ ${controlled?.name ?? ""}`}>
            {slots.map((v, index) => {
              const pressed = selection.slot === v.slot && myTurn;
              const meta = v.cd > 0 ? `รอ ${v.cd} ตา` : v.mpShort ? `MP ไม่พอ (${v.mp})` : v.mp ? `${v.mp} MP` : v.inReach ? "พร้อม" : "นอกระยะ";
              return <button key={v.slot} type="button" className="gb-skill combat-action" aria-label={v.name}
                aria-pressed={pressed} aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
                disabled={!myTurn || !v.ready} onClick={() => selectSlot(v.slot)}
                title={`${v.name} — ${v.range} · ${meta}`} data-cooldown={v.cd > 0 ? v.cd : undefined}
                data-in-reach={v.inReach ? "true" : "false"}>
                <span className="gb-skill-icon" aria-hidden="true">{v.icon}{v.cd > 0 && <b>{v.cd}</b>}</span>
                <span className="gb-skill-copy">
                  <strong>{v.name}</strong>
                  <small>{v.range}</small>
                  <em>{meta}</em>
                </span>
                {index < 9 && <kbd aria-hidden="true">{index + 1}</kbd>}
              </button>;
            })}
          </div>
          <div className="gb-controls">
            {selection.slot !== null && myTurn ? <>
              <button type="button" className="gb-control" data-kind="cancel" onClick={clearSelection} aria-keyshortcuts="Escape">
                <X size={18} aria-hidden="true" /><span>ยกเลิก</span>
              </button>
              <button type="button" className="gb-control" data-kind="confirm" disabled={!selection.aimed}
                onClick={() => selection.aimed && selection.slot !== null && confirm(selection.slot, selection.aimed)} aria-keyshortcuts="Enter">
                <Check size={18} aria-hidden="true" /><span>ยืนยัน</span>
              </button>
            </> : <>
              <button type="button" className="gb-control" onClick={doWait} disabled={!myTurn} aria-keyshortcuts="W" title="จบตานี้โดยไม่ออกกระบวนท่า">
                <Hourglass size={18} aria-hidden="true" /><span>รอ</span>
              </button>
              {mode === "world" && <button type="button" className="gb-control" data-kind="flee" onClick={doFlee}
                disabled={!myTurn || !active?.leader} title={`โอกาสหนีรอด ${fleeOdds}% · พลาดจะเสียตานี้`}>
                <Footprints size={18} aria-hidden="true" /><span>ถอยหนี</span>
              </button>}
            </>}
            <button type="button" className="gb-control" data-kind="auto" aria-pressed={auto} onClick={toggleAuto} aria-keyshortcuts="A"
              title="ให้ AI เล่นฝ่ายเรา">
              <Bot size={18} aria-hidden="true" /><span>อัตโนมัติ</span>
            </button>
            {mode === "free" && <button type="button" className="gb-control" data-kind="reset" onClick={reset}>
              <span>Reset</span>
            </button>}
          </div>
        </>}
      </section>
    </div>
  );
}
