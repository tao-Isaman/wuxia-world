"use client";

import { useMemo } from "react";
import { markText, sliceSegments } from "@/lib/world";

/**
 * A line with its key words coloured (lib/world/text-marks.ts): **marked**
 * words, people, places, items, sects and numbers. `shown` cuts it to the
 * first visible characters for a typewriter.
 */
export function RichText({ text, shown }: { text: string; shown?: number }) {
  const segments = useMemo(() => markText(text), [text]);
  const visible = shown === undefined ? segments : sliceSegments(segments, shown);
  return <>{visible.map((segment, index) => segment.mark
    ? <strong key={index} className={`text-mark text-mark-${segment.mark}`} data-mark={segment.mark}>{segment.text}</strong>
    : <span key={index}>{segment.text}</span>)}</>;
}

/** How many characters the player reads in a line (the typewriter's end). */
export function visibleLength(text: string): number {
  return markText(text).reduce((n, segment) => n + segment.text.length, 0);
}
