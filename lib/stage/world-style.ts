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
export function drawWorldBadge(context: CanvasRenderingContext2D, exit: boolean, icon?: string): void {
  const glyph = icon?.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
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
  context.beginPath();
  if (exit) {
    context.moveTo(10, 22); context.lineTo(22, 10); context.lineTo(13, 10);
    context.moveTo(22, 10); context.lineTo(22, 19);
  } else if (glyph === "rest") {
    context.arc(16, 16, 7, Math.PI * 0.25, Math.PI * 1.65);
    context.moveTo(19, 10); context.lineTo(17, 16); context.lineTo(22, 20);
  } else if (glyph === "bag") {
    context.rect(9, 12, 14, 11);
    context.moveTo(12, 12); context.lineTo(12, 8); context.lineTo(20, 8); context.lineTo(20, 12);
  } else if (glyph === "sect") {
    context.moveTo(6, 10); context.lineTo(26, 10);
    context.moveTo(9, 14); context.lineTo(23, 14);
    context.moveTo(11, 9); context.lineTo(11, 24);
    context.moveTo(21, 9); context.lineTo(21, 24);
  } else if (glyph === "log") {
    context.rect(10, 8, 13, 16);
    context.moveTo(10, 9); context.lineTo(7, 9); context.lineTo(7, 14); context.lineTo(10, 14);
    context.moveTo(13, 13); context.lineTo(20, 13);
    context.moveTo(13, 18); context.lineTo(20, 18);
  } else if (glyph === "craft" || glyph === "skills") {
    context.moveTo(8, 24); context.lineTo(23, 9);
    context.moveTo(9, 9); context.lineTo(24, 24);
    context.moveTo(7, 18); context.lineTo(14, 25);
    context.moveTo(18, 25); context.lineTo(25, 18);
    if (glyph === "craft") {
      context.moveTo(18, 7); context.lineTo(25, 14);
      context.moveTo(20, 5); context.lineTo(27, 12);
    }
  } else {
    context.moveTo(16, 9); context.lineTo(16, 23);
    context.moveTo(9, 16); context.lineTo(23, 16);
  }
  context.stroke();
  context.fillRect(15, 33, 2, 2);
}
