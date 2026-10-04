"use client";

import type { AssetEntry } from "@/lib/assets/types";

// Placeholder: the map team replaces this with the map editor.
export function MapEditor({ assets }: { assets: AssetEntry[] }) {
  return (
    <div className="eng-placeholder" data-testid="map-editor">
      <h2>แผนที่</h2>
      <p>กำลังพัฒนา — ตัวแก้ไขแผนที่สำหรับวางวัตถุจากคลังภาพ ({assets.length.toLocaleString("th-TH")} ภาพ)</p>
    </div>
  );
}
