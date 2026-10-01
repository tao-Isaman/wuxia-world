// Every quest stage that needs a steal, an assassination or a kidnapping must
// offer that action on the target NPC's card, and doing it through the real
// store must move the quest on. Regression: qe_spy_capital_frame_merchant asked
// the hero to rob เถ้าแก่หวาง, who had no steal loot, so no steal button ever
// appeared.
import assert from "node:assert/strict";
import { QUESTS } from "../lib/world/data/quests";
import { getNpc } from "../lib/world/data/npcs";
import { getLocationMap } from "../lib/world/data/location-maps";
import { badActionOffered, type BadActionKind } from "../lib/world/bad-actions";
import type { Condition } from "../lib/world/types";

const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();

const KIND: Record<string, BadActionKind> = { stoleFromNpc: "steal", assassinatedNpc: "assassinate", kidnappedNpc: "kidnap" };
function deeds(c: Condition | undefined, out: { kind: BadActionKind; npcId: string }[] = []) {
  if (!c) return out;
  if (c.t === "and") c.all.forEach((x) => deeds(x, out));
  else if (c.t === "or") c.any.forEach((x) => deeds(x, out));
  else if (c.t === "stoleFromNpc" || c.t === "assassinatedNpc" || c.t === "kidnappedNpc") out.push({ kind: KIND[c.t], npcId: c.npcId });
  return out;
}

let checked = 0;
const realRandom = Math.random;
for (const q of QUESTS) {
  q.stages.forEach((stage, i) => {
    for (const { kind, npcId } of deeds(stage.autoAdvance)) {
      const npc = getNpc(npcId);
      assert.ok(npc, `${q.id} stage ${i}: target ${npcId} is a registry NPC`);
      assert.ok(npc.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[npcId]),
        `${q.id} stage ${i}: ${npcId} stands on a map where the hero can open their card`);

      store().resetGame();
      store().startNewGame({ name: "ทดสอบ" });
      useWorldStore.setState({ quests: { [q.id]: { id: q.id, status: "active", stage: i } } });
      assert.ok(badActionOffered(store(), npc, kind), `${q.id} stage ${i}: the card of ${npcId} offers ${kind}`);

      Math.random = () => 0; // the attempt succeeds
      const r = kind === "steal" ? store().attemptSteal(npcId)
        : kind === "assassinate" ? store().attemptAssassinate(npcId)
        : store().attemptKidnap(npcId);
      Math.random = realRandom;
      assert.ok(r.ok && r.outcome === "passed", `${q.id} stage ${i}: ${kind} on ${npcId} succeeds (${JSON.stringify(r)})`);
      const after = store().quests[q.id];
      assert.ok(after.status === "done" || after.stage > i, `${q.id} stage ${i}: the quest moves on after the ${kind}`);
      if (kind !== "steal") assert.ok(!badActionOffered(store(), npc, kind), `${q.id}: ${kind} is not offered twice`);
      checked++;
    }
  });
}
assert.ok(checked >= 30, `expected at least 30 bad-action stages, saw ${checked}`);
console.log(`PASS ${checked} steal / assassinate / kidnap quest stages offer the action on the target's card and advance when done`);
