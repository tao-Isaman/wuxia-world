"use client";

// สนทนา — the chat (docs/design/social.md): a bar always at the bottom centre
// of the screen while online (no menu button), which opens in place into a box
// with three channels, แผนที่ (everyone on this map), คณะ (the party) and
// กระซิบ (one player). It is not a dialog, so the map keeps running; while its
// input has focus the hero stands still (worldInputBlocked). Tapping the bar or
// Enter on the map opens it, Escape or ▾ folds it back. Folded, the last lines
// float above the bar for a few seconds.
import { useEffect, useRef, useState } from "react";
import { useSocialStore, socialErrorText, type ChatChannel, type ChatLine } from "@/store/social-store";
import { SOCIAL_LIMITS } from "@/lib/net/social-protocol";
import { toast } from "@/store/toast-store";

const TABS: { id: ChatChannel; label: string }[] = [
  { id: "map", label: "แผนที่" },
  { id: "party", label: "คณะ" },
  { id: "whisper", label: "กระซิบ" },
];
/** How long a line stays in the closed box's feed (ms). */
const FEED_MS = 8000;

const who = (line: ChatLine) => (line.mine ? "ท่าน" : line.from.name || `@${line.from.username}`);

function Line({ line, onPick }: { line: ChatLine; onPick: (line: ChatLine) => void }) {
  const whisperLabel = line.channel === "whisper" ? (line.mine ? `ถึง ${line.with?.name || `@${line.with?.username}`}` : "กระซิบ") : null;
  return (
    <p className={`chat-line chat-line--${line.channel}${line.mine ? " chat-line--mine" : ""}`}>
      <button type="button" className="chat-who" onClick={() => onPick(line)} disabled={line.mine}>{who(line)}</button>
      {whisperLabel && <small className="chat-tag">{whisperLabel}</small>}
      <span className="chat-text">{line.text}</span>
    </p>
  );
}

export function ChatBox() {
  const status = useSocialStore((s) => s.status);
  const open = useSocialStore((s) => s.chatOpen);
  const tab = useSocialStore((s) => s.chatTab);
  const lines = useSocialStore((s) => s.lines);
  const whisperTo = useSocialStore((s) => s.whisperTo);
  const party = useSocialStore((s) => s.party);
  const friends = useSocialStore((s) => s.friends);
  const unread = useSocialStore((s) => s.unread);
  const { setChatOpen, setChatTab, setWhisperTo, say, showCard } = useSocialStore.getState();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Enter on the map opens the chat (not while typing elsewhere or in a dialog).
  useEffect(() => {
    if (status === "off") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || useSocialStore.getState().chatOpen) return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [data-world-busy]')) return;
      event.preventDefault();
      setChatOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, setChatOpen]);

  useEffect(() => { if (open) input.current?.focus({ preventScroll: true }); }, [open, tab]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [open, tab, lines.length]);
  // The closed feed fades lines out.
  useEffect(() => {
    if (open) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (status === "off") return null;
  const shown = lines.filter((l) => l.channel === tab);
  const pick = (line: ChatLine) => showCard(line.channel === "whisper" && line.mine && line.with ? line.with : line.from);

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const result = await say(tab, text);
    setBusy(false);
    if (result.ok) setText("");
    else toast("warn", socialErrorText(result.error));
    input.current?.focus({ preventScroll: true });
  };

  if (!open) {
    const feed = lines.filter((l) => now - l.at < FEED_MS && !l.mine).slice(-3);
    const tabLabel = TABS.find((t) => t.id === tab)?.label ?? "แผนที่";
    return (
      <div className="chat-dock" data-testid="chat-dock">
        {feed.length > 0 && (
          <div className="chat-feed" aria-live="polite" data-testid="chat-feed">
            {feed.map((line) => (
              <p key={line.id} className={`chat-line chat-line--${line.channel}`}>
                <b className="chat-who">{who(line)}</b><span className="chat-text">{line.text}</span>
              </p>
            ))}
          </div>
        )}
        <button type="button" className="chat-bar" data-hud-occluder data-testid="chat-bar" aria-label="สนทนา" title="สนทนา (Enter)"
          onClick={() => setChatOpen(true)}>
          <span className="chat-bar-channel">{tabLabel}</span>
          <span className="chat-bar-hint">แตะเพื่อพิมพ์ข้อความ</span>
          {unread > 0 && <b className="chat-bar-badge" aria-label={`${unread} ข้อความใหม่`}>{unread}</b>}
        </button>
      </div>
    );
  }

  const disabled = (tab === "party" && !party) || (tab === "whisper" && !whisperTo);
  return (
    <section className="chat-box" aria-label="สนทนา" data-hud-occluder data-testid="chat-box">
      <header className="chat-head">
        <nav className="chat-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className="chat-tab"
              data-testid={`chat-tab-${t.id}`} onClick={() => setChatTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <button type="button" className="chat-close" aria-label="ย่อแชท" title="ย่อแชท (Esc)" onClick={() => setChatOpen(false)}>▾</button>
      </header>
      {tab === "whisper" && (
        <label className="chat-to">
          <span>ถึง</span>
          <select value={whisperTo?.username ?? ""} data-testid="chat-whisper-to"
            onChange={(e) => {
              const f = friends.find((x) => x.username === e.target.value);
              setWhisperTo(f ? { username: f.username, name: f.name } : whisperTo?.username === e.target.value ? whisperTo : null);
            }}>
            <option value="">— เลือกสหาย —</option>
            {whisperTo && !friends.some((f) => f.username === whisperTo.username) && (
              <option value={whisperTo.username}>{whisperTo.name || whisperTo.username} (@{whisperTo.username})</option>
            )}
            {friends.map((f) => <option key={f.username} value={f.username}>{f.name || f.username}{f.online ? " ●" : ""}</option>)}
          </select>
        </label>
      )}
      <div className="chat-list" ref={list} data-testid="chat-list">
        {shown.length ? shown.map((line) => <Line key={line.id} line={line} onPick={pick} />)
          : <p className="chat-empty">{tab === "map" ? "พูดคุยกับผู้คนในแผนที่นี้" : tab === "party" ? (party ? "พูดคุยในคณะ" : "ยังไม่ได้อยู่ในคณะ") : "เลือกสหายเพื่อกระซิบ"}</p>}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input ref={input} value={text} maxLength={SOCIAL_LIMITS.chatChars} disabled={disabled} data-testid="chat-input"
          placeholder={disabled ? "" : "พิมพ์แล้วกด Enter"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); setChatOpen(false); } }} />
        <button type="submit" disabled={disabled || busy || !text.trim()}>ส่ง</button>
      </form>
    </section>
  );
}
