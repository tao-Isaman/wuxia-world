/**
 * Match the painted world's warm light without changing source artwork or
 * alpha. Baked once into the atlas pixels (in linear light, as the old shader
 * did) so both the WebGL and Canvas renderers show the same ink.
 */
export function warmWorldCharacter(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const toLinear = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    toLinear[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
  const toSrgb = (c: number) => {
    const v = Math.min(1, Math.max(0, c));
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055) * 255);
  };
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const r = toLinear[pixels[i]], g = toLinear[pixels[i + 1]], b = toLinear[pixels[i + 2]];
    const ink = r * 0.2126 + g * 0.7152 + b * 0.0722;
    pixels[i] = toSrgb((ink * 1.06 * 0.22 + r * 0.78) * 0.97 + 0.005);
    pixels[i + 1] = toSrgb((ink * 0.22 + g * 0.78) * 0.94 + 0.004);
    pixels[i + 2] = toSrgb((ink * 0.86 * 0.22 + b * 0.78) * 0.86 + 0.002);
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

/** Small semantic map signs use a shared muted palette, not inventory thumbnails. */
type Pen = CanvasRenderingContext2D;
const line = (c: Pen, ...points: number[]) => {
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
};
const circle = (c: Pen, x: number, y: number, r: number, from = 0, to = Math.PI * 2) => {
  c.moveTo(x + r * Math.cos(from), y + r * Math.sin(from));
  c.arc(x, y, r, from, to);
};

/**
 * One line-art glyph per map activity, so a forge, a fishing spot and a chess
 * table read differently at a glance. Keys are the marker's `badge`: service
 * kinds (shop, sect, rest, rumor, practice, gate…) and life-skill ids.
 */
