// The hand-off back from a battle: spoils and acknowledgeBattleResult.
import { getArt, getSkill } from "@/lib/game";
import { EQUIPMENT_BY_ID } from "@/lib/game/data/equipment";
import { STAT_XP_PER_ACTION } from "@/lib/world/stat-progression";
import { useBattleStore } from "@/store/battle-store";
import { packOpponentIdOf } from "@/lib/world/battle-looks";
import { getItem, getNpc, getOpponent, getResource, getScene, masteryLevel } from "@/lib/world";
import { applyEffect, tickQuestProgress } from "@/lib/world/effects";
import { isLawOpponent } from "@/lib/world/law";
import { moveXpMultiplier } from "@/lib/world/victory";
import { getBoss } from "@/lib/world/data/bosses";
import { emitWorldEvent } from "@/lib/world/shared/events";
import { heroTag } from "../state";
import { heroKills, markAttemptedMurder, reviveFromDeath, settleTournamentBout } from "../lifecycle";
import { applyArtLevelUps, applySkillLevelUps, grantStatXp, isArtFrozen, isSkillFrozen, rollLukXp } from "../progression";
import { ART_USE_XP, FAIL_XP_FRACTION, FIGHT_STAMINA, HUNT_XP_MULT, SKILL_USE_XP } from "../rules";
import { consumeBattleItems, rollResourceYield, rollVictorySpoils, victorySpoilsFor } from "../spoils";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const battleActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "clearPendingBattle" | "victorySpoils" | "acknowledgeBattleResult"> => ({
  clearPendingBattle: () =>
    set({
      pendingBattle: null,
      pendingEncounter: null,
      pendingHuntYield: null,
      pendingSpar: null,
    }),

  victorySpoils: () => victorySpoilsFor(get()),

  acknowledgeBattleResult: () => {
    const s = get();
    if (!s.pendingBattle) return;
    const battleState = useBattleStore.getState().state;
    const winner = battleState?.winner;
    if (battleState?.escaped) {
      // Retreat: the fight simply ends. No rewards, no defeat; the player
      // stays where the fight found them (an escaped arrest means no jail).
      const pb = s.pendingBattle;
      const draft = draftFrom(s);
      draft.stamina = Math.max(0, draft.stamina - FIGHT_STAMINA);
      draft.pendingBattle = null;
      draft.pendingSpar = null;
      draft.pendingHuntYield = null;
      consumeBattleItems(draft, battleState);
      draft.currentHp = Math.max(1, battleState.hA);
      draft.currentMp = Math.max(0, battleState.mpA);
      if (isLawOpponent(pb.opponentId)) {
        // Slipped the law: the Brocade Guard takes note (law.ts pickLawPursuer).
        draft.jailCityId = null;
        draft.lawEvasions = (draft.lawEvasions ?? 0) + 1;
      }
      if (pb.killNpcId) markAttemptedMurder(draft, pb.killNpcId);
      const opponent = getOpponent(pb.opponentId);
      if (pb.tournament) {
        // Leaving the ring forfeits the bout.
        draft.currentHp = Math.max(1, draft.currentHp ?? 1);
        settleTournamentBout(draft, false);
        set({ ...draft });
        useBattleStore.getState().reset();
        return;
      }
      appendActionLog(draft, "battle", `ถอยหนีจาก${opponent?.name ?? "ศัตรู"}สำเร็จ`);
      const back = getScene(draft.currentSceneId)?.kind === "dialog" ? draft.lastLocationId : null;
      set({ ...draft });
      useBattleStore.getState().reset();
      if (back && back !== draft.currentSceneId) get().gotoScene(back);
      return;
    }
    if (!winner) return;

    const pb = s.pendingBattle;
    // Combat charges flat 5 stamina + 0.5 ชั่วยาม regardless of outcome.
    const draft = draftFrom(s);
    draft.stamina = Math.max(0, draft.stamina - FIGHT_STAMINA);
    draft.pendingBattle = null;
    consumeBattleItems(draft, battleState);
    // Carry resources back into the world. Non-fatal defeat leaves one HP
    // below; fatal losses preserve zero and route to gameOver.
    if (battleState) {
      draft.currentHp = Math.max(0, battleState.hA);
      draft.currentMp = Math.max(0, battleState.mpA);
    }

    // Loss path. Fatal battles → game over (existing behaviour).
    // Non-fatal battles (sparring) → route to onLose, world resumes.
    if (winner !== "A") {
      draft.pendingHuntYield = null;
      if (pb.tournament) {
        draft.currentHp = Math.max(1, draft.currentHp ?? 1);
        draft.pendingSpar = null;
        settleTournamentBout(draft, false);
        set({ ...draft });
        useBattleStore.getState().reset();
        get().gotoScene(pb.onLose);
        return;
      }
      if (pb.nonFatal) {
        draft.currentHp = Math.max(1, draft.currentHp ?? 1);
        appendActionLog(draft, "battle", "พ่ายแพ้ในการประลอง แต่ยังมีชีวิต — พักผ่อนก่อนสู้ครั้งต่อไป");
        draft.pendingSpar = null;
        set({ ...draft });
        useBattleStore.getState().reset();
        get().gotoScene(pb.onLose);
        return;
      }
      if (pb.killNpcId) markAttemptedMurder(draft, pb.killNpcId);
      // A fatal loss is not the end: the hero wakes at home a day later,
      // poorer (lib/world/death.ts).
      const lines = reviveFromDeath(draft);
      set({ ...draft, roamingFoes: [], lastDeath: { lines } });
      useBattleStore.getState().reset();
      return;
    }

    // Win path: bank w-exp + per-skill xp + stat xp from every move
    // used and every hit taken, then drop hunt spoils if a hunt was in
    // flight, then route to the encounter's onWin destination. The
    // spoils are the ones the result panel showed (victorySpoils).
    const spoils = victorySpoilsFor(s) ?? rollVictorySpoils(s, pb);
    draft.wExp = Math.max(0, draft.wExp + spoils.wExp);
    draft.gold += spoils.gold;
    // Beat the law this time: no jail pending (the marks stay), and the
    // law grows keener. An upright waylayer is left wounded.
    if (isLawOpponent(pb.opponentId)) {
      draft.jailCityId = null;
      draft.lawEvasions = (draft.lawEvasions ?? 0) + 1;
      const ambusher = pb.ambushNpcId ? draft.npcExt[pb.ambushNpcId] : undefined;
      if (ambusher) {
        draft.npcExt = { ...draft.npcExt, [pb.ambushNpcId!]: { ...ambusher, woundedUntil: draft.day + 30 } };
        appendActionLog(draft, "law", `ตีโต้${getNpc(pb.ambushNpcId)?.name ?? "ผู้ลอบโจมตี"}ที่หมายจับตัวส่งทางการจนบาดเจ็บ`);
      }
    }
    // Bump the defeat counter so `Condition.defeatedOpponent` quests
    // can auto-advance against this kill.
    draft.defeatedCounts[pb.opponentId] =
      (draft.defeatedCounts[pb.opponentId] ?? 0) + 1;
    // Grid battles: fallen pack members (a chief's bandits, an alpha's
    // wolves) count too. Only the primary foe's drops roll.
    for (const unit of battleState?.units ?? []) {
      const packId = unit.team === "enemy" && !unit.alive ? packOpponentIdOf(unit.id) : null;
      if (packId) draft.defeatedCounts[packId] = (draft.defeatedCounts[packId] ?? 0) + 1;
    }
    // Beasts and legendary beasts teach twice as much per move (lib/world/victory.ts).
    const xpMult = moveXpMultiplier(getOpponent(pb.opponentId));
    const uses = battleState?.skillUses?.A ?? {};
    let actionTotal = 0;
    for (const [sid, count] of Object.entries(uses)) {
      if (typeof count !== "number" || count <= 0) continue;
      const sk = getSkill(sid);
      if (!sk) continue;
      actionTotal += count;
      // Skip XP entirely when the skill came from a sect the player
      // has formally RESIGNED from. The skill remains usable at its
      // current level but never grows further. Betrayed sects keep
      // earning XP — the cost there is the random-event hunters.
      if (!isSkillFrozen(draft, sid)) {
        draft.skillExp[sid] = (draft.skillExp[sid] ?? 0) + count * SKILL_USE_XP * xpMult;
        if (!(sid in draft.skillLevel)) draft.skillLevel[sid] = 1;
        // Per-skill auto-level on overflow.
        applySkillLevelUps(draft, sid);
      }
      // STR for physical attacks, POW for internal attacks. Non-attack
      // skills (pure buffs / debuffs / heals) grant nothing here.
      if (sk.at === "phy") {
        grantStatXp(draft, "STR", count * STAT_XP_PER_ACTION);
      } else if (sk.at === "int") {
        grantStatXp(draft, "POW", count * STAT_XP_PER_ACTION);
      }
    }
    // Inner-art XP — every art active fired counts toward its own
    // per-art pool, mirroring the move-skill loop above. Auto-levels
    // when the pool overflows the (2×) art-tier cost.
    const artUses = battleState?.artUses?.A ?? {};
    for (const [aid, count] of Object.entries(artUses)) {
      if (typeof count !== "number" || count <= 0) continue;
      const art = getArt(aid);
      if (!art || art.id === "none") continue;
      // Same freeze rule as move skills — skip XP for arts learned
      // from a resigned sect.
      if (isArtFrozen(draft, aid)) continue;
      draft.artExp[aid] = (draft.artExp[aid] ?? 0) + count * ART_USE_XP * xpMult;
      // Make sure an artLevels entry exists so applyArtLevelUps can
      // read a starting level — also covers legacy builds that learned
      // an art without populating artLevels.
      if (draft.playerBuild) {
        const cur = draft.playerBuild.artLevels?.[aid];
        if (typeof cur !== "number") {
          draft.playerBuild = {
            ...draft.playerBuild,
            artLevels: { ...(draft.playerBuild.artLevels ?? {}), [aid]: 1 },
          };
        }
      }
      applyArtLevelUps(draft, aid);
    }
    // DEF — one tick per incoming hit landed during the fight.
    const hits = battleState?.hitsReceived?.A ?? 0;
    if (hits > 0) {
      grantStatXp(draft, "DEF", hits * STAT_XP_PER_ACTION);
    }
    // LUK — one roll per resolved player action plus per hit absorbed.
    const lukRolls = actionTotal + hits;
    for (let i = 0; i < lukRolls; i++) rollLukXp(draft);

    // Sparring victory → grant ชื่อเสียง and bump the NPC's relationship
    // a touch (winning a friendly match earns respect, not enmity).
    const spar = draft.pendingSpar;
    draft.pendingSpar = null;
    if (spar) {
      const reward = Math.max(0, spar.fameReward);
      if (reward > 0) {
        draft.traits.fame = (draft.traits.fame ?? 0) + reward;
      }
      const entry = draft.npcStates[spar.npcId] ?? {};
      draft.npcStates[spar.npcId] = {
        ...entry,
        met: true,
        relationship: (entry.relationship ?? 0) + 1,
      };
    }

    // Liveness Layer: drop a `duel_win_named` player-echo when the
    // defeated foe is in the named-NPC roster. Spar fights set
    // `pendingSpar.npcId` directly; scripted duels (if the
    // pendingBattle.opponentId itself happens to match a named-NPC
    // id) also count. Generic mob fights are skipped — no rumor
    // for "ชนะ thug ที่ตลาด".
    // Anyone the simulation tracks counts (the thirty, and generated people).
    const echoTargetNpcId =
      spar && draft.npcExt[spar.npcId]
        ? spar.npcId
        : draft.npcExt[pb.opponentId]
          ? pb.opponentId
          : null;
    if (echoTargetNpcId) {
      applyEffect(draft, {
        t: "firePlayerEcho",
        actionId: "duel_win_named",
        targetNpcId: echoTargetNpcId,
      });
    }

    // ⚔ สังหาร won: the person is dead for good, and the law knows who did it.
    if (pb.killNpcId) heroKills(draft, pb.killNpcId);

    // Roll the opponent's drop table (separate from hunt-yield, which
    // covers gathering kicks; these are the random-encounter loot).
    const oppDef = getOpponent(pb.opponentId);
    const lootSummary: string[] = [];
    if (pb.tournament) settleTournamentBout(draft, true);
    // Opponent drops and meridian charts (data/meridian-sources.ts), rolled in victorySpoils.
    draft.inventory = { ...draft.inventory };
    for (const it of spoils.items) {
      draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
      lootSummary.push(`${getItem(it.itemId)?.name ?? it.itemId}×${it.count}`);
    }
    // A legendary beast's rare gear goes to the gear bag.
    if (spoils.gear?.length) {
      draft.inventoryEquipment = { ...draft.inventoryEquipment };
      for (const id of spoils.gear) {
        draft.inventoryEquipment[id] = (draft.inventoryEquipment[id] ?? 0) + 1;
        lootSummary.push(EQUIPMENT_BY_ID.get(id)?.n ?? id);
      }
    }
    if (spoils.gold > 0) lootSummary.push(`${spoils.gold} ตำลึง`);
    appendActionLog(
      draft,
      "combat",
      `ชนะ ${oppDef?.name ?? pb.opponentId}` +
        (lootSummary.length > 0 ? ` · ${lootSummary.join(", ")}` : ""),
    );

    // A legendary beast fell: it is gone for 90 days and the jianghu hears of it.
    // The beast belongs to the shared world: its fall is a world event.
    if (oppDef?.boss) {
      emitWorldEvent(draft, { t: "boss_slain", bossId: oppDef.id, byPlayer: heroTag(draft), day: draft.day });
      const boss = getBoss(oppDef.id);
      if (boss) appendActionLog(draft, "boss", `ปราบ${boss.name}สำเร็จ! ข่าวนี้จะลือไปทั่วยุทธภพ — มันจะกลับมาอีกใน ${boss.respawnDays} วัน`);
    }

    // Now that loot, kill counts, and skill xp have all been written,
    // give the quest progress ticker a chance to advance any active
    // quest whose autoAdvance condition just became true.
    tickQuestProgress(draft);

    const hunt = draft.pendingHuntYield;
    draft.pendingHuntYield = null;
    if (hunt) {
      const res = getResource(hunt.resourceId);
      if (res) {
        const yieldRoll = spoils.hunt ?? rollResourceYield(res, masteryLevel(draft.lifeSkillXp[res.skill] ?? 0));
        for (const it of yieldRoll.items) {
          draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
        }
        // Win + drop-check pass = full xp; win + check-fail (carcass
        // unusable) = half xp.
        const xp = HUNT_XP_MULT * res.level;
        draft.lifeSkillXp[res.skill] =
          (draft.lifeSkillXp[res.skill] ?? 0) + (yieldRoll.passed ? xp : Math.floor(xp * FAIL_XP_FRACTION));
      }
    }
    set({ ...draft });
    useBattleStore.getState().reset();
    get().gotoScene(s.pendingBattle.onWin);
  },
});
