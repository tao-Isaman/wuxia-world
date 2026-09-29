"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getArt,
  hitPct,
  critPct,
  hpColor,
  parseSlotId,
  predictTurnOrder,
  type BattleState,
  type CharacterBuild,
  type Side,
} from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { useCharacterStore } from "@/store/character-store";
import { BattleLog } from "./battle-log";
import { BattleCanvas, useBattleActors } from "./battle-canvas";
import { CharacterPreview } from "./character-preview";
import { cn } from "@/lib/utils";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import {
  buffBadgeLabel,
  debuffBadgeLabel,
  describeBuff,
  describeDebuff,
} from "./buff-descriptions";
import { SkillIcon, ArtIcon } from "./skill-icon";
import { recoveryAmount, GUARD_REDUCTION, GUARD_MP_COST, RIPOSTE_BONUS, RECOVER_EVASION_COST } from "@/lib/game/combat-actions";
import type { BattleCastProgress } from "@/lib/three/battle-runtime";
import { Shield, Wind } from "lucide-react";
import "@/app/combat-actions.css";

function SkillButton({ name, icon, disabled, onClick, cd = 0, mp = 0, detail, mpShort = false, kind = "skill" }: {
  name: string; icon: React.ReactNode; disabled: boolean; onClick: () => void;
  cd?: number; mp?: number; detail: string; mpShort?: boolean; kind?: "skill" | "guard" | "recover";
}) {
  return <button type="button" disabled={disabled} onClick={onClick}
    className={`combat-action combat-action-${kind}`} aria-label={name}>
    <span className="combat-action-icon" aria-hidden="true">{icon}</span>
    <span className="combat-action-copy">
      <strong>{name}</strong>
      <span>{detail}</span>
      <small>{cd > 0 ? `รอ ${cd} ตา` : mpShort ? `MP ไม่พอ \xb7 ใช้ ${mp} MP` : `${mp} MP \xb7 1 ตา`}</small>
    </span>
  </button>;
}

// HP follows renderer impacts, including dialog pauses. Remember actual
// pre-cast HP, because overkill damage cannot reconstruct it accurately.
function useAnimatedHp(actualHp: number, maxHp: number, lastCast: BattleState["lastCast"],
  side: Side, progress: BattleCastProgress | null): number {
  const seq = lastCast?.seq ?? null;
  const [snapshot, setSnapshot] = useState({ seq, actualHp, beforeHp: actualHp });
  if (snapshot.seq !== seq) {
    setSnapshot({ seq, actualHp, beforeHp: snapshot.actualHp });
  } else if (snapshot.actualHp !== actualHp) {
    setSnapshot({ ...snapshot, actualHp });
  }
  if (!lastCast || lastCast.side === side || lastCast.hitDamages.every((damage) => damage <= 0)
    || (progress?.seq === seq && progress.complete)) {
    return Math.max(0, Math.min(maxHp, actualHp));
  }
  const hits = progress?.seq === seq ? progress.hits : 0;
  const damage = lastCast.hitDamages.slice(0, hits).reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.min(maxHp, Math.max(actualHp, snapshot.beforeHp - damage)));
}

