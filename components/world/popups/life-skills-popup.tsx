"use client";

import { useState } from "react";
import { PagedGrid } from "@/components/ui/paged-grid";
import { useShortScreen } from "@/components/ui/use-short-screen";
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
  RECIPES_BY_ID,
  gatherSuccessChance,
  getItem,
  masteryLevel,
  masteryProgress,
} from "@/lib/world";
import type { LifeSkill, RecipeDef } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "skills" | "practice" | "recipes";

// Combined popup for the menu's "🌾 อาชีพ" button: three tabs, each a paged
// grid of tiles (no scrolling, landscape):
//   • มาสเตอร์รี่    — one tile per life skill: icon, level, progress
//   • ฝึกฝน          — the music practice + every training item in the bag
//   • สูตรที่เรียน    — learned recipes (crafting happens at artisans)
export function LifeSkillsPopup({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("skills");
  return (
    <Modal open={open} onClose={onClose} title="🌾 วิชาชีพและการฝึกฝน" fill>
      <div className="life-wrap">
        <div className="menu-tabs" role="tablist" aria-label="หมวดอาชีพ">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {tab === "skills" && <SkillsTab />}
        {tab === "practice" && <PracticeTab />}
        {tab === "recipes" && <RecipesTab />}
      </div>
    </Modal>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "skills", label: "มาสเตอร์รี่" },
  { id: "practice", label: "ฝึกฝน" },
  { id: "recipes", label: "สูตรที่เรียน" },
];

// ─── Mastery tab ────────────────────────────────────────────────────
function SkillsTab() {
  const xpMap = useWorldStore((s) => s.lifeSkillXp);
  const short = useShortScreen();
  return (
    <PagedGrid items={LIFE_SKILL_KEYS} itemKey={(k) => k} cellWidth={short ? 118 : 150} cellHeight={short ? 70 : 92} gap={6}
      label="มาสเตอร์รี่" render={(k) => <SkillTile skill={k} xp={xpMap[k] ?? 0} />} />
  );
}

function SkillTile({ skill, xp }: { skill: LifeSkill; xp: number }) {
  const { lvl, cur, need } = masteryProgress(xp);
  const pct = need === 0 ? 100 : (cur / need) * 100;
  const atCap = lvl >= MAX_MASTERY;
  return (
    <div className="life-tile" data-life-skill={skill} title={atCap ? "ถึงระดับสูงสุดแล้ว" : `ค่าประสบการณ์ ${xp} · อีก ${Math.max(0, need - cur)} เพื่อระดับถัดไป`}>
      <div className="life-tile-head">
        <span className="life-tile-icon" aria-hidden="true">{LIFE_SKILL_ICON[skill]}</span>
        <strong>{LIFE_SKILL_LABEL[skill]}</strong>
      </div>
      {/* Level and xp share a row, so the card never clips the numbers. */}
      <div className="life-tile-level"><span>ระดับ <b>{lvl}</b>/{MAX_MASTERY}</span><small>{atCap ? "สูงสุด" : `${cur}/${need}`}</small></div>
      <Progress value={pct} className="h-1.5 shrink-0" />
    </div>
  );
}

// ─── Practice tab — เล่นเพลง + training items ─────────────────────────
type PracticeCell = { kind: "music" } | { kind: "item"; id: string };

function PracticeTab() {
  const inventory = useWorldStore((s) => s.inventory);
  const consumeItem = useWorldStore((s) => s.useItem);
  const practiceMusic = useWorldStore((s) => s.practiceMusic);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  const short = useShortScreen();

  const trainable = ITEMS
    .filter((it) => it.use?.t === "trainSkill" && (inventory[it.id] ?? 0) > 0)
    .sort((a, b) => {
      const sa = a.use?.t === "trainSkill" ? a.use.skill : "";
      const sb = b.use?.t === "trainSkill" ? b.use.skill : "";
      return sa.localeCompare(sb);
    });
  const equippedW = getEquip(playerBuild?.equipment.W);
  const hasInstrument = !!equippedW?.instrument;
  const cells: PracticeCell[] = [{ kind: "music" }, ...trainable.map((it): PracticeCell => ({ kind: "item", id: it.id }))];

  return (
    <PagedGrid items={cells} itemKey={(c) => (c.kind === "music" ? "music" : c.id)} cellWidth={short ? 150 : 180} cellHeight={short ? 84 : 104} gap={6}
      label="ไอเทมฝึกฝน" render={(c) => {
        if (c.kind === "music") return (
          <div className="life-tile">
            <div className="life-tile-head"><span className="life-tile-icon" aria-hidden="true">🎵</span><strong>เล่นเพลงในใจ</strong></div>
            <small>{hasInstrument ? `ใช้ ${equippedW?.n}` : "ต้องสวมเครื่องดนตรีในช่องอาวุธ"}</small>
            <Button size="sm" variant="outline" className="h-7 text-[12px] mt-auto" disabled={!hasInstrument}
              onClick={() => {
                const r = practiceMusic();
                if (!r.ok) { toast("error", r.reason === "no-instrument" ? "ต้องสวมเครื่องดนตรีในช่องอาวุธก่อน" : "เล่นเพลงไม่ได้ตอนนี้"); return; }
                toast("success", `บรรเลงเพลงสั้น ๆ · +${r.xpGained} xp ดนตรี`);
              }}>เล่นเพลง</Button>
          </div>
        );
        const it = getItem(c.id)!;
        const eff = it.use!;
        if (eff.t !== "trainSkill") return null;
        return (
          <div className="life-tile" title={it.description}>
            <div className="life-tile-head"><span className="life-tile-icon" aria-hidden="true">{LIFE_SKILL_ICON[eff.skill]}</span><strong>{it.name}</strong></div>
            <small>{LIFE_SKILL_LABEL[eff.skill]} · +{eff.xp} xp · ×{inventory[it.id] ?? 0}</small>
            <Button size="sm" variant="outline" className="h-7 text-[12px] mt-auto"
              onClick={() => {
                const r = consumeItem(it.id);
                if (!r.ok) { toast("error", "ใช้ไม่สำเร็จ"); return; }
                if (r.kind === "trainSkill") toast("success", `ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`);
              }}>ใช้</Button>
          </div>
        );
      }} />
  );
}

// ─── Recipes tab — read-only "what have I learned" reference ─────────
// Crafting happens at the artisan popups (city / village / sect); each tile
// says what the recipe needs and which artisan to visit.
function RecipesTab() {
  const learnedRecipeIds = useWorldStore((s) => s.learnedRecipeIds);
  const inventory = useWorldStore((s) => s.inventory);
  const xpMap = useWorldStore((s) => s.lifeSkillXp);
  const short = useShortScreen();

  const recipes: RecipeDef[] = learnedRecipeIds
    .map((id) => RECIPES_BY_ID.get(id))
    .filter((r): r is RecipeDef => !!r);

  return (
    <PagedGrid items={recipes} itemKey={(r) => r.id} cellWidth={short ? 210 : 250} cellHeight={short ? 92 : 112} gap={6}
      label="สูตรที่เรียน"
      empty={<p className="text-xs text-muted-foreground italic py-3 text-center">ท่านยังไม่ได้เรียนสูตรใด — ไปพบช่างฝีมือในเมือง · หมู่บ้าน · สำนัก เพื่อซื้อสูตร</p>}
      render={(r) => <RecipeRow recipe={r} inventory={inventory} masteryLv={r.skill ? masteryLevel(xpMap[r.skill] ?? 0) : MAX_MASTERY} />} />
  );
}

function RecipeRow({
  recipe,
  inventory,
  masteryLv,
}: {
  recipe: RecipeDef;
  inventory: Record<string, number>;
  masteryLv: number;
}) {
  const required = recipe.requiredMastery ?? 1;
  const masteryOk = masteryLv >= required;
  const out = getItem(recipe.output.itemId);
  const skillKey = recipe.skill;

  const successChance = recipe.usesDropCheck
    ? gatherSuccessChance(masteryLv, required)
    : null;

  return (
    <div className="life-tile life-tile--recipe" title={recipe.description}>
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
        {skillKey && (
          <span className="text-[10px] text-muted-foreground">
            ไปร้าน{LIFE_SKILL_LABEL[skillKey]}
          </span>
        )}
      </div>
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
