import type { WorldPresentation } from "./types";
import { getLocationMap } from "../world/data/location-maps";

/** Read-only scene response to an authored quest outcome. No simulation state. */
export function capitalVignette(location: string, clinicDelivered: boolean, ledgerRecovered = false): Pick<WorldPresentation, "props" | "bystanders" | "worldDescription"> {
  if (location !== "city_capital") return {};
  // The quest props stand beside the NPCs they belong to, wherever the map puts them.
  const spots = getLocationMap("city_capital")?.npcSpots ?? {};
  const lin = spots.city_capital_physician_lin ?? { x: 35, y: 58 };
  const qing = spots.city_capital_clerk_qing ?? { x: 41, y: 31 };
  const descriptions = [
    clinicDelivered ? "เสบียงยาส่งถึงคลินิกแล้ว หีบสมุนไพรวางข้างหมอหลิน และชาวบ้านมารอรับยา" : "",
    ledgerRecovered ? "หีบเอกสารข้างเสมียนนายฉิงเปิดอยู่ บัญชีคลังหลวงถูกนำออกมาแล้ว" : "",
  ].filter(Boolean);
  return {
    props: [
      { id: "clinic-medicines", image: "/art/props/clinic-supplies.png", x: lin.x - 2.7, y: lin.y - 0.5,
        width: 35, height: 29, visible: clinicDelivered },
      { id: "archive-chest", image: "/art/props/archive-chest.png", x: qing.x - 3.2, y: qing.y + 0.4,
        width: 31, height: 25, visible: !ledgerRecovered },
      // Both textures stay registered so a quest choice only toggles their
      // visibility, preserving the same canvas and conversation framing.
      // 1491×1055 source bounds: closed body x121..1370/floor1039;
      // open lower body x255..1216/floor1055. Match visible body width
      // and floor under the runtime's (0.5,0.05) sprite anchor.
      { id: "archive-chest-open", image: "/art/props/archive-chest-open.png", x: qing.x - 3.172, y: qing.y + 0.282,
        width: 40.3, height: 32.5, visible: ledgerRecovered },
    ],
    bystanders: [{ id: "clinic-patient", characterId: "elder", x: lin.x - 6.5, y: lin.y - 0.3,
      size: 51, facingLeft: false, visible: clinicDelivered }],
    worldDescription: descriptions.join(" ") || undefined,
  };
}
