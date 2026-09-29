import assert from "node:assert/strict";
import { capitalVignette } from "../lib/stage/world-vignettes";

const initial = capitalVignette("city_capital", false, false);
const signature = (vignette: ReturnType<typeof capitalVignette>) =>
  (vignette.props ?? []).map(prop => `${prop.id}:${prop.image}`).join("|") +
  (vignette.bystanders ?? []).map(actor => `${actor.id}:${actor.characterId}`).join("|");

for (const clinic of [false, true]) {
  for (const recovered of [false, true]) {
    const vignette = capitalVignette("city_capital", clinic, recovered);
    const closed = vignette.props!.find(prop => prop.id === "archive-chest")!;
    const opened = vignette.props!.find(prop => prop.id === "archive-chest-open")!;
    assert.equal(closed.visible, !recovered);
    assert.equal(opened.visible, recovered);
    assert.equal(Number(closed.visible) + Number(opened.visible), 1, "exactly one chest is visible");
    // Source alpha measurements, at the existing sprite anchor (0.5,0.05).
    const closedWidth = closed.width * (1370 - 121) / 1491;
    const openWidth = opened.width * (1216 - 255) / 1491;
    const closedFloor = closed.y * 6.4 + (1039 / 1055 - 0.95) * closed.height;
    const openFloor = opened.y * 6.4 + (1055 / 1055 - 0.95) * opened.height;
    const closedCenter = closed.x * 9.6 + ((121 + 1370) / 2 / 1491 - 0.5) * closed.width;
    const openCenter = opened.x * 9.6 + ((255 + 1216) / 2 / 1491 - 0.5) * opened.width;
    assert.ok(Math.abs(closedWidth - openWidth) < 0.02, "open body matches visible closed-body width");
    assert.ok(Math.abs(closedFloor - openFloor) < 0.02, "open chest retains the same floor line");
    assert.ok(Math.abs(closedCenter - openCenter) < 0.02, "open body retains its horizontal anchor");
    assert.equal(signature(vignette), signature(initial), "visibility never changes the WorldCanvas resource signature");
    assert.equal(vignette.props!.find(prop => prop.id === "clinic-medicines")!.visible, clinic);
    assert.equal(vignette.bystanders!.find(actor => actor.id === "clinic-patient")!.visible, clinic);
    assert.equal(vignette.worldDescription?.includes("หมอหลิน") ?? false, clinic);
    assert.equal(vignette.worldDescription?.includes("หีบเอกสารข้างเสมียนนายฉิงเปิดอยู่") ?? false, recovered);
    assert.deepEqual(capitalVignette("city_capital", clinic, recovered), vignette, "the same saved facts reconstruct the same presentation");
  }
}
assert.deepEqual(capitalVignette("home_player", true, true), {});
assert.deepEqual(capitalVignette("city_changan", true, true), {});
assert.deepEqual(capitalVignette("city_capital", false), initial, "missing old-save flag preserves the closed state");
console.log("PASS capital vignette: exclusive chest state, stable resource IDs/images, calibrated visible body/floor, saved-fact reconstruction, clinic preserved, capital only");
