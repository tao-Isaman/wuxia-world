// Positions follow the painted lanterns, in the same 960x640 ground coordinates.
const LANTERNS: Record<string, readonly [number, number][]> = {
  home_player: [[270, 151], [313, 143], [390, 122], [420, 112], [448, 106]],
  city_capital: [[713, 196], [739, 206], [772, 210], [802, 202], [236, 171]],
};

const WIDTH = 960;
const HEIGHT = 640;
const DAY = [0.69, 0.40, 0.16] as const;
const NIGHT = [0.035, 0.075, 0.18] as const;
const LAMP = [1, 0.64, 0.22] as const;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * A flat lighting veil drawn into a canvas: the time-of-day wash plus
 * quantized lantern pools at night. Pixel textures stay untouched and labels
 * stay above it. The caller shows `canvas` at `opacity` and re-uploads it
 * whenever `update` reports a change.
 */
export function createWorldLighting(location: string) {
  const lamps = LANTERNS[location] ?? [];
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let drawnNight = -1;
  let drawnFlicker = -1;
  let lastDraw = -Infinity;
  const state = { canvas, opacity: 0 };

  function draw(night: number, flicker: number) {
    if (!context) return;
    const ambient = DAY.map((day, index) => day + (NIGHT[index] - day) * night);
    context.fillStyle = `rgb(${ambient.map((c) => Math.round(c * 255)).join(",")})`;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    if (!night || !lamps.length) return;
    for (const [lampX, lampY] of lamps) {
      const left = Math.max(0, lampX - 48), top = Math.max(0, lampY - 32);
      const width = Math.min(WIDTH, lampX + 48) - left, height = Math.min(HEIGHT, lampY + 68) - top;
      const image = context.getImageData(left, top, width, height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = left + x + 0.5, py = top + y + 0.5;
          let light = 0;
          for (const [lx, ly] of lamps) {
            const glow = 1 - smoothstep(2, 31, Math.hypot(px - lx, py - ly));
            const pool = 1 - smoothstep(2, 47, Math.hypot(px - lx, (py - ly - 42) / 0.52));
            light = Math.max(light, glow * 0.94, pool * 0.55);
          }
          light = Math.floor(light * 12) / 12 * night * flicker;
          const offset = (y * width + x) * 4;
          for (let channel = 0; channel < 3; channel++) {
            image.data[offset + channel] = Math.round((ambient[channel] + (LAMP[channel] - ambient[channel]) * light) * 255);
          }
          image.data[offset + 3] = 255;
        }
      }
      context.putImageData(image, left, top);
    }
  }

  return Object.assign(state, {
    /** Returns true when the canvas pixels changed and need re-uploading. */
    update(time: number, elapsed: number, reducedMotion: boolean): boolean {
      const hour = ((time % 12) + 12) % 12;
      const night = hour >= 8 ? Math.min(1, (hour - 7) / 2) : 0;
      state.opacity = night ? 0.13 + night * 0.34 : hour < 4 ? 0.025 : 0.012;
      const flicker = reducedMotion || !lamps.length ? 1 : 0.97 + Math.sin(elapsed * 2.1) * 0.02 + Math.sin(elapsed * 3.7) * 0.01;
      const nightStep = Math.round(night * 50) / 50;
      // Lantern flicker redraws at ~10 fps; a wash-only veil redraws on change.
      const flickerDue = night > 0 && lamps.length > 0 && elapsed - lastDraw >= 0.1 && Math.abs(flicker - drawnFlicker) > 0.002;
      if (nightStep === drawnNight && !flickerDue) return false;
      draw(nightStep, flicker);
      drawnNight = nightStep;
      drawnFlicker = flicker;
      lastDraw = elapsed;
      return true;
    },
  });
}
