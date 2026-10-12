"use client";

// A hero standing in an outfit, with the weapon they carry (the wardrobe's
// cards, docs/design/appearance.md). Only the one standing cell is recoloured,
// so a wall of previews costs little.
import { useEffect, useRef } from "react";
import { characterId } from "@/lib/characters/catalog";
import { loadCharacterAtlas } from "@/lib/characters/sheet";
import { frameBoxes, recolorSheet, type RecolorTint } from "@/lib/characters/outfit-recolor";

interface Props {
  body: string;
  tint: RecolorTint | null;
  /** A weapon on the back: its icon and its length as a share of the figure. */
  weapon?: { icon: string; carry: "back" | "waist"; length: number } | null;
  size?: number;
  className?: string;
}

const icons = new Map<string, Promise<HTMLImageElement>>();
function icon(url: string): Promise<HTMLImageElement> {
  let pending = icons.get(url);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`icon ${url}`));
      image.src = url;
    });
    icons.set(url, pending);
  }
  return pending;
}

export function OutfitPreview({ body, tint, weapon, size = 72, className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tintKey = JSON.stringify(tint);
  const weaponKey = JSON.stringify(weapon ?? null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const id = characterId(body === "f1" ? "f1" : "m1");
      const atlas = await loadCharacterAtlas(id, true);
      const target = canvas.current;
      if (!live || !target) return;
      const cell = atlas.frameSize;
      const frame = atlas.walk8Cells?.stand.S ?? 0;
      const sx = (frame % atlas.columns) * cell, sy = Math.floor(frame / atlas.columns) * cell;
      const work = document.createElement("canvas");
      work.width = cell; work.height = cell;
      const context = work.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(atlas.image, sx, sy, cell, cell, 0, 0, cell, cell);
      const pixels = context.getImageData(0, 0, cell, cell);
      const parsed = tintKey === "null" ? null : (JSON.parse(tintKey) as RecolorTint);
      if (parsed) recolorSheet(pixels.data, cell, cell, cell, id, parsed);
      context.putImageData(pixels, 0, 0);
      const box = frameBoxes(pixels.data, cell, cell, cell)[0];
      const out = target.getContext("2d");
      if (!out || !box) return;
      // Fit the figure (plus a little room) to the card.
      const height = box.bottom - box.top;
      const span = Math.max(height, box.right - box.left) * 1.12;
      const scale = target.width / span;
      const cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2;
      out.clearRect(0, 0, target.width, target.height);
      out.imageSmoothingEnabled = false;
      const draw = (image: CanvasImageSource, x: number, y: number, w: number, h: number) =>
        out.drawImage(image, (x - cx) * scale + target.width / 2, (y - cy) * scale + target.height / 2, w * scale, h * scale);
      // Facing the viewer, a weapon on the back shows behind the body; one at the waist in front.
      const carriedWeapon = JSON.parse(weaponKey) as Props["weapon"];
      const carried = carriedWeapon ? await icon(carriedWeapon.icon).catch(() => null) : null;
      if (!live) return;
      const drawWeapon = () => {
        if (!carried || !carriedWeapon) return;
        const length = carriedWeapon.length * height;
        const k = length / Math.hypot(carried.width, carried.height);
        const w = carried.width * k, h = carried.height * k;
        const x = cx + (carriedWeapon.carry === "back" ? 0 : 0.2 * (box.right - box.left)) - w / 2;
        const y = box.top + (carriedWeapon.carry === "back" ? 0.38 : 0.55) * height - h / 2;
        draw(carried, x, y, w, h);
      };
      if (carriedWeapon?.carry === "back") drawWeapon();
      draw(work, 0, 0, cell, cell);
      if (carriedWeapon?.carry === "waist") drawWeapon();
    })().catch(() => {});
    return () => { live = false; };
  }, [body, tintKey, weaponKey]);
  return <canvas ref={canvas} width={size * 2} height={size * 2} style={{ width: size, height: size }} className={className} aria-hidden="true" />;
}
