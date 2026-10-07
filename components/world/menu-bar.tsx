"use client";

import { useEffect, useState } from "react";
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
import { QuestTracker } from "./quest-tracker";
import { SectMembershipPopup } from "./popups/sect-membership-popup";
import { LettersPopup } from "./popups/letters-popup";
import { MeridianPopup, meridianActionable } from "./popups/meridian-popup";
import { toast } from "@/store/toast-store";
import { RestQuickAction } from "./rest-quick-action";
import { HudVitals } from "./hud-vitals";
import { GameMenuContext } from "@/components/ui/game-menu-context";
import { InstallGameButton } from "@/components/pwa";
import { SoundButton } from "@/components/sound-button";
import { sectActionCount } from "@/lib/world";

type PopupId =
  | "profile"
  | "inventory"
  | "moves"
  | "lifeskills"
  | "quests"
  | "sect"
  | "log"
  | "letters"
  | "meridians"
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
// The 🥋 กระบวนท่า tab manages BOTH move skills and inner arts: each
// of the 10 slots can hold either kind, so a separate ☯ inner-skills
// popup would just duplicate state.
export function MenuBar({ hud }: { hud?: boolean } = {}) {
  const [open, setOpen] = useState<PopupId>(null);
  const close = () => setOpen(null);
  // Active-quest counter for the seal badge on the ภารกิจ tab.
  const activeQuestCount = useWorldStore(
    (s) => Object.values(s.quests).filter((q) => q.status === "active").length,
  );
  // Sect tab badge: things to do in the สำนัก window (rank-up, quests it offers).
  const sectActions = useWorldStore(sectActionCount);

  // Letters: an unread badge, and a toast when a new one arrives.
  const unread = useWorldStore((s) => s.letters.filter((l) => !l.read).length);
  const newest = useWorldStore((s) => s.letters[s.letters.length - 1]?.id);
  const [seenNewest, setSeenNewest] = useState(newest);
  useEffect(() => {
    if (!hud || newest === seenNewest) return;
    setSeenNewest(newest);
    const letter = useWorldStore.getState().letters.find((l) => l.id === newest);
    if (letter && !letter.read) toast("info", "✉ มีจดหมายฉบับใหม่ — เปิดดูที่ จดหมาย");
  }, [hud, newest, seenNewest]);

  // ชีพจร: the unspent points, shown only while a point can be opened with them.
  const meridianPoints = useWorldStore((s) => s.meridianPoints ?? 0);
  const meridianReady = useWorldStore((s) => meridianActionable(s.playerBuild?.meridians, s.meridianPoints ?? 0));

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
    { id: "log", icon: "/icons/ui/log.png", label: "บันทึก" },
    { id: "letters", icon: "/icons/ui/letter.png", label: "จดหมาย", badge: unread > 0 ? unread : undefined },
    { id: "meridians", icon: "/icons/ui/meridian.png", label: "ชีพจร", badge: meridianReady ? meridianPoints : undefined },
  ];

  // Hero's Adventure-style unified menu: the open popup renders inside one
  // full-screen tabbed shell, and number keys 1-9 switch sections in place.
  const menu = {
    tabs: tabs.map((t, i) => ({ ...t, hotkey: String(i + 1) })),
    active: open,
    select: (id: string) => setOpen(id as Exclude<PopupId, null>),
  };
  const popups = (
    <GameMenuContext.Provider value={menu}>
      <ProfilePopup open={open === "profile"} onClose={close} />
      <InventoryPopup open={open === "inventory"} onClose={close} />
      <MoveSkillsPopup open={open === "moves"} onClose={close} />
      <LifeSkillsPopup open={open === "lifeskills"} onClose={close} />
      <QuestLogPopup open={open === "quests"} onClose={close} />
      <SectMembershipPopup open={open === "sect"} onClose={close} />
      <ActionLogPopup open={open === "log"} onClose={close} />
      <LettersPopup open={open === "letters"} onClose={close} />
      <MeridianPopup open={open === "meridians"} onClose={close} />
    </GameMenuContext.Provider>
  );

  // World hotkeys 1-9 open a section directly (desktop); inside the section
  // shell the same digits switch tabs (see Modal).
  useEffect(() => {
    if (!hud || open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [data-world-busy]')) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < tabs.length) { e.preventDefault(); setOpen(tabs[index].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Mobile-first HUD: HP / MP / stamina, then every section one tap away as
  // an icon, stacked top-left.
  if (hud) {
    return (
      <>
        <div className="hud-topleft" data-hud-occluder>
        <HudVitals />
        <nav className="hud-iconbar" aria-label="เมนูเกม">
          {tabs.map((t, i) => (
            <button key={t.id} type="button" title={`${t.label} (${i + 1})`} aria-label={t.label} aria-keyshortcuts={String(i + 1)}
              className="hud-icon" onClick={() => setOpen(t.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.icon} alt="" className="pixel" draggable={false} />
              <span className="hud-icon-label" aria-hidden="true">{t.label}</span>
              {typeof t.badge === "number" && <b className="hud-icon-badge" aria-hidden="true">{t.badge}</b>}
            </button>
          ))}
          <SoundButton />
          <InstallGameButton variant="icon" />
        </nav>
        </div>
        <QuestTracker onOpen={() => setOpen("quests")} />
        <RestQuickAction />
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
      <RestQuickAction />
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
