"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getEquip } from "@/lib/game";
import {
  ITEMS,
  LIFE_SKILL_ICON,
  LIFE_SKILL_KEYS,
  LIFE_SKILL_LABEL,
  MAX_MASTERY,
  RECIPES,
  gatherSuccessChance,
  getItem,
  masteryLevel,
  masteryProgress,
} from "@/lib/world";
import type { LifeSkill, RecipeDef } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "skills" | "practice" | "crafting";

// Combined popup for the menu's "🌾 วิชาชีพ" button. Three tabs:
//   • มาสเตอร์รี่    — progress bar for each of the 17 life skills
//   • ฝึกฝน          — consumable training items + เล่นเพลง button
//   • ประดิษฐ์       — recipes the player can attempt; mastery-gated and
//                      drop-checked when usesDropCheck is set
export function LifeSkillsPopup({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("skills");
  return (
    <Modal open={open} onClose={onClose} title="🌾 วิชาชีพและการฝึกฝน" maxWidth="max-w-2xl">
      <div className="flex gap-1 mb-3 border-b pb-2">
        <Button variant={tab === "skills" ? "default" : "ghost"} size="sm" className="text-xs" onClick={() => setTab("skills")}>
          มาสเตอร์รี่
        </Button>
        <Button variant={tab === "practice" ? "default" : "ghost"} size="sm" className="text-xs" onClick={() => setTab("practice")}>
          ฝึกฝน
        </Button>
        <Button variant={tab === "crafting" ? "default" : "ghost"} size="sm" className="text-xs" onClick={() => setTab("crafting")}>
          ประดิษฐ์
        </Button>
      </div>

      {tab === "skills" && <SkillsTab />}
      {tab === "practice" && <PracticeTab />}
      {tab === "crafting" && <CraftingTab />}
    </Modal>
  );
}

// ─── Mastery tab ────────────────────────────────────────────────────
function SkillsTab() {
  const xpMap = useWorldStore((s) => s.lifeSkillXp);
  return (
    <div className="space-y-2">
      {LIFE_SKILL_KEYS.map((k) => (
        <SkillRow key={k} skill={k} xp={xpMap[k] ?? 0} />
      ))}
    </div>
  );
}

function SkillRow({ skill, xp }: { skill: LifeSkill; xp: number }) {
  const { lvl, cur, need } = masteryProgress(xp);
  const pct = need === 0 ? 100 : (cur / need) * 100;
  const atCap = lvl >= MAX_MASTERY;
  return (
    <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{LIFE_SKILL_ICON[skill]}</span>
          <strong className="text-sm">{LIFE_SKILL_LABEL[skill]}</strong>
        </div>
        <Badge variant="outline" className="text-[9px]">
          ระดับ {lvl} / {MAX_MASTERY}
        </Badge>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>xp {xp}</span>
        <span>{atCap ? "ถึงระดับสูงสุดแล้ว" : `อีก ${Math.max(0, need - cur)} เพื่อระดับถัดไป`}</span>
      </div>
    </div>
  );
}

// ─── Practice tab — consumables + เล่นเพลง ──────────────────────────
function PracticeTab() {
  const inventory = useWorldStore((s) => s.inventory);
  const consumeItem = useWorldStore((s) => s.useItem);
  const practiceMusic = useWorldStore((s) => s.practiceMusic);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  const [last, setLast] = useState<string | null>(null);

  const trainable = ITEMS
    .filter((it) => it.use && (inventory[it.id] ?? 0) > 0)
    .sort((a, b) => {
      const sa = a.use?.t === "trainSkill" ? a.use.skill : "";
      const sb = b.use?.t === "trainSkill" ? b.use.skill : "";
      return sa.localeCompare(sb);
    });

  const equippedW = getEquip(playerBuild?.equipment.W);
  const hasInstrument = !!equippedW?.instrument;

  return (
    <div className="space-y-3">
      {last && (
        <div className="rounded bg-muted/40 px-2 py-1.5 text-[11px]">{last}</div>
      )}

      {/* Music practice button */}
      <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🎵</span>
            <strong className="text-sm">เล่นเพลงในใจ</strong>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            disabled={!hasInstrument}
            onClick={() => {
              const r = practiceMusic();
              if (!r.ok) {
                setLast(
                  r.reason === "no-instrument"
                    ? "ต้องสวมเครื่องดนตรีในช่องอาวุธก่อน"
                    : "เล่นเพลงไม่ได้ตอนนี้",
                );
                return;
              }
              setLast(`บรรเลงเพลงสั้น ๆ · +${r.xpGained} xp ดนตรี`);
            }}
          >
            เล่นเพลง
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {hasInstrument
            ? `ติดตั้ง ${equippedW?.n} อยู่ในช่องอาวุธ`
            : "ต้องสวมขลุ่ย พิณ หรือเครื่องดนตรีอื่นในช่องอาวุธ"}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
          ไอเทมฝึกฝน
        </div>
        {trainable.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            ยังไม่มีไอเทมฝึกฝนในย่าม
          </p>
        ) : (
          <div className="space-y-1.5">
            {trainable.map((it) => {
              const eff = it.use!;
              if (eff.t !== "trainSkill") return null;
              const count = inventory[it.id] ?? 0;
              return (
                <div key={it.id} className="rounded bg-muted/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-sm">{it.name}</strong>
                        <Badge variant="outline" className="text-[9px]">
                          {LIFE_SKILL_ICON[eff.skill]} {LIFE_SKILL_LABEL[eff.skill]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          +{eff.xp} xp
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">×{count}</Badge>
                      </div>
                      {it.description && (
                        <span className="text-[10px] text-muted-foreground">{it.description}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] shrink-0"
                      onClick={() => {
                        const r = consumeItem(it.id);
                        if (!r.ok) {
                          setLast("ใช้ไม่สำเร็จ");
                          return;
                        }
                        setLast(`ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`);
                      }}
                    >
                      ใช้
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Crafting tab ───────────────────────────────────────────────────
function CraftingTab() {
  const inventory = useWorldStore((s) => s.inventory);
  const xpMap = useWorldStore((s) => s.lifeSkillXp);
  const craftRecipe = useWorldStore((s) => s.craftRecipe);
  const [lastResult, setLastResult] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {lastResult && (
        <div className="rounded bg-muted/40 px-2 py-1.5 text-[11px]">{lastResult}</div>
      )}
      {RECIPES.map((r) => (
        <RecipeRow
          key={r.id}
          recipe={r}
          inventory={inventory}
          masteryLv={r.skill ? masteryLevel(xpMap[r.skill] ?? 0) : MAX_MASTERY}
          onCraft={() => {
            const res = craftRecipe(r.id);
            if (!res.ok) {
              setLastResult(
                res.reason === "missing-input"
                  ? "วัตถุดิบไม่ครบ"
                  : res.reason === "missing-mastery"
                    ? "มาสเตอร์รี่ยังไม่ถึงระดับที่กำหนด"
                    : "ไม่สามารถประดิษฐ์ได้",
              );
              return;
            }
            const out = getItem(res.outputItemId);
            if (res.dropCheck === "failed") {
              setLastResult(`พลาดในขั้นตอนสุดท้าย — เสียวัตถุดิบ · +${res.xpGained} xp`);
              return;
            }
            setLastResult(`สร้าง ${out?.name ?? res.outputItemId} ×${res.outputCount} สำเร็จ · +${res.xpGained} xp`);
          }}
        />
      ))}
    </div>
  );
}

function RecipeRow({
  recipe,
  inventory,
  masteryLv,
  onCraft,
}: {
  recipe: RecipeDef;
  inventory: Record<string, number>;
  masteryLv: number;
  onCraft: () => void;
}) {
  const required = recipe.requiredMastery ?? 1;
  const masteryOk = masteryLv >= required;
  const inputsOk = recipe.inputs.every(
    (inp) => (inventory[inp.itemId] ?? 0) >= inp.count,
  );
  const canCraft = masteryOk && inputsOk;
  const out = getItem(recipe.output.itemId);
  const skillKey = recipe.skill;

  // Drop-check preview: only for recipes that actually roll one.
  const successChance = recipe.usesDropCheck
    ? gatherSuccessChance(masteryLv, required)
    : null;

  return (
    <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <strong className="text-sm">{recipe.name}</strong>
          {skillKey && (
            <Badge variant="outline" className="text-[9px]">
              {LIFE_SKILL_ICON[skillKey]} {LIFE_SKILL_LABEL[skillKey]}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-[9px] ${masteryOk ? "" : "text-rose-600 border-rose-300"}`}
          >
            ต้อง ระดับ {required}
          </Badge>
          {successChance !== null && (
            <Badge variant="outline" className="text-[9px]">
              ✓ {Math.round(successChance * 100)}%
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!canCraft}
          onClick={onCraft}
          className="text-[11px] h-7"
        >
          ประดิษฐ์
        </Button>
      </div>
      {recipe.description && (
        <div className="text-[10px] text-muted-foreground">{recipe.description}</div>
      )}
      <div className="flex flex-wrap gap-1 text-[10px]">
        {recipe.inputs.map((inp) => {
          const have = inventory[inp.itemId] ?? 0;
          const ok = have >= inp.count;
          const def = getItem(inp.itemId);
          return (
            <span
              key={inp.itemId}
              className={
                ok
                  ? "bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded"
                  : "bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded"
              }
            >
              {def?.name ?? inp.itemId} {have}/{inp.count}
            </span>
          );
        })}
        <span className="text-muted-foreground">→</span>
        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
          {out?.name ?? recipe.output.itemId} ×{recipe.output.count}
        </span>
      </div>
    </div>
  );
}
