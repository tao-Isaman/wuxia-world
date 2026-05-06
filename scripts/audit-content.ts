// One-shot audit: walks every NPC and Quest, verifies every referenced
// id (dialogSceneId, sparOpponentId, questIds, giverNpcId, turnInNpcId,
// rewards.itemId / opponentId / skillId / artId / npcId, prereqs, stage
// autoAdvance, etc.) resolves to a registered entry. Prints a punch list
// of bad references and exits non-zero on any miss.
//
// Usage:  bun run scripts/audit-content.ts

import {
  evaluateCondition,
  NPCS,
  NPCS_BY_ID,
  QUESTS,
  QUESTS_BY_ID,
  SCENES_BY_ID,
  ITEMS_BY_ID,
  OPPONENTS_BY_ID,
  type Condition,
  type NpcDef,
  type QuestDef,
  type QuestReward,
  type SceneEffect,
  TRAIT_KEYS,
} from "@/lib/world";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import { ARTS_BY_ID } from "@/lib/game/data/arts";

const issues: string[] = [];

function require(label: string, ok: boolean): void {
  if (!ok) issues.push(label);
}

function checkCondition(ctx: string, c: Condition): void {
  switch (c.t) {
    case "hasItem":
      require(`${ctx}: hasItem -> unknown item "${c.itemId}"`, ITEMS_BY_ID.has(c.itemId));
      break;
    case "questStatus":
      require(
        `${ctx}: questStatus -> unknown quest "${c.questId}"`,
        QUESTS_BY_ID.has(c.questId),
      );
      break;
    case "trait":
      require(
        `${ctx}: trait -> unknown trait "${c.trait}"`,
        (TRAIT_KEYS as readonly string[]).includes(c.trait),
      );
      break;
    case "npcRelationship":
      require(
        `${ctx}: npcRelationship -> unknown npc "${c.npcId}"`,
        NPCS_BY_ID.has(c.npcId),
      );
      break;
    case "defeatedOpponent":
      require(
        `${ctx}: defeatedOpponent -> unknown opponent "${c.opponentId}"`,
        OPPONENTS_BY_ID.has(c.opponentId),
      );
      break;
    case "visitedLocation":
      require(
        `${ctx}: visitedLocation -> unknown location "${c.locationId}"`,
        SCENES_BY_ID.has(c.locationId) && SCENES_BY_ID.get(c.locationId)!.kind === "location",
      );
      break;
    case "and":
      c.all.forEach((sub, i) => checkCondition(`${ctx}.and[${i}]`, sub));
      break;
    case "or":
      c.any.forEach((sub, i) => checkCondition(`${ctx}.or[${i}]`, sub));
      break;
    case "not":
      checkCondition(`${ctx}.not`, c.of);
      break;
    case "flag":
      // Free-form flags — no registry to validate against.
      break;
  }
}