// Real-time stats shown in the tap/click popover opened by a fighter's
// name in SidePanel. Shows base derived stats merged with the
// caster's currently-active buff / debuff modifiers, plus Hit/Crit %
// against the opposing fighter — so the player can see the live values
// that drive damage rolls without committing the chrome to the panel.
function FighterStatsTooltip({
  name,
  d,
  opp: _opp,
  hPct,
  cPct,
  buffs,
  debuffs,
  stkPct,
}: {
  name: string;
  d: BattleState["dA"];
  opp: BattleState["dA"];
  hPct: number;
  cPct: number;
  buffs: BattleState["st"]["A"]["buffs"];
  debuffs: BattleState["st"]["A"]["debuffs"];
  stkPct: number;
}) {
  // Sum modifier contributions from current buffs / debuffs onto each
  // affected stat. Mirrors the math in lib/game/battle.ts (effectiveSpd /
  // effectiveCri) and lib/game/effects.ts addBuff/addDebuff conventions:
  // buff_* values are positive, debuff_* values are stored negative.
  let spdMod = 0, criMod = 0, accMod = 0, evaMod = 0, defMod = 0;
  let reduceMod = 0, reflectMod = 0, iatkMod = 0;
  for (const b of buffs) {
    switch (b.t) {
      case "buff_spd": spdMod += b.v; break;
      case "buff_cri": criMod += b.v; break;
      case "buff_eva": evaMod += b.v; break;
      case "buff_def": defMod += b.v; break;
      case "buff_reduce": reduceMod += b.v; break;
      case "buff_reflect": reflectMod += b.v; break;
      case "buff_iatk": iatkMod += b.v; break;
      case "buff_iatk_reduce": iatkMod += b.v; reduceMod += b.v; break;
      case "buff_reflect_eva": reflectMod += b.v; evaMod += b.v; break;
      default: break;
    }
  }
  for (const x of debuffs) {
    switch (x.t) {
      case "debuff_acc": accMod += x.v ?? 0; break;
      case "debuff_eva": evaMod += x.v ?? 0; break;
      case "debuff_def": defMod += x.v ?? 0; break;
      default: break;
    }
  }
  const eSpd = d.Spd + spdMod;
  const eCri = d.Cri + criMod;
  const eAcc = d.Acc + accMod;
  const eEva = d.Eva + evaMod;
  const ePD = d.PD + defMod;

  const sign = (n: number) => (n === 0 ? "" : n > 0 ? ` (+${n})` : ` (${n})`);
  const modClass = (n: number) =>
    n > 0 ? "text-emerald-700" : n < 0 ? "text-rose-700" : "text-muted-foreground";

  return (
    <div className="space-y-2 text-[11px]">
      <div className="font-display text-sm border-b pb-1 pr-8 mb-1">{name}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">HP</span>
          <span><strong>{d.HP}</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">MP</span>
          <span><strong>{d.MP}</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">SPD</span>
          <span><strong>{eSpd}</strong><span className={modClass(spdMod)}>{sign(spdMod)}</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cri</span>
          <span><strong>{eCri}</strong><span className={modClass(criMod)}>{sign(criMod)}</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Acc</span>
          <span><strong>{eAcc}</strong><span className={modClass(accMod)}>{sign(accMod)}</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Eva</span>
          <span><strong>{eEva}</strong><span className={modClass(evaMod)}>{sign(evaMod)}</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ATK</span>
          <span><strong>{d.Atk}</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IA</span>
          <span><strong>{d.IA}</strong>
            {iatkMod !== 0 && <span className={modClass(iatkMod)}> (+{iatkMod}%)</span>}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">PD</span>
          <span><strong>{ePD}</strong><span className={modClass(defMod)}>{sign(defMod)}</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID</span>
          <span><strong>{d.ID}</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Res</span>
          <span><strong>{d.Res}</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hit</span>
          <span className="text-emerald-700"><strong>{hPct}%</strong></span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Crit</span>
          <span className="text-amber-700"><strong>{cPct}%</strong></span>
        </div>
      </div>
      {(stkPct > 0 || reduceMod > 0 || reflectMod > 0) && (
        <div className="border-t pt-1 mt-1 space-y-0.5">
          {stkPct > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">ATK stack</span>
              <span className="text-emerald-700"><strong>+{stkPct}%</strong></span>
            </div>
          )}
          {reduceMod > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">ลด dmg รับ</span>
              <span className="text-emerald-700"><strong>{reduceMod}%</strong></span>
            </div>
          )}
          {reflectMod > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">สะท้อน</span>
              <span className="text-amber-700"><strong>{reflectMod}%</strong></span>
            </div>
          )}
        </div>
      )}
      <div className="text-[9px] text-muted-foreground border-t pt-1">
        Hit / Crit คำนวณกับศัตรูปัจจุบัน · ค่าในวงเล็บเป็นโบนัสจาก buff / debuff
      </div>
    </div>
  );
}

