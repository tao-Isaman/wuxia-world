import type { WorldPresentation } from "./types";

/** Read-only scene response to an authored quest outcome. No simulation state. */
export function capitalVignette(location: string, clinicDelivered: boolean, ledgerRecovered = false): Pick<WorldPresentation, "props" | "bystanders" | "worldDescription"> {
  if (location !== "city_capital") return {};
  const descriptions = [
    clinicDelivered ? "เสบียงยาส่งถึงคลินิกแล้ว หีบสมุนไพรวางข้างหมอหลิน และชาวบ้านมารอรับยา" : "",
    ledgerRecovered ? "หีบเอกสารข้างเสมียนนายฉิงเปิดอยู่ บัญชีคลังหลวงถูกนำออกมาแล้ว" : "",
  ].filter(Boolean);
  return {
    props: [
      { id: "clinic-medicines", image: "/art/props/clinic-supplies.png", x: 32.3, y: 57.5,
        width: 35, height: 29, visible: clinicDelivered },
      { id: "archive-chest", image: "/art/props/archive-chest.png", x: 37.8, y: 31.4,
        width: 31, height: 25, visible: !ledgerRecovered },
      // Both textures stay registered so a quest choice only toggles their
      // visibility, preserving the same canvas and conversation framing.
      // 1491×1055 source bounds: closed body x121..1370/floor1039;
      // open lower body x255..1216/floor1055. Match visible body width
      // and floor under the runtime's (0.5,0.05) sprite anchor.
      { id: "archive-chest-open", image: "/art/props/archive-chest-open.png", x: 37.828, y: 31.282,
        width: 40.3, height: 32.5, visible: ledgerRecovered },
    ],
    bystanders: [{ id: "clinic-patient", characterId: "elder", x: 28.5, y: 57.7,
      size: 51, facingLeft: false, visible: clinicDelivered }],
    worldDescription: descriptions.join(" ") || undefined,
  };
}
