// The sword tournament: registering, bouts and the champion's prize.
import { TOURNAMENT, currentTournament, entrantOpponentId, pickPrize, playerOpponent, prizeName, registerForTournament, startBlock, startTournament } from "@/lib/world/tournament";
import { applyEffect } from "@/lib/world/effects";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const tournamentActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "registerTournament" | "fightTournamentBout" | "pickTournamentPrize"> => ({
  registerTournament: () => {
    const draft = draftFrom(get());
    if (!registerForTournament(draft)) return false;
    appendActionLog(draft, "tournament", `ลงชื่อเข้าร่วมชุมนุมวิจารณ์กระบี่เขาหัวซาน · ค่าสมัคร ${TOURNAMENT.fee} ตำลึง`);
    set({ ...draft });
    return true;
  },

  fightTournamentBout: () => {
    const s = get();
    if (s.pendingBattle) return false;
    const draft = draftFrom(s);
    if (currentTournament(draft)?.status === "registered") {
      if (startBlock(draft) || !startTournament(draft)) return false;
      appendActionLog(draft, "tournament", "ชุมนุมวิจารณ์กระบี่เขาหัวซานเริ่มขึ้น — จับสลากสายการแข่งขันแล้ว");
    }
    const foe = playerOpponent(currentTournament(draft));
    const opponentId = foe ? entrantOpponentId(foe) : null;
    if (!opponentId) { set({ ...draft }); return false; }
    draft.pendingBattle = { opponentId, onWin: TOURNAMENT.locationId, onLose: TOURNAMENT.locationId, nonFatal: true, tournament: true };
    set({ ...draft });
    return true;
  },

  pickTournamentPrize: (slotId) => {
    const draft = draftFrom(get());
    const prize = pickPrize(draft, slotId);
    if (!prize) return false;
    applyEffect(draft, prize.kind === "skill" ? { t: "learnSkill", skillId: prize.id } : { t: "learnArt", artId: prize.id });
    appendActionLog(draft, "tournament", `รางวัลแชมป์ชุมนุมวิจารณ์กระบี่เขาหัวซาน · ได้เรียน ${prizeName(slotId)}`);
    set({ ...draft });
    return true;
  },
});
