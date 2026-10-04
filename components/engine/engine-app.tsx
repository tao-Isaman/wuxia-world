"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadAssetManifest, reloadAssetData } from "@/lib/assets/catalog";
import type { AssetManifest } from "@/lib/assets/types";
import { applyAssetEdits, editedManifest, pruneAssetEdits, type AssetEdits } from "@/lib/engine/asset-edit";
import { DRAFT_KEYS, readDraft, writeDraft } from "@/lib/engine/draft";
import { ENGINE_FILES, saveEngineFile, type EngineFileKey } from "@/lib/engine/save";
import { AssetLibrary } from "./asset-library";
import { MapEditor } from "./map-editor";
import { SkillTextEditor } from "./skill-text-editor";

type Tab = "assets" | "map" | "skills";
const TABS: { id: Tab; label: string }[] = [
  { id: "assets", label: "คลังภาพ" },
  { id: "map", label: "แผนที่" },
  { id: "skills", label: "วิชา" },
];
const TAB_KEY = "wuxia-engine-tab";

export type SaveMode = "checking" | "write" | "download";
export interface Notice { kind: "ok" | "warn" | "error"; text: string }
/** Save one engine file; resolves true when it reached the repo (dev) or was downloaded. */
export type EngineSave = (key: EngineFileKey, data: unknown) => Promise<"written" | "downloaded" | "failed">;

export function EngineApp() {
  const [tab, setTab] = useState<Tab>("assets");
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set(["assets"]));
  const [mode, setMode] = useState<SaveMode>("checking");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [edits, setEdits] = useState<AssetEdits>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      if (saved && TABS.some((t) => t.id === saved)) { setTab(saved); setVisited((v) => new Set(v).add(saved)); }
    } catch { /* no storage: start on the library */ }
    fetch("/game/engine/api/save", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { writable: false }))
      .then((body: { writable?: boolean }) => setMode(body.writable ? "write" : "download"))
      .catch(() => setMode("download"));
    loadAssetManifest().then((loaded) => {
      setManifest(loaded);
      const draft = readDraft<{ edits: AssetEdits }>(DRAFT_KEYS.manifest);
      if (draft?.edits) setEdits(pruneAssetEdits(draft.edits, loaded.assets));
    });
  }, []);

  useEffect(() => {
    if (!manifest) return;
    writeDraft(DRAFT_KEYS.manifest, Object.keys(edits).length ? { edits } : null);
  }, [edits, manifest]);

  const pick = (next: Tab) => {
    setTab(next);
    setVisited((v) => (v.has(next) ? v : new Set(v).add(next)));
    try { localStorage.setItem(TAB_KEY, next); } catch { /* ignore */ }
  };

  const save: EngineSave = useCallback(async (key, data) => {
    const result = await saveEngineFile(key, data);
    if (result.ok) {
      setNotice({ kind: "ok", text: `บันทึกลงไฟล์แล้ว: ${result.written}` });
      return "written";
    }
    if (result.downloaded) {
      setNotice({ kind: "warn", text: `เซิร์ฟเวอร์นี้อ่านอย่างเดียว — ดาวน์โหลด ${ENGINE_FILES[key].split("/").pop()} แล้ว นำไปแทนที่ ${ENGINE_FILES[key]} แล้ว commit (ฉบับร่างยังเก็บไว้)` });
      return "downloaded";
    }
    setNotice({ kind: "error", text: `บันทึกไม่สำเร็จ: ${result.reason}` });
    return "failed";
  }, []);

  const saveManifest = async () => {
    if (!manifest) return;
    const outcome = await save("manifest", editedManifest(manifest, edits));
    if (outcome === "written") {
      reloadAssetData();
      const fresh = await loadAssetManifest();
      setManifest(fresh);
      setEdits({});
    }
  };

  const assets = useMemo(() => (manifest ? applyAssetEdits(manifest.assets, edits) : []), [manifest, edits]);

  return (
    <div className="engine-root" data-engine-root data-save-mode={mode}>
      <header className="eng-header">
        <div className="eng-brand">
          <strong>เอนจิน</strong>
          <span>กำลังภายใน — ยุทธภพ</span>
        </div>
        <nav className="eng-tabs" role="tablist" aria-label="ส่วนของเอนจิน">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-tab={t.id} className="eng-tab" onClick={() => pick(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <span className={`eng-chip eng-chip-${mode}`} data-testid="save-mode" title={mode === "write" ? "bun dev: กดบันทึกแล้วไฟล์ใน repo เปลี่ยนทันที" : "เว็บที่ deploy อ่านอย่างเดียว: กดบันทึกจะดาวน์โหลดไฟล์ JSON"}>
          {mode === "checking" ? "กำลังตรวจ…" : mode === "write" ? "บันทึกลงไฟล์ได้ (dev)" : "อ่านอย่างเดียว · บันทึกจะดาวน์โหลด"}
        </span>
      </header>
      {notice && (
        <div className={`eng-notice eng-notice-${notice.kind}`} role="status" data-testid="engine-notice">
          <span>{notice.text}</span>
          <button type="button" className="eng-link" onClick={() => setNotice(null)}>ปิด</button>
        </div>
      )}
      <main className="eng-main">
        <section role="tabpanel" hidden={tab !== "assets"} className="eng-panel">
          <AssetLibrary
            manifest={manifest}
            assets={assets}
            edits={edits}
            setEdits={setEdits}
            onSave={saveManifest}
            onDiscard={() => setEdits({})}
          />
        </section>
        {visited.has("map") && (
          <section role="tabpanel" hidden={tab !== "map"} className="eng-panel">
            <MapEditor assets={assets} />
          </section>
        )}
        {visited.has("skills") && (
          <section role="tabpanel" hidden={tab !== "skills"} className="eng-panel">
            <SkillTextEditor save={save} />
          </section>
        )}
      </main>
    </div>
  );
}
