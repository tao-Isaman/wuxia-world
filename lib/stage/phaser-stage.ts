import * as Phaser from "phaser";

export interface Stage {
  game: Phaser.Game;
  /** Device pixels per CSS pixel the canvas is rendered at. */
  dpr: number;
  /** Size the drawing buffer to the parent (CSS px), keeping the canvas at 100 %. */
  fit(width: number, height: number): void;
  /** Tear the game down now: the canvas leaves the DOM immediately. */
  destroy(): void;
}

export interface StageOptions {
  /** Called once the scene exists; build the world here. */
  create: (scene: Phaser.Scene) => void;
  /** Called every frame with the frame delta in ms (clamped by the caller). */
  update: (time: number, delta: number) => void;
  /** The renderer lost its GPU context (WebGL only). */
  contextLost: () => void;
  /** Phaser failed to boot (no renderer available). */
  error: (cause: unknown) => void;
}

/**
 * One Phaser game per stage. WebGL (1) when available, otherwise the Canvas
 * renderer, so old phones and GPU-blocklisted browsers still get a picture.
 * Phaser owns the frame loop; input stays on the DOM so the React HUD, modal
 * focus rules and tests keep one source of truth.
 */
/** Device pixels per CSS pixel a stage renders at (capped for low-power GPUs). */
export const stagePixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

export function createStage(parent: HTMLElement, background: string, options: StageOptions): Stage {
  const dpr = stagePixelRatio();
  let destroyed = false;
  let canvasListener: HTMLCanvasElement | undefined;
  const onContextLost = (event: Event) => { event.preventDefault(); options.contextLost(); };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: Math.max(1, Math.round(parent.clientWidth * dpr)),
    height: Math.max(1, Math.round(parent.clientHeight * dpr)),
    backgroundColor: background,
    pixelArt: true,
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    scale: { mode: Phaser.Scale.NONE },
    render: { powerPreference: "low-power", antialias: false, antialiasGL: false },
    callbacks: {
      postBoot: (booted) => {
        const canvas = booted.canvas;
        canvas.setAttribute("aria-hidden", "true");
        styleCanvas(canvas);
        canvas.addEventListener("webglcontextlost", onContextLost);
        canvasListener = canvas;
        parent.dataset.rendererBackend = booted.renderer.type === Phaser.WEBGL ? "webgl" : "canvas";
      },
    },
    scene: {
      key: "stage",
      create(this: Phaser.Scene) {
        if (destroyed) return;
        try { options.create(this); } catch (error) { options.error(error); }
      },
      update(this: Phaser.Scene, time: number, delta: number) {
        if (destroyed) return;
        options.update(time, delta);
      },
    },
  });

  return {
    game,
    dpr,
    fit(width, height) {
      if (destroyed || !game.isBooted) return;
      const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
      if (game.scale.width !== w || game.scale.height !== h) game.scale.resize(w, h);
      styleCanvas(game.canvas);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      canvasListener?.removeEventListener("webglcontextlost", onContextLost);
      // Phaser tears down on its next step; take the canvas out right away so a
      // remount never shows two stages.
      game.canvas?.remove();
      game.destroy(true);
      delete parent.dataset.rendererBackend;
    },
  };
}

function styleCanvas(canvas: HTMLCanvasElement | undefined) {
  if (!canvas) return;
  canvas.style.setProperty("width", "100%", "important");
  canvas.style.setProperty("height", "100%", "important");
  canvas.style.display = "block";
  canvas.style.imageRendering = "pixelated";
}

/** A nearest-filtered texture from a canvas, replacing any texture with that key. */
export function canvasTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.addCanvas(key, canvas);
  if (!texture) throw new Error(`Texture ${key} could not be created`);
  return texture;
}

/** Register a grid of numbered frames (0…n-1, row-major) on a texture. */
export function addGridFrames(texture: Phaser.Textures.Texture, cell: number, columns: number, rows: number, cellHeight = cell) {
  for (let index = 0; index < columns * rows; index++) {
    texture.add(index, 0, (index % columns) * cell, Math.floor(index / columns) * cellHeight, cell, cellHeight);
  }
}

export function drawCanvas(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context unavailable");
  context.imageSmoothingEnabled = false;
  draw(context);
  return canvas;
}
