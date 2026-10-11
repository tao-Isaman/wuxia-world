// What the game server's TypeScript half answers (server/worker/ts,
// docs/online.md "The shared world" and "Battles on the server"). Types only,
// shared by the browser and the server.
import type { BattleCommand, BattleStartOpts } from "@/lib/game/grid/session";
import type { CharacterBuild } from "@/lib/game/types";
import type { SharedWorld } from "@/lib/world/shared/world";
import type { VictorySpoils } from "@/lib/world/spoils";

/** `GET /world[?rev=N]`: the one world everyone plays in (or `same` when `rev` is current). */
export type WorldReply =
  | { rev: number; same: true }
  | { rev: number; same?: false; day: number; time: number; world: SharedWorld };

/** What the hero did, as the jianghu will tell it (`POST /world/echo`); the server writes the rumor. */
export interface EchoRequest {
  actionId: string;
  targetNpcId?: string;
  /** How people know the hero (an archetype label), where it happened, and the sect it concerns. */
  context: { archetype: string; sceneId: string | null; sectId: string | null };
  /** People this hero has open business with (their quests' givers): the simulation keeps them home. */
  pins?: string[];
}

/** `POST /characters/<id>/battle/start`: the fight as the server staged it from the saved state. */
export interface BattleStartReply {
  battleId: string;
  seed: number;
  start: { a: CharacterBuild; b: CharacterBuild; opts: BattleStartOpts };
}

/** `POST /characters/<id>/battle/log` / `finish` body. */
export interface BattleLogRequest {
  battleId: string;
  /** Index of the first command in `commands` (the server keeps how many it has). */
  from: number;
  commands: BattleCommand[];
}

/** `POST /characters/<id>/battle/finish`: the outcome as the server replayed it, and what it pays. */
export interface BattleVerdict {
  battleId: string;
  winner: "A" | "B" | null;
  escaped: boolean;
  hA: number;
  mpA: number;
  itemsUsed: Record<string, number>;
  /** The spoils of a win (rolled by the server; null otherwise). */
  spoils: VictorySpoils | null;
}