function SidePanel({
  side,
  state,
  isActive,
  artId,
  artLevel,
  name,
  progress,
}: {
  side: Side;
  state: BattleState;
  isActive: boolean;
  artId: string;
  artLevel: number;
  name: string;
  progress: BattleCastProgress | null;
}) {
  const [statsOpen, setStatsOpen] = useState(false);
  const d = side === "A" ? state.dA : state.dB;
  const actualHp = side === "A" ? state.hA : state.hB;
  const mp = side === "A" ? state.mpA : state.mpB;
  const gauge = side === "A" ? state.gA : state.gB;
  const opp = side === "A" ? state.dB : state.dA;

  // Animated HP — drains in sync with the per-hit cast animation. The
  // engine applies all damage instantly at cast resolution time, but we
  // delay the visual drop so each hit's damage number pop matches a
  // matching dip in the HP bar. Drains to actualHp by the end of the
  // cast hold, never exceeds it.
  const hp = useAnimatedHp(actualHp, d.HP, state.lastCast, side, progress);
  const hpPct = Math.max(0, Math.min(100, (hp / d.HP) * 100));
  const mpPct = d.MP > 0 ? Math.max(0, (mp / d.MP) * 100) : 0;
  const gaugePct = Math.min(100, gauge);
  const hPct = Math.round(hitPct(d.Acc, opp.Eva));
  const cPct = Math.round(critPct(d.Cri, opp.Res));
  const art = getArt(artId);
  const buffs = state.st[side].buffs;
  const debuffs = state.st[side].debuffs;
  const stk = state.st[side].stk;
  const stkV = state.st[side].stkV;
  const stkPct = stk * stkV;

  return (
    <Card
      className={cn(
        "battle-fighter",
        isActive && "combat-fighter-active",
      )}
    >
      <CardContent className="combat-fighter-content">
        <div className="combat-fighter-heading">
          <Popover open={statsOpen} onOpenChange={setStatsOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="combat-fighter-name" aria-label={`ดูค่าสถานะของ ${name}`} title={name}>
                <strong>{name}</strong><span aria-hidden="true">ⓘ</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" sideOffset={6}
              aria-label={`ค่าสถานะ ${name}`} className="relative w-72 max-w-[90vw] max-h-[70dvh] overflow-y-auto p-3">
              <button type="button" onClick={() => setStatsOpen(false)} aria-label="ปิดค่าสถานะ"
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center text-lg hover:bg-muted focus-visible:outline focus-visible:outline-2">
                <span aria-hidden="true">×</span>
              </button>
              <FighterStatsTooltip
                name={name}
                d={d}
                opp={opp}
                hPct={hPct}
                cPct={cPct}
                buffs={buffs}
                debuffs={debuffs}
                stkPct={stkPct}
              />
            </PopoverContent>
          </Popover>
          {art.id !== "none" && (
            <span
              className="combat-fighter-art"
            >
              [{art.n.substring(0, 7)}{artLevel}]
            </span>
          )}
        </div>
        <div className="combat-hp-line">
          <Progress value={hpPct} indicatorColor={hpColor(hpPct)} aria-label={`พลังชีวิต ${name}`} className="combat-hp-bar" />
          <span data-testid={`fighter-${side.toLowerCase()}-hp`}>{hp} / {d.HP} HP</span>
        </div>
        <div className="combat-meter-row">
          {d.MP > 0 && <div>
            <span>{mp} / {d.MP} MP</span>
            <Progress value={mpPct} variant="qi" aria-label={`พลังปราณ ${name}`} className="combat-small-bar" />
          </div>}
          <div>
            <span>จังหวะ <b>{isActive ? "พร้อม" : `${Math.floor(gaugePct)}%`}</b></span>
            <Progress value={isActive ? 100 : gaugePct} aria-label={`จังหวะโจมตี ${name}`}
              indicatorColor={side === "A" ? "#d9c58b" : "#d69368"} className="combat-small-bar" animate={false} />
          </div>
        </div>
        <div className="combat-buffs">
          {buffs.map((b, i) => {
            const desc = describeBuff(b);
            // Canonical badge label per type — prevents "two separate
            // entries" confusion when different sources (skill / art /
            // weapon) tag the same debuff with different `n` values.
            const label = buffBadgeLabel(b);
            return (
              <InfoPopover
                key={i}
                trigger={
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded cursor-help">
                    {label}{b.t === "buff_riposte" ? " · 1 ครั้ง" : `(${b.u})`}
                  </span>
                }
                contentClassName="max-w-[240px]"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-700">{desc.title}</div>
                  <div className="text-muted-foreground">{desc.detail}</div>
                  <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
                    {b.t === "buff_riposte" ? "สิทธิ์สวนกลับจะหมดเมื่อโจมตีกาย แม้พลาด" : <>เหลือ <strong className="text-foreground">{b.u}</strong> เทิร์น</>}
                  </div>
                </div>
              </InfoPopover>
            );
          })}
          {debuffs.map((d, i) => {
            const desc = describeDebuff(d);
            const label = debuffBadgeLabel(d);
            return (
              <InfoPopover
                key={i}
                trigger={
                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded cursor-help">
                    {label}({d.u})
                  </span>
                }
                contentClassName="max-w-[240px]"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-700">{desc.title}</div>
                  <div className="text-muted-foreground">{desc.detail}</div>
                  <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
                    เหลือ <strong className="text-foreground">{d.u}</strong> เทิร์น
                  </div>
                </div>
              </InfoPopover>
            );
          })}
          {stk > 0 && (
            <InfoPopover
              trigger={
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded cursor-help">
                  ATK+{stkPct}%
                </span>
              }
              contentClassName="max-w-[240px]"
            >
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-700">สะสมพลังโจมตี</div>
                <div className="text-muted-foreground">
                  ATK ×{(1 + stkPct / 100).toFixed(2)} ({stk} ชั้น × +{stkV}%)
                </div>
                <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
                  ค้างจนสุดเกม (ลบโดย dispel)
                </div>
              </div>
            </InfoPopover>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const TIMELINE_LENGTH = 6;

/**
 * Hero's Adventure-style turn order: faces queue toward the acting slot, so
 * who moves next (and how often a faster side acts twice) reads at a glance.
 */
function TurnTimeline({ state, mode, nameA, nameB, casting }: {
  state: BattleState; mode: "world" | "free"; nameA: string; nameB: string; casting: boolean;
}) {
  const { characterA, characterB, creatureFrame } = useBattleActors(mode);
  const order = predictTurnOrder(state, TIMELINE_LENGTH);
  if (!order.length) return null;
  const acting = !casting && (state.phase === "player" || state.phase === "enemy");
  const label = order.map((side) => side === "A" ? nameA : nameB).join(" → ");
  return <ol className="turn-timeline" aria-label={`ลำดับการลงมือ: ${label}`} data-testid="turn-timeline">
    {order.map((side, index) => <li key={`${state.turn}-${index}`} data-side={side}
      data-acting={index === 0 && acting ? "true" : undefined} title={side === "A" ? nameA : nameB}>
      {side === "B" && creatureFrame !== null ? <span className="turn-glyph" aria-hidden="true">獸</span> :
        <CharacterPreview id={side === "A" ? characterA : characterB} framing="bust" />}
    </li>)}
  </ol>;
}

interface BattleArenaProps {
  // "free"  — /debug battle tab. User can configure builds and reset freely.
  // "world" — embedded in WorldScreen. No reset; "ดำเนินเรื่อง" closes the
  //           seam via onContinue, which resolves to the world's onWin/onLose.
  mode?: "free" | "world";
  onContinue?: () => void;
}

export function BattleArena({ mode = "free", onContinue }: BattleArenaProps) {
  const state = useBattleStore((s) => s.state);
  const battleBuilds = useBattleStore((s) => s.builds);
  const start = useBattleStore((s) => s.start);
  const reset = useBattleStore((s) => s.reset);
  // Renamed from `useSkill` / `useArtActive` (the store action names) to
  // verb-form locals so ESLint's react-hooks/rules-of-hooks doesn't
  // misclassify them as hooks when called inside `onClick` callbacks.
  const castSkill = useBattleStore((s) => s.useSkill);
  const castArtActive = useBattleStore((s) => s.useArtActive);
  const autoAdvance = useBattleStore((s) => s.autoAdvance);
  const takeCombatAction = useBattleStore((s) => s.useCombatAction);
  const [castProgress, setCastProgress] = useState<BattleCastProgress | null>(null);
  // Battle log defaults closed — the cast-animation banner now carries
  // the moment-to-moment narration, so the log is for after-the-fact
  // review only. Player can toggle open/closed via the header button.
  const [showLog, setShowLog] = useState(false);

  // Setup-tab builds — used in free mode for the "start fresh" button only.
  const setupA = useCharacterStore((s) => s.builds.A);
  const setupB = useCharacterStore((s) => s.builds.B);

  // What's actually fighting (set by `start()`). Falls back to setup builds
  // for the brief render when the battle hasn't been started yet in free mode.
  const displayA: CharacterBuild = battleBuilds?.A ?? setupA;
  const displayB: CharacterBuild = battleBuilds?.B ?? setupB;

  // BattleCanvas owns the Three.js update loop and reports visual impacts.

  if (!state) {
    if (mode === "world") {
      return (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            กำลังเริ่มการต่อสู้...
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">ตั้งค่าตัวละครและเลือกวิชาก่อน</p>
          <Button size="lg" onClick={() => start(setupA, setupB)}>
            ⚔ เริ่มการต่อสู้
          </Button>
        </CardContent>
      </Card>
    );
  }

  const casting = !!state.lastCast && !(castProgress?.seq === state.lastCast.seq && castProgress.complete);
  const resultReady = !!state.winner && !casting;
  const canAct = !state.winner && !casting && state.phase === "player";
  const isAActive = canAct;
  const isBActive = !state.winner && !casting && state.phase === "enemy";
  const aA = getArt(displayA.artId);
  const canIA = !!aA.act && state.mpA >= aA.act.c && state.iaCD.A === 0;
  const recoverMp = Math.min(state.dA.MP - state.mpA, recoveryAmount(state.dA.MP));
  const riposteReady = state.st.A.buffs.some((buff) => buff.t === "buff_riposte" && buff.u > 0);
  const headline = resultReady ? "การประลองสิ้นสุด" : casting ? `กำลังใช้ · ${state.lastCast?.name}` :
    canAct ? "ถึงตาเจ้า · เลือกกระบวนท่า" : isBActive ? `${displayB.name} กำลังออกกระบวนท่า` : "รอจังหวะ · กำลังรวบรวมพลัง";

  return (
    <div className="battle-arena pixel-panel" data-mode={mode}>
      <div className="combat-status" data-testid="combat-status" data-phase={resultReady ? "over" : casting ? "casting" : state.phase}>
        <span role="status" aria-live="polite"><i aria-hidden="true" /><strong>{headline}</strong></span>
        <TurnTimeline state={state} mode={mode} nameA={displayA.name} nameB={displayB.name} casting={casting} />
        <small>ตาที่ {Math.max(1, state.turn + (!state.winner && !casting ? 1 : 0))}</small>
      </div>
      <div className="combat-field">
        <BattleCanvas mode={mode} onCastProgress={setCastProgress} />
        <div className="combat-hud">
          <SidePanel side="A" state={state} isActive={isAActive} artId={displayA.artId}
            artLevel={displayA.artLevel} name={displayA.name} progress={castProgress} />
          <div className="combat-versus" aria-hidden="true">對</div>
          <SidePanel side="B" state={state} isActive={isBActive} artId={displayB.artId}
            artLevel={displayB.artLevel} name={displayB.name} progress={castProgress} />
        </div>
        {showLog && <div id="combat-log-drawer" className="combat-log-drawer" role="region" aria-label="บันทึกการต่อสู้">
          <BattleLog log={state.log} />
        </div>}
      </div>

      <section className="combat-decision" aria-label="กระบวนท่าต่อสู้">
        {resultReady ? (
          <div className="combat-result" data-testid="combat-result">
            <div><span>{state.winner === "A" ? "ชัยชนะ" : "พ่ายแพ้"}</span>
              <strong>{state.winner === "A" ? displayA.name : displayB.name} ชนะ</strong>
              <small>ประลอง {state.turn} ตา</small></div>
            {mode === "world" ? <Button onClick={() => onContinue?.()}>ดำเนินเรื่อง →</Button> :
              <div className="flex gap-2"><Button onClick={() => start(setupA, setupB)}>เริ่มใหม่</Button>
                <Button variant="outline" onClick={reset}>Reset</Button></div>}
          </div>
        ) : (
          <div className="combat-actions">
            {displayA.skillIds.map((raw, i) => {
              if (!raw) return null;
              const info = parseSlotId(raw);
              if (!info) return null;
              const cd = state.cd.A[i] ?? 0;
              if (info.kind === "art") {
                const art = info.art;
                if (!art.act) return null;
                const mpShort = state.mpA < art.act.c;
                return <SkillButton key={i} name={art.n} icon={<ArtIcon art={art} size={34} />}
                  disabled={!canAct || cd > 0 || mpShort} onClick={() => castSkill(i)} cd={cd}
                  mp={art.act.c} mpShort={mpShort} detail="วิชาในกาย · ใช้ปราณ" />;
              }
              const sk = info.skill;
              const detail = sk.at ? `${sk.at === "phy" ? riposteReady ? `สวนกลับ +${RIPOSTE_BONUS}%` : "โจมตีภายนอก" : "โจมตีปราณ"} · ${sk.hits ?? 1} ครั้ง` : "เสริมพลัง · เปลี่ยนจังหวะ";
              return <SkillButton key={i} name={sk.n} icon={<SkillIcon skill={sk} size={34} />}
                disabled={!canAct || cd > 0} onClick={() => castSkill(i)} cd={cd} detail={detail} />;
            })}
            {aA.act && !displayA.skillIds.includes(`art:${aA.id}`) &&
              <SkillButton name={aA.n} icon={<ArtIcon art={aA} size={34} />}
                disabled={!canAct || !canIA} onClick={castArtActive} cd={state.iaCD.A}
                mp={aA.act.c} mpShort={state.mpA < aA.act.c} detail="วิชาในกาย · ใช้ปราณ" />}
            <SkillButton name="ตั้งรับ" icon={<Shield size={27} strokeWidth={1.5} />} kind="guard"
              disabled={!canAct || state.mpA < GUARD_MP_COST} onClick={() => takeCombatAction("guard")}
              mp={GUARD_MP_COST} mpShort={state.mpA < GUARD_MP_COST}
              detail={`ลดรับ ${GUARD_REDUCTION}% · กายครั้งถัดไป +${RIPOSTE_BONUS}% (ใช้แม้พลาด)`} />
            <SkillButton name="รวบรวมปราณ" icon={<Wind size={27} strokeWidth={1.5} />} kind="recover"
              disabled={!canAct || recoverMp <= 0} onClick={() => takeCombatAction("recover")}
              detail={recoverMp > 0 ? `MP +${recoverMp} · หลบหลีก −${RECOVER_EVASION_COST} จังหวะถัดไป` : "MP เต็ม · ใช้เมื่อปราณพร่อง"} />
          </div>
        )}
      </section>

      <div className="combat-log">
        <button type="button" onClick={() => setShowLog((value) => !value)} aria-expanded={showLog} aria-controls="combat-log-drawer">
          <span>บันทึกการต่อสู้ <small>({state.log.length})</small></span>
          <span aria-hidden="true">{showLog ? "−" : "+"}</span>
        </button>
      </div>
      {mode === "free" && !state.winner && <div className="combat-debug-controls flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={autoAdvance} disabled={casting}>Auto ▶▶</Button>
        <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
      </div>}
    </div>
  );
}
