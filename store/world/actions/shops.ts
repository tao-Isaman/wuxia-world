// Shops, sect halls and artisans: buying and selling, recipes, equipment in and out of the bag.
import { getArt, getEquip, getSkill } from "@/lib/game";
import { ENHANCE_STONE, enhanceCheck, gainGear, gearProfession, getArtisansAt, getItem, getRecipe, gearSellPrice, reforgeCheck, rerollGear, rollEnhance } from "@/lib/world";
import { affixParts, gearEnhance, gearName } from "@/lib/game";
import { staminaForHours } from "../lifecycle";
import { ACTION_HOURS } from "../rules";
import { rollLukXp } from "../progression";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const shopsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "buyItem" | "sellItem" | "sellGear" | "buyMoveSkill" | "buyInnerSkill" | "buyRecipe" | "buyEquipment" | "equipFromBag" | "unequipFromSlot" | "reforgeGear" | "enhanceGear"> => ({
  buyItem: (itemId, count) => {
    if (count <= 0) return { ok: false, reason: "unknown" };
    const s = get();
    const def = getItem(itemId);
    if (!def) return { ok: false, reason: "unknown" };
    const price = def.price ?? 0;
    if (price <= 0) return { ok: false, reason: "not-for-sale" };
    const total = price * count;
    if (s.gold < total) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= total;
    draft.inventory[itemId] = (draft.inventory[itemId] ?? 0) + count;
    rollLukXp(draft);
    appendActionLog(draft, "buy", `ซื้อ ${def.name}×${count} · -${total}🟡`);
    set({ ...draft });
    return { ok: true, itemId, count, spent: total };
  },

  sellItem: (itemId, count, sellMultiplier) => {
    if (count <= 0) return { ok: false, reason: "unknown" };
    const s = get();
    const def = getItem(itemId);
    if (!def) return { ok: false, reason: "unknown" };
    const price = def.price ?? 0;
    if (price <= 0) return { ok: false, reason: "unsellable" };
    const have = s.inventory[itemId] ?? 0;
    if (have < count) return { ok: false, reason: "missing" };
    const draft = draftFrom(s);
    const remaining = have - count;
    if (remaining <= 0) delete draft.inventory[itemId];
    else draft.inventory[itemId] = remaining;
    const gained = Math.floor(price * sellMultiplier) * count;
    draft.gold = Math.max(0, draft.gold + gained);
    rollLukXp(draft);
    appendActionLog(draft, "sell", `ขาย ${def.name}×${count} · +${gained}🟡`);
    set({ ...draft });
    return { ok: true, itemId, count, gained };
  },

  sellGear: (key, sellMultiplier) => {
    const s = get();
    if (!getEquip(key)) return { ok: false, reason: "unknown" };
    if ((s.inventoryEquipment[key] ?? 0) <= 0) return { ok: false, reason: "missing" };
    const gained = gearSellPrice(key, sellMultiplier);
    if (gained <= 0) return { ok: false, reason: "unsellable" };
    const draft = draftFrom(s);
    const bag = { ...draft.inventoryEquipment };
    if (bag[key]! <= 1) delete bag[key];
    else bag[key] = bag[key]! - 1;
    draft.inventoryEquipment = bag;
    draft.gold = Math.max(0, draft.gold + gained);
    rollLukXp(draft);
    appendActionLog(draft, "sell", `ขาย ${gearName(key)} · +${gained}🟡`);
    set({ ...draft });
    return { ok: true, itemId: key, count: 1, gained };
  },

  buyMoveSkill: (skillId, price) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "unknown" };
    const sk = getSkill(skillId);
    if (!sk) return { ok: false, reason: "unknown" };
    if ((s.playerBuild.learnedSkillIds ?? []).includes(skillId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    const cur = draft.playerBuild!.learnedSkillIds ?? [];
    const slots = [...draft.playerBuild!.skillIds];
    if (!slots.includes(skillId)) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null) { slots[i] = skillId; break; }
      }
    }
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedSkillIds: [...cur, skillId],
      skillIds: slots,
    };
    rollLukXp(draft);
    appendActionLog(draft, "learn", `เรียน ${sk.n} (กระบวนท่า) · -${price}🟡`);
    set({ ...draft });
    return { ok: true, id: skillId, spent: price };
  },

  buyInnerSkill: (artId, price) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "unknown" };
    if ((s.playerBuild.learnedArtIds ?? []).includes(artId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    const curArts = draft.playerBuild!.learnedArtIds ?? [];
    const levels = { ...(draft.playerBuild!.artLevels ?? {}) };
    const slots = [...draft.playerBuild!.skillIds];
    const slotEntry = `art:${artId}`;
    if (!slots.includes(slotEntry)) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null) { slots[i] = slotEntry; break; }
      }
    }
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedArtIds: [...curArts, artId],
      artLevels: { ...levels, [artId]: levels[artId] ?? 1 },
      skillIds: slots,
    };
    rollLukXp(draft);
    const artDef = getArt(artId);
    appendActionLog(draft, "learn", `เรียน ${artDef?.n ?? artId} (ลมปราณ) · -${price}🟡`);
    set({ ...draft });
    return { ok: true, id: artId, spent: price };
  },

  buyRecipe: (recipeId, price) => {
    const s = get();
    const r = getRecipe(recipeId);
    if (!r) return { ok: false, reason: "unknown" };
    if (s.learnedRecipeIds.includes(recipeId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    draft.learnedRecipeIds = [...draft.learnedRecipeIds, recipeId];
    rollLukXp(draft);
    appendActionLog(draft, "learn", `เรียนสูตร ${r.name} · -${price}🟡`);
    set({ ...draft });
    return { ok: true, recipeId, spent: price };
  },

  buyEquipment: (equipId, price) => {
    const s = get();
    const e = getEquip(equipId);
    if (!e) return { ok: false, reason: "unknown" };
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    // Every piece gained rolls its options (lib/game/gear.ts).
    const key = gainGear(draft, equipId);
    rollLukXp(draft);
    const opts = affixParts(key);
    appendActionLog(draft, "buy", `ซื้อ ${e.n} · -${price}🟡${opts.length ? ` · ${opts.join(" · ")}` : ""}`);
    set({ ...draft });
    return { ok: true, equipId: key, spent: price };
  },

  equipFromBag: (equipId) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const e = getEquip(equipId);
    if (!e) return { ok: false, reason: "unknown" };
    if ((s.inventoryEquipment[equipId] ?? 0) < 1) {
      return { ok: false, reason: "missing" };
    }

    const draft = draftFrom(s);
    const eq = { ...draft.playerBuild!.equipment };
    const ty = e.ty;
    let chosenIdx = 0;
    let swapped: string | null = null;

    // Multi-slot types: prefer the first empty slot, else swap into
    // index 0 and push the displaced id back to the bag.
    if (ty === "BR" || ty === "R" || ty === "C") {
      const arr = [...eq[ty]] as [string | null, string | null];
      const emptyIdx = arr.findIndex((v) => v === null);
      chosenIdx = emptyIdx === -1 ? 0 : emptyIdx;
      if (arr[chosenIdx] !== null) swapped = arr[chosenIdx];
      arr[chosenIdx] = equipId;
      eq[ty] = arr;
    } else {
      // Single-slot types — direct swap.
      if (eq[ty] !== null) swapped = eq[ty];
      eq[ty] = equipId;
    }

    draft.playerBuild = { ...draft.playerBuild!, equipment: eq };

    // Pull one copy out of the bag; push any displaced id back.
    const bag = { ...draft.inventoryEquipment };
    const remain = (bag[equipId] ?? 0) - 1;
    if (remain <= 0) delete bag[equipId];
    else bag[equipId] = remain;
    if (swapped) bag[swapped] = (bag[swapped] ?? 0) + 1;
    draft.inventoryEquipment = bag;

    const swappedDef = swapped ? getEquip(swapped) : null;
    appendActionLog(
      draft,
      "use",
      swapped
        ? `ติดตั้ง ${e.n} (เก็บ ${swappedDef?.n ?? swapped} กลับย่าม)`
        : `ติดตั้ง ${e.n}`,
    );
    set({ ...draft });
    return {
      ok: true,
      equipId,
      slotType: ty,
      slotIdx: chosenIdx,
      swapped,
    };
  },

  unequipFromSlot: (slotType, slotIdx) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const idx = (slotIdx ?? 0) as 0 | 1;
    const eq = { ...s.playerBuild.equipment };
    let cur: string | null = null;
    if (slotType === "BR" || slotType === "R" || slotType === "C") {
      cur = eq[slotType][idx];
    } else {
      cur = eq[slotType];
    }
    if (!cur) return { ok: false, reason: "empty" };
    const e = getEquip(cur);
    if (!e) return { ok: false, reason: "unknown" };

    const draft = draftFrom(s);
    const next = { ...draft.playerBuild!.equipment };
    if (slotType === "BR" || slotType === "R" || slotType === "C") {
      const arr = [...next[slotType]] as [string | null, string | null];
      arr[idx] = null;
      next[slotType] = arr;
    } else {
      next[slotType] = null;
    }
    draft.playerBuild = { ...draft.playerBuild!, equipment: next };
    draft.inventoryEquipment[cur] =
      (draft.inventoryEquipment[cur] ?? 0) + 1;
    appendActionLog(draft, "use", `ถอด ${e.n} เก็บลงย่าม`);
    set({ ...draft });
    return { ok: true, equipId: cur, slotType, slotIdx: idx };
  },

  reforgeGear: (key, worn) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const def = getEquip(key);
    if (!def) return { ok: false, reason: "unknown" };
    // The shop of the piece's own line, here.
    const profession = gearProfession(def);
    if (!getArtisansAt(s.currentSceneId).some((a) => a.profession === profession)) return { ok: false, reason: "no-artisan" };
    const check = reforgeCheck(s, profession, key);
    if (!check.ok) return { ok: false, reason: check.reason ?? "unknown" };
    const eq = s.playerBuild.equipment;
    const wornKey = worn ? (worn.ty === "BR" || worn.ty === "R" || worn.ty === "C" ? eq[worn.ty][worn.idx] : eq[worn.ty]) : null;
    if (worn ? wornKey !== key : (s.inventoryEquipment[key] ?? 0) < 1) return { ok: false, reason: "not-owned" };

    const draft = draftFrom(s);
    const material = check.material!;
    const left = (draft.inventory[material] ?? 0) - 1;
    if (left <= 0) delete draft.inventory[material];
    else draft.inventory[material] = left;
    draft.stamina = Math.max(0, draft.stamina - staminaForHours(ACTION_HOURS));
    const next = rerollGear(key);
    if (worn) {
      const loadout = { ...draft.playerBuild!.equipment };
      if (worn.ty === "BR" || worn.ty === "R" || worn.ty === "C") {
        const arr = [...loadout[worn.ty]] as [string | null, string | null];
        arr[worn.idx] = next;
        loadout[worn.ty] = arr;
      } else {
        loadout[worn.ty] = next;
      }
      draft.playerBuild = { ...draft.playerBuild!, equipment: loadout };
    } else {
      const bag = { ...draft.inventoryEquipment };
      if ((bag[key] ?? 0) <= 1) delete bag[key];
      else bag[key] = bag[key]! - 1;
      bag[next] = (bag[next] ?? 0) + 1;
      draft.inventoryEquipment = bag;
    }
    const opts = affixParts(next);
    appendActionLog(draft, "craft", `สุ่มออฟชั่นเสริม ${def.n} ใหม่ · ใช้${getItem(material)?.name ?? material} · ${opts.length ? opts.join(" · ") : "ไม่ได้ออฟชั่น"}`);
    set({ ...draft });
    return { ok: true, before: key, key: next, material };
  },

  enhanceGear: (key, worn) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const def = getEquip(key);
    if (!def) return { ok: false, reason: "unknown" };
    const profession = gearProfession(def);
    if (!getArtisansAt(s.currentSceneId).some((a) => a.profession === profession)) return { ok: false, reason: "no-artisan" };
    const check = enhanceCheck(s, profession, s.currentSceneId, key);
    if (!check.ok) return { ok: false, reason: check.reason ?? "unknown" };
    const eq = s.playerBuild.equipment;
    const wornKey = worn ? (worn.ty === "BR" || worn.ty === "R" || worn.ty === "C" ? eq[worn.ty][worn.idx] : eq[worn.ty]) : null;
    if (worn ? wornKey !== key : (s.inventoryEquipment[key] ?? 0) < 1) return { ok: false, reason: "not-owned" };

    const draft = draftFrom(s);
    const stones = check.stones!;
    const left = (draft.inventory[ENHANCE_STONE] ?? 0) - stones;
    if (left <= 0) delete draft.inventory[ENHANCE_STONE];
    else draft.inventory[ENHANCE_STONE] = left;
    draft.stamina = Math.max(0, draft.stamina - staminaForHours(ACTION_HOURS));
    const { outcome, key: next } = rollEnhance(key);
    if (worn) {
      const loadout = { ...draft.playerBuild!.equipment };
      if (worn.ty === "BR" || worn.ty === "R" || worn.ty === "C") {
        const arr = [...loadout[worn.ty]] as [string | null, string | null];
        arr[worn.idx] = next;
        loadout[worn.ty] = arr;
      } else {
        loadout[worn.ty] = next;
      }
      draft.playerBuild = { ...draft.playerBuild!, equipment: loadout };
    } else {
      const bag = { ...draft.inventoryEquipment };
      if ((bag[key] ?? 0) <= 1) delete bag[key];
      else bag[key] = bag[key]! - 1;
      if (next) bag[next] = (bag[next] ?? 0) + 1;
      draft.inventoryEquipment = bag;
    }
    const level = next ? gearEnhance(next) : 0;
    const text = outcome === "success" ? `เสริมพลังสำเร็จ · ${gearName(next)}`
      : outcome === "down" ? `เสริมพลังล้มเหลว · ลดเหลือ ${gearName(next)}`
      : outcome === "broken" ? `เสริมพลังล้มเหลว · ${gearName(key)} แตกสลาย`
      : `เสริมพลังล้มเหลว · ${gearName(key)} คงเดิม`;
    appendActionLog(draft, "craft", `${text} · ใช้${getItem(ENHANCE_STONE)?.name ?? ENHANCE_STONE} ×${stones}`);
    set({ ...draft });
    return { ok: true, outcome, before: key, key: next, level, stones };
  },
});
