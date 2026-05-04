"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterCard } from "@/components/game/character-card";
import { SkillLibrary } from "@/components/game/skill-library";
import { BattleArena } from "@/components/game/battle-arena";

export default function HomePage() {
  return (
    <main className="container max-w-5xl mx-auto p-3">
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">1 ตั้งค่า + วิชา</TabsTrigger>
          <TabsTrigger value="library">2 คลังวิชา</TabsTrigger>
          <TabsTrigger value="battle">3 สมรภูมิ</TabsTrigger>
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
          <BattleArena />
        </TabsContent>
      </Tabs>
    </main>
  );
}
