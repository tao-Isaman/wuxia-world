// Where the game server is (docs/online.md). Online play shows only when one
// is set: `localStorage["wuxia-game-server"]` (tests, a local `wrangler dev`)
// wins over the build's `NEXT_PUBLIC_GAME_SERVER_URL`.
export const SERVER_OVERRIDE_KEY = "wuxia-game-server";

export function gameServerUrl(): string | null {
  try {
    const override = typeof localStorage === "undefined" ? null : localStorage.getItem(SERVER_OVERRIDE_KEY);
    if (override) return override.replace(/\/$/, "");
  } catch {
    // Storage blocked: fall back to the build's server.
  }
  const built = process.env.NEXT_PUBLIC_GAME_SERVER_URL;
  return built ? built.replace(/\/$/, "") : null;
}
