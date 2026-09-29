param([string]$ReportPath)

# Read-only source-art audit. Uses the same exported source-cell calculation as
# the atlas loader; System.Drawing reads alpha without changing the PNGs.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public sealed class FrameAudit {
 public int Index, X, Y, Width, Height, Pixels, CutPixels;
}
public sealed class SheetAudit {
 public int Width, Height, Pixels, AssignedPixels, CutPixels, UnassignedPixels, OverlappingPixels;
 public FrameAudit[] Frames;
}
public static class CharacterSourceAudit {
 public static SheetAudit Analyze(string path, int[] regions) {
  using (var bitmap = new Bitmap(path)) {
   var data = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
   var pixels = new byte[data.Stride * data.Height];
   Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
   bitmap.UnlockBits(data);
   var result = new SheetAudit { Width = bitmap.Width, Height = bitmap.Height };
   int frameCount = 0;
   var owners = new int[bitmap.Width * bitmap.Height];
   for (int offset = 0; offset < regions.Length; offset += 5) {
    int frame = regions[offset] + 1;
    int sx = regions[offset + 1], sy = regions[offset + 2], ex = sx + regions[offset + 3], ey = sy + regions[offset + 4];
    if (sx < 0 || sy < 0 || ex > bitmap.Width || ey > bitmap.Height || ex <= sx || ey <= sy) throw new Exception("Invalid source region");
    frameCount = Math.Max(frameCount, frame);
    for (int y = sy; y < ey; y++) for (int x = sx; x < ex; x++) {
     int p = y * bitmap.Width + x;
     if (owners[p] != 0) result.OverlappingPixels++;
     owners[p] = frame;
    }
   }
   var frames = new FrameAudit[frameCount];
   for (int f = 0; f < frameCount; f++) frames[f] = new FrameAudit { Index = f, X = bitmap.Width, Y = bitmap.Height, Width = -1, Height = -1 };
   for (int y = 0; y < bitmap.Height; y++) for (int x = 0; x < bitmap.Width; x++) {
     int owner = owners[y * bitmap.Width + x];
     if (owner == 0) result.UnassignedPixels++;
     if (pixels[y * data.Stride + x * 4 + 3] < 32) continue;
     result.Pixels++;
     if (owner == 0) continue;
     result.AssignedPixels++;
     var frame = frames[owner - 1];
     frame.Pixels++;
     frame.X = Math.Min(frame.X, x); frame.Width = Math.Max(frame.Width, x); frame.Y = Math.Min(frame.Y, y); frame.Height = Math.Max(frame.Height, y);
     // Same-frame region edges are harmless. A visible 8-connected stroke
     // crossing between different pose owners proves a crop cuts the artwork.
     bool split = false;
      for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
       int nx = x + dx, ny = y + dy;
       if (nx < 0 || ny < 0 || nx >= bitmap.Width || ny >= bitmap.Height) continue;
       if (owners[ny * bitmap.Width + nx] == owner) continue;
       if (pixels[ny * data.Stride + nx * 4 + 3] >= 32) split = true;
      }
     if (split) { frame.CutPixels++; result.CutPixels++; }
   }
   foreach (var frame in frames) { frame.Width = frame.Width - frame.X + 1; frame.Height = frame.Height - frame.Y + 1; }
   result.Frames = frames;
   return result;
  }
 }
}
'@

$specCode = @'
import { readFileSync } from "node:fs";
import { CHARACTER_IDS, CHARACTER_SHEET_LAYOUTS, CHARACTER_DIRECTION_LAYOUTS, hasDirectionalSheet } from "./lib/characters/catalog";
import { characterSourceCells } from "./lib/characters/sheet";
const specs = CHARACTER_IDS.flatMap((id) => [false, ...(hasDirectionalSheet(id) ? [true] : [])].map((directions) => {
  const file = `public/art/characters/${id}${directions ? "-directions" : ""}.png`;
  const png = readFileSync(file);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), rows = directions ? 2 : 4;
  const flatten = (cells) => cells.flatMap(({regions}, index) => regions.flatMap(({x, y, width, height}) => [index, x, y, width, height]));
  const layout = directions ? CHARACTER_DIRECTION_LAYOUTS[id] : CHARACTER_SHEET_LAYOUTS[id];
  return { id: `${id}${directions ? "-directions" : ""}`, file,
    cells: flatten(characterSourceCells(width, height, rows, layout)),
    originalCells: layout ? flatten(characterSourceCells(width, height, rows)) : undefined };
}));
console.log(JSON.stringify(specs));
'@
$specsJson = $specCode | & bun run -
if ($LASTEXITCODE -ne 0) { throw 'Could not read source-cell metadata' }
$specs = $specsJson | ConvertFrom-Json
$report = foreach ($spec in $specs) {
  $path = Join-Path (Get-Location) $spec.file
  $audit = [CharacterSourceAudit]::Analyze($path, [int[]]$spec.cells)
  $originalCutPixels = if ($spec.originalCells) { ([CharacterSourceAudit]::Analyze($path, [int[]]$spec.originalCells)).CutPixels } else { $null }
  $emptyFrames = @($audit.Frames | Where-Object { $_.Pixels -eq 0 }).Count
  [pscustomobject]@{ id = $spec.id; width = $audit.Width; height = $audit.Height;
    frameCount = $audit.Frames.Count; sourcePixels = $audit.Pixels; assignedPixels = $audit.AssignedPixels;
    cutPixels = $audit.CutPixels; originalGridCutPixels = $originalCutPixels; emptyFrames = $emptyFrames;
    unassignedPixels = $audit.UnassignedPixels; overlappingPixels = $audit.OverlappingPixels; frames = $audit.Frames }
}
$json = $report | ConvertTo-Json -Depth 7
if ($ReportPath) {
  [IO.File]::WriteAllText((Join-Path (Get-Location) $ReportPath), $json, [Text.UTF8Encoding]::new($false))
  $report | Select-Object id, frameCount, cutPixels, originalGridCutPixels, emptyFrames | Format-Table -AutoSize
} else { $json }
if (@($report | Where-Object { $_.cutPixels -gt 0 -or $_.emptyFrames -gt 0 -or $_.sourcePixels -ne $_.assignedPixels -or $_.unassignedPixels -gt 0 -or $_.overlappingPixels -gt 0 }).Count) { exit 1 }
