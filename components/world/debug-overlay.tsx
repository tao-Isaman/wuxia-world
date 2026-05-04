"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SCENES, QUESTS, OPPONENTS } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

// Dev-only — only rendered when NODE_ENV === "development".
// Exposes raw state inspection + jump shortcuts so authoring/testing scenes
// doesn't require playing through the entire flow.
export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const state = useWorldStore();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Card className="border-amber-300">
      <CardContent className="p-3 space-y-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] font-mono text-amber-700 hover:underline w-full text-left"
        >
          {open ? "▼" : "▶"} debug
        </button>
        {open && (
          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold mb-1">scene</div>
              <div className="font-mono text-[10px] bg-muted/40 p-1 rounded">
                {state.currentSceneId}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {SCENES.map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant="outline"
                    className="text-[9px] h-6 px-1.5"
                    onClick={() => state.gotoScene(s.id)}
                  >
                    {s.id}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1">flags</div>
              <pre className="font-mono text-[10px] bg-muted/40 p-1 rounded overflow-x-auto">
                {JSON.stringify(state.flags, null, 2)}
              </pre>
              <SetFlagInput />
            </div>

            <div>
              <div className="font-semibold mb-1">quests</div>
              <pre className="font-mono text-[10px] bg-muted/40 p-1 rounded overflow-x-auto">
                {JSON.stringify(state.quests, null, 2)}
              </pre>
              <div className="flex flex-wrap gap-1 mt-1">
                {QUESTS.map((q) => (
                  <Button
                    key={q.id}
                    size="sm"
                    variant="outline"
                    className="text-[9px] h-6 px-1.5"
                    onClick={() => {
                      // Manually start via direct flag
                      useWorldStore.setState({
                        quests: {
                          ...state.quests,
                          [q.id]: { id: q.id, status: "active", stage: 0 },
                        },
                      });
                    }}
                  >
                    +{q.id}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1">gold</div>
              <div className="flex gap-1">
                {[100, 500, 1000].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant="outline"
                    className="text-[9px] h-6 px-1.5"
                    onClick={() => state._giveGold(n)}
                  >
                    +{n}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold mb-1">force battle</div>
              <div className="flex flex-wrap gap-1">
                {OPPONENTS.map((o) => (
                  <Button
                    key={o.id}
                    size="sm"
                    variant="outline"
                    className="text-[9px] h-6 px-1.5"
                    onClick={() =>
                      useWorldStore.setState({
                        pendingBattle: {
                          opponentId: o.id,
                          onWin: state.currentSceneId,
                          onLose: state.currentSceneId,
                        },
                      })
                    }
                  >
                    vs {o.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="destructive"
                className="text-[10px] h-6"
                onClick={() => {
                  if (window.confirm("ลบเซฟทั้งหมด?")) state.resetGame();
                }}
              >
                wipe save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SetFlagInput() {
  const setFlag = useWorldStore((s) => s._setFlag);
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  return (
    <div className="flex gap-1 mt-1">
      <Input
        placeholder="key"
        value={k}
        onChange={(e) => setK(e.target.value)}
        className="text-[10px] h-6"
      />
      <Input
        placeholder="value"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="text-[10px] h-6"
      />
      <Button
        size="sm"
        variant="outline"
        className="text-[9px] h-6 px-2"
        onClick={() => {
          if (!k) return;
          // Parse value as bool/number/string
          const parsed: boolean | number | string =
            v === "true" ? true : v === "false" ? false : !isNaN(Number(v)) && v !== "" ? Number(v) : v;
          setFlag(k, parsed);
          setK("");
          setV("");
        }}
      >
        set
      </Button>
    </div>
  );
}
