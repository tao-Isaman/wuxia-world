"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Coins, HeartHandshake, Sparkles, Sprout, X } from "lucide-react";
import { getScene, npcPortrait } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { observeQuestReceipts, type GrantedReward, type QuestReceipt } from "./quest-completion-receipt-data";
import "@/app/quest-completion-receipt.css";

function RewardIcon({ kind }: { kind: GrantedReward["kind"] }) {
  const Icon = kind === "gold" ? Coins : kind === "item" ? Sprout : kind === "relationship" ? HeartHandshake : Sparkles;
  return <Icon size={18} strokeWidth={1.6} aria-hidden="true" />;
}

/** A transient thank-you, not another claim action. The world remains usable;
 * continue, Escape, movement, or interacting elsewhere dismisses it. */
export function QuestCompletionReceipt() {
  const [receipt, setReceipt] = useState<QuestReceipt | null>(null);
  const panel = useRef<HTMLElement>(null);
  const canPresent = useWorldStore(state => state.hasGame && !state.gameOver && !state.pendingBattle && !state.pendingEncounter && getScene(state.currentSceneId)?.kind !== "dialog");
  useEffect(() => observeQuestReceipts(useWorldStore, setReceipt), []);
  useEffect(() => {
    if (!receipt || !canPresent) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) setReceipt(null);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" || (!panel.current?.contains(document.activeElement) && /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|w|a|s|d)$/i.test(event.key))) setReceipt(null);
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", key);
    };
  }, [receipt, canPresent]);
  if (!receipt || !canPresent) return null;
  const portrait = receipt.npcId ? npcPortrait(receipt.npcId) : undefined;
  const relationship = receipt.rewards.filter(reward => reward.kind === "relationship");
  const rewards = receipt.rewards.filter(reward => reward.kind !== "relationship");
  return (
    <aside ref={panel} className="quest-receipt" aria-label="ภารกิจสำเร็จ" data-testid="quest-completion-receipt">
      <header className="quest-receipt-heading">
        <span><Check size={15} aria-hidden="true" /> ภารกิจสำเร็จ</span>
        <button type="button" aria-label="ปิดใบรับรางวัล" onClick={() => setReceipt(null)}><X size={17} aria-hidden="true" /></button>
      </header>
      <div className="quest-receipt-body" role="status" aria-live="polite">
        <h2>{receipt.questName}</h2>
        {receipt.npcName && <div className="quest-receipt-character">
          {portrait && <div className="quest-receipt-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait} alt={receipt.npcName} width={80} height={80} draggable={false} />
          </div>}
          <div><strong>{receipt.npcName}</strong>{receipt.quotation && <blockquote>“{receipt.quotation}”</blockquote>}</div>
        </div>}
        {relationship.map(reward => <p key={reward.id} className="quest-receipt-relationship">
          <RewardIcon kind="relationship" /><span>{reward.label}</span><strong>{reward.value}</strong>
        </p>)}
        {rewards.length > 0 && <div className="quest-receipt-rewards" aria-label="รางวัลที่ได้รับ">
          {rewards.map(reward => <div key={reward.id} className="quest-receipt-reward" data-kind={reward.kind}>
            <RewardIcon kind={reward.kind} /><strong>{reward.value}</strong><span>{reward.label}</span>
          </div>)}
        </div>}
      </div>
      <footer><span>รับรางวัลแล้ว</span><button type="button" onClick={() => setReceipt(null)}>เดินทางต่อ <ArrowRight size={15} aria-hidden="true" /></button></footer>
    </aside>
  );
}
