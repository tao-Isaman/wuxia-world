import type { SpriteMaterial } from "three";

/** Match the painted world's warm light without changing source artwork or alpha. */
export function warmWorldCharacter(material: SpriteMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #include <map_fragment>
      float inkLight = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 warmInk = inkLight * vec3(1.06, 1.0, 0.86);
      diffuseColor.rgb = mix(warmInk, diffuseColor.rgb, 0.78) * vec3(0.97, 0.94, 0.86);
      diffuseColor.rgb += vec3(0.005, 0.004, 0.002);
    `);
  };
  material.customProgramCacheKey = () => "world-warm-ink-v1";
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
