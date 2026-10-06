import { getSkill } from "@/lib/game";
import { getItem, getNpc, getQuest, getScene, scrollItemId, TRAIT_LABEL, type QuestDef, type WorldStateData } from "@/lib/world";
import { npcForSpeaker } from "@/lib/world/speaker";

export interface GrantedReward {
  id: string;
  kind: "gold" | "item" | "experience" | "relationship" | "other";
  label: string;
  value: string;
}

export interface QuestReceipt {
  questId: string;
  questName: string;
  npcId?: string;
  npcName?: string;
  quotation?: string;
  rewards: GrantedReward[];
}

type ReceiptState = Pick<WorldStateData, "hasGame" | "gameOver" | "gold" | "wExp" | "inventory" | "skillExp" | "traits"> & {
  quests: Record<string, { status: "active" | "done" | "failed" }>;
  npcStates: Record<string, { relationship?: number }>;
  playerBuild: { learnedSkillIds?: readonly string[]; learnedArtIds?: readonly string[] } | null;
};

function receiptSnapshot(state: ReceiptState): ReceiptState {
  return {
    hasGame: state.hasGame, gameOver: state.gameOver, gold: state.gold, wExp: state.wExp,
    quests: Object.fromEntries(Object.entries(state.quests).map(([id, quest]) => [id, { status: quest.status }])),
    inventory: { ...state.inventory }, skillExp: { ...state.skillExp }, traits: { ...state.traits },
    npcStates: Object.fromEntries(Object.entries(state.npcStates).map(([id, npc]) => [id, { relationship: npc.relationship }])),
    playerBuild: state.playerBuild ? {
      learnedSkillIds: [...(state.playerBuild.learnedSkillIds ?? [])],
      learnedArtIds: [...(state.playerBuild.learnedArtIds ?? [])],
    } : null,
  };
}

/** World drafts share quest entries with Zustand's previous state. Keep only
 * the receipt's primitive inputs independently, before those entries mutate. */
export function observeQuestReceipts(source: {
  getState: () => ReceiptState;
  subscribe: (listener: (state: ReceiptState) => void) => () => void;
}, onReceipt: (receipt: QuestReceipt | null) => void): () => void {
  let previous = receiptSnapshot(source.getState());
  let lastQuestId: string | null = null;
  return source.subscribe(state => {
    const before = previous;
    const after = receiptSnapshot(state);
    previous = after;
    if (!after.hasGame || after.gameOver || (lastQuestId && after.quests[lastQuestId]?.status !== "done")) {
      lastQuestId = null;
      onReceipt(null);
    }
    if (!before.hasGame || !after.hasGame || after.gameOver) return;
    for (const [id, entry] of Object.entries(after.quests)) {
      if (entry.status !== "done" || before.quests[id]?.status !== "active") continue;
      const def = getQuest(id);
      const receipt = def ? questCompletionReceipt(def, before, after) : null;
      if (receipt) {
        lastQuestId = id;
        onReceipt(receipt);
      }
    }
  });
}

/** Read a committed active → done transition. Declared rewards cap observed
 * deltas, so a treasure event on the same return cannot inflate the receipt. */
export function questCompletionReceipt(def: QuestDef, before: ReceiptState, after: ReceiptState): QuestReceipt | null {
  if (before.quests[def.id]?.status !== "active" || after.quests[def.id]?.status !== "done") return null;
  const npc = getNpc(def.turnInNpcId ?? def.giverNpcId);
  const scene = getScene(`qs_${def.id}_complete`);
  const speech = scene?.kind === "dialog"
    ? scene.lines.find(line => line.t === "dialogue" && !!npc && npcForSpeaker(line.speaker, [npc])?.id === npc.id)
    : undefined;
  const numeric = new Map<string, { kind: GrantedReward["kind"]; label: string; expected: number; delta: number }>();
  const rewards: GrantedReward[] = [];
  function amount(id: string, kind: GrantedReward["kind"], label: string, expected: number, delta: number) {
    const prior = numeric.get(id);
    numeric.set(id, { kind, label, expected: expected + (prior?.expected ?? 0), delta });
  }
  for (const reward of def.rewards ?? []) {
    switch (reward.t) {
      case "gold": amount("gold", "gold", "ทอง", reward.amount, after.gold - before.gold); break;
      case "wExp": amount("wExp", "experience", "W-EXP", reward.amount, after.wExp - before.wExp); break;
      case "item": amount(`item:${reward.itemId}`, "item", getItem(reward.itemId)?.name ?? reward.itemId,
        Math.max(1, reward.count ?? 1), (after.inventory[reward.itemId] ?? 0) - (before.inventory[reward.itemId] ?? 0)); break;
      case "skillExp": amount(`skill:${reward.skillId}`, "experience", `${getSkill(reward.skillId)?.n ?? "วิชา"} · XP`,
        reward.amount, (after.skillExp[reward.skillId] ?? 0) - (before.skillExp[reward.skillId] ?? 0)); break;
      case "trait": amount(`trait:${reward.trait}`, "other", TRAIT_LABEL[reward.trait], reward.amount,
        (after.traits[reward.trait] ?? 0) - (before.traits[reward.trait] ?? 0)); break;
      case "npcRelationship": amount(`relationship:${reward.npcId}`, "relationship", `ความสัมพันธ์ · ${getNpc(reward.npcId)?.name ?? "สหาย"}`,
        reward.amount, (after.npcStates[reward.npcId]?.relationship ?? 0) - (before.npcStates[reward.npcId]?.relationship ?? 0)); break;
      case "learnSkill":
      case "learnArt": {
        const scroll = reward.t === "learnSkill" ? scrollItemId("skill", reward.skillId) : scrollItemId("art", reward.artId);
        if ((after.inventory[scroll] ?? 0) > (before.inventory[scroll] ?? 0)) {
          rewards.push({ id: `item:${scroll}`, kind: "item", label: getItem(scroll)?.name ?? "คัมภีร์วิชา", value: "อ่านได้ในย่าม" });
        }
        break;
      }
    }
  }
  for (const [id, entry] of numeric) {
    const granted = Math.sign(entry.expected) * Math.min(Math.abs(entry.expected), Math.max(0, entry.delta * Math.sign(entry.expected)));
    if (granted === 0) continue;
    rewards.push({ id, kind: entry.kind, label: entry.label, value: `${granted > 0 ? "+" : ""}${granted}` });
  }
  return {
    questId: def.id, questName: def.name,
    npcId: npc?.id, npcName: npc?.name,
    quotation: speech?.text,
    rewards,
  };
}
