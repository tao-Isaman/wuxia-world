"use client";

import { useEffect } from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { InsideMenuShellContext, useGameMenu, useInsideMenuShell } from "./game-menu-context";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // Optional max-width override; defaults to a comfortable popup size.
  maxWidth?: string;
}

/** System emoji clash with the pixel icon set; titles lose any leading emoji. */
const cleanTitle = (title?: string) => title?.replace(/^(?:\p{Extended_Pictographic}|\uFE0F|\u200D|\s)+/u, "") ?? "";

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

// Lightweight modal — backdrop click + Escape close, scrolls inside the card
// if the content overflows the viewport. Opened from the HUD menu bar it
// becomes the full-screen tabbed menu shell (see game-menu-context.tsx).
export function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }: Props) {
  const menu = useGameMenu();
  const nested = useInsideMenuShell();
  const shell = !!menu?.active && !nested;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      // Number keys jump between menu tabs, like the reference game's hotkeys.
      if (!shell || !menu || typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      const tab = menu.tabs.find((candidate) => candidate.hotkey === e.key);
      if (tab) { e.preventDefault(); menu.select(tab.id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, shell, menu]);

  if (!open) return null;

  const activeTab = menu?.tabs.find((tab) => tab.id === menu.active);
  if (shell && menu) {
    return (
      <div className="hud-menu" role="dialog" aria-modal="true" aria-label={cleanTitle(title)}>
        <header className="hud-menu-bar">
          <nav className="hud-menu-tabs" role="tablist" aria-label="หมวดเมนู">
            {menu.tabs.map((tab) => (
              <button key={tab.id} type="button" role="tab" aria-selected={tab.id === menu.active}
                className="hud-menu-tab" onClick={() => menu.select(tab.id)}
                title={tab.hotkey ? `${tab.label} (${tab.hotkey})` : tab.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tab.icon} alt="" className="pixel" draggable={false} />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && <b className="hud-menu-badge">{tab.badge}</b>}
              </button>
            ))}
          </nav>
          <button type="button" className="hud-menu-close" onClick={onClose} aria-label="ปิด">✕</button>
        </header>
        <div className="hud-menu-stage" onClick={onClose}>
          <section className="hud-menu-panel game-modal-card" onClick={(e) => e.stopPropagation()}>
            {title && <h2 className="hud-menu-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {activeTab && <img src={activeTab.icon} alt="" className="pixel" draggable={false} />}
              {cleanTitle(title)}
            </h2>}
            <div className="hud-menu-body">
              <InsideMenuShellContext.Provider value>{children}</InsideMenuShellContext.Provider>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className="game-modal fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/50 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className={`game-modal-card w-full ${maxWidth} my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-4 space-y-3">
          <div className="game-modal-heading flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-bold">{title && <span className="game-modal-ornament" aria-hidden="true">❖</span>}{cleanTitle(title)}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-base"
              aria-label="ปิด"
            >
              ✕
            </Button>
          </div>
          <div className="game-modal-body max-h-[70vh] overflow-y-auto pr-1">
            <InsideMenuShellContext.Provider value>{children}</InsideMenuShellContext.Provider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
