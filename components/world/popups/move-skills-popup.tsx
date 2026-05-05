"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SKILL_LEVEL_MAX,
  TIERS,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  effectiveBp,
  effectiveMg,
  getSkill,
  mgMultiplier,
  xpToNextLevel,
} from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Move-skills popup — the 5 equipped skill slots plus their level / xp /
// upgrade controls. Each skill shows the live BP and mastery contribution
// at its current level; the two upgrade buttons spend either the per-skill
// xp pool or the global w-exp pool.
export function MoveSkillsPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const skillLevel = useWorldStore((s) => s.skillLevel);
  const skillExp = useWorldStore((s) => s.skillExp);
  const wExp = useWorldStore((s) => s.wExp);
  const levelUpFromExp = useWorldStore((s) => s.levelUpSkillFromExp);
  const levelUpFromWExp = useWorldStore((s) => s.levelUpSkillFromWExp);

  if (!player) return null;

  const slots = player.skillIds;

  return (
    <Modal open={open} onClose={onClose} title="🥋 วิชาฝีมือ (5 ช่อง)">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <Badge variant="outline" className="text-[10px]">
          ค่าประสบการณ์ (w-exp)
        </Badge>
        <span className="font-mono font-semibold">{wExp}</span>
      </div>
      <div className="space-y-2">
        {slots.map((sid, i) => {
          const sk = sid ? getSkill(sid) : null;
          if (!sk || !sid) {
            return (
              <div
                key={i}
                className="rounded border border-dashed border-muted-foreground/30 px-3 py-3 text-xs text-center text-muted-foreground italic"
              >
                ช่องที่ {i + 1} — ว่าง
              </div>
            );
          }
          const tier = TIERS[sk.ti];
          const lv = skillLevel[sid] ?? 1;
          const xp = skillExp[sid] ?? 0;
          const maxed = lv >= SKILL_LEVEL_MAX;
          const cost = maxed ? Infinity : xpToNextLevel(sk, lv);
          const xpCapped = maxed ? 1 : Math.min(xp, cost);
          const xpPct = maxed ? 100 : Math.min(100, Math.round((xp / cost) * 100));
          const eBp = Math.round(effectiveBp(sk, lv));
          const eMg = Math.round(effectiveMg(sk, lv));
          const bpMul = Math.round(bpMultiplier(lv) * 100);
          const mgMul = Math.round(mgMultiplier(lv) * 100);
          const canSkillExp = !maxed && xp >= cost;
          const canWExp = !maxed && wExp >= cost;

          return (
            <div key={i} className="rounded bg-muted/30 px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                  <strong className="text-sm">{sk.n}</strong>
                  <Badge variant="default" className="text-[10px]">
                    Lv.{lv}{maxed ? " (สูงสุด)" : ""}
                  </Badge>
                  {tier && (
                    <Badge variant="outline" className="text-[9px]">
                      {tier.n}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px]"
                    title={WEAPON_FAMILY_HINT[sk.w]}
                  >
                    {WEAPON_FAMILY_LABEL[sk.w]}
                  </Badge>
                  {sk.at && (
                    <Badge variant="outline" className="text-[9px]">
                      {sk.at === "phy" ? "ทางกาย" : "ทางใน"}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">{sk.d}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                <span>BP {eBp} <span className="opacity-60">({bpMul}% ของ {sk.bp})</span></span>
                {sk.p > 0 && <span>+{sk.p}%</span>}
                {sk.f > 0 && <span>+{sk.f} flat</span>}
                {sk.dm !== 1 && <span>×{sk.dm}</span>}
                {sk.dr ? <span>ดูด {sk.dr}%</span> : null}
                <span>ฝีมือ +{eMg} <span className="opacity-60">({mgMul}% ของ {sk.mg})</span></span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {maxed
                      ? "ระดับสูงสุดแล้ว"
                      : `xp ${xpCapped}/${cost} (ตี-${sk.ti + 1})`}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
              {!maxed && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7"
                    disabled={!canSkillExp}
                    onClick={() => levelUpFromExp(sid)}
                    title={canSkillExp ? `ใช้ ${cost} xp ของวิชา` : `ต้องการ ${cost} xp`}
                  >
                    เลื่อนขั้นด้วย xp วิชา
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7"
                    disabled={!canWExp}
                    onClick={() => levelUpFromWExp(sid)}
                    title={canWExp ? `ใช้ ${cost} w-exp` : `ต้องการ ${cost} w-exp`}
                  >
                    เลื่อนขั้นด้วย w-exp ({cost})
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
