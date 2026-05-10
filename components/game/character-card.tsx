"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type Side } from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";
import { StatSliders } from "./stat-sliders";
import { DerivedStats } from "./derived-stats";
import { SkillSlots } from "./skill-slots";
import { EquipmentSlots } from "./equipment-slots";
import { NpcPresetSelector } from "./npc-preset-selector";

interface Props {
  side: Side;
}

export function CharacterCard({ side }: Props) {
  const name = useCharacterStore((s) => s.builds[side].name);
  const setName = useCharacterStore((s) => s.setName);

  const accent =
    side === "A"
      ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
      : "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Badge className={accent}>ฝ่าย {side}</Badge>
        <Input
          value={name}
          onChange={(e) => setName(side, e.target.value)}
          className="font-semibold"
        />
        <NpcPresetSelector side={side} />
        <StatSliders side={side} />
        <DerivedStats side={side} />
        <SkillSlots side={side} />
        <EquipmentSlots side={side} />
      </CardContent>
    </Card>
  );
}
