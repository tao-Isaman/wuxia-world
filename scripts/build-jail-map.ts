// Paints the prison courtyard map (public/maps/jail.png) procedurally.
// Run: bun scripts/build-jail-map.ts   (uses the pre-installed Chromium)
//
// Drawn on a 768×512 pixel grid (world units × 0.8) and doubled with
// nearest-neighbour to the 1536×1024 size every painted map uses. Layout
// matches LOCATION_MAPS.jail and the jail footprints in world-navigation.ts.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

function paint() {
  const W = 768, H = 512, S = 0.8;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const px = (x: number) => Math.round(x * S);
  const rect = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(px(x), px(y), Math.max(1, px(w)), Math.max(1, px(h))); };
  const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
    c.fillStyle = color; c.beginPath(); c.ellipse(px(x), px(y), px(rx), px(ry), 0, 0, Math.PI * 2); c.fill();
  };
  const speckle = (x: number, y: number, w: number, h: number, colors: string[], density: number) => {
    for (let i = 0; i < w * h * S * S * density; i++) {
      c.fillStyle = colors[Math.floor(rnd() * colors.length)];
      c.fillRect(px(x + rnd() * w), px(y + rnd() * h), 1 + (rnd() < 0.3 ? 1 : 0), 1);
    }
  };
  const bricks = (x: number, y: number, w: number, h: number, base: string, mortar: string, light: string) => {
    rect(x, y, w, h, mortar);
    const bh = 14, bw = 30;
    for (let row = 0; row * bh < h; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col * bw < w; col++) {
        const bx = x + col * bw + off, by = y + row * bh;
        const left = Math.max(x, bx + 1), right = Math.min(x + w, bx + bw - 1);
        if (right <= left) continue;
        const tone = rnd();
        rect(left, by + 1, right - left, Math.min(bh - 2, y + h - by - 1), tone < 0.2 ? light : base);
        if (tone > 0.85) rect(left + 3, by + 3, 4, 2, mortar);
      }
    }
  };

  // Courtyard: packed earth with grit, a flagstone path from gate to cells.
  rect(0, 0, 960, 640, "#6f5c45");
  speckle(0, 0, 960, 640, ["#645240", "#7a6750", "#5d4b39", "#83705a"], 0.09);
  for (let y = 200; y < 600; y += 26) {
    for (let x = 440; x < 520; x += 40) {
      const jitter = (rnd() - 0.5) * 6;
      rect(x + jitter + 2, y + 2, 34, 21, "#857a69");
      rect(x + jitter + 2, y + 2, 34, 3, "#9a8f7c");
      rect(x + jitter + 2, y + 21, 34, 2, "#5f5547");
    }
  }
  // Worn ground under the cell block and at the gate.
  speckle(40, 190, 880, 40, ["#5b4a38", "#54442f"], 0.2);

  // Cell block (north): tiled roof, stone face, four barred cells.
  rect(0, 0, 960, 70, "#2e2b30");
  for (let x = 0; x < 960; x += 16) { rect(x, 6, 12, 56, "#3b3840"); rect(x, 6, 12, 4, "#4c4952"); }
  rect(0, 62, 960, 10, "#1f1c20");
  bricks(0, 72, 960, 118, "#7d7a74", "#4e4b47", "#94918a");
  rect(0, 176, 960, 14, "#3f3c38");
  const cells = [[110, 270], [300, 460], [500, 660], [690, 850]];
  for (const [left, right] of cells) {
    rect(left, 92, right - left, 84, "#1d1916");
    // Straw bedding and a bucket inside.
    speckle(left + 6, 150, right - left - 12, 24, ["#8c7440", "#a5894d", "#6f5a31"], 0.5);
    rect(right - 34, 144, 16, 22, "#4a3a28"); rect(right - 34, 144, 16, 3, "#6a5439");
    // Lintel and iron bars.
    rect(left - 6, 84, right - left + 12, 10, "#5c5953");
    rect(left - 6, 84, right - left + 12, 3, "#8e8a82");
    for (let x = left + 8; x < right - 4; x += 15) { rect(x, 94, 4, 82, "#3a3f45"); rect(x, 94, 1, 82, "#7b848d"); }
    rect(left, 118, right - left, 4, "#3a3f45"); rect(left, 118, right - left, 1, "#7b848d");
  }
  // Wall lanterns between cells.
  for (const x of [285, 480, 675]) {
    rect(x - 5, 100, 10, 16, "#c43a2a"); rect(x - 5, 100, 10, 3, "#f1b24a"); rect(x - 1, 94, 2, 6, "#2a2522");
    ellipse(x, 125, 18, 8, "rgba(255,190,90,0.12)");
  }

  // Side and south walls.
  bricks(0, 190, 40, 450, "#76736d", "#4b4844", "#8e8b84");
  bricks(920, 190, 40, 450, "#76736d", "#4b4844", "#8e8b84");
  bricks(0, 600, 430, 40, "#76736d", "#4b4844", "#8e8b84");
  bricks(530, 600, 430, 40, "#76736d", "#4b4844", "#8e8b84");
  rect(40, 596, 390, 4, "#3a3733"); rect(530, 596, 390, 4, "#3a3733");
  // South gate: heavy iron grille between stone posts.
  rect(418, 578, 16, 62, "#5d5a55"); rect(526, 578, 16, 62, "#5d5a55");
  rect(418, 578, 16, 4, "#8f8b84"); rect(526, 578, 16, 4, "#8f8b84");
  rect(434, 604, 92, 36, "#22201e");
  for (let x = 438; x < 524; x += 11) { rect(x, 598, 4, 42, "#3d4248"); rect(x, 598, 1, 42, "#80898f"); }
  rect(434, 612, 92, 4, "#3d4248"); rect(434, 628, 92, 4, "#3d4248");
  rect(474, 616, 12, 10, "#b08a3a");
  for (const x of [404, 556]) { rect(x - 5, 580, 10, 14, "#c43a2a"); rect(x - 5, 580, 10, 3, "#f1b24a"); ellipse(x, 600, 16, 7, "rgba(255,190,90,0.14)"); }

  // East wall crack: loose bricks and rubble (the risky way out).
  rect(918, 286, 10, 60, "#3a3632");
  for (const [x, y] of [[912, 300], [905, 322], [914, 338], [900, 352]]) rect(x, y, 10, 7, "#8e8b84");
  speckle(880, 340, 36, 26, ["#8e8b84", "#6a675f", "#5a5650"], 0.5);

  // Labour yard (south-west): rock pile, broken stone, a millstone.
  const rocks: [number, number, number][] = [[110, 476, 26], [146, 468, 30], [178, 484, 22], [128, 500, 24], [164, 504, 20], [96, 500, 16]];
  for (const [x, y, r] of rocks) { ellipse(x, y + 4, r, r * 0.6, "#3f3a33"); ellipse(x, y, r, r * 0.7, "#8a857b"); ellipse(x - r * 0.3, y - r * 0.25, r * 0.45, r * 0.3, "#a7a296"); }
  speckle(70, 510, 150, 40, ["#8a857b", "#6d685f", "#a09b8f"], 0.25);
  ellipse(262, 528, 32, 20, "#5b5750"); ellipse(262, 524, 32, 19, "#8f8b83"); ellipse(262, 524, 8, 5, "#4a4640");
  rect(228, 500, 6, 34, "#6b4a2a"); // lever
  // Hammer resting on the pile.
  rect(186, 452, 34, 5, "#6b4a2a"); rect(214, 446, 10, 16, "#51565c");

  // Straw sleeping mats (west, below the cells).
  for (const [x, y] of [[140, 262], [214, 272]]) {
    rect(x, y, 60, 28, "#a5894d"); rect(x, y, 60, 3, "#c4a765");
    speckle(x, y, 60, 28, ["#8c7440", "#c4a765", "#6f5a31"], 0.6);
  }

  // Water trough (centre-west).
  rect(356, 318, 88, 30, "#5a3f26"); rect(362, 322, 76, 18, "#3d6f86"); rect(362, 322, 76, 4, "#6aa3ba");

  // Meditation corner (north-east): round mat by the last cell.
  ellipse(768, 262, 30, 14, "#6d2f2a"); ellipse(768, 260, 26, 11, "#8e3d34"); ellipse(768, 260, 10, 4, "#b25a45");

  // Guard post (south-east): desk with dice bowl, stool, lantern, weapon rack.
  rect(700, 400, 120, 45, "#5a3a22"); rect(700, 400, 120, 8, "#7a5231"); rect(706, 445, 8, 14, "#3d2716"); rect(806, 445, 8, 14, "#3d2716");
  ellipse(740, 408, 12, 5, "#2e2a26"); rect(734, 404, 4, 4, "#efe6d2"); rect(742, 406, 4, 4, "#efe6d2");
  rect(790, 392, 10, 14, "#c43a2a"); rect(790, 392, 10, 3, "#f1b24a"); ellipse(795, 420, 26, 10, "rgba(255,190,90,0.12)");
  rect(760, 462, 20, 14, "#6b4a2a"); // stool
  rect(884, 430, 30, 70, "#4a3220"); rect(884, 430, 30, 5, "#6a4a30");
  for (const x of [890, 900, 910]) { rect(x, 400, 3, 60, "#8b8f94"); rect(x - 2, 398, 7, 6, "#51565c"); }

  // Soft shadow along walls.
  c.fillStyle = "rgba(20,14,10,0.18)";
  c.fillRect(px(40), px(190), px(880), px(18));
  c.fillRect(px(40), px(190), px(14), px(410));
  c.fillRect(px(906), px(190), px(14), px(410));

  const out = document.createElement("canvas");
  out.width = W * 2; out.height = H * 2;
  const o = out.getContext("2d")!;
  o.imageSmoothingEnabled = false;
  o.drawImage(canvas, 0, 0, W * 2, H * 2);
  return out.toDataURL("image/png");
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
const url = await page.evaluate(paint);
writeFileSync("public/maps/jail.png", Buffer.from(url.split(",")[1], "base64"));
await browser.close();
console.log("wrote public/maps/jail.png");
