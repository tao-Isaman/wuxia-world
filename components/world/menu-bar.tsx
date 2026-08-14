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
import { RestPopup } from "./popups/rest-popup";
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
  | "rest"
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
export function MenuBar({ hud }: { hud?: boolean } = {}) {
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

  const tabs: {
    id: Exclude<PopupId, null>;
    icon: string;
    label: string;
    badge?: number;
  }[] = [
    { id: "profile", icon: "/icons/ui/profile.png", label: "โปรไฟล์" },
    { id: "inventory", icon: "/icons/ui/bag.png", label: "ย่าม" },
    { id: "moves", icon: "/icons/ui/skills.png", label: "วิชา" },
    { id: "lifeskills", icon: "/icons/ui/craft.png", label: "อาชีพ" },
    {
      id: "quests",
      icon: "/icons/ui/quest.png",
      label: "ภารกิจ",
      badge: activeQuestCount > 0 ? activeQuestCount : undefined,
    },
    {
      id: "sect",
      icon: "/icons/ui/sect.png",
      label: "สำนัก",
      badge: sectActions > 0 ? sectActions : undefined,
    },
    { id: "rest", icon: "/icons/ui/rest.png", label: "พักผ่อน" },
    { id: "log", icon: "/icons/ui/log.png", label: "บันทึก" },
  ];

  const popups = (
    <>
      <ProfilePopup open={open === "profile"} onClose={close} />
      <InventoryPopup open={open === "inventory"} onClose={close} />
      <MoveSkillsPopup open={open === "moves"} onClose={close} />
      <LifeSkillsPopup open={open === "lifeskills"} onClose={close} />
      <QuestLogPopup open={open === "quests"} onClose={close} />
      <SectMembershipPopup open={open === "sect"} onClose={close} />
      <ActionLogPopup open={open === "log"} onClose={close} />
      <RestPopup open={open === "rest"} onClose={close} />
    </>
  );

  // HUD variant — icon column overlaid on the fullscreen map (top-right).
  if (hud) {
    return (
      <>
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={() => setOpen(t.id)}
              className="relative w-11 h-11 frame-pixel-quiet bg-ink/80 hover:bg-ink transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.icon}
                alt={t.label}
                className="w-full h-full pixel"
                draggable={false}
              />
              {typeof t.badge === "number" && (
                <Badge
                  variant="seal"
                  className="absolute -top-1 -right-1 text-[9px] px-1 h-4 leading-none"
                >
                  {t.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
        {popups}
      </>
    );
  }

  return (
    <>
      <Panel padding="p-2">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {tabs.map((t) => (
            <MenuTab
              key={t.id}
              icon={t.icon}
              label={t.label}
              badge={t.badge}
              onClick={() => setOpen(t.id)}
            />
          ))}
        </div>
      </Panel>
      {popups}
    </>
  );
}

interface MenuTabProps {
  icon: string;
  label: string;
  onClick: () => void;
  badge?: number;
}

// Single menu tab — game-style icon button: painted pixel icon with a
// tiny caption below so the bar reads as a game HUD, not a text nav.
function MenuTab({ icon, label, onClick, badge }: MenuTabProps) {
  return (
    <WuxiaButton
      variant="default"
      size="sm"
      onClick={onClick}
      title={label}
      className="h-auto py-1.5 flex-col gap-0.5 relative"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt={label}
        className="w-7 h-7 pixel"
        draggable={false}
      />
      <span className="text-[9px] leading-tight text-muted-foreground">
        {label}
      </span>
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
