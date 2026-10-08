"use client";
import { useEffect, useRef } from "react";
import { CHARACTER_FEET_Y, CHARACTER_FRAME_SIZE, characterId, type CharacterMotion } from "@/lib/characters/catalog";
import { ATLAS_FIGURE, loadCharacterAtlas } from "@/lib/characters/sheet";

/** Small 2D previews share the normalized sprite atlas with the Phaser stages. */
export function CharacterPreview({ id, animate = false, motion = "idle", framing = "body" }: {
  id: string; animate?: boolean; motion?: CharacterMotion; framing?: "body" | "bust";
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Idle selection portraits do not need the north/south walking supplements.
    const needsDirections = motion === "walkNorth" || motion === "walkSouth";
    void loadCharacterAtlas(characterId(id), needsDirections).then(({ image, frameSize, feetY, columns, directional, clips, native, figure }) => {
      if (disposed || !canvas.current) return;
      const context = canvas.current.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = false;
      let index = 0;
      const clip = clips[!directional && (motion === "walkNorth" || motion === "walkSouth") ? "walk" : motion];
      // The square around the figure that a rigged 128 px cell would show: a PixelLab
      // figure then fills the preview as much as a rigged one does.
      const side = native ? figure * CHARACTER_FRAME_SIZE / ATLAS_FIGURE : frameSize;
      const left = (frameSize - side) / 2, top = feetY - side * CHARACTER_FEET_Y / CHARACTER_FRAME_SIZE;
      const unit = side / CHARACTER_FRAME_SIZE;
      const draw = () => {
        if (document.hidden) return;
        const frame = clip.frames[index];
        context.clearRect(0, 0, CHARACTER_FRAME_SIZE, CHARACTER_FRAME_SIZE);
        // Conversation thumbnails give the face and shoulders the available
        // space. The shared source atlas and full-body game sprites stay intact.
        const crop = framing === "bust" ? { x: 28, y: 8, width: 72, height: 72 } : { x: 0, y: 0, width: 128, height: 128 };
        context.drawImage(image, frame % columns * frameSize + left + crop.x * unit, Math.floor(frame / columns) * frameSize + top + crop.y * unit,
          crop.width * unit, crop.height * unit, 0, 0, CHARACTER_FRAME_SIZE, CHARACTER_FRAME_SIZE);
        index = animate && !preference.matches ? (index + 1) % clip.frames.length : 0;
      };
      draw();
      if (animate) timer = setInterval(draw, 1000 / clip.fps);
    }).catch(() => { /* The main scene exposes a retry if artwork cannot load. */ });
    return () => { disposed = true; if (timer) clearInterval(timer); };
  }, [id, animate, motion, framing]);
  return <canvas ref={canvas} width={128} height={128} className="character-preview"
    data-character-id={characterId(id)} aria-hidden="true" />;
}
