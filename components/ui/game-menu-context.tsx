"use client";

import { createContext, useContext } from "react";

/**
 * Hero's Adventure-style unified menu: the HUD menu bar provides its tabs
 * here, and any Modal opened by one of those tabs renders as the full-screen
 * tabbed shell instead of a floating card. Modals nested inside the shell
 * (confirmations) see `insideShell` and stay ordinary overlays.
 */
export interface GameMenuTab { id: string; label: string; icon: string; badge?: number; hotkey?: string }
export interface GameMenuState {
  tabs: readonly GameMenuTab[];
  active: string | null;
  select: (id: string) => void;
}

export const GameMenuContext = createContext<GameMenuState | null>(null);
export const InsideMenuShellContext = createContext(false);

export function useGameMenu() { return useContext(GameMenuContext); }
export function useInsideMenuShell() { return useContext(InsideMenuShellContext); }
