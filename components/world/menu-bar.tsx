"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { OnlineButton } from "./online-panel";
import { sectActionCount } from "@/lib/world";
import { mailWaiting, useSocialStore } from "@/store/social-store";
import { FriendsPopup } from "./social/friends-popup";
import { WorldMapPopup } from "./popups/world-map-popup";
import { ChatBox } from "./social/chat-box";
import { PlayerCard } from "./social/player-card";
import { PartyFrame } from "./social/party-frame";

/** "open": the HUD menu stays unfolded on every screen (tests; phones fold it otherwise). */
const HUD_MENU_KEY = "wuxia-hud-menu";
/** A phone held either way (the page turns portrait into landscape). */
const SHORT_SCREEN = "(orientation: landscape) and (max-height: 500px), (orientation: portrait) and (max-width: 500px)";
const shortScreen = () => typeof window !== "undefined" && window.matchMedia(SHORT_SCREEN).matches;

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
  | "friends"
  | "map"
  | null;

// The game's menu: nine sections (โปรไฟล์ … ชีพจร), and สหาย online (hotkey
// 0), one popup at a time.
// On a painted map (`hud`) it is the top-left stack — the vitals card over
// an icon bar that wraps into rows (four to a row on phones, see
// mobile-hud.css) — plus the top-right stack (the quest tracker over the
// map's `extras`) and the rest button. In the
// classic card layout (world_journey and the unpainted roads) it sits under
// the StatusBar as a 4-column grid, 8 columns from `sm`.
//
// The วิชา tab manages BOTH move skills and inner arts: each of the 10
// slots can hold either kind, so a separate inner-arts popup would just
// duplicate state.
export function MenuBar({ hud, extras }: { hud?: boolean; extras?: ReactNode } = {}) {
  const [open, setOpen] = useState<PopupId>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  // Phones start with the icons folded (larger screens open); "open" in
  // HUD_MENU_KEY keeps them out on every screen (the e2e suite seeds it).
  const pinnedOpen = () => { try { return localStorage.getItem(HUD_MENU_KEY) === "open"; } catch { return false; } };
  useEffect(() => { setMenuOpen(pinnedOpen() || !shortScreen()); }, []);
  const setMenu = (next: boolean) => setMenuOpen(next);
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

  // Online: player mail joins the จดหมาย badge; สหาย counts requests and invites.
  const online = useSocialStore((s) => s.status !== "off");
  const playerMail = useSocialStore(mailWaiting);
  const socialPending = useSocialStore((s) => s.requestsIn.length + s.invites.length);
  const menuRequest = useSocialStore((s) => s.menuRequest);
  useEffect(() => {
    if (!menuRequest) return;
    setOpen(menuRequest);
    useSocialStore.setState({ menuRequest: null });
  }, [menuRequest]);

  // ชีพจร: the unspent points, shown only while a point can be opened with them.
  const meridianPoints = useWorldStore((s) => s.meridianPoints ?? 0);
  const meridianReady = useWorldStore((s) => meridianActionable(s.playerBuild?.meridians, s.meridianPoints ?? 0));

  const tabs: {
    id: Exclude<PopupId, null>;
    icon: string;
    label: string;
    badge?: number;
    /** A letter hotkey instead of the next digit. */
    key?: string;
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
    { id: "letters", icon: "/icons/ui/letter.png", label: "จดหมาย", badge: unread + playerMail > 0 ? unread + playerMail : undefined },
    { id: "meridians", icon: "/icons/ui/meridian.png", label: "ชีพจร", badge: meridianReady ? meridianPoints : undefined },
    ...(online ? [{ id: "friends" as const, icon: "/icons/ui/friends.png", label: "สหาย", badge: socialPending > 0 ? socialPending : undefined }] : []),
    { id: "map", icon: "/icons/ui/map.png", label: "แผนที่", key: "m" },
  ];
  /** Tab hotkeys: 1–9, then 0 for the tenth; a tab with its own letter keeps it. */
  const hotkey = (i: number) => tabs[i]?.key ?? String((i + 1) % 10);

  // Hero's Adventure-style unified menu: the open popup renders inside one
  // full-screen tabbed shell, and number keys 1-9 switch sections in place.
  const menu = {
    tabs: tabs.map((t, i) => ({ ...t, hotkey: hotkey(i) })),
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
      <FriendsPopup open={open === "friends"} onClose={close} />
      <WorldMapPopup open={open === "map"} onClose={close} />
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
      const index = tabs.findIndex((_, i) => hotkey(i) === e.key.toLowerCase());
      if (index >= 0) { e.preventDefault(); setOpen(tabs[index].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Mobile-first HUD: HP / MP / stamina, then the sections. On a phone the
  // icons fold behind one เมนู button (badges summed on it) so the map stays
  // clear, and fold back after a section opens; larger screens show them all.
  // The player's choice is remembered (localStorage, per device).
  const badgeTotal = tabs.reduce((sum, t) => sum + (t.badge ?? 0), 0);
  const pick = (id: Exclude<PopupId, null>) => {
    setOpen(id);
    if (shortScreen() && !pinnedOpen()) setMenuOpen(false);
  };
  if (hud) {
    return (
      <>
        <div className="hud-topleft" data-hud-occluder>
        <HudVitals />
        <PartyFrame onOpen={() => setOpen("friends")} />
        <nav className="hud-iconbar" aria-label="เมนูเกม" data-menu-open={menuOpen}>
          <button type="button" className="hud-icon hud-menu-toggle" data-testid="hud-menu-toggle" aria-expanded={menuOpen}
            aria-label={menuOpen ? "ซ่อนเมนู" : "เมนู"} title={menuOpen ? "ซ่อนเมนู" : "เมนู"}
            onClick={() => setMenu(!menuOpen)}>
            <span className="hud-icon-glyph" aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            <span className="hud-icon-label" aria-hidden="true">{menuOpen ? "ซ่อน" : "เมนู"}</span>
            {!menuOpen && badgeTotal > 0 && <b className="hud-icon-badge" aria-hidden="true">{badgeTotal}</b>}
          </button>
          {menuOpen && tabs.map((t, i) => (
            <button key={t.id} type="button" title={`${t.label} (${hotkey(i)})`} aria-label={t.label} aria-keyshortcuts={hotkey(i)}
              className="hud-icon" onClick={() => pick(t.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.icon} alt="" className="pixel" draggable={false} />
              <span className="hud-icon-label" aria-hidden="true">{t.label}</span>
              {typeof t.badge === "number" && <b className="hud-icon-badge" aria-hidden="true">{t.badge}</b>}
            </button>
          ))}
          {menuOpen && <>
            <SoundButton />
            <OnlineButton />
            <InstallGameButton variant="icon" />
          </>}
        </nav>
        </div>
        {/* Top right, under the purse: the tracked quest, then whatever the
            map adds (the อื่น ๆ drawer button), stacked so neither covers the other. */}
        <div className="hud-right-stack">
          <QuestTracker onOpen={() => setOpen("quests")} />
          {extras}
        </div>
        <RestQuickAction />
        <ChatBox />
        <PlayerCard />
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
