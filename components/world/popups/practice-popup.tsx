"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ART_LEVEL_MAX,
  SKILL_LEVEL_MAX,
  SKILL_TYPE_LABEL,
  TIERS,
  WEAPON_FAMILY_LABEL,
  effectiveTypes,
  encodeArtSlot,
  getArt,
  getSkill,
  xpToNextArtLevel,
  xpToNextLevel,
} from "@/lib/game";
import {
  describeBonusForLocation,
  getLocationCategories,
  LOCATION_CATEGORY_LABEL,
  practiceXpBonus,
  type LocationScene,
} from "@/lib/world";
import {
  PRACTICE_HOURS,
  PRACTICE_STAMINA_COST,
  useWorldStore,
  type PracticeResult,
} from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  scene: LocationScene | null;
  onClose: () => void;
}

// Practice popup — pick one learned move skill or inner art to train at the
// current location. Costs PRACTICE_STAMINA_COST + PRACTICE_HOURS; xp gained
// scales with the location's category bonus (forest→yang/external,
// cave→yin/soft, mountain→balance/hard, river→internal). Show a 1-second
// flashLoading on click so the action feels deliberate.
export function PracticePopup({ open, scene, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const stamina = useWorldStore((s) => s.stamina);
  const skillExp = useWorldStore((s) => s.skillExp);
  const skillLevel = useWorldStore((s) => s.skillLevel);
  const artExp = useWorldStore((s) => s.artExp);
  const practiceSkill = useWorldStore((s) => s.practiceSkill);

  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!scene) return null;
  if (!player) return null;

  const learnedSkillIds = player.learnedSkillIds ?? [];
  const learnedArtIds = player.learnedArtIds ?? [];
  const cats = getLocationCategories(scene);
  const { matchedTypes, hasBonus } = describeBonusForLocation(scene);
  const tooTired = stamina < PRACTICE_STAMINA_COST;

  const onPractice = (rawId: string) => {
    if (tooTired) {
      toast("warn", `พลังไม่พอ — ต้องการ ${PRACTICE_STAMINA_COST} แรง`);
      return;
    }
    setPendingId(rawId);
    flashLoading("กำลังฝึกฝน...", 1000);
    // Defer the actual mutation a tick so the loading overlay paints first.
    window.setTimeout(() => {
      const r = practiceSkill(rawId);
      setPendingId(null);
      toast(...practiceToast(r));
    }, 1000);
  };

  return (
    <Modal open={open} onClose={onClose} title="🧘 ฝึกฝน" maxWidth="max-w-xl">
      {/* ─── Location bonus header ──────────────────────────────────── */}
      <div className="mb-3 rounded bg-muted/30 px-3 py-2 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            สถานที่
          </span>
          <strong className="text-sm">{scene.name}</strong>
          {cats.length > 0 ? (
            cats.map((c) => (
              <Badge key={c} variant="outline" className="text-[9px]">
                {LOCATION_CATEGORY_LABEL[c]}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-[9px]">
              ไม่มีหมวดที่เพิ่มประสบการณ์
            </Badge>
          )}
        </div>
        {hasBonus ? (
          <div className="text-[10px] text-emerald-700">
            +30% xp สำหรับวิชาประเภท:{" "}
            {matchedTypes.map((t) => SKILL_TYPE_LABEL[t]).join(" / ")}
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground">
            สถานที่นี้ไม่ให้โบนัสประสบการณ์เพิ่ม
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          ค่าใช้: ⚡ {PRACTICE_STAMINA_COST} · เวลา {PRACTICE_HOURS} ชั่วยาม
          <span className="ml-2">
            พลังคงเหลือ:{" "}
            <strong className={tooTired ? "text-rose-600" : ""}>
              {stamina}
            </strong>
          </span>
        </div>
      </div>

      {/* ─── Learned move skills ────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          วิชาฝีมือที่เรียนรู้แล้ว ({learnedSkillIds.length})
        </div>
        {learnedSkillIds.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-2">
            ยังไม่มีวิชาฝีมือ
          </p>
        ) : (
          <div className="space-y-1.5">
            {learnedSkillIds.map((sid) => {
              const sk = getSkill(sid);
              if (!sk) return null;
              const tier = TIERS[sk.ti];
              const lv = skillLevel[sid] ?? 1;
              const xp = skillExp[sid] ?? 0;
              const maxed = lv >= SKILL_LEVEL_MAX;
              const cost = maxed ? Infinity : xpToNextLevel(sk, lv);
              const xpPct = maxed
                ? 100
                : Math.min(100, Math.round((xp / cost) * 100));
              const types = effectiveTypes(sk);
              const mult = practiceXpBonus(scene, types);
              return (
                <div key={sid} className="rounded bg-muted/30 px-2 py-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Badge variant="default" className="text-[9px]">⚔</Badge>
                      <strong className="text-xs">{sk.n}</strong>
                      <Badge variant="default" className="text-[9px]">
                        Lv.{lv}
                        {maxed ? " (สูงสุด)" : ""}
                      </Badge>
                      {tier && (
                        <Badge variant="outline" className="text-[9px]">
                          {tier.n}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px]">
                        {WEAPON_FAMILY_LABEL[sk.w]}
                      </Badge>
                      {mult > 1 && (
                        <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-700">
                          +30% xp
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={tooTired || maxed || pendingId !== null}
                      onClick={() => onPractice(sid)}
                    >
                      {maxed ? "สูงสุดแล้ว" : "ฝึก"}
                    </Button>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {maxed ? "ระดับสูงสุดแล้ว" : `xp ${xp}/${cost}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground pt-2">
          วิชาในกายที่เรียนรู้แล้ว ({learnedArtIds.length})
        </div>
        {learnedArtIds.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-2">
            ยังไม่มีวิชาในกาย
          </p>
        ) : (
          <div className="space-y-1.5">
            {learnedArtIds.map((aid) => {
              const art = getArt(aid);
              if (!art || art.id === "none") return null;
              const lv = player.artLevels?.[aid] ?? 1;
              const xp = artExp[aid] ?? 0;
              const maxed = lv >= ART_LEVEL_MAX;
              const cost = maxed ? Infinity : xpToNextArtLevel(art, lv);
              const xpPct = maxed
                ? 100
                : Math.min(100, Math.round((xp / cost) * 100));
              const types = effectiveTypes(art);
              const mult = practiceXpBonus(scene, types);
              const raw = encodeArtSlot(aid);
              return (
                <div key={aid} className="rounded bg-muted/30 px-2 py-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Badge variant="default" className="text-[9px]">☯</Badge>
                      <strong className="text-xs">{art.n}</strong>
                      <Badge variant="default" className="text-[9px]">
                        ขั้น {lv}
                        {maxed ? " (สูงสุด)" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        {art.sc}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        {art.tp}
                      </Badge>
                      {mult > 1 && (
                        <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-700">
                          +30% xp
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={tooTired || maxed || pendingId !== null}
                      onClick={() => onPractice(raw)}
                    >
                      {maxed ? "สูงสุดแล้ว" : "ฝึก"}
                    </Button>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-full ${maxed ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {maxed ? "ระดับสูงสุดแล้ว" : `xp ${xp}/${cost}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

type ToastTuple = ["success" | "info" | "warn" | "error", string];
function practiceToast(r: PracticeResult): ToastTuple {
  if (!r.ok) {
    if (r.reason === "stamina") return ["warn", "พลังไม่พอสำหรับการฝึก"];
    if (r.reason === "not-allowed") return ["warn", "ที่นี่ฝึกฝนไม่ได้"];
    if (r.reason === "no-build") return ["error", "ตัวละครยังไม่พร้อม"];
    return ["error", "ฝึกไม่สำเร็จ"];
  }
  const kindLabel = r.kind === "skill" ? "วิชาฝีมือ" : "วิชาในกาย";
  const def =
    r.kind === "skill" ? getSkill(r.id) : getArt(r.id);
  const name = def && "n" in def ? def.n : r.id;
  const bonusPart =
    r.bonusMult > 1 ? ` (×${r.bonusMult.toFixed(2)} โบนัสสถานที่)` : "";
  if (r.leveledUp) {
    const lvLabel = r.kind === "skill" ? `Lv.${r.newLevel}` : `ขั้น ${r.newLevel}`;
    return [
      "success",
      `ฝึก ${kindLabel} ${name} · +${r.xpGained} xp${bonusPart} · ขึ้น ${lvLabel}!`,
    ];
  }
  return [
    "success",
    `ฝึก ${kindLabel} ${name} · +${r.xpGained} xp${bonusPart}`,
  ];
}
