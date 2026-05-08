"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/wuxia/panel";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { Badge } from "@/components/ui/badge";
import { useWorldStore } from "@/store/world-store";
import { ProfilePopup } from "./popups/profile-popup";
import { InventoryPopup } from "./popups/inventory-popup";
import { MoveSkillsPopup } from "./popups/move-skills-popup";
import { LifeSkillsPopup } from "./popups/life-skills-popup";
import { ActionLogPopup } from "./popups/action-log-popup";
import { QuestLogPopup } from "./popups/quest-log-popup";
import { SectMembershipPopup } from "./popups/sect-membership-popup";
import {
  SECT_MEMBERSHIPS,
  getQuestsForSect,
  isSectQuestOfferable,
  pendingRewardsAtRank,
  type SectId,
} from "@/lib/world";

type PopupId =
  | "profile"
  | "inventory"
  | "moves"
  | "lifeskills"
  | "quests"
  | "sect"
  | "log"
  | null;

// Main-screen menu bar — popup buttons, one popup at a time. The bar
// lives directly under the StatusBar in WorldScreen so it's reachable
// from every scene kind (location / route / dialog).
//
// Wuxia redesign: each tab is a pixel-bordered WuxiaButton instead of a
// plain shadcn outline button. The grid is 3 columns on mobile (two
// rows of three) and 6 columns on `sm+`, so touch targets stay ≥40px
// even on the narrowest phones.
//
// The 🥋 วิชาฝีมือ tab manages BOTH move skills and inner arts: each
// of the 10 slots can hold either kind, so a separate ☯ inner-skills
// popup would just duplicate state.
export function MenuBar() {
  const [open, setOpen] = useState<PopupId>(null);
  const close = () => setOpen(null);
  // Active-quest counter for the seal badge on the ภารกิจ tab.
  const activeQuestCount = useWorldStore(
    (s) => Object.values(s.quests).filter((q) => q.status === "active").length,
  );
  // Sect tab badge counts ACTIONABLE items, not just membership presence.
  // "1 สำนัก joined" was meaningless — the player wants to know if there
  // is something to do (claim a reward, accept a quest, rank up), not be
  // reminded they're a disciple. Count:
  //   - pending multi-option reward picks at reached ranks
  //   - affordable rank-up
  //   - offerable sect / art quests
  // The full state object is read once and the helper does the work — re-
  // computes only when the relevant slices change.
  const sectActions = useWorldStore((s) => {
    let count = 0;
    for (const [sid, m] of Object.entries(s.sectMembership)) {
      if (!m) continue;
      const def = SECT_MEMBERSHIPS[sid as SectId];
      if (!def) continue;
      // Unclaimed reward picks at every reached rank.
      for (let r = m.rank; r <= def.startRank; r++) {
        const p = pendingRewardsAtRank(def, r, m.rewardPicks);
        if (p.skills.length > 0) count++;
        if (p.arts.length > 0) count++;
      }
      // Rank-up affordable.
      if (m.rank > def.topRank && m.points >= def.rankUpCost(m.rank - 1)) {
        count++;
      }
      // Offerable sect / art quests (excludes ones on cooldown / already
      // claimed / wrong rank — see isSectQuestOfferable).
      for (const q of getQuestsForSect(sid)) {
        if (isSectQuestOfferable(s, q, def.questCooldownDays).offerable) count++;
      }
    }
    return count;
  });

  return (
    <>
      <Panel padding="p-2">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          <MenuTab
            label="โปรไฟล์"
            onClick={() => setOpen("profile")}
          />
          <MenuTab
            label="ของในย่าม"
            onClick={() => setOpen("inventory")}
          />
          <MenuTab
            label="วิชาฝีมือ"
            onClick={() => setOpen("moves")}
          />
          <MenuTab
            label="วิชาชีพ"
            onClick={() => setOpen("lifeskills")}
          />
          <MenuTab
            label="ภารกิจ"
            onClick={() => setOpen("quests")}
            badge={activeQuestCount > 0 ? activeQuestCount : undefined}
          />
          <MenuTab
            label="สำนัก"
            onClick={() => setOpen("sect")}
            badge={sectActions > 0 ? sectActions : undefined}
          />
          <MenuTab label="บันทึก" onClick={() => setOpen("log")} />
        </div>
      </Panel>

      <ProfilePopup open={open === "profile"} onClose={close} />
      <InventoryPopup open={open === "inventory"} onClose={close} />
      <MoveSkillsPopup open={open === "moves"} onClose={close} />
      <LifeSkillsPopup open={open === "lifeskills"} onClose={close} />
      <QuestLogPopup open={open === "quests"} onClose={close} />
      <SectMembershipPopup open={open === "sect"} onClose={close} />
      <ActionLogPopup open={open === "log"} onClose={close} />
    </>
  );
}

interface MenuTabProps {
  label: string;
  onClick: () => void;
  badge?: number;
}

// Single menu tab. Stack-layout: pixel emoji icon on top, Charm display
// label below. The icon gets `.pixel` rendering so emojis stay crisp at
// every DPR; the label uses Charm so the proper-noun feel carries
// across the whole nav.
function MenuTab({ label, onClick, badge }: MenuTabProps) {
  return (
    <WuxiaButton
      variant="default"
      size="sm"
      onClick={onClick}
      className="h-auto py-2 flex-col gap-0.5 relative"
    >
      <span className="text-[11px] sm:text-xs leading-tight">{label}</span>
      {typeof badge === "number" && (
        <Badge
          variant="seal"
          className="absolute -top-1 -right-1 text-[9px] px-1 h-4 leading-none"
        >
          {badge}
        </Badge>
      )}
    </WuxiaButton>
  );
}
