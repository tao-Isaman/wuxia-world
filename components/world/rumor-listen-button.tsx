"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RumorPopup } from "./popups/rumor-popup";
import { useWorldStore } from "@/store/world-store";
import type { SectId } from "@/lib/world";

interface Props {
  // Current scene id used to decide which channel to listen on.
  // Callers in v1 pass `scene.id` from LocationView so the same button
  // can adapt to inn / market / city / sect-hall contexts.
  locationId: string;
}

// Channel + label resolution from the location id. Spec §4.1 gives
// three popup flavours: inn / market / sect_internal. The matrix below
// is a v1 heuristic over the existing scene-id prefixes:
//   - inn_*                       → inn
//   - city_*                      → inn (cities front the same gossip mix)
//   - any *market* substring      → market
//   - sect_<member of>            → sect_internal
//
// Returns null when no channel applies — in that case the button
// shouldn't render at all.
type Resolution = {
  channel: "inn" | "market" | "sect_internal";
  label: string;
  hint: string;
} | null;

function resolveChannel(
  locationId: string,
  membership: ReturnType<typeof useWorldStore.getState>["sectMembership"],
): Resolution {
  if (locationId.includes("market")) {
    return {
      channel: "market",
      label: "🛒 ฟังพ่อค้าคุยกัน",
      hint:  "ข่าวค้าขายและสมบัติ",
    };
  }
  if (locationId.startsWith("inn_")) {
    return {
      channel: "inn",
      label: "🍶 ฟังข่าวลือในโรงเตี๊ยม",
      hint:  "ข่าวสารบ้านเมืองหลากหลาย",
    };
  }
  if (locationId.startsWith("city_")) {
    return {
      channel: "inn",
      label: "🍶 ฟังข่าวลือในเมือง",
      hint:  "ข่าวสารบ้านเมืองหลากหลาย",
    };
  }
  if (locationId.startsWith("sect_")) {
    // Treat the whole sect-hall id as <sect_<sectId>>. Only show the
    // internal-news option if the player is an active disciple of that
    // sect — outsiders shouldn't have access to the rumor mill.
    const sectId = locationId.slice("sect_".length) as SectId;
    const m = membership[sectId];
    if (m && m.status === "active") {
      return {
        channel: "sect_internal",
        label: "⛩ ฟังข่าวภายในสำนัก",
        hint:  "ข่าวภายในที่ศิษย์เท่านั้นรู้",
      };
    }
    return null;
  }
  return null;
}

// Liveness Layer §4.1 — drop-in "ฟังข่าวลือ" button for LocationView.
// Renders nothing when the current scene doesn't admit a rumor channel
// (most wilderness leaves) or when the player isn't an active member of
// the sect they're standing in.
//
// Why a separate component instead of inlining into LocationView: the
// channel resolution + popup state + memberships read are all self-
// contained, and authors may want to drop this into LocationScene-
// driven content later (a special inn scene's `npcs` list, a sect-
// specific dialog choice, etc.) without re-implementing the matrix.
export function RumorListenButton({ locationId }: Props) {
  const [open, setOpen] = useState(false);
  const sectMembership = useWorldStore((s) => s.sectMembership);

  const resolution = resolveChannel(locationId, sectMembership);
  if (!resolution) return null;
  const { channel, label, hint } = resolution;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left h-auto py-2 whitespace-normal"
      >
        <span className="flex flex-col items-start gap-0.5">
          <span className="font-semibold text-sm">{label}</span>
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        </span>
      </Button>
      <RumorPopup
        open={open}
        channel={channel}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
