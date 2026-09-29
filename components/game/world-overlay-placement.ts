type Box = { left: number; top: number; width: number; height: number };
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

/** Reposition the optional guide when it would cover the actor, keeping core HUD controls clear. */
export function protectActorFromGuide(host: HTMLElement): () => void {
  let moved: HTMLElement | null = null;
  let dx = 0, dy = 0;
  const timer = window.setInterval(() => {
    if (document.hidden) return;
    const guide = document.querySelector<HTMLElement>(".journey-guide:not(.journey-guide--inline)");
    if (!guide || getComputedStyle(guide).visibility === "hidden") return;
    if (guide !== moved) { moved = guide; dx = 0; dy = 0; }
    const x = Number(host.dataset.playerScreenX), y = Number(host.dataset.playerScreenY);
    const height = Number(host.dataset.playerScreenHeight);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !height) return;
    const bounds = host.getBoundingClientRect();
    const actor = { left: bounds.left + x - height * 0.42 - 10, top: bounds.top + y - height - 10, width: height * 0.84 + 20, height: height + 22 };
    const nearby = JSON.parse(host.dataset.nearbyScreenBounds ?? "[]") as Box[];
    const protectedBoxes = [actor, ...nearby.map((box) => ({ ...box, left: bounds.left + box.left, top: bounds.top + box.top }))];
    const rect = guide.getBoundingClientRect();
    const base = { left: rect.left - dx, top: rect.top - dy, width: rect.width, height: rect.height };
    const controls = [...document.querySelectorAll<HTMLElement>(".player-hud, .location-hud, .world-controls, .minimap, .command-toggle")]
      .map((element) => element.getBoundingClientRect());
    const lowerEdge = Math.min(bounds.bottom - 12, ...controls.filter((box) => box.top > bounds.height / 2).map((box) => box.top - 12));
    const right = Math.max(10, bounds.right - base.width - 10);
    const bottom = Math.max(10, lowerEdge - base.height);
    const candidates = [base, { ...base, left: right }, { ...base, top: bottom }, { ...base, left: right, top: bottom }];
    const score = (box: Box) => protectedBoxes.reduce((total, actorBox) => total + overlap(box, actorBox), 0) * 1000 + controls.reduce((total, control) => total + overlap(box, control), 0) * 20 +
      (Math.abs(box.left - base.left) + Math.abs(box.top - base.top)) * 0.01;
    const best = candidates.reduce((a, b) => score(a) <= score(b) ? a : b);
    const nextX = Math.round(best.left - base.left), nextY = Math.round(best.top - base.top);
    if (nextX !== dx || nextY !== dy) {
      dx = nextX; dy = nextY;
      guide.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }, 150);
  return () => { clearInterval(timer); if (moved) moved.style.transform = ""; };
}