const GLYPHS: Record<string, (c: Pen) => void> = {
  rest: (c) => { c.arc(16, 16, 7, Math.PI * 0.25, Math.PI * 1.65); line(c, 19, 10, 17, 16, 22, 20); },
  shop: (c) => { c.rect(9, 12, 14, 11); line(c, 12, 12, 12, 8, 20, 8, 20, 12); },
  bag: (c) => GLYPHS.shop(c),
  sect: (c) => { line(c, 6, 10, 26, 10); line(c, 9, 14, 23, 14); line(c, 11, 9, 11, 24); line(c, 21, 9, 21, 24); },
  log: (c) => { c.rect(10, 8, 13, 16); line(c, 10, 9, 7, 9, 7, 14, 10, 14); line(c, 13, 13, 20, 13); line(c, 13, 18, 20, 18); },
  // Wine jug with a speech tick: gossip at the inn.
  rumor: (c) => { line(c, 13, 8, 19, 8); line(c, 14, 8, 14, 12, 10, 16, 10, 24, 22, 24, 22, 16, 18, 12, 18, 8); line(c, 24, 9, 27, 7); line(c, 24, 13, 28, 13); },
  // Seated figure: meditation / practice.
  practice: (c) => { circle(c, 16, 9, 3); line(c, 16, 12, 16, 19); line(c, 9, 16, 16, 14, 23, 16); line(c, 8, 23, 16, 19, 24, 23, 8, 23); },
  skills: (c) => { line(c, 8, 24, 23, 9); line(c, 9, 9, 24, 24); line(c, 7, 18, 14, 25); line(c, 18, 25, 25, 18); },
  craft: (c) => { GLYPHS.skills(c); line(c, 18, 7, 25, 14); line(c, 20, 5, 27, 12); },
  // Crafts.
  forge: (c) => { c.rect(9, 8, 14, 6); line(c, 16, 14, 16, 25); line(c, 7, 25, 25, 25); },
  alchemy: (c) => { line(c, 13, 7, 19, 7); line(c, 14, 7, 14, 13, 9, 23, 23, 23, 18, 13, 18, 7); line(c, 11, 18, 21, 18); },
  tailoring: (c) => { line(c, 8, 24, 24, 8); circle(c, 22, 10, 2); c.moveTo(8, 24); c.quadraticCurveTo(6, 14, 14, 16); c.quadraticCurveTo(20, 18, 18, 25); },
  chef: (c) => { line(c, 7, 16, 25, 16); c.moveTo(7, 16); c.quadraticCurveTo(16, 30, 25, 16); line(c, 19, 5, 13, 14); line(c, 23, 6, 16, 14); },
  jewelry: (c) => { line(c, 10, 11, 13, 7, 19, 7, 22, 11, 16, 25, 10, 11, 22, 11); line(c, 13, 11, 16, 25, 19, 11); },
  accessory: (c) => { line(c, 9, 6, 16, 14, 23, 6); circle(c, 16, 19, 5); line(c, 16, 16, 16, 22); },
  // Gathering.
  mining: (c) => { c.moveTo(7, 12); c.quadraticCurveTo(16, 4, 25, 12); line(c, 16, 8, 12, 26); },
  woodcutting: (c) => { line(c, 11, 26, 18, 7); line(c, 15, 9, 23, 9, 24, 15, 17, 16); },
  fishing: (c) => { line(c, 9, 25, 22, 6); line(c, 22, 6, 22, 16); circle(c, 19, 19, 3, 0, Math.PI); line(c, 16, 19, 16, 17); },
  herbalism: (c) => { c.moveTo(16, 26); c.quadraticCurveTo(6, 16, 16, 6); c.quadraticCurveTo(26, 16, 16, 26); line(c, 16, 26, 16, 10); line(c, 16, 18, 12, 15); line(c, 16, 15, 20, 12); },
  hunting: (c) => { c.moveTo(11, 6); c.quadraticCurveTo(24, 16, 11, 26); line(c, 11, 6, 11, 26); line(c, 7, 16, 26, 16); line(c, 22, 13, 26, 16, 22, 19); },
  venom: (c) => { c.moveTo(16, 6); c.quadraticCurveTo(24, 16, 22, 21); c.arc(16, 20, 6, 0.2, Math.PI - 0.2); c.quadraticCurveTo(8, 16, 16, 6); line(c, 13, 18, 19, 22); line(c, 19, 18, 13, 22); },
  // Social.
  chess: (c) => { c.rect(7, 7, 18, 18); line(c, 13, 7, 13, 25); line(c, 19, 7, 19, 25); line(c, 7, 13, 25, 13); line(c, 7, 19, 25, 19); circle(c, 16, 16, 3); },
  begging: (c) => { line(c, 7, 17, 25, 17); c.moveTo(7, 17); c.quadraticCurveTo(16, 29, 25, 17); circle(c, 16, 11, 3); },
  // Jail.
  gate: (c) => { c.rect(8, 7, 16, 19); line(c, 12, 7, 12, 26); line(c, 16, 7, 16, 26); line(c, 20, 7, 20, 26); line(c, 8, 16, 24, 16); },
  labor: (c) => { circle(c, 11, 21, 5); line(c, 18, 8, 25, 15); line(c, 21, 11, 14, 18); },
  dice: (c) => { c.rect(8, 8, 16, 16); circle(c, 12, 12, 1.2); circle(c, 16, 16, 1.2); circle(c, 20, 20, 1.2); },
  escape: (c) => { line(c, 9, 26, 9, 8, 23, 8, 23, 26); line(c, 14, 17, 26, 17); line(c, 22, 13, 26, 17, 22, 21); },
};

export function drawWorldBadge(context: CanvasRenderingContext2D, exit: boolean, glyph?: string): void {
  const key = glyph?.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  context.fillStyle = exit ? "rgba(49, 66, 46, 0.90)" : "rgba(63, 57, 39, 0.90)";
  context.strokeStyle = exit ? "#acbd94" : "#bca97c";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(8, 3); context.lineTo(24, 3); context.lineTo(29, 8); context.lineTo(29, 24);
  context.lineTo(24, 29); context.lineTo(8, 29); context.lineTo(3, 24); context.lineTo(3, 8); context.closePath();
  context.fill(); context.stroke();
  context.strokeStyle = exit ? "#d3dbb4" : "#e1cf9d";
  context.fillStyle = context.strokeStyle;
  context.lineWidth = 2;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  if (exit) {
    line(context, 10, 22, 22, 10, 13, 10);
    line(context, 22, 10, 22, 19);
  } else if (GLYPHS[key]) {
    GLYPHS[key](context);
  } else {
    line(context, 16, 9, 16, 23);
    line(context, 9, 16, 23, 16);
  }
  context.stroke();
  context.fillRect(15, 33, 2, 2);
}

/** Badge keys that have their own glyph (for tests / previews). */
export const WORLD_BADGE_GLYPHS = Object.keys(GLYPHS);
