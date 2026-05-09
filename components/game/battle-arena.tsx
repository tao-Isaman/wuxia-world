"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TIERS,
  WEAPON_FAMILY_LABEL,
  getArt,
  getSkill,
  hitPct,
  critPct,
  hpColor,
  parseSlotId,
  type BattleState,
  type CharacterBuild,
  type Side,
} from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { useCharacterStore } from "@/store/character-store";
import { BattleLog } from "./battle-log";
import { cn } from "@/lib/utils";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import {
  buffBadgeLabel,
  debuffBadgeLabel,
  describeBuff,
  describeDebuff,
} from "./buff-descriptions";

// Animation timing for per-hit HP drain — must stay in sync with the
// damage-pop CSS keyframe + emitCast's CAST_NAME_MS / CAST_HIT_STAGGER_MS
// constants in battle.ts. Each hit's damage number pops at this offset,
// and the matching HP drain fires at the same moment.
const ANIM_NAME_MS = 300;
const ANIM_HIT_STAGGER_MS = 100;

// Drains the HP bar in sync with the per-hit cast animation. When a new
// `lastCast` arrives that targeted THIS side, the hook:
//   1. snaps display HP back to the pre-cast value (actualHp + total
//      damage that the cast already applied to the engine state)
//   2. schedules a setTimeout per hit to drop display HP by that hit's
//      damage at the moment the damage number pops in the overlay
// Heals / regen / non-damage state changes snap immediately (no anim).
function useAnimatedHp(
  actualHp: number,
  lastCast: BattleState["lastCast"],
  side: Side,
): number {
  const [displayHp, setDisplayHp] = useState(actualHp);
  // Track the most-recent seq we animated for so the effect doesn't
  // re-fire on unrelated re-renders (e.g., a sibling SidePanel updates).
  const lastSeqRef = useRef<number>(-1);

  useEffect(() => {
    // No active cast → snap to actual.
    if (!lastCast) {
      setDisplayHp(actualHp);
      lastSeqRef.current = -1;
      return;
    }
    // Same cast as before → don't re-animate.
    if (lastCast.seq === lastSeqRef.current) return;
    lastSeqRef.current = lastCast.seq;

    // Caster targets the OTHER side — only animate if WE are the target.
    const targeted = lastCast.side !== side;
    if (!targeted) {
      // Non-target: caster's own HP shouldn't budge from the cast.
      // Snap to actualHp in case some other thing moved it.
      setDisplayHp(actualHp);
      return;
    }

    // Sum landed damages (misses contribute 0 to actualHp delta).
    const totalDmg = lastCast.hitDamages.reduce((a, b) => a + b, 0);
    if (totalDmg <= 0) {
      // Buff / no-damage cast — nothing to drain.
      setDisplayHp(actualHp);
      return;
    }
    // Pre-cast HP = current actualHp + damage the engine already deducted.
    const preHp = actualHp + totalDmg;
    setDisplayHp(preHp);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = preHp;
    lastCast.hitDamages.forEach((dmg, i) => {
      const delay = ANIM_NAME_MS + i * ANIM_HIT_STAGGER_MS;
      cumulative = Math.max(0, cumulative - dmg);
      const target = cumulative;
      timers.push(setTimeout(() => setDisplayHp(target), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [lastCast, actualHp, side]);

  return displayHp;
}

function SidePanel({
  side,
  state,
  isActive,
  artId,
  artLevel,
  name,
}: {
  side: Side;
  state: BattleState;
  isActive: boolean;
  artId: string;
  artLevel: number;
  name: string;
}) {
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
  const hp = useAnimatedHp(actualHp, state.lastCast, side);
  const hpPct = Math.max(0, (hp / d.HP) * 100);
  const mpPct = d.MP > 0 ? Math.max(0, (mp / d.MP) * 100) : 0;
  const gaugePct = Math.min(100, gauge);
  const hPct = Math.round(hitPct(d.Acc, opp.Eva));
  const cPct = Math.round(critPct(d.Cri, opp.Res));
  const art = getArt(artId);
  const buffs = state.st[side].buffs;
  const debuffs = state.st[side].debuffs;
  const stk = state.st[side].stk;

  return (
    <Card
      className={cn(
        isActive && side === "A" && "ring-2 ring-indigo-400",
        isActive && side === "B" && "ring-2 ring-orange-400",
      )}
    >
      <CardContent className="p-3 space-y-1">
        <div className="font-semibold text-sm">
          {name}
          {art.id !== "none" && (
            <span
              className={cn(
                "text-[10px] ml-1",
                side === "A" ? "text-indigo-600" : "text-orange-700",
              )}
            >
              [{art.n.substring(0, 7)}{artLevel}]
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">{hp} / {d.HP} HP</div>
        <Progress value={hpPct} indicatorColor={hpColor(hpPct)} className="h-3" />
        {d.MP > 0 && (
          <>
            <div className="text-[10px] text-muted-foreground">{mp} / {d.MP} MP</div>
            <Progress value={mpPct} className="h-1.5" />
          </>
        )}
        <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
          <span>ATB</span>
          <span>{Math.floor(gaugePct)}%</span>
        </div>
        <Progress
          value={gaugePct}
          indicatorColor={side === "A" ? "#7F77DD" : "#D85A30"}
          className="h-1.5"
          animate={false}
        />
        <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
          <span className="bg-muted/40 px-1.5 py-0.5 rounded">SPD <strong>{d.Spd}</strong></span>
          <span className="bg-muted/40 px-1.5 py-0.5 rounded">Acc <strong>{d.Acc}</strong></span>
          <span className="bg-muted/40 px-1.5 py-0.5 rounded">Eva <strong>{d.Eva}</strong></span>
          <span className="bg-muted/40 px-1.5 py-0.5 rounded">Cri <strong>{d.Cri}</strong></span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Hit<strong className="text-emerald-600"> {hPct}%</strong> · Crit
          <strong className="text-amber-600"> {cPct}%</strong>
        </div>
        <div className="flex flex-wrap gap-1 mt-1 min-h-[16px]">
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
                    {label}({b.u})
                  </span>
                }
                contentClassName="max-w-[240px]"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-700">{desc.title}</div>
                  <div className="text-muted-foreground">{desc.detail}</div>
                  <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1">
                    เหลือ <strong className="text-foreground">{b.u}</strong> เทิร์น
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
                  ATK+{stk * 3}%
                </span>
              }
              contentClassName="max-w-[240px]"
            >
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-700">สะสมพลังโจมตี</div>
                <div className="text-muted-foreground">
                  ATK ×{(1 + stk * 0.03).toFixed(2)} ({stk} ชั้น × +3%)
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
  const useSkill = useBattleStore((s) => s.useSkill);
  const useArtActive = useBattleStore((s) => s.useArtActive);
  const autoAdvance = useBattleStore((s) => s.autoAdvance);
  const tick = useBattleStore((s) => s.tick);
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

  // rAF-driven gauge animation. Runs only while a side hasn't filled yet —
  // when phase changes to "player"/"enemy"/"over", the effect cleans up and
  // the loop stops. Restarts when phase returns to "filling".
  const phase = state?.phase;
  useEffect(() => {
    if (phase !== "filling") return;
    let raf = 0;
    let lastTime = performance.now();
    const loop = (now: number) => {
      // Cap dt so a backgrounded tab can't jump the simulation forward.
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, tick]);

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

  const isAActive = state.phase === "player";
  const isBActive = state.phase === "enemy" || state.phase === "resolving";
  const aA = getArt(displayA.artId);
  const canIA = !!aA.act && state.mpA >= aA.act.c && state.iaCD.A === 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_36px_1fr] gap-2">
        <SidePanel
          side="A"
          state={state}
          isActive={isAActive}
          artId={displayA.artId}
          artLevel={displayA.artLevel}
          name={displayA.name}
        />
        <div className="flex items-start justify-center pt-4 text-2xl font-bold text-muted-foreground">VS</div>
        <SidePanel
          side="B"
          state={state}
          isActive={isBActive}
          artId={displayB.artId}
          artLevel={displayB.artLevel}
          name={displayB.name}
        />
      </div>

      {/* Skill-cast banner — sits BELOW the side-panel status UI so it
          doesn't overlap HP / MP / gauge bars. Reserved 96px height
          keeps the layout stable across cast / no-cast frames. */}
      <SkillCastOverlay cast={state.lastCast} />

      {state.winner && (
        <Card>
          <CardContent
            className={cn(
              "p-4 text-center",
              state.winner === "A" ? "bg-indigo-50 dark:bg-indigo-950" : "bg-orange-50 dark:bg-orange-950",
            )}
          >
            <div className={cn(
              "text-xl font-bold",
              state.winner === "A" ? "text-indigo-900 dark:text-indigo-200" : "text-orange-900 dark:text-orange-200",
            )}>
              🏆 {state.winner === "A" ? displayA.name : displayB.name} ชนะ!
            </div>
            <div className="text-xs text-muted-foreground mt-1">{state.turn} ตา</div>
          </CardContent>
        </Card>
      )}

      {/* Battle log — collapsible. Header toggles, body conditional. */}
      <div>
        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          aria-expanded={showLog}
        >
          <span className="font-display">
            📜 บันทึกการต่อสู้{" "}
            <span className="text-muted-foreground">({state.log.length})</span>
          </span>
          <span
            className={cn(
              "text-muted-foreground transition-transform",
              showLog && "rotate-90",
            )}
            aria-hidden="true"
          >
            ▸
          </span>
        </button>
        {showLog && (
          <div className="mt-1">
            <BattleLog log={state.log} />
          </div>
        )}
      </div>

      {state.winner ? (
        mode === "world" ? (
          <div className="flex justify-center">
            <Button size="lg" onClick={() => onContinue?.()}>
              ดำเนินเรื่อง →
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            <Button onClick={() => start(setupA, setupB)}>เริ่มใหม่</Button>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        )
      ) : state.phase === "player" ? (
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            เลือกวิชา: <strong>{displayA.name}</strong>
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {displayA.skillIds.map((raw, i) => {
              if (!raw) return null;
              const info = parseSlotId(raw);
              if (!info) return null;
              const cd = state.cd.A[i];
              const onCd = cd > 0;

              if (info.kind === "art") {
                const art = info.art;
                if (!art.act) return null;
                const mpShort = state.mpA < art.act.c;
                return (
                  <Button
                    key={i}
                    size="sm"
                    disabled={onCd || mpShort}
                    onClick={() => useSkill(i)}
                    className="flex-col h-auto py-2 min-w-[82px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-700"
                  >
                    <span className="font-semibold text-xs">⚡ {art.act.n}</span>
                    <span className="text-[9px]">
                      MP {art.act.c}/{state.mpA}{" "}
                      {onCd ? (
                        <Badge variant="destructive" className="text-[8px] px-1 py-0">
                          CD {cd}
                        </Badge>
                      ) : (
                        <span>CD{art.act.cd}</span>
                      )}
                    </span>
                  </Button>
                );
              }

              const sk = info.skill;
              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  disabled={onCd}
                  onClick={() => useSkill(i)}
                  className="flex-col h-auto py-2 min-w-[82px]"
                >
                  <span className="font-semibold text-xs">{sk.n}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {sk.at === "phy" ? "⚔" : sk.at === "int" ? "💜" : sk.se ? "⟳" : "💥"} {WEAPON_FAMILY_LABEL[sk.w]}{" "}
                    {onCd ? (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0">
                        CD {cd}
                      </Badge>
                    ) : (
                      <span>{TIERS[sk.ti].n}</span>
                    )}
                  </span>
                </Button>
              );
            })}
            {aA.act && (
              <Button
                size="sm"
                disabled={!canIA}
                onClick={useArtActive}
                className="flex-col h-auto py-2 min-w-[82px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-700"
              >
                <span className="font-semibold text-xs">⚡ {aA.act.n}</span>
                <span className="text-[9px]">
                  MP {aA.act.c}/{state.mpA}{" "}
                  {state.iaCD.A > 0 ? (
                    <Badge variant="destructive" className="text-[8px] px-1 py-0">
                      CD {state.iaCD.A}
                    </Badge>
                  ) : (
                    <span>CD{aA.act.cd}</span>
                  )}
                </span>
              </Button>
            )}
          </div>
          {mode === "free" && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={autoAdvance}>
                Auto ▶▶
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                Reset
              </Button>
            </div>
          )}
        </div>
      ) : state.phase === "filling" ? (
        <div className="text-center space-y-2">
          <p className="text-sm italic text-muted-foreground py-2">
            กำลังสะสมพลัง... (A {Math.floor(state.gA)}% · B {Math.floor(state.gB)}%)
          </p>
          {mode === "free" && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={autoAdvance}>
                Auto ▶▶
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                Reset
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-sm italic text-muted-foreground py-2">{displayB.name} กำลังโจมตี...</p>
          {mode === "free" && (
            <Button variant="outline" size="sm" onClick={reset}>
              Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skill-cast animation banner ──────────────────────────────────────
// Renders the most-recent skill / art active cast in a fixed-height
// banner placed BELOW the side-panel status UI (HP / MP / gauges).
//
// Animation sequence (must stay synced with `castEndsAt` in battle.ts):
//   - 0.00s: skill name pops in BIG (animate-skill-cast)
//   - 0.30s: hit 1 damage pops (animate-damage-pop with delay 0.3s)
//   - 0.40s: hit 2 damage pops
//   - 0.30s + (n-1)*0.10s: hit n
// Each hit shows either its damage (with ★ for crits) or "พลาดเป้า"
// for misses. Layout stays stable because the container reserves a
// fixed height regardless of cast presence.
function SkillCastOverlay({
  cast,
}: {
  cast: BattleState["lastCast"];
}) {
  // Reserve the height even when no cast yet — keeps the BattleLog
  // anchored at a stable Y so the layout doesn't shift mid-battle.
  if (!cast) return <div className="h-32" aria-hidden />;
  const { seq, name, hits, hitDamages, hitCrits, hitMisses, tier } = cast;
  // Rarity-tinted name color by skill / art tier:
  //   T0 white · T1 green · T2 blue · T3 purple · T4 orange
  // White uses near-white off the cream paper background so it stays
  // legible. Higher tiers escalate visually (mirrors loot-rarity
  // conventions in most RPGs).
  const tierColor =
    [
      "text-stone-100",   // T0 white
      "text-emerald-600", // T1 green
      "text-sky-600",     // T2 blue
      "text-purple-600",  // T3 purple
      "text-orange-500",  // T4 orange
    ][tier] ?? "text-foreground";
  return (
    <div
      key={seq}
      className="pointer-events-none flex h-32 flex-col items-center justify-start pt-1"
      aria-hidden
    >
      {/* Skill name — large, top tier of the banner. */}
      <div
        className={cn(
          "font-action font-bold animate-skill-cast",
          "text-4xl sm:text-5xl md:text-6xl leading-none",
          "text-center px-2 py-0.5",
          "text-stroke-black drop-shadow-[2px_2px_0_hsl(20_15%_12%/0.9)]",
          tierColor,
        )}
      >
        {name}
        {hits > 1 && (
          <span className="ml-1.5 text-sm align-top text-muted-foreground">
            ×{hits}
          </span>
        )}
      </div>

      {/* Per-hit damage row — staggered. Each hit waits for skill name
          (0.3s) plus its index × 0.1s before popping in. */}
      <div className="mt-2 flex gap-2 items-center justify-center min-h-[2.25rem]">
        {hitDamages.map((dmg, i) => {
          const isMiss = hitMisses[i];
          const isCrit = hitCrits[i];
          const delayMs = 300 + i * 100;
          const styleVar = { animationDelay: `${delayMs}ms` } as React.CSSProperties;
          if (isMiss) {
            return (
              <span
                key={i}
                className={cn(
                  "font-action text-xl sm:text-2xl text-muted-foreground",
                  "animate-damage-pop opacity-0",
                  "drop-shadow-[1px_1px_0_hsl(20_15%_12%/0.6)]",
                )}
                style={styleVar}
              >
                พลาดเป้า
              </span>
            );
          }
          if (dmg <= 0) return null; // buff / no-damage cast
          return (
            <span
              key={i}
              className={cn(
                "font-action font-bold leading-none animate-damage-pop opacity-0",
                "text-3xl sm:text-4xl md:text-5xl",
                "drop-shadow-[2px_2px_0_hsl(20_15%_12%/0.9)]",
                isCrit ? "text-red-600" : "text-amber-700",
              )}
              style={styleVar}
            >
              {isCrit && <span className="mr-0.5 text-xl align-top">★</span>}
              {dmg}
            </span>
          );
        })}
      </div>
    </div>
  );
}
