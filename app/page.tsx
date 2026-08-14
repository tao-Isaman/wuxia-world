"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WorldScreen } from "@/components/world/world-screen";
import { MobileLandscape } from "@/components/mobile-landscape";
import { initBattleBridge } from "@/lib/world/battle-bridge";

// World page (`/`) — the main game. Setup / skill library / free battle sim
// live in /debug as dev tools. The world owns its own player build (see
// store/world-store.ts STARTER_BUILD) and is fully decoupled from the dev
// sandbox; battles inside the world play out inline via BattleArena in
// "world" mode.
export default function HomePage() {
  // Module-level subscriptions live outside React, but we initialize them
  // once in a useEffect so SSR / hot-reload don't double-subscribe.
  useEffect(() => {
    initBattleBridge();
  }, []);

  return (
    <MobileLandscape>
      <main className="container max-w-3xl mx-auto p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold">กำลังภายใน — โลกยุทธภพ</h1>
        </div>
        <WorldScreen />
      </main>
    </MobileLandscape>
  );
}