function checkSceneEffect(ctx: string, eff: SceneEffect): void {
  switch (eff.t) {
    case "giveItem":
    case "takeItem":
      require(`${ctx}: ${eff.t} -> unknown item "${eff.itemId}"`, ITEMS_BY_ID.has(eff.itemId));
      break;
    case "startQuest":
    case "advanceQuest":
    case "finishQuest":
      require(`${ctx}: ${eff.t} -> unknown quest "${eff.questId}"`, QUESTS_BY_ID.has(eff.questId));
      break;
    case "triggerBattle":
      require(
        `${ctx}: triggerBattle -> unknown opponent "${eff.opponentId}"`,
        OPPONENTS_BY_ID.has(eff.opponentId),
      );
      require(
        `${ctx}: triggerBattle -> unknown onWin scene "${eff.onWin}"`,
        SCENES_BY_ID.has(eff.onWin),
      );
      require(
        `${ctx}: triggerBattle -> unknown onLose scene "${eff.onLose}"`,
        SCENES_BY_ID.has(eff.onLose),
      );
      break;
    case "goto":
      require(`${ctx}: goto -> unknown scene "${eff.sceneId}"`, SCENES_BY_ID.has(eff.sceneId));
      break;
    case "gotoRandom":
      eff.sceneIds.forEach((sid, i) =>
        require(
          `${ctx}: gotoRandom[${i}] -> unknown scene "${sid}"`,
          SCENES_BY_ID.has(sid),
        ),
      );
      break;
    case "addNpcRelationship":
      require(
        `${ctx}: addNpcRelationship -> unknown npc "${eff.npcId}"`,
        NPCS_BY_ID.has(eff.npcId),
      );
      break;
    case "learnSkill":
      require(
        `${ctx}: learnSkill -> unknown skill "${eff.skillId}"`,
        SKILLS_BY_ID.has(eff.skillId),
      );
      break;
    case "learnArt":
      require(`${ctx}: learnArt -> unknown art "${eff.artId}"`, ARTS_BY_ID.has(eff.artId));
      break;
    case "addTrait":
      require(
        `${ctx}: addTrait -> unknown trait "${eff.trait}"`,
        (TRAIT_KEYS as readonly string[]).includes(eff.trait),
      );
      break;
    // setFlag / addGold / rollRandomEvent — nothing to validate.
  }
}

function checkReward(ctx: string, r: QuestReward): void {
  switch (r.t) {
    case "item":
      require(`${ctx}: reward item -> unknown item "${r.itemId}"`, ITEMS_BY_ID.has(r.itemId));
      break;
    case "skillExp":
      require(
        `${ctx}: reward skillExp -> unknown skill "${r.skillId}"`,
        SKILLS_BY_ID.has(r.skillId),
      );
      break;
    case "trait":
      require(
        `${ctx}: reward trait -> unknown trait "${r.trait}"`,
        (TRAIT_KEYS as readonly string[]).includes(r.trait),
      );
      break;
    case "npcRelationship":
      require(
        `${ctx}: reward npcRelationship -> unknown npc "${r.npcId}"`,
        NPCS_BY_ID.has(r.npcId),
      );
      break;
    case "learnSkill":
      require(
        `${ctx}: reward learnSkill -> unknown skill "${r.skillId}"`,
        SKILLS_BY_ID.has(r.skillId),
      );
      break;
    case "learnArt":
      require(`${ctx}: reward learnArt -> unknown art "${r.artId}"`, ARTS_BY_ID.has(r.artId));
      break;
  }
}

function checkNpc(npc: NpcDef): void {
  const ctx = `npc[${npc.id}]`;
  for (const lid of npc.locationIds) {
    const sc = SCENES_BY_ID.get(lid);
    require(`${ctx}.locationIds: unknown location "${lid}"`, Boolean(sc));
    if (sc) {
      require(
        `${ctx}.locationIds: scene "${lid}" is ${sc.kind}, not location`,
        sc.kind === "location",
      );
    }
  }
  if (npc.dialogSceneId) {
    const sc = SCENES_BY_ID.get(npc.dialogSceneId);
    require(`${ctx}.dialogSceneId: unknown scene "${npc.dialogSceneId}"`, Boolean(sc));
    if (sc) {
      require(
        `${ctx}.dialogSceneId: "${npc.dialogSceneId}" is ${sc.kind}, not dialog`,
        sc.kind === "dialog",
      );
    }
  }
  if (npc.sparOpponentId) {
    require(
      `${ctx}.sparOpponentId: unknown opponent "${npc.sparOpponentId}"`,
      OPPONENTS_BY_ID.has(npc.sparOpponentId),
    );
  }
  if (npc.visibleIf) checkCondition(`${ctx}.visibleIf`, npc.visibleIf);
  for (const qid of npc.questIds ?? []) {
    require(`${ctx}.questIds: unknown quest "${qid}"`, QUESTS_BY_ID.has(qid));
  }
}

