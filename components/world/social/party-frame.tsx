"use client";

// The party frame (คณะ) under the vitals card: each companion's hero name,
// whether they are online and where they stand; a star when they share the
// hero's map (the battle bonus counts them). Tap opens the สหาย window.
import { useSocialStore } from "@/store/social-store";
import { useWorldStore } from "@/store/world-store";
import { placeName } from "./friends-popup";

export function PartyFrame({ onOpen }: { onOpen: () => void }) {
  const party = useSocialStore((s) => s.party);
  const me = useSocialStore((s) => s.me.username);
  const here = useWorldStore((s) => s.currentSceneId);
  if (!party) return null;
  const others = party.members.filter((m) => m.username !== me);
  if (!others.length) return null;
  return (
    <button type="button" className="hud-strip party-frame" data-testid="party-frame" aria-label="คณะ" onClick={onOpen}>
      {others.map((m) => {
        const near = m.online && m.location === here;
        return (
          <span key={m.username} className="party-frame-row" data-member={m.username} data-near={near ? "true" : "false"}>
            <span className={`online-dot online-dot-${m.online ? "online" : "off"}`} aria-hidden="true" />
            <b>{party.leader === m.username ? "👑 " : ""}{m.name || m.username}</b>
            <small>{near ? "★ อยู่ด้วยกัน" : m.online ? (placeName(m.location) ?? "") : "ออฟไลน์"}</small>
          </span>
        );
      })}
    </button>
  );
}
