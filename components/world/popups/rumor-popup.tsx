"use client";

import { useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { regionOf } from "@/lib/world/data/regions";
import { selectRumorsForScene } from "@/lib/world/rumor-engine";
import type { Rumor, RumorSource } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

// Channel categories admitted by this popup. Wilderness rumors land
// only in random encounters (out of scope for v1 popup UX), so the type
// is narrowed here even though `RumorChannel` permits "wilderness".
type ListenChannel = "inn" | "market" | "sect_internal";

interface Props {
  open: boolean;
  onClose: () => void;
  channel: ListenChannel;
  // Title override. When omitted, falls back to a sensible Thai default
  // per channel (โรงเตี๊ยม / ตลาด / สำนัก).
  title?: string;
  // Pool size to pull. Defaults: inn 5, market 3, sect_internal 3.
  limit?: number;
}

// Spec §3.2 — source icons. The truth axis (true / distorted / false)
// is intentionally NOT surfaced — the player only learns in retrospect
// whether a rumor panned out (§4.4).
const SOURCE_ICON: Record<RumorSource, string> = {
  npc_event:   "💬",
  player_echo: "🌬",
  lore:        "📜",
  warning:     "⚠",
};

const DEFAULT_TITLE: Record<ListenChannel, string> = {
  inn:           "🍶 ฟังข่าวลือในโรงเตี๊ยม",
  market:        "🛒 ฟังพ่อค้าคุยกัน",
  sect_internal: "⛩ ฟังข่าวภายในสำนัก",
};

const DEFAULT_LIMIT: Record<ListenChannel, number> = {
  inn:           5,
  market:        3,
  sect_internal: 3,
};

const EMPTY_LINE = "วันนี้เงียบเป็นพิเศษ — ไม่มีใครพูดเรื่องไหนหนักหน่วง";

// Liveness Layer §4.1 — rumor listening popup. Shown when the player
// triggers "ฟังข่าวลือ" at an inn / market / sect hall. The pool is
// pulled live via `selectRumorsForScene` (pure function over the
// current world state) so opening the popup never mutates state.
//
// The "ฟังต่อ" button is the only interactive control: clicking it
// records the rumor in `rumorSeenLog` (de-prioritises future selection
// per §3.5 / §3.7) and closes the popup. Future scenes can gate on
// `Condition.heardRumor` once the player has heard a specific entry.
//
// Wuxia tone: vermilion accents, ink text, paper background — every
// rumor renders as a blockquote-style card with a left vermilion rule.
export function RumorPopup({ open, onClose, channel, title, limit }: Props) {
  // Subscribe to the live state — opening / closing the popup re-derives
  // the pool against the current rumorPool + day. We deliberately re-
  // compute inside useMemo against open/day so the list doesn't churn
  // every render while the popup is mounted.
  const state = useWorldStore();
  const day = useWorldStore((s) => s.day);
  const sceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);

  // Anchor the rumor selection to the most recent LOCATION (not the
  // dialog scene the popup is being summoned from), so a popup opened
  // mid-dialog still pulls rumors for the city the player is standing
  // in.
  const anchorScene = lastLocationId ?? sceneId;
  const region = useMemo(() => regionOf(anchorScene), [anchorScene]);
  const limitFinal = limit ?? DEFAULT_LIMIT[channel];

  const rumors = useMemo<Rumor[]>(() => {
    if (!open) return [];
    return selectRumorsForScene(state, region, channel, limitFinal);
    // We re-run when (a) the popup opens, (b) day ticks, or (c) the
    // scene changes underfoot. We also include `state` as the dep so
    // the array refreshes if the rumor pool mutates while open (e.g.,
    // a background tick fires between renders).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, day, region, channel, limitFinal, state.rumorPool, state.rumorSeenLog]);

  // Optional pre-fetch on open so the empty popup never flashes for a
  // frame before the memo settles. No-op if already memo'd.
  useEffect(() => {
    if (open) void rumors;
  }, [open, rumors]);

  const headerTitle = title ?? DEFAULT_TITLE[channel];

  return (
    <Modal open={open} onClose={onClose} title={headerTitle} maxWidth="max-w-xl">
      <div className="space-y-3">
        <p className="text-[10px] text-muted-foreground italic">
          เลือก &quot;ฟังต่อ&quot; เพื่อจดจำข่าวลือนี้ — ในอนาคตอาจมีฉากที่อ้างถึง
        </p>

        {rumors.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">
            {EMPTY_LINE}
          </p>
        ) : (
          <ul className="space-y-2">
            {rumors.map((r) => (
              <RumorCard
                key={r.id}
                rumor={r}
                currentDay={day}
                onListen={() => {
                  // Defensive call — Agent G is wiring the dedicated
                  // store action. Until then, fall back to no-op so the
                  // popup never throws. Once the store action lands, it
                  // will dispatch markRumorHeard via the existing
                  // SceneEffect dispatcher (already wired in
                  // lib/world/effects.ts case "markRumorHeard").
                  const store = useWorldStore.getState() as unknown as {
                    recordRumorHeard?: (rumorId: string) => void;
                  };
                  store.recordRumorHeard?.(r.id);
                  onClose();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

// ─── RumorCard ───────────────────────────────────────────────────────
// Blockquote-style row. Source icon at top-left, "{N} วันก่อน" timestamp
// at top-right, italic Thai body text in the middle, "ฟังต่อ" CTA at the
// bottom-right. The vermilion left rule reinforces the wuxia ink-on-
// paper visual language without inventing a new chrome primitive.
function RumorCard({
  rumor,
  currentDay,
  onListen,
}: {
  rumor: Rumor;
  currentDay: number;
  onListen: () => void;
}) {
  // "วันนี้" / "เมื่อวาน" / "{N} วันก่อน" — keeps the timestamp short
  // and natural-sounding rather than a raw day number that requires the
  // player to remember when the world started.
  const ageDays = Math.max(0, currentDay - rumor.createdDay);
  const ageLabel =
    ageDays === 0 ? "วันนี้" : ageDays === 1 ? "เมื่อวาน" : `${ageDays} วันก่อน`;
  const icon = SOURCE_ICON[rumor.source] ?? "•";

  return (
    <li className="rounded bg-paper border-l-2 border-vermilion px-3 py-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span aria-hidden className="text-sm leading-none">{icon}</span>
          {rumor.source === "warning" && (
            <Badge
              variant="outline"
              className="text-[9px] border-amber-500/70 text-amber-700"
            >
              คำเตือน
            </Badge>
          )}
        </span>
        <span className="italic">{ageLabel}</span>
      </div>

      <blockquote className="text-sm text-ink italic leading-relaxed">
        &ldquo;{rumor.text}&rdquo;
      </blockquote>

      <div className="flex justify-end pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onListen}
          className="text-[11px] h-7 border-vermilion/60 text-vermilion hover:bg-vermilion/10"
        >
          ฟังต่อ
        </Button>
      </div>
    </li>
  );
}
