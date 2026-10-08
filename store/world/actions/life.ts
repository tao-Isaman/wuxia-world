// Life skills and the bag: gathering, crafting, using items, music, rest and place activities.
import { combinedStats, deriveAll, getArt, getEquip, getSkill, getMeridianChart } from "@/lib/game";
import { statFromLifeSkill, STAT_XP_PER_ACTION } from "@/lib/world/stat-progression";
import { applyEffects, gatherSuccessChance, getArtisansAt, getItem, getRecipe, getResource, masteryLevel } from "@/lib/world";
import { applyEffect, releaseFromJail } from "@/lib/world/effects";
import { absoluteHours, describeSentence, sentenceLeft } from "@/lib/world/law";
import { JAIL_SCENE_ID, getActivity, jailDiceChance, jailEscapeChance } from "@/lib/world/data/activities";
import { meridianReadBlock } from "@/lib/world/meridians";
import { ownSectAt } from "@/lib/world/data/sect-memberships";
import { staminaForHours } from "../lifecycle";
import { grantStatXp, rollLukXp } from "../progression";
import { ACTION_HOURS, ARTISAN_PROFESSIONS, CRAFT_XP_MULT, FAIL_XP_FRACTION, GATHER_XP_MULT, JAIL_ESCAPE_PENALTY_HOURS, JAIL_LABOR_HOURS, JAIL_MEDITATE_COOLDOWN, JAIL_MEDITATE_WEXP, MAX_DUMMY_LEVEL, PRACTICE_MUSIC_XP, REST_COOLDOWN_HOURS, REST_INN_COST, W_EXP_CRAFT, W_EXP_GATHER, W_EXP_PRACTICE_MUSIC, W_EXP_USE_ITEM } from "../rules";
import { rollResourceYield } from "../spoils";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const lifeActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "gatherResource" | "craftRecipe" | "useItem" | "practiceMusic" | "rest" | "doActivity"> => ({
  gatherResource: (resourceId) => {
    const s = get();
    const res = getResource(resourceId);
    if (!res) return { ok: false, reason: "unknown" };
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    if (s.stamina < res.staminaCost) return { ok: false, reason: "stamina" };

    // Hunting: spend stamina, queue a battle. Spoils land in
    // acknowledgeBattleResult on win.
    if (res.skill === "hunting" && res.opponentIds && res.opponentIds.length > 0) {
      const oppId =
        res.opponentIds[Math.floor(Math.random() * res.opponentIds.length)]!;
      const draft = draftFrom(s);
      draft.stamina = Math.max(0, draft.stamina - res.staminaCost);
      draft.pendingHuntYield = {
        resourceId: res.id,
        returnSceneId: s.currentSceneId,
      };
      draft.pendingBattle = {
        opponentId: oppId,
        onWin: s.currentSceneId,
        onLose: s.currentSceneId,
      };
      // Legacy flag: nothing reads it since encounters moved to walk ticks.
      draft.flags._skipEventRoll = true;
      set({ ...draft });
      return { ok: true, type: "battle", resourceId: res.id, opponentId: oppId };
    }

    // Non-combat: spend stamina, roll drop check + yield, grant xp.
    // Failed checks still give half xp — low-tier grinding is the
    // legitimate path to higher mastery. Begging-style activities pay
    // an extra stamina hit only when the drop check fails.
    const draft = draftFrom(s);
    draft.stamina = Math.max(0, draft.stamina - res.staminaCost);
    const lvl = masteryLevel(draft.lifeSkillXp[res.skill] ?? 0);
    const successChance = gatherSuccessChance(lvl, res.level);
    const yieldRoll = rollResourceYield(res, lvl);
    for (const it of yieldRoll.items) {
      draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
    }
    // Drop-check pass also pays out gold for begging / chess activities.
    if (yieldRoll.passed && res.goldYield) {
      const [g0, g1] = res.goldYield;
      const gold = g0 + Math.floor(Math.random() * Math.max(1, g1 - g0 + 1));
      draft.gold = Math.max(0, draft.gold + gold);
    }
    // Extra failure stamina cost (used by begging — botched approach
    // costs 2× the listed stamina total).
    if (!yieldRoll.passed && res.failureExtraStamina) {
      draft.stamina = Math.max(0, draft.stamina - res.failureExtraStamina);
    }
    const fullXp = GATHER_XP_MULT * res.level;
    const xpGained = yieldRoll.passed ? fullXp : Math.floor(fullXp * FAIL_XP_FRACTION);
    draft.lifeSkillXp[res.skill] = (draft.lifeSkillXp[res.skill] ?? 0) + xpGained;
    draft.wExp += W_EXP_GATHER;
    const statKey = statFromLifeSkill(res.skill);
    if (statKey) grantStatXp(draft, statKey, STAT_XP_PER_ACTION);
    rollLukXp(draft);
    // Build a one-liner for the toast/log.
    if (yieldRoll.passed) {
      const itemPart = yieldRoll.items.length > 0
        ? yieldRoll.items.map((it) => {
            const def = getItem(it.itemId);
            return `${def?.name ?? it.itemId}×${it.count}`;
          }).join(", ")
        : "ไม่ได้ของ";
      appendActionLog(draft, "gather", `เก็บ ${res.name}: ${itemPart} · +${xpGained} xp`);
    } else {
      appendActionLog(draft, "gather", `เก็บ ${res.name}: ลองมือไม่สำเร็จ · +${xpGained} xp`);
    }
    set({ ...draft });
    return {
      ok: true,
      type: "yield",
      resourceId: res.id,
      items: yieldRoll.items,
      xpGained,
      skill: res.skill,
      dropCheck: yieldRoll.passed ? "passed" : "failed",
      successChance,
    };
  },

  craftRecipe: (recipeId) => {
    const s = get();
    const r = getRecipe(recipeId);
    if (!r) return { ok: false, reason: "unknown" };

    // Artisan gating — the 6 craft professions (forge / alchemy /
    // tailoring / chef / jewelry / accessory) require:
    //   1. the recipe is in `learnedRecipeIds` (bought from an
    //      artisan)
    //   2. the player is currently at a location with an artisan
    //      whose profession matches recipe.skill
    // Other recipes (gathering-derived, drawing/writing) keep the
    // legacy "craft inline anywhere" behavior — they were never
    // shop-gated and the user's redesign explicitly targeted the
    // craftsman shops.
    const skill = r.skill;
    if (skill && ARTISAN_PROFESSIONS.has(skill)) {
      if (!s.learnedRecipeIds.includes(recipeId)) {
        return { ok: false, reason: "not-learned" };
      }
      const here = getArtisansAt(s.currentSceneId);
      const matching = here.find((a) => a.profession === skill);
      if (!matching) return { ok: false, reason: "no-artisan" };
    }

    // Mastery gate — recipes can require a minimum mastery level on
    // their `skill`. Below the threshold we refuse the attempt before
    // touching the inventory.
    const required = r.requiredMastery ?? 1;
    const masteryLv = skill ? masteryLevel(s.lifeSkillXp[skill] ?? 0) : MAX_DUMMY_LEVEL;
    if (skill && masteryLv < required) {
      return { ok: false, reason: "missing-mastery" };
    }

    for (const inp of r.inputs) {
      if ((s.inventory[inp.itemId] ?? 0) < inp.count) {
        return { ok: false, reason: "missing-input" };
      }
    }

    const draft = draftFrom(s);
    draft.stamina = Math.max(0, draft.stamina - staminaForHours(ACTION_HOURS));
    // Inputs are consumed regardless of drop-check outcome — failed
    // craft = ingredients lost, success = ingredients lost + output.
    for (const inp of r.inputs) {
      const cur = draft.inventory[inp.itemId] ?? 0;
      const next = cur - inp.count;
      if (next <= 0) delete draft.inventory[inp.itemId];
      else draft.inventory[inp.itemId] = next;
    }

    let dropCheck: "passed" | "failed" | "none" = "none";
    let outputProduced = false;
    if (r.usesDropCheck) {
      const passed = Math.random() < gatherSuccessChance(masteryLv, required);
      dropCheck = passed ? "passed" : "failed";
      outputProduced = passed;
    } else {
      outputProduced = true;
    }

    if (outputProduced) {
      draft.inventory[r.output.itemId] =
        (draft.inventory[r.output.itemId] ?? 0) + r.output.count;
    }

    // XP scales with recipe required mastery; failed drop-checks still
    // teach you something (half xp).
    const fullXp = CRAFT_XP_MULT * required;
    const xpGained = dropCheck === "failed" ? Math.floor(fullXp * FAIL_XP_FRACTION) : fullXp;
    if (skill) {
      draft.lifeSkillXp[skill] = (draft.lifeSkillXp[skill] ?? 0) + xpGained;
    }
    draft.wExp += W_EXP_CRAFT;
    // Hard crafts → DEX, cultural recipes (drawing / writing) → INT.
    const craftStat = statFromLifeSkill(skill);
    if (craftStat) grantStatXp(draft, craftStat, STAT_XP_PER_ACTION);
    rollLukXp(draft);
    const outDef = getItem(r.output.itemId);
    if (dropCheck === "failed") {
      appendActionLog(draft, "craft", `ประดิษฐ์ ${r.name}: พลาด · +${xpGained} xp`);
    } else {
      appendActionLog(
        draft,
        "craft",
        `ประดิษฐ์ ${outDef?.name ?? r.output.itemId}×${r.output.count} · +${xpGained} xp`,
      );
    }
    set({ ...draft });
    return {
      ok: true,
      recipeId: r.id,
      outputItemId: r.output.itemId,
      outputCount: outputProduced ? r.output.count : 0,
      xpGained,
      dropCheck,
    };
  },

  useItem: (itemId) => {
    const s = get();
    const def = getItem(itemId);
    if (!def) return { ok: false, reason: "unknown" };
    if ((s.inventory[itemId] ?? 0) <= 0) return { ok: false, reason: "missing" };
    if (!def.use) return { ok: false, reason: "no-effect" };

    // Pre-flight for heal items: refuse if both targets are already at
    // max so the player doesn't waste a potion.
    if (def.use.t === "heal") {
      if (!s.playerBuild) return { ok: false, reason: "no-build" };
      const d = deriveAll(s.playerBuild);
      const hpRoom = Math.max(0, d.HP - s.currentHp);
      const mpRoom = Math.max(0, d.MP - s.currentMp);
      const staminaRoom = Math.max(0, s.staminaMax - s.stamina);
      const wantsHp = (def.use.hp ?? 0) > 0 || (def.use.hpPct ?? 0) > 0;
      const wantsMp = (def.use.mp ?? 0) > 0 || (def.use.mpPct ?? 0) > 0;
      const wantsStamina = (def.use.stamina ?? 0) > 0;
      if ((!wantsHp || hpRoom === 0) && (!wantsMp || mpRoom === 0) && (!wantsStamina || staminaRoom === 0)) {
        return { ok: false, reason: "full" };
      }
    }

    // Pre-flight for ตำราวิชา (manual) items — refuse without consuming
    // when the player can't actually use it. Two failure modes:
    //   - already learned (don't waste the manual)
    //   - effective stat below the requirement (book stays in inventory)
    //
    // The stat check uses `combinedStats(playerBuild, undefined,
    // { excludeEquipment: true })[reqStat]` — i.e. base + slotted /
    // learned skill bonuses (level-scaled) + art bonuses + conflict,
    // but NOT equipment. Rationale: a player should earn higher-tier
    // manuals through training (skills + arts) rather than just
    // suiting up. Battle damage / derived combat stats keep equipment
    // included via the default `combinedStats` call.
    if (def.use.t === "manualLearnSkill" || def.use.t === "manualLearnArt") {
      if (!s.playerBuild) return { ok: false, reason: "no-build" };
      if (def.use.t === "manualLearnSkill") {
        const learned = s.playerBuild.learnedSkillIds ?? [];
        if (learned.includes(def.use.skillId)) {
          return { ok: false, reason: "already-learned", itemId };
        }
      } else {
        const learned = s.playerBuild.learnedArtIds ?? [];
        if (learned.includes(def.use.artId)) {
          return { ok: false, reason: "already-learned", itemId };
        }
      }
      const reqStat = def.use.reqStat;
      const reqValue = def.use.reqValue;
      const current =
        combinedStats(s.playerBuild, undefined, { excludeEquipment: true })[
          reqStat
        ] ?? 0;
      if (current < reqValue) {
        return { ok: false, reason: "stat-too-low", stat: reqStat, needed: reqValue, current };
      }
    }

    // แผนภาพชีพจร: readable only once every required skill / art is
    // learned, and only once. Refuses without consuming.
    if (def.use.t === "learnMeridian") {
      if (!s.playerBuild) return { ok: false, reason: "no-build" };
      const chart = getMeridianChart(def.use.chartId);
      if (!chart) return { ok: false, reason: "unknown" };
      if (s.playerBuild.meridians?.[chart.id]) return { ok: false, reason: "already-learned", itemId };
      const block = meridianReadBlock(chart, s.playerBuild);
      if (block) return { ok: false, reason: "meridian-locked", itemId, message: block };
    }

    const draft = draftFrom(s);
    // Consume one count.
    const cur = draft.inventory[itemId] ?? 0;
    if (cur <= 1) delete draft.inventory[itemId];
    else draft.inventory[itemId] = cur - 1;

    const eff = def.use;
    if (eff.t === "trainSkill") {
      draft.lifeSkillXp[eff.skill] = (draft.lifeSkillXp[eff.skill] ?? 0) + eff.xp;
      draft.wExp += W_EXP_USE_ITEM;
      // Cultural training items (book / song book / image / writing /
      // chess) feed INT through the same skill→stat map.
      const itemStat = statFromLifeSkill(eff.skill);
      if (itemStat) grantStatXp(draft, itemStat, STAT_XP_PER_ACTION);
      rollLukXp(draft);
      appendActionLog(draft, "use", `ใช้ ${def.name} · +${eff.xp} xp`);
      set({ ...draft });
      return { ok: true, kind: "trainSkill", itemId, skill: eff.skill, xpGained: eff.xp };
    }
    if (eff.t === "heal") {
      // playerBuild was checked above for heal items.
      const d = deriveAll(draft.playerBuild!);
      // Flat + % of max (potions scale with the hero); food also restores stamina.
      const hpAmount = Math.round((eff.hp ?? 0) + d.HP * (eff.hpPct ?? 0) / 100);
      const mpAmount = Math.round((eff.mp ?? 0) + d.MP * (eff.mpPct ?? 0) / 100);
      const hpHealed = hpAmount > 0 ? Math.max(0, Math.min(d.HP - draft.currentHp, hpAmount)) : 0;
      const mpHealed = mpAmount > 0 ? Math.max(0, Math.min(d.MP - draft.currentMp, mpAmount)) : 0;
      const staminaHealed = Math.max(0, Math.min(draft.staminaMax - draft.stamina, eff.stamina ?? 0));
      draft.currentHp = Math.min(d.HP, draft.currentHp + hpHealed);
      draft.currentMp = Math.min(d.MP, draft.currentMp + mpHealed);
      draft.stamina = Math.min(draft.staminaMax, draft.stamina + staminaHealed);
      rollLukXp(draft);
      const parts: string[] = [];
      if (hpHealed > 0) parts.push(`HP +${hpHealed}`);
      if (mpHealed > 0) parts.push(`MP +${mpHealed}`);
      if (staminaHealed > 0) parts.push(`พลัง +${staminaHealed}`);
      appendActionLog(draft, "use", `ใช้ ${def.name} · ${parts.join(" / ") || "ไม่มีพลังให้ฟื้น"}`);
      set({ ...draft });
      return { ok: true, kind: "heal", itemId, hpHealed, mpHealed };
    }
    if (eff.t === "manualLearnSkill") {
      // Pre-flight already verified player meets the stat req and
      // hasn't learned the skill — apply the learn effect, which also
      // auto-slots the skill (see lib/world/effects.ts).
      applyEffects(draft, [{ t: "learnSkill", skillId: eff.skillId }]);
      draft.wExp += W_EXP_USE_ITEM;
      appendActionLog(draft, "learn", `ฝึก ${def.name} · เรียนวิชา ${getSkill(eff.skillId)?.n ?? eff.skillId}`);
      set({ ...draft });
      return { ok: true, kind: "manualLearnSkill", itemId, skillId: eff.skillId };
    }
    if (eff.t === "manualLearnArt") {
      const lv = eff.level && eff.level >= 1 ? eff.level : 1;
      applyEffects(draft, [{ t: "learnArt", artId: eff.artId, level: lv }]);
      draft.wExp += W_EXP_USE_ITEM;
      appendActionLog(draft, "learn", `ฝึก ${def.name} · เรียนลมปราณ ${getArt(eff.artId)?.n ?? eff.artId}`);
      set({ ...draft });
      return { ok: true, kind: "manualLearnArt", itemId, artId: eff.artId, level: lv };
    }
    if (eff.t === "learnMeridian") {
      // Pre-flight verified the chart exists, isn't learned and its
      // requirements are met.
      const chart = getMeridianChart(eff.chartId)!;
      draft.playerBuild = {
        ...draft.playerBuild!,
        meridians: { ...(draft.playerBuild!.meridians ?? {}), [chart.id]: chart.nodes.map(() => 0) },
      };
      draft.wExp += W_EXP_USE_ITEM;
      appendActionLog(draft, "meridian", `อ่าน ${def.name} · เรียนรู้ชีพจร${chart.name} (${chart.nodes.length} จุด)`);
      set({ ...draft });
      return { ok: true, kind: "learnMeridian", itemId, chartId: chart.id };
    }
    // Unknown effect t — fall through; no xp granted but item consumed.
    set({ ...draft });
    return { ok: false, reason: "no-effect" };
  },

  practiceMusic: () => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const wId = s.playerBuild.equipment.W;
    const w = getEquip(wId);
    if (!w?.instrument) return { ok: false, reason: "no-instrument" };
    const draft = draftFrom(s);
    draft.stamina = Math.max(0, draft.stamina - staminaForHours(ACTION_HOURS));
    draft.lifeSkillXp.music = (draft.lifeSkillXp.music ?? 0) + PRACTICE_MUSIC_XP;
    draft.wExp += W_EXP_PRACTICE_MUSIC;
    // Music is a cultural action → INT.
    grantStatXp(draft, "INT", STAT_XP_PER_ACTION);
    rollLukXp(draft);
    set({ ...draft });
    return { ok: true, xpGained: PRACTICE_MUSIC_XP };
  },

  rest: (kind) => {
    const s = get();
    const max = s.staminaMax;
    let cost = 0;
    let pct = 0;
    if (kind === "home" || kind === "sect") {
      const here = kind === "home" ? s.currentSceneId === "home_player" : !!ownSectAt(s.sectMembership, s.currentSceneId);
      if (!here) return { ok: false, reason: "place" };
      pct = 1;
    } else if (kind === "inn") {
      cost = REST_INN_COST;
      pct = 1;
    } else if (kind === "temple") {
      pct = 0.5;
    } else {
      // route
      pct = 0.25;
    }
    if (s.gold < cost) return { ok: false, reason: "gold" };
    const draft = draftFrom(s);
    // Resting takes no time now (the world clock runs on): a free rest is
    // ready again REST_COOLDOWN_HOURS ชั่วยาม later; a paid inn room any time.
    if (kind !== "inn") {
      const ready = Number(draft.flags._restAt ?? -Infinity) + REST_COOLDOWN_HOURS;
      if (absoluteHours(draft) < ready) return { ok: false, reason: "cooldown", readyIn: ready - absoluteHours(draft) };
      draft.flags._restAt = absoluteHours(draft);
    }
    draft.gold -= cost;
    const restored = Math.floor(max * pct);
    draft.stamina = Math.min(max, draft.stamina + restored);
    // Resting restores HP / MP at the same proportion as stamina —
    // matches the existing "ฟื้นเต็ม / ½ / ¼" labels which were always
    // meant to cover every pool, not stamina alone.
    if (draft.playerBuild) {
      const d = deriveAll(draft.playerBuild);
      draft.currentHp = Math.min(d.HP, draft.currentHp + Math.floor(d.HP * pct));
      draft.currentMp = Math.min(d.MP, draft.currentMp + Math.floor(d.MP * pct));
    }
    const restLabel = kind === "home" ? "นอนพักที่บ้าน" : kind === "sect" ? "นอนพักที่สำนัก" : kind === "inn" ? "พักโรงเตี๊ยม" : kind === "temple" ? "พักวัด" : "พักริมทาง";
    appendActionLog(
      draft,
      "rest",
      cost > 0
        ? `${restLabel} · -${cost}🟡 · ฟื้น ${restored} แรง`
        : `${restLabel} · ฟื้น ${restored} แรง`,
    );
    set({ ...draft });
    return { ok: true, kind, cost, restored };
  },

  doActivity: (id) => {
    const activity = getActivity(id);
    if (!activity) return { ok: false, reason: "unknown", message: "ไม่มีกิจกรรมนี้" };
    const s = get();
    const place = activity.place;
    if (place) {
      // A place activity: here, off cooldown, affordable — then its rewards.
      if (!place.locationIds.includes(s.currentSceneId)) return { ok: false, reason: "not-here", message: "ทำที่นี่ไม่ได้" };
      const last = s.activityDays[activity.id];
      const cooldown = place.cooldownDays ?? 1;
      if (last !== undefined && s.day - last < cooldown) {
        return { ok: false, reason: "cooldown", message: `ทำไปแล้ว · ทำได้อีกใน ${cooldown - (s.day - last)} วัน` };
      }
      if (s.stamina < activity.stamina) return { ok: false, reason: "stamina", message: `พลังไม่พอ (ต้องใช้ ${activity.stamina})` };
      if (place.costGold && s.gold < place.costGold) return { ok: false, reason: "gold", message: `ต้องใช้เงิน ${place.costGold} ตำลึง` };
      const draft = draftFrom(s);
      draft.stamina -= activity.stamina;
      if (place.costGold) draft.gold -= place.costGold;
      const gains: string[] = [];
      const r = place.reward;
      if (r.gold) {
        const won = Math.round(r.gold[0] + Math.random() * (r.gold[1] - r.gold[0]));
        draft.gold += won; if (won) gains.push(`${won} ตำลึง`);
      }
      if (r.wExp) { draft.wExp += r.wExp; gains.push(`${r.wExp} 悟`); }
      if (r.statXp) grantStatXp(draft, r.statXp, STAT_XP_PER_ACTION);
      if (r.trait) applyEffect(draft, { t: "addTrait", trait: r.trait.trait, amount: r.trait.amount });
      if (r.item && Math.random() < (r.item.chance ?? 1)) {
        const count = r.item.count ?? 1;
        draft.inventory = { ...draft.inventory, [r.item.itemId]: (draft.inventory[r.item.itemId] ?? 0) + count };
        gains.push(`${getItem(r.item.itemId)?.name ?? r.item.itemId} ×${count}`);
      }
      if (r.stamina) draft.stamina = Math.min(draft.staminaMax, draft.stamina + r.stamina);
      if (r.heal) {
        const derived = draft.playerBuild ? deriveAll(draft.playerBuild) : null;
        if (derived) {
          draft.currentHp = Math.min(derived.HP, (draft.currentHp ?? 0) + Math.round(derived.HP * r.heal));
          draft.currentMp = Math.min(derived.MP, (draft.currentMp ?? 0) + Math.round(derived.MP * r.heal));
        }
      }
      if (r.relationship) applyEffect(draft, { t: "addNpcRelationship", npcId: r.relationship.npcId, amount: r.relationship.amount });
      draft.activityDays = { ...draft.activityDays, [activity.id]: draft.day };
      const message = gains.length ? `${place.doneText} · ได้ ${gains.join(", ")}` : place.doneText;
      appendActionLog(draft, "activity", `${activity.label}: ${message}`);
      set({ ...draft });
      return { ok: true, message };
    }
    if (s.currentSceneId !== JAIL_SCENE_ID) return { ok: false, reason: "not-here", message: "ทำที่นี่ไม่ได้" };
    if (s.stamina < activity.stamina) return { ok: false, reason: "stamina", message: `พลังไม่พอ (ต้องใช้ ${activity.stamina})` };
    const draft = draftFrom(s);
    const derived = draft.playerBuild ? deriveAll(draft.playerBuild) : null;
    let message = "";
    switch (activity.id) {
      case "jail_gate": {
        const left = sentenceLeft(draft);
        if (draft.jailUntil != null && left > 0) {
          return { ok: false, reason: "locked", hoursLeft: left, message: `ประตูลั่นกุญแจ · เหลือโทษอีก ${describeSentence(left)}` };
        }
        releaseFromJail(draft);
        draft.currentSceneId = draft.lastLocationId!;
        appendActionLog(draft, "law", "พ้นโทษ ออกจากคุกหลวง");
        set({ ...draft });
        return { ok: true, message: "ผู้คุมไขประตู · เจ้าเป็นอิสระแล้ว" };
      }
      case "jail_labor": {
        draft.stamina -= activity.stamina;
        // Hard labour takes time off the sentence (it runs on the world clock).
        if (draft.jailUntil != null) draft.jailUntil -= JAIL_LABOR_HOURS;
        grantStatXp(draft, "STR", STAT_XP_PER_ACTION * 2);
        draft.wExp += 5;
        message = `ทุบหินจนเหงื่อโชก · โทษลดลง ${describeSentence(JAIL_LABOR_HOURS)} · เหลือ ${describeSentence(sentenceLeft(draft))}`;
        break;
      }
      case "jail_dice": {
        if (draft.gold < 10) return { ok: false, reason: "gold", message: "ต้องมีเงินเดิมพัน 10 ตำลึง" };
        draft.stamina -= activity.stamina;
        const won = Math.random() < jailDiceChance(draft.playerBuild?.stats.LUK ?? 0);
        draft.gold += won ? 10 : -10;
        grantStatXp(draft, "LUK", STAT_XP_PER_ACTION);
        message = won ? "ทอยได้แต้มสูง · ชนะ 10 ตำลึง" : "แต้มต่ำกว่าผู้คุม · เสีย 10 ตำลึง";
        break;
      }
      case "jail_meditate": {
        // A sitting takes its time: one per JAIL_MEDITATE_COOLDOWN ชั่วยาม of the world clock.
        const lastSat = Number(draft.flags._jailMeditateAt ?? -Infinity);
        const ready = lastSat + JAIL_MEDITATE_COOLDOWN;
        if (absoluteHours(draft) < ready) {
          return { ok: false, reason: "cooldown", message: `จิตยังไม่สงบพอ · นั่งสมาธิได้อีกครั้งใน ${describeSentence(ready - absoluteHours(draft))}` };
        }
        draft.flags._jailMeditateAt = absoluteHours(draft);
        if (derived) {
          draft.currentMp = derived.MP;
          draft.currentHp = Math.min(derived.HP, (draft.currentHp ?? 0) + Math.round(derived.HP * 0.2));
        }
        draft.stamina = Math.min(draft.staminaMax, draft.stamina + 15);
        // Nothing to do but sit with one's arts: insight comes (w-exp).
        draft.wExp += JAIL_MEDITATE_WEXP;
        message = `จิตสงบท่ามกลางซี่กรง · ปราณเต็มเปี่ยม · w-exp +${JAIL_MEDITATE_WEXP}`;
        break;
      }
      case "jail_escape": {
        draft.stamina -= activity.stamina;
        if (Math.random() < jailEscapeChance(draft.playerBuild?.stats.AGI ?? 0)) {
          releaseFromJail(draft);
          draft.wanted += 2;
          draft.lawEvasions = (draft.lawEvasions ?? 0) + 1;
          draft.wantedDay = draft.day;
          draft.currentSceneId = draft.lastLocationId!;
          appendActionLog(draft, "law", `แหกคุกสำเร็จ! หมายจับ ${draft.wanted}`);
          set({ ...draft });
          return { ok: true, message: `ปีนกำแพงร้าวหนีออกมาได้ · หมายจับเพิ่มเป็น ${draft.wanted}` };
        }
        if (draft.jailUntil != null) draft.jailUntil += JAIL_ESCAPE_PENALTY_HOURS;
        message = `ผู้คุมจับได้คาหนังคาเขา · โทษเพิ่ม ${describeSentence(JAIL_ESCAPE_PENALTY_HOURS)} · เหลือ ${describeSentence(sentenceLeft(draft))}`;
        break;
      }
    }
    appendActionLog(draft, "law", message);
    set({ ...draft });
    return { ok: true, message };
  },
});
