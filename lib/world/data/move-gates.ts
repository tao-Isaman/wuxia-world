// Stat gates on the way to a martial move are MOVE_STAT_GATE_SCALE of their
// authored value (rounded up, at least 1): lineage quests, saga chapters (sect
// and jianghu; not the main story), the sect trials that open them, quests
// whose reward teaches a move (lib/world/data/quests.ts) and manuals'
// reqValue (lib/world/data/items.ts). Content keeps the authored numbers;
// this is the one knob.
export const MOVE_STAT_GATE_SCALE = 0.5;

export function scaleMoveStat(min: number): number {
  return min <= 0 ? 0 : Math.max(1, Math.ceil(min * MOVE_STAT_GATE_SCALE));
}
