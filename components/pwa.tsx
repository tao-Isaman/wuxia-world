"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The browser fires `beforeinstallprompt` once, often before any install
// button mounts, so it is kept here and shared.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => { deferred = null; notify(); });
}

/** True when running as the installed app (home screen), not in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Registers the service worker in production builds and asks to keep saves on disk. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`, { scope: "/" })
        .catch((error) => console.warn("[pwa] service worker registration failed:", error));
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    // Saves live in localStorage; ask the browser not to evict them.
    if (isStandalone()) void navigator.storage?.persist?.().catch(() => undefined);
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

type InstallMode = "prompt" | "ios" | null;

function useInstallMode(): InstallMode {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(iOS && !isStandalone());
  }, []);
  if (canPrompt) return "prompt";
  return ios ? "ios" : null;
}

/**
 * "Install the game" control. Chrome/Edge/Android get the native prompt;
 * iOS Safari (no prompt API) gets the Share → Add to Home Screen steps.
 * Renders nothing once installed or where installing is not offered.
 */
export function InstallGameButton({ className = "" }: { className?: string }) {
  const mode = useInstallMode();
  const [hint, setHint] = useState(false);
  if (!mode) return null;
  const install = async () => {
    if (mode === "ios") { setHint((value) => !value); return; }
    const event = deferred;
    if (!event) return;
    await event.prompt();
    await event.userChoice.catch(() => undefined);
    deferred = null;
    notify();
  };
  return (
    <div className={`pwa-install ${className}`}>
      <button type="button" className="pwa-install-button" onClick={install} aria-expanded={mode === "ios" ? hint : undefined}>
        <span aria-hidden="true">⬇</span> ติดตั้งเกมลงเครื่อง
      </button>
      {mode === "ios" && hint && (
        <p className="pwa-install-hint" role="status">
          แตะปุ่ม <b>แชร์</b> <span aria-hidden="true">(□↑)</span> ของ Safari แล้วเลือก <b>เพิ่มไปยังหน้าจอโฮม</b> เพื่อเล่นแบบเต็มจอ
        </p>
      )}
    </div>
  );
}
