// Landscape only (see app/globals.css): when the viewport is portrait the body
// is turned 90° clockwise, so client (screen) coordinates no longer match the
// page's own. Pointer code converts through here.
//
// The body's transform is rotate(90deg) translateY(-100%) about its top-left,
// so a page point (x, y) lands on screen at (H − y, x), where H is the body's
// laid-out height (the screen's width). Inverse: x = clientY, y = H − clientX.

export interface PageRect { left: number; top: number; right: number; bottom: number; width: number; height: number }

/** True while the page is turned (the viewport is portrait). */
export function landscapeRotated(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(orientation: portrait)").matches;
}

const turnedHeight = () => document.body.offsetHeight;

/** A client (screen) point in page coordinates. */
export function toPagePoint(clientX: number, clientY: number): { x: number; y: number } {
  if (!landscapeRotated()) return { x: clientX, y: clientY };
  return { x: clientY, y: turnedHeight() - clientX };
}

/** A page point in client (screen) coordinates — the inverse of toPagePoint. */
export function toClientPoint(x: number, y: number): { x: number; y: number } {
  if (!landscapeRotated()) return { x, y };
  return { x: turnedHeight() - y, y: x };
}

/** An element's box in page coordinates (getBoundingClientRect, turned back). */
export function pageRect(element: Element): PageRect {
  const r = element.getBoundingClientRect();
  if (!landscapeRotated()) return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  const h = turnedHeight();
  return { left: r.top, top: h - r.right, right: r.bottom, bottom: h - r.left, width: r.height, height: r.width };
}
