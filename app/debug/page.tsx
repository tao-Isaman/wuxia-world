"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/game/character-card";
import { SkillLibrary } from "@/components/game/skill-library";
import { BattleArena } from "@/components/game/battle-arena";

// Dev sandbox — character setup, skill library, and the free battle sim.
// Decoupled from the world game (which has its own STARTER_BUILD-based
// player and runs at "/"). Anything you change here only affects the
// /debug battle, never the world's player or save.
export default function DebugPage() {
  const [tab, setTab] = useState<"setup" | "library" | "battle">("setup");

  return (
    <main className="container max-w-5xl mx-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
          🛠 dev tools
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← กลับสู่โลก</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">ตั้งค่า + วิชา</TabsTrigger>
          <TabsTrigger value="library">คลังวิชา</TabsTrigger>
          <TabsTrigger value="battle">สมรภูมิ</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CharacterCard side="A" />
            <CharacterCard side="B" />
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-3">
          <SkillLibrary />
        </TabsContent>

        <TabsContent value="battle" className="mt-3">
          <BattleArena mode="free" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
