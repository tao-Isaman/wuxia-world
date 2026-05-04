"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DialogScene } from "@/lib/world";

interface Props {
  scene: DialogScene;
}

export function DialogDisplay({ scene }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {scene.lines.map((line, i) => {
          if (line.t === "narration") {
            return (
              <p
                key={i}
                className="text-sm leading-relaxed italic text-muted-foreground"
              >
                {line.text}
              </p>
            );
          }
          return (
            <div key={i} className="space-y-1">
              <div className="text-xs font-semibold text-primary">
                {line.speaker}
              </div>
              <p className="text-sm leading-relaxed pl-3 border-l-2 border-primary/30">
                &ldquo;{line.text}&rdquo;
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
