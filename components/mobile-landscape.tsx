"use client";
// The game stage uses the real viewport. Rotating DOM ancestors breaks pointer mapping;
// the game now adapts naturally to portrait and landscape.
export function MobileLandscape({ children }: { children: React.ReactNode }) {
  return <div className="game-shell">{children}</div>;
}
