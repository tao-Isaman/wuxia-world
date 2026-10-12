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
  equipmentOfferedBy,
  gatherSuccessChance,
  getItem,
  getRecipe,
  masteryLevel,
  recipesOfferedBy,
  REFORGE_MIN_LEVEL,
  SPIRIT_STONE,
  SPIRIT_THREAD,
  reforgeCheck,
  reforgeablePieces,
  recipeOutputName,
  ENHANCE_MIN_LEVEL,
  ENHANCE_STONE,
  enhanceCheck,
  isEnhanceTown,
  type ArtisanDef,
  type ItemCategory,
  type RecipeDef,
} from "@/lib/world";
import { ENHANCE_MAX, SLOT_LABELS, affixParts, enhanceParts, equipStatParts, gearName, getEquip, parseGear } from "@/lib/game";
import { confirmDialog } from "@/store/confirm-store";
import { GearAffixList } from "@/components/game/gear-affixes";
import { equipmentIconUrl, itemIconUrl } from "@/lib/world/data/item-icons";
import { useWorldStore } from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { lifeSkillPose } from "@/lib/characters/hero-actions";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  artisan: ArtisanDef | null;
  onClose: () => void;
}

type Tab = "learn" | "craft" | "trade" | "reforge" | "enhance";

// The crafts whose shops re-roll gear options (lib/world/gear.ts).
const GEAR_CRAFTS = new Set(["forge", "tailoring", "jewelry", "accessory"]);

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
          {GEAR_CRAFTS.has(artisan.profession) && (
            <Button
              size="sm"
              variant={tab === "reforge" ? "default" : "ghost"}
              className="text-xs h-7"
              onClick={() => setTab("reforge")}
              data-testid="artisan-tab-reforge"
            >
              ✦ สุ่มออฟชั่น
            </Button>
          )}
          {GEAR_CRAFTS.has(artisan.profession) && (
            <Button
              size="sm"
              variant={tab === "enhance" ? "default" : "ghost"}
              className="text-xs h-7"
              onClick={() => setTab("enhance")}
              data-testid="artisan-tab-enhance"
            >
              ⚒ เสริมพลัง
            </Button>
          )}
        </div>

        {tab === "learn" && <LearnTab artisan={artisan} />}
        {tab === "craft" && <CraftTab artisan={artisan} />}
        {tab === "trade" && <TradeTab artisan={artisan} />}
        {tab === "reforge" && GEAR_CRAFTS.has(artisan.profession) && <ReforgeTab artisan={artisan} />}
        {tab === "enhance" && GEAR_CRAFTS.has(artisan.profession) && <EnhanceTab artisan={artisan} />}
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
            flashLoading("กำลังประดิษฐ์...", undefined, "work", lifeSkillPose(r.skill));
            const res = craftRecipe(r.id);
            if (!res.ok) {
              toast(
                "error",
                res.reason === "missing-input"
                  ? "วัตถุดิบไม่ครบ"
                  : res.reason === "missing-mastery"
                    ? "ความชำนาญยังไม่ถึงระดับที่กำหนด"
                    : res.reason === "not-learned"
                      ? "ยังไม่ได้เรียนสูตรนี้"
                      : res.reason === "no-artisan"
                        ? "ที่นี่ไม่มีช่างที่เหมาะสม"
                        : "ไม่สามารถประดิษฐ์ได้",
              );
              return;
            }
            if (res.dropCheck === "failed") {
              toast(
                "warn",
                `พลาดในขั้นตอนสุดท้าย — เสียวัตถุดิบ · +${res.xpGained} ประสบการณ์`,
              );
              return;
            }
            toast(
              "success",
              `สร้าง ${res.outputName}×${res.outputCount}${res.outputEquipKey ? ` · ${affixParts(res.outputEquipKey).join(" · ") || "ไม่มีออฟชั่นเสริม"}` : ""} · +${res.xpGained} ประสบการณ์`,
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
          {recipeOutputName(recipe)} ×{recipe.output.count}
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
  const buyEquipment = useWorldStore((s) => s.buyEquipment);
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

  // Equipment-for-sale list — folded from the artisan's specialty list +
  // the basic profession roster. Helper lives in lib/world/data/artisans.
  const equipOffers = equipmentOfferedBy(artisan);

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
        <div className="space-y-3">
          {equipOffers.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                อุปกรณ์
              </div>
              <ul className="space-y-1.5">
                {equipOffers.map((offer) => {
                  const e = getEquip(offer.equipId);
                  if (!e) return null;
                  const canAfford = gold >= offer.price;
                  return (
                    <li
                      key={offer.equipId}
                      className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong>{e.n}</strong>
                          <Badge variant="outline" className="text-[9px]">
                            {SLOT_LABELS[e.ty]}
                          </Badge>
                          {equipStatParts(e).map((part) => (
                            <Badge key={part} variant="outline" className="text-[9px]">
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canAfford}
                        className="h-7 text-[11px] shrink-0"
                        onClick={() => {
                          const res = buyEquipment(offer.equipId, offer.price);
                          if (!res.ok) {
                            toast(
                              "error",
                              res.reason === "no-gold"
                                ? "ทองไม่พอ"
                                : "ซื้ออุปกรณ์ไม่สำเร็จ",
                            );
                            return;
                          }
                          const opts = affixParts(res.equipId);
                          toast("success", `ซื้อ ${e.n} (-${res.spent}🟡)${opts.length ? ` · ✦ ${opts.join(" · ")}` : " · ไม่มีออฟชั่นเสริม"}`);
                        }}
                      >
                        {offer.price}🟡
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
              ของในร้าน
            </div>
            {artisan.inventory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2 text-center">
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
        )}
          </div>
        </div>
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

/* eslint-disable @next/next/no-img-element -- the re-roll tab's small pixel-art icons, no optimisation wanted */
// ─── สุ่มออฟชั่น tab ─────────────────────────────────────────────────
// Re-roll a piece's random options (lib/world/gear.ts): only this craft's own
// pieces, worn or in the bag; one หินศิลาวิเศษ (weapons, rings, charms) or
// ด้ายศิลาวิเศษ (robes, hats, boots, bracers) each time, and the hero's own
// skill in this craft at level 3 or more.
function ReforgeTab({ artisan }: { artisan: ArtisanDef }) {
  const inventory = useWorldStore((s) => s.inventory);
  const inventoryEquipment = useWorldStore((s) => s.inventoryEquipment);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  const lifeSkillXp = useWorldStore((s) => s.lifeSkillXp);
  const reforgeGear = useWorldStore((s) => s.reforgeGear);
  const [last, setLast] = useState<string | null>(null);
  const prof = artisan.profession;
  const level = masteryLevel(lifeSkillXp[prof] ?? 0);
  const pieces = reforgeablePieces({ inventoryEquipment, playerBuild }, prof);
  const stones = inventory[SPIRIT_STONE] ?? 0;
  const threads = inventory[SPIRIT_THREAD] ?? 0;

  return (
    <div className="space-y-2" data-testid="artisan-reforge">
      <div className="rounded bg-muted/30 px-3 py-2 text-xs space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span>
            {LIFE_SKILL_ICON[prof]} ฝีมือ{LIFE_SKILL_LABEL[prof]}ของท่าน{" "}
            <strong className={level >= REFORGE_MIN_LEVEL ? "text-emerald-700" : "text-red-700"}>ขั้น {level}/{MAX_MASTERY}</strong>
            {level < REFORGE_MIN_LEVEL && <> · ต้องถึงขั้น {REFORGE_MIN_LEVEL} จึงสุ่มออฟชั่นได้</>}
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><img src={itemIconUrl(SPIRIT_STONE)} alt="" width={18} height={18} /> {getItem(SPIRIT_STONE)?.name} ×{stones}</span>
            <span className="inline-flex items-center gap-1"><img src={itemIconUrl(SPIRIT_THREAD)} alt="" width={18} height={18} /> {getItem(SPIRIT_THREAD)?.name} ×{threads}</span>
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          สุ่มออฟชั่นเสริมทั้งชุดใหม่ ใช้วัตถุดิบ 1 ชิ้นต่อครั้ง · อาวุธ แหวน เครื่องประดับใช้หินศิลาวิเศษ · เสื้อ หมวก รองเท้า ปลอกแขนใช้ด้ายศิลาวิเศษ · ได้จากศัตรูขั้นลับขึ้นไป
        </p>
      </div>
      {last && <p className="text-xs rounded bg-emerald-50 text-emerald-800 px-3 py-1.5" role="status">{last}</p>}
      {pieces.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3 text-center">ท่านไม่มีอุปกรณ์ที่ช่างคนนี้สุ่มออฟชั่นให้ได้</p>
      ) : (
        <ul className="space-y-1.5">
          {pieces.map(({ key, worn }, i) => {
            const e = getEquip(key);
            if (!e) return null;
            const check = reforgeCheck({ inventory, lifeSkillXp }, prof, key);
            const material = getItem(check.material ?? "")?.name ?? "";
            const why =
              check.reason === "low-skill" ? `ฝีมือต้องถึงขั้น ${REFORGE_MIN_LEVEL}` :
              check.reason === "no-material" ? `ไม่มี${material}` : null;
            return (
              <li key={`${worn ? `${worn.ty}${worn.idx}` : "bag"}:${key}:${i}`} className="rounded bg-muted/30 px-2 py-1.5 text-xs space-y-1" data-reforge-key={key}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src={equipmentIconUrl(key)} alt="" width={24} height={24} />
                    <strong className="truncate">{gearName(key)}</strong>
                    <Badge variant="outline" className="text-[9px]">{SLOT_LABELS[e.ty]}</Badge>
                    {worn && <Badge variant="outline" className="text-[9px]">สวมอยู่</Badge>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!check.ok}
                    title={why ?? undefined}
                    className="h-7 text-[11px] shrink-0"
                    data-testid="reforge-button"
                    onClick={() => {
                      const res = reforgeGear(key, worn);
                      if (!res.ok) {
                        toast("error", res.reason === "low-skill" ? `ฝีมือต้องถึงขั้น ${REFORGE_MIN_LEVEL}` : res.reason === "no-material" ? `ไม่มี${material}` : "สุ่มออฟชั่นไม่สำเร็จ");
                        return;
                      }
                      const opts = affixParts(res.key);
                      const text = `${gearName(res.key)}: ${opts.length ? opts.join(" · ") : "ไม่ได้ออฟชั่นเสริม"}`;
                      setLast(`✦ ${text}`);
                      flashLoading(`ช่างกำลังหลอม ${e.n}…`, 900, "work", lifeSkillPose(prof));
                      toast("success", `สุ่มออฟชั่นใหม่ · ${text}`);
                    }}
                  >
                    ✦ สุ่มใหม่ · {material} 1
                  </Button>
                </div>
                <GearAffixList gearKey={key} />
                {why && <p className="text-[10px] text-red-700">{why}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── เสริมพลัง tab ───────────────────────────────────────────────────
// Enhance a piece +1…+10 (lib/world/gear.ts): this craft's own pieces, worn
// or in the bag, in a city, with the craft at level 3+, for ศิลาเสริมพลัง.
// Aiming at +6–8 a failure drops a level; at +9–10 the piece breaks — the
// shop asks before either.
function EnhanceTab({ artisan }: { artisan: ArtisanDef }) {
  const inventory = useWorldStore((s) => s.inventory);
  const inventoryEquipment = useWorldStore((s) => s.inventoryEquipment);
  const playerBuild = useWorldStore((s) => s.playerBuild);
  const lifeSkillXp = useWorldStore((s) => s.lifeSkillXp);
  const enhanceGear = useWorldStore((s) => s.enhanceGear);
  const [last, setLast] = useState<{ text: string; good: boolean } | null>(null);
  const prof = artisan.profession;
  const level = masteryLevel(lifeSkillXp[prof] ?? 0);
  const inCity = isEnhanceTown(artisan.locationId);
  const pieces = reforgeablePieces({ inventoryEquipment, playerBuild }, prof);
  const stones = inventory[ENHANCE_STONE] ?? 0;

  return (
    <div className="space-y-2" data-testid="artisan-enhance">
      <div className="rounded bg-muted/30 px-3 py-2 text-xs space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span>
            {LIFE_SKILL_ICON[prof]} ฝีมือ{LIFE_SKILL_LABEL[prof]}ของท่าน{" "}
            <strong className={level >= ENHANCE_MIN_LEVEL ? "text-emerald-700" : "text-red-700"}>ขั้น {level}/{MAX_MASTERY}</strong>
            {level < ENHANCE_MIN_LEVEL && <> · ต้องถึงขั้น {ENHANCE_MIN_LEVEL}</>}
          </span>
          <span className="inline-flex items-center gap-1"><img src={itemIconUrl(ENHANCE_STONE)} alt="" width={18} height={18} /> {getItem(ENHANCE_STONE)?.name} ×{stones}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          เสริมพลังได้ถึง +{ENHANCE_MAX} · +1–5 พลาดไม่เสียอะไร · +6–8 พลาดลดลง 1 ขั้น · +9–10 พลาดแล้วอุปกรณ์แตกสลาย
          {!inCity && <strong className="text-red-700"> · เสริมพลังได้เฉพาะร้านในเมือง</strong>}
        </p>
      </div>
      {last && <p className={`text-xs rounded px-3 py-1.5 ${last.good ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`} role="status">{last.text}</p>}
      {pieces.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3 text-center">ท่านไม่มีอุปกรณ์ที่ช่างคนนี้เสริมพลังให้ได้</p>
      ) : (
        <ul className="space-y-1.5">
          {pieces.map(({ key, worn }, i) => {
            const g = parseGear(key);
            if (!g) return null;
            const check = enhanceCheck({ inventory, lifeSkillXp }, prof, artisan.locationId, key);
            const target = check.target ?? g.enhance + 1;
            const why =
              check.reason === "max" ? "เสริมพลังเต็มแล้ว" :
              check.reason === "not-city" ? "ต้องเสริมพลังที่ร้านในเมือง" :
              check.reason === "low-skill" ? `ฝีมือต้องถึงขั้น ${ENHANCE_MIN_LEVEL}` :
              check.reason === "no-stone" ? `ศิลาเสริมพลังไม่พอ (ต้องใช้ ${check.stones})` : null;
            const now = enhanceParts(g.def.ty, g.enhance);
            const next = g.enhance < ENHANCE_MAX ? enhanceParts(g.def.ty, target) : [];
            return (
              <li key={`${worn ? `${worn.ty}${worn.idx}` : "bag"}:${key}:${i}`} className="rounded bg-muted/30 px-2 py-1.5 text-xs space-y-1" data-enhance-key={key}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src={equipmentIconUrl(key)} alt="" width={24} height={24} />
                    <strong className="truncate">{gearName(key)}</strong>
                    <Badge variant="outline" className="text-[9px]">{SLOT_LABELS[g.def.ty]}</Badge>
                    {worn && <Badge variant="outline" className="text-[9px]">สวมอยู่</Badge>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!check.ok}
                    title={why ?? undefined}
                    className="h-7 text-[11px] shrink-0"
                    data-testid="enhance-button"
                    onClick={async () => {
                      if (check.failure === "break" && !(await confirmDialog({
                        title: "เสี่ยงแตกสลาย",
                        message: `เสริมพลัง ${gearName(key)} เป็น +${target} สำเร็จ ${Math.round((check.chance ?? 0) * 100)}% — ถ้าพลาด อุปกรณ์จะแตกสลายหายไปทันที`,
                        confirmText: "เสริมพลัง", variant: "danger",
                      }))) return;
                      if (check.failure === "down" && !(await confirmDialog({
                        title: "เสี่ยงลดขั้น",
                        message: `เสริมพลัง ${gearName(key)} เป็น +${target} สำเร็จ ${Math.round((check.chance ?? 0) * 100)}% — ถ้าพลาดจะลดลงเหลือ +${Math.max(0, g.enhance - 1)}`,
                        confirmText: "เสริมพลัง", variant: "warn",
                      }))) return;
                      const res = enhanceGear(key, worn);
                      if (!res.ok) { toast("error", "เสริมพลังไม่สำเร็จ"); return; }
                      flashLoading(`ช่างกำลังเสริมพลัง ${g.def.n}…`, 900, "work", lifeSkillPose(prof));
                      const text = res.outcome === "success" ? `สำเร็จ! ${gearName(res.key)}`
                        : res.outcome === "down" ? `ล้มเหลว · ลดเหลือ ${gearName(res.key)}`
                        : res.outcome === "broken" ? `ล้มเหลว · ${gearName(key)} แตกสลาย`
                        : `ล้มเหลว · ${gearName(key)} คงเดิม`;
                      setLast({ text, good: res.outcome === "success" });
                      toast(res.outcome === "success" ? "success" : res.outcome === "broken" ? "error" : "warn", `เสริมพลัง${text}`);
                    }}
                  >
                    ⚒ +{Math.min(ENHANCE_MAX, target)} · {Math.round((check.chance ?? 0) * 100)}% · ศิลา {check.stones}
                  </Button>
                </div>
                {now.length > 0 && <p className="text-[11px]">ตอนนี้: <span className="text-emerald-800">{now.join(" · ")}</span></p>}
                {next.length > 0 && <p className="text-[11px] text-muted-foreground">ถ้าได้ +{target}: {next.join(" · ")}
                  {check.failure === "down" && <span className="text-amber-700"> · พลาดลดขั้น</span>}
                  {check.failure === "break" && <span className="text-red-700"> · พลาดแตกสลาย</span>}</p>}
                {why && <p className="text-[10px] text-red-700">{why}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
