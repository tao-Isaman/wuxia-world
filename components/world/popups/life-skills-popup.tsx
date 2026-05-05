"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LIFE_SKILL_ICON,
  LIFE_SKILL_KEYS,
  LIFE_SKILL_LABEL,
  MAX_MASTERY,
  RECIPES,
  getItem,
  masteryProgress,
} from "@/lib/world";
import type { LifeSkill, RecipeDef } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "skills" | "crafting";

// Combined popup for the menu's "🌾 วิชาชีพ" button. Two tabs:
//   • skills   — mastery progress bar for each of the 6 life skills
//   • crafting — list of recipes the player can attempt right now
//                (greyed out when ingredients are missing)
export function LifeSkillsPopup({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("skills");
  return (
    <Modal open={open} onClose={onClose} title="🌾 วิชาชีพและการประดิษฐ์" maxWidth="max-w-2xl">
      <div className="flex gap-1 mb-3 border-b pb-2">
        <Button
          variant={tab === "skills" ? "default" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setTab("skills")}
        >
          มาสเตอร์รี่
        </Button>
        <Button
          variant={tab === "crafting" ? "default" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setTab("crafting")}
        >
          ประดิษฐ์
        </Button>
      </div>

      {tab === "skills" ? <SkillsTab /> : <CraftingTab />}
    </Modal>
  );
}

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

function CraftingTab() {
  const inventory = useWorldStore((s) => s.inventory);
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
          onCraft={() => {
            const res = craftRecipe(r.id);
            if (!res.ok) {
              setLastResult(
                res.reason === "missing-input" ? "วัตถุดิบไม่ครบ" : "ไม่สามารถประดิษฐ์ได้",
              );
              return;
            }
            const out = getItem(res.outputItemId);
            setLastResult(`สร้าง ${out?.name ?? res.outputItemId} ×${res.outputCount} สำเร็จ`);
          }}
        />
      ))}
    </div>
  );
}

function RecipeRow({
  recipe,
  inventory,
  onCraft,
}: {
  recipe: RecipeDef;
  inventory: Record<string, number>;
  onCraft: () => void;
}) {
  const canCraft = recipe.inputs.every(
    (inp) => (inventory[inp.itemId] ?? 0) >= inp.count,
  );
  const out = getItem(recipe.output.itemId);
  return (
    <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm">{recipe.name}</strong>
        <Button size="sm" variant="outline" disabled={!canCraft} onClick={onCraft} className="text-[11px] h-7">
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
