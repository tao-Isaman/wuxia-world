"use client";

import { Badge } from "@/components/ui/badge";
import { useWorldStore } from "@/store/world-store";
import type { NpcSimStatus } from "@/lib/world";

interface Props {
  npcId: string;
  // Optional CSS classes appended to the badge for layout tweaks.
  className?: string;
}

// Per-status visuals. "alive" deliberately renders nothing — that's the
// common case and we don't want to clutter the UI with green checkmarks
// next to every name. The other three are mostly muted color chips so
// the encyclopedia / NPC list stays scannable.
const STATUS_LABEL: Record<Exclude<NpcSimStatus, "alive">, string> = {
  dead:     "เสียชีวิต",
  secluded: "ปลีกวิเวก",
  missing:  "หายสาบสูญ",
};

const STATUS_CLASS: Record<Exclude<NpcSimStatus, "alive">, string> = {
  // Dead — desaturated stone gray. Renders ก่อนใบหน้า of the NPC name
  // to signal "this character is no longer interactable".
  dead:     "border-stone-500/60 bg-stone-100 text-stone-700",
  // Secluded — calm blue ink, the wuxia "in retreat / training" trope.
  secluded: "border-sky-500/60 bg-sky-50 text-sky-700",
  // Missing — amber, the "we don't know what happened to them" warning.
  missing:  "border-amber-500/60 bg-amber-50 text-amber-700",
};

// Liveness Layer §4.3 — NPC status chip for the encyclopedia / NPC list.
// Reads the per-named-NPC sim state from `worldState.npcExt`. Generic
// NPCs (no ext entry) render nothing so the badge only appears where it
// adds information; named-NPCs that are still alive also render nothing
// (it's the default expectation — surface the badge only when something
// has changed).
//
// Use it next to an NPC's name in any roster:
//
//   <span>{npc.name}</span>
//   <NpcStatusBadge npcId={npc.id} />
//
// The wrapping flex container should already gap the children.
export function NpcStatusBadge({ npcId, className }: Props) {
  const ext = useWorldStore((s) => s.npcExt[npcId]);
  if (!ext) return null;
  if (ext.status === "alive") return null;
  const cls = STATUS_CLASS[ext.status];
  const label = STATUS_LABEL[ext.status];
  return (
    <Badge
      variant="outline"
      className={`text-[9px] ${cls} ${className ?? ""}`.trim()}
      title={`สถานะ ณ ปัจจุบัน: ${label}`}
    >
      {label}
    </Badge>
  );
}
