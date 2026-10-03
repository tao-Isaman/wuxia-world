"use client";

import { useEffect, useMemo, useState } from "react";
import { regionOf } from "@/lib/world/data/regions";
import { selectRumorsForScene } from "@/lib/world/rumor-engine";
import { useWorldStore } from "@/store/world-store";

interface Props {
  // Current scene's location id. The banner only shows when this id
  // looks city-like — see `isCityishLocation` below.
  locationId: string;
  // Over the painted map (bottom centre) instead of above the location card.
  floating?: boolean;
}

// Internal flag used to throttle the banner to once per 7 world days.
// Underscore-prefixed so it stays out of the player-visible flag list.
const FLAG_LAST_BANNER_DAY = "_lastBannerDay";
const BANNER_COOLDOWN_DAYS = 7;
// How long the overheard rumor stays on screen before it fades.
const BANNER_SHOW_MS = 12_000;

// Rough city-detection. The spec asks the banner to appear when the
// player enters a city (or city-like commercial leaf) for the first
// time in 7 days. We treat any of these prefixes / substrings as city-
// like: dedicated city scenes, inn scenes (where rumors naturally land),
// and a couple of market scenes that are handled with a substring check
// because they break the prefix convention.
function isCityishLocation(locationId: string): boolean {
  if (locationId.startsWith("city_")) return true;
  if (locationId.startsWith("inn_")) return true;
  if (locationId.includes("market")) return true;
  return false;
}

// Liveness Layer §4.2 — passive "rumor on arrival" banner.
//
// Behavior (spec §4.2):
//   1. Player enters a city / market / inn for the first time in
//      ≥ 7 world days.
//   2. The single highest-weight rumor from the inn pool is shown as
//      flavour text above the location view: "ขณะเดินเข้าเมือง ได้ยิน
//      คนพูดกันว่า: {rumor.text}".
//   3. The banner is purely passive — no buttons, no action cost. It
//      fades after BANNER_SHOW_MS (talk in the street passes).
//   4. Internal cooldown flag `_lastBannerDay` is set when the banner
//      decides to show, so re-entering the same city within 7 days
//      doesn't spam.
//
// When no eligible rumor exists, or the cooldown hasn't elapsed, or the
// scene isn't city-like, the component renders nothing.
export function RumorBanner({ locationId, floating = false }: Props) {
  const day = useWorldStore((s) => s.day);
  const rumorPool = useWorldStore((s) => s.rumorPool);
  const flags = useWorldStore((s) => s.flags);
  const setFlag = useWorldStore((s) => s._setFlag);
  // Pull a snapshot for the rumor selector — selector is pure and reads
  // rumorPool + rumorSeenLog + day off the snapshot so the memo only
  // re-runs when those slices change.
  const state = useWorldStore();
  // The rumor on show. Kept here so starting the cooldown (which makes the
  // scene ineligible) does not hide it; it fades after BANNER_SHOW_MS.
  const [shown, setShown] = useState<{ id: string; text: string; at: string } | null>(null);

  const cityish = isCityishLocation(locationId);
  const region = useMemo(() => regionOf(locationId), [locationId]);

  // Cooldown check: render only when we've never shown OR when the
  // cooldown has elapsed.
  const lastDayRaw = flags[FLAG_LAST_BANNER_DAY];
  const lastDay = typeof lastDayRaw === "number" ? lastDayRaw : null;
  const cooldownElapsed = lastDay === null || day - lastDay >= BANNER_COOLDOWN_DAYS;

  const eligible = cityish && cooldownElapsed;

  // Pull the top rumor for this region via the inn channel. Inn pulls
  // the widest mix (inn + market + wilderness per CHANNEL_ADMITS) which
  // is what we want for an arrival hook — anything noteworthy lands
  // here.
  const top = useMemo(() => {
    if (!eligible) return null;
    const list = selectRumorsForScene(state, region, "inn", 1);
    return list[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, region, day, rumorPool, state.rumorSeenLog]);

  // Show it and start the cooldown, in an effect (not during render).
  useEffect(() => {
    if (!top) return;
    setShown({ id: top.id, text: top.text, at: locationId });
    setFlag(FLAG_LAST_BANNER_DAY, day);
  }, [top, day, setFlag, locationId]);

  // Talk in the street passes: the banner fades after a while, or on leaving.
  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(() => setShown(null), BANNER_SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [shown]);

  if (!shown || shown.at !== locationId) return null;

  return (
    <div
      role="note"
      data-testid="rumor-banner"
      className={floating ? "rumor-banner rumor-banner--floating" : "rumor-banner rounded-sm bg-paper border-l-2 border-vermilion px-3 py-2 text-sm italic leading-relaxed text-ink"}
      style={{ animationDuration: `${BANNER_SHOW_MS}ms` }}
    >
      <span className="text-[11px] not-italic font-display tracking-wide text-vermilion">
        ข่าวลือในเมือง ·{" "}
      </span>
      ขณะเดินเข้าเมือง ได้ยินคนพูดกันว่า: &ldquo;{shown.text}&rdquo;
    </div>
  );
}