function checkQuest(q: QuestDef): void {
  const ctx = `quest[${q.id}]`;
  if (q.giverNpcId) {
    require(`${ctx}.giverNpcId: unknown npc "${q.giverNpcId}"`, NPCS_BY_ID.has(q.giverNpcId));
  }
  if (q.turnInNpcId) {
    require(
      `${ctx}.turnInNpcId: unknown npc "${q.turnInNpcId}"`,
      NPCS_BY_ID.has(q.turnInNpcId),
    );
  }
  if (q.prereqs) checkCondition(`${ctx}.prereqs`, q.prereqs);
  q.stages.forEach((s, i) => {
    if (s.autoAdvance) checkCondition(`${ctx}.stages[${i}].autoAdvance`, s.autoAdvance);
  });
  (q.rewards ?? []).forEach((r, i) => checkReward(`${ctx}.rewards[${i}]`, r));
}

function checkScene(): void {
  for (const sc of SCENES_BY_ID.values()) {
    const ctx = `scene[${sc.id}]`;
    if (sc.onEnter) sc.onEnter.forEach((e, i) => checkSceneEffect(`${ctx}.onEnter[${i}]`, e));
    if (sc.kind === "dialog") {
      if (sc.next) {
        require(`${ctx}.next: unknown scene "${sc.next}"`, SCENES_BY_ID.has(sc.next));
      }
      (sc.choices ?? []).forEach((c, i) => {
        require(
          `${ctx}.choices[${i}].next: unknown scene "${c.next}"`,
          SCENES_BY_ID.has(c.next),
        );
        if (c.visibleIf) checkCondition(`${ctx}.choices[${i}].visibleIf`, c.visibleIf);
        (c.effects ?? []).forEach((e, j) =>
          checkSceneEffect(`${ctx}.choices[${i}].effects[${j}]`, e),
        );
      });
    }
    if (sc.kind === "route") {
      sc.destinations.forEach((d, i) => {
        const dest = SCENES_BY_ID.get(d.locationId);
        require(
          `${ctx}.destinations[${i}].locationId: unknown scene "${d.locationId}"`,
          Boolean(dest),
        );
        if (dest) {
          require(
            `${ctx}.destinations[${i}].locationId: "${d.locationId}" is ${dest.kind}, not location`,
            dest.kind === "location",
          );
        }
        if (d.visibleIf) checkCondition(`${ctx}.destinations[${i}].visibleIf`, d.visibleIf);
        (d.effects ?? []).forEach((e, j) =>
          checkSceneEffect(`${ctx}.destinations[${i}].effects[${j}]`, e),
        );
      });
      if (sc.back) {
        require(`${ctx}.back: unknown scene "${sc.back}"`, SCENES_BY_ID.has(sc.back));
      }
    }
    if (sc.kind === "location") {
      sc.npcs.forEach((n, i) => {
        const dial = SCENES_BY_ID.get(n.dialogSceneId);
        require(
          `${ctx}.npcs[${i}].dialogSceneId: unknown scene "${n.dialogSceneId}"`,
          Boolean(dial),
        );
        if (n.visibleIf) checkCondition(`${ctx}.npcs[${i}].visibleIf`, n.visibleIf);
      });
      sc.routes.forEach((r, i) => {
        const rs = SCENES_BY_ID.get(r.routeSceneId);
        require(
          `${ctx}.routes[${i}].routeSceneId: unknown scene "${r.routeSceneId}"`,
          Boolean(rs),
        );
        if (r.visibleIf) checkCondition(`${ctx}.routes[${i}].visibleIf`, r.visibleIf);
      });
    }
  }
}

NPCS.forEach(checkNpc);
QUESTS.forEach(checkQuest);
checkScene();

// Sanity touch evaluateCondition so tree-shaking can't drop it.
void evaluateCondition;

if (issues.length === 0) {
  console.log(
    `[audit] OK — ${NPCS.length} NPCs · ${QUESTS.length} quests · ${SCENES_BY_ID.size} scenes · all references resolve.`,
  );
  process.exit(0);
} else {
  console.error(`[audit] FAIL — ${issues.length} issue(s):`);
  for (const msg of issues) console.error("  -", msg);
  process.exit(1);
}
