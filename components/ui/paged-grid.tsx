"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface Props<T> {
  items: readonly T[];
  /** Smallest cell width (px); columns stretch to fill the row. */
  cellWidth: number;
  cellHeight: number;
  gap?: number;
  render: (item: T, index: number) => ReactNode;
  /** Key of an item, for React. */
  itemKey: (item: T) => string;
  /** Changing it (a new filter, say) goes back to page 1. */
  resetKey?: string;
  /** Jump to the page holding this item (the selected one). */
  focusKey?: string | null;
  empty?: ReactNode;
  label?: string;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// A grid that shows as many cells as fit its box and pages the rest
// (◀ n/m ▶) — the landscape menus never scroll a long collection.
export function PagedGrid<T>({ items, cellWidth, cellHeight, gap = 6, render, itemKey, resetKey, focusKey, empty, label }: Props<T>) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ cols: 1, rows: 1 });
  const [page, setPage] = useState(0);

  useIsoLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth: w, clientHeight: h } = element;
      const cols = Math.max(1, Math.floor((w + gap) / (cellWidth + gap)));
      const rows = Math.max(1, Math.floor((h + gap) / (cellHeight + gap)));
      setFit((old) => (old.cols === cols && old.rows === rows ? old : { cols, rows }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cellWidth, cellHeight, gap]);

  const size = fit.cols * fit.rows;
  const pages = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => { setPage(0); }, [resetKey]);
  useEffect(() => {
    if (!focusKey) return;
    const index = items.findIndex((item) => itemKey(item) === focusKey);
    if (index >= 0) setPage(Math.floor(index / size));
    // Only when the focused item or the page size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, size]);
  const current = Math.min(page, pages - 1);
  const shown = items.slice(current * size, current * size + size);

  return (
    <div className="paged-grid" aria-label={label}>
      <div ref={box} className="paged-grid-cells"
        style={{ gridTemplateColumns: `repeat(${fit.cols}, minmax(0, 1fr))`, gridAutoRows: `${cellHeight}px`, gap: `${gap}px` }}>
        {items.length === 0 ? <div style={{ gridColumn: "1 / -1" }}>{empty}</div> : shown.map((item, i) => (
          <div key={itemKey(item)} style={{ minWidth: 0 }}>{render(item, current * size + i)}</div>
        ))}
      </div>
      <div className="paged-grid-pager" style={{ visibility: pages > 1 ? "visible" : "hidden" }} data-testid="paged-grid-pager">
        <button type="button" aria-label="หน้าก่อน" disabled={current === 0} onClick={() => setPage(current - 1)}>◀</button>
        <span>{current + 1} / {pages}</span>
        <button type="button" aria-label="หน้าถัดไป" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>▶</button>
      </div>
    </div>
  );
}
