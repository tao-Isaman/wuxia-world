"use client";

import { useEffect, useState } from "react";

// A short landscape screen (a phone on its side, or held upright and turned
// by the landscape lock) — the menus use smaller cells there.
const QUERY = "(orientation: landscape) and (max-height: 500px), (orientation: portrait) and (max-width: 500px)";

export function useShortScreen(): boolean {
  const [short, setShort] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setShort(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return short;
}
