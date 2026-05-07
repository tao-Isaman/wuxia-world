"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ITEM_CATEGORY_LABEL,
  LIFE_SKILL_ICON,
  LIFE_SKILL_LABEL,
  MAX_MASTERY,
  RECIPES_BY_ID,
  gatherSuccessChance,
  getItem,
  getRecipe,
  masteryLevel,
  recipesOfferedBy,
  type ArtisanDef,
  type ItemCategory,
  type RecipeDef,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  artisan: ArtisanDef | null;
  onClose: () => void;
}

type Tab = "learn" | "craft" | "trade";

// Artisan popup — three tabs:
//   ซื้อสูตร    list recipes the artisan teaches that the player has
//                NOT yet learned. Buy → adds to learnedRecipeIds.
//   ประดิษฐ์   list the player's learned recipes whose `skill` matches
//                this artisan's profession. Craft → consumes inputs +
//                grants xp on success.
//   ซื้อ-ขาย   item shop — buy from artisan's inventory, sell items in
//                the artisan's accepted categories.
//
// The popup is the canonical entry point for crafting after the redesign;
// the lifeskills popup's ประดิษฐ์ tab now points the player back here.
export function ArtisanPopup({ open, artisan, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("learn");
  if (!artisan) return null;

  return (
    <Modal open={open} onClose={onClose} title={artisan.label} maxWidth="max-w-2xl">
      <div className="space-y-3">
        {/* Header — NPC + profession */}
        <div className="rounded bg-muted/40 px-3 py-2 text-xs space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-sm">👤 {artisan.npcName}</strong>
            <Badge variant="outline" className="text-[9px]">
              {LIFE_SKILL_ICON[artisan.profession]} {LIFE_SKILL_LABEL[artisan.profession]}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">{artisan.description}</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b pb-2">
          <Button
            size="sm"
            variant={tab === "learn" ? "default" : "ghost"}
            className="text-xs h-7"
            onClick={() => setTab("learn")}
          >
            📜 ซื้อสูตร
          </Button>
          <Button
            size="sm"
            variant={tab === "craft" ? "default" : "ghost"}
            className="text-xs h-7"
            onClick={() => setTab("craft")}
          >
            🔧 ประดิษฐ์
          </Button>
          <Button
            size="sm"
            variant={tab === "trade" ? "default" : "ghost"}
            className="text-xs h-7"
            onClick={() => setTab("trade")}
          >
            🏪 ซื้อ-ขาย ({Math.round(artisan.sellMultiplier * 100)}%)
          </Button>
        </div>

        {tab === "learn" && <LearnTab artisan={artisan} />}
        {tab === "craft" && <CraftTab artisan={artisan} />}
        {tab === "trade" && <TradeTab artisan={artisan} />}
      </div>
    </Modal>
  );
}

// ─── ซื้อสูตร tab ─────────────────────────────────────────────────────
function LearnTab({ artisan }: { artisan: ArtisanDef }) {
  const gold = useWorldStore((s) => s.gold);
  const learnedRecipeIds = useWorldStore((s) => s.learnedRecipeIds);
  const buyRecipe = useWorldStore((s) => s.buyRecipe);

  // Pull the full offer list (specialty + basic). Filter out recipes
  // the player already knows so the list always reflects buyable rows.
  const offers = recipesOfferedBy(artisan).filter(
    (o) => !learnedRecipeIds.includes(o.recipeId),
  );

  if (offers.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-3 text-center">
        ท่านได้เรียนสูตรทั้งหมดของช่างคนนี้แล้ว
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end text-xs">
        <span className="text-muted-foreground">ทอง </span>
        <strong className="text-amber-600 ml-1">{gold}</strong>
      </div>
      <ul className="space-y-1.5">
        {offers.map((offer) => {
          const r = getRecipe(offer.recipeId);
          if (!r) return null;
          const canAfford = gold >= offer.price;
          return (
            <li
              key={offer.recipeId}
              className="rounded bg-muted/30 px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <strong className="text-sm">{r.name}</strong>
                  {r.skill && (
                    <Badge variant="outline" className="text-[9px]">
                      {LIFE_SKILL_ICON[r.skill]} {LIFE_SKILL_LABEL[r.skill]}
                    </Badge>
                  )}
                  {r.requiredMastery && (
                    <Badge variant="outline" className="text-[9px]">
                      ต้องมาสเตอร์ {r.requiredMastery}
                    </Badge>
                  )}
                  {r.basic && (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">
                      สูตรพื้นฐาน
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canAfford}
                  className="text-[11px] h-7"
                  onClick={() => {
                    const res = buyRecipe(offer.recipeId, offer.price);
                    if (!res.ok) {
                      toast(
                        "error",
                        res.reason === "no-gold"
                          ? "ทองไม่พอ"
                          : res.reason === "already-learned"
                            ? "เรียนรู้สูตรนี้แล้ว"
                            : "ซื้อสูตรไม่สำเร็จ",
                      );
                      return;
                    }
                    toast("success", `เรียน ${r.name} (-${res.spent}🟡)`);
                  }}
                >
                  {offer.price}🟡 · เรียน
                </Button>
              </div>
              {r.description && (
                <p className="text-[10px] text-muted-foreground">{r.description}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── ประดิษฐ์ tab ─────────────────────────────────────────────────────
function CraftTab({ artisan }: { artisan: ArtisanDef }) {
  const inventory = useWorldStore((s) => s.inventory);
  const lifeSkillXp = useWorldStore((s) => s.lifeSkillXp);
  const learnedRecipeIds = useWorldStore((s) => s.learnedRecipeIds);
  const craftRecipe = useWorldStore((s) => s.craftRecipe);

  // Learned recipes filtered to this artisan's profession.
  const recipes: RecipeDef[] = learnedRecipeIds
    .map((id) => RECIPES_BY_ID.get(id))
    .filter((r): r is RecipeDef => !!r && r.skill === artisan.profession);

  if (recipes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-3 text-center">
        ท่านยังไม่ได้เรียนสูตรของ
        {LIFE_SKILL_LABEL[artisan.profession]}
        — ดูที่แท็บ &quot;ซื้อสูตร&quot;
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {recipes.map((r) => (
        <RecipeRow
          key={r.id}
          recipe={r}
          inventory={inventory}
          masteryLv={r.skill ? masteryLevel(lifeSkillXp[r.skill] ?? 0) : MAX_MASTERY}
          onCraft={() => {
            flashLoading("กำลังประดิษฐ์...");
            const res = craftRecipe(r.id);
            if (!res.ok) {
              toast(
                "error",
                res.reason === "missing-input"
                  ? "วัตถุดิบไม่ครบ"
                  : res.reason === "missing-mastery"
                    ? "มาสเตอร์รี่ยังไม่ถึงระดับที่กำหนด"
                    : res.reason === "not-learned"
                      ? "ยังไม่ได้เรียนสูตรนี้"
                      : res.reason === "no-artisan"
                        ? "ที่นี่ไม่มีช่างที่เหมาะสม"
                        : "ไม่สามารถประดิษฐ์ได้",
              );
              return;
            }
            const out = getItem(res.outputItemId);
            if (res.dropCheck === "failed") {
              toast(
                "warn",
                `พลาดในขั้นตอนสุดท้าย — เสียวัตถุดิบ · +${res.xpGained} xp`,
              );
              return;
            }
            toast(
              "success",
              `สร้าง ${out?.name ?? res.outputItemId}×${res.outputCount} · +${res.xpGained} xp`,
            );
          }}
        />
      ))}
    </div>
  );
}

// Recipe row used inside the craft tab. Trimmed copy of the previous
// CraftingTab row from life-skills-popup — drop-check chance preview,
// material list with green/red chips, and a craft button.
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
  const successChance = recipe.usesDropCheck
    ? gatherSuccessChance(masteryLv, required)
    : null;

  return (
    <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <strong className="text-sm">{recipe.name}</strong>
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

// ─── ซื้อ-ขาย tab ─────────────────────────────────────────────────────
function TradeTab({ artisan }: { artisan: ArtisanDef }) {
  const gold = useWorldStore((s) => s.gold);
  const inventory = useWorldStore((s) => s.inventory);
  const buyItem = useWorldStore((s) => s.buyItem);
  const sellItem = useWorldStore((s) => s.sellItem);
  const [sub, setSub] = useState<"buy" | "sell">("buy");

  const accepts: readonly ItemCategory[] | undefined = artisan.acceptsCategories;
  const acceptsAll = !accepts || accepts.length === 0;

  const canSell = (cat: ItemCategory | undefined): boolean => {
    if (acceptsAll) return true;
    if (!cat) return false;
    return accepts!.includes(cat);
  };

  const sellable = Object.entries(inventory).filter(([id, n]) => {
    if (n <= 0) return false;
    const def = getItem(id);
    if (!def) return false;
    if ((def.price ?? 0) <= 0) return false;
    return canSell(def.category);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={sub === "buy" ? "default" : "outline"}
            className="h-7 text-[11px]"
            onClick={() => setSub("buy")}
          >
            ซื้อ
          </Button>
          <Button
            size="sm"
            variant={sub === "sell" ? "default" : "outline"}
            className="h-7 text-[11px]"
            onClick={() => setSub("sell")}
          >
            ขาย
          </Button>
        </div>
        <div>
          <span className="text-muted-foreground">ทอง </span>
          <strong className="text-amber-600">{gold}</strong>
        </div>
      </div>

      {!acceptsAll && (
        <div className="text-[10px] text-muted-foreground">
          รับซื้อเฉพาะหมวด:{" "}
          {accepts!.map((c) => ITEM_CATEGORY_LABEL[c]).join(" · ")}
        </div>
      )}

      {sub === "buy" ? (
        artisan.inventory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 text-center">
            ช่างคนนี้ไม่มีของขายในขณะนี้
          </p>
        ) : (
          <ul className="space-y-1.5">
            {artisan.inventory.map((id) => {
              const def = getItem(id);
              if (!def) return null;
              const price = def.price ?? 0;
              const canAfford = gold >= price;
              return (
                <li
                  key={id}
                  className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong>{def.name}</strong>
                      {def.category && (
                        <Badge variant="outline" className="text-[9px]">
                          {ITEM_CATEGORY_LABEL[def.category]}
                        </Badge>
                      )}
                    </div>
                    {def.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {def.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canAfford || price <= 0}
                    className="h-7 text-[11px] shrink-0"
                    onClick={() => {
                      const res = buyItem(id, 1);
                      if (!res.ok) {
                        toast("error", "ซื้อไม่สำเร็จ");
                        return;
                      }
                      toast("success", `ซื้อ ${def.name} (-${res.spent}🟡)`);
                    }}
                  >
                    {price}🟡
                  </Button>
                </li>
              );
            })}
          </ul>
        )
      ) : sellable.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3 text-center">
          ไม่มีของให้ขายในย่าม{!acceptsAll ? " (ตามหมวดที่ช่างรับ)" : ""}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {sellable.map(([id, n]) => {
            const def = getItem(id)!;
            const price = def.price ?? 0;
            const sellPrice = Math.floor(price * artisan.sellMultiplier);
            return (
              <li
                key={id}
                className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong>{def.name}</strong>
                    {def.category && (
                      <Badge variant="outline" className="text-[9px]">
                        {ITEM_CATEGORY_LABEL[def.category]}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px]">×{n}</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sellPrice <= 0}
                  className="h-7 text-[11px] shrink-0"
                  onClick={() => {
                    const res = sellItem(id, 1, artisan.sellMultiplier);
                    if (!res.ok) {
                      toast("error", "ขายไม่สำเร็จ");
                      return;
                    }
                    toast("success", `ขาย ${def.name} (+${res.gained}🟡)`);
                  }}
                >
                  +{sellPrice}🟡
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
