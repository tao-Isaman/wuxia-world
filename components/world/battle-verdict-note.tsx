"use client";

import { useBattleStore } from "@/store/battle-store";
import { cloudBattle, useCloudBattle } from "@/store/cloud-battle";

const ERROR_TEXT: Record<string, string> = {
  offline: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กำลังลองใหม่",
};

/**
 * Whether the result panel waits on the game server's verdict (a battle the
 * server checks, store/cloud-battle.ts), and the line it shows meanwhile.
 */
export function useVerdictNote(): React.ReactNode | undefined {
  const checked = useBattleStore((s) => s.seed !== null);
  const status = useCloudBattle((s) => s.status);
  const error = useCloudBattle((s) => s.error);
  if (!checked || status === "done" || status === "idle") return undefined;
  return (
    <p className="gb-verdict" data-testid="battle-verdict" data-status={status} aria-live="polite">
      {status === "error"
        ? <>{ERROR_TEXT[error ?? ""] ?? `เซิร์ฟเวอร์ตอบกลับ: ${error}`} <button type="button" className="pixel-action" onClick={() => void cloudBattle.again()}>ลองอีกครั้ง</button></>
        : "กำลังตรวจผลการต่อสู้กับเซิร์ฟเวอร์…"}
    </p>
  );
}
