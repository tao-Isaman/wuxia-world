"use client";

import { useEffect } from "react";
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
  type BattleState,
  type CharacterBuild,
  type Side,
} from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { useCharacterStore } from "@/store/character-store";
import { BattleLog } from "./battle-log";
import { cn } from "@/lib/utils";

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
  const hp = side === "A" ? state.hA : state.hB;
  const mp = side === "A" ? state.mpA : state.mpB;
  const gauge = side === "A" ? state.gA : state.gB;
  const opp = side === "A" ? state.dB : state.dA;
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
          {buffs.map((b, i) => (
            <span key={i} className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              {b.n ?? b.t}({b.u})
            </span>
          ))}
          {debuffs.map((d, i) => (
            <span key={i} className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
              {d.n ?? d.t}({d.u})
            </span>
          ))}
          {stk > 0 && (
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              ATK+{stk * 3}%
            </span>
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

      <BattleLog log={state.log} />

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
            {displayA.skillIds.map((sid, i) => {
              if (!sid) return null;
              const sk = getSkill(sid);
              if (!sk) return null;
              const cd = state.cd.A[i];
              const onCd = cd > 0;
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
