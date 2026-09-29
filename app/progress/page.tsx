"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CharacterPreview } from "@/components/game/character-preview";
import { CHARACTER_IDS, CHARACTER_CLIPS, type CharacterMotion } from "@/lib/characters/catalog";
import "./progress.css";

interface Piece { id: string; name: string; status: string; owner: string; detail: string; evidence?: string }
interface Progress { updated: string; wave: string; summary: string; pieces: Piece[]; reviews: { title: string; verdict: string }[]; checks: string[] }
export default function ProgressPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [offline, setOffline] = useState(false);
  const [motion, setMotion] = useState<CharacterMotion>("walk");
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/progress.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Progress unavailable");
        const next = await response.json() as Progress;
        if (active) { setProgress(next); setOffline(false); }
      } catch { if (active) setOffline(true); }
    }
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return <main className="progress-page">
    <header><div><p className="progress-eyebrow">WUXIA / DEVELOPMENT JOURNAL</p><h1>A world in the making.</h1></div><Link href="/">Play current build ↗</Link></header>
    {!progress ? <p role="status">{offline ? "Waiting for the development journal…" : "Loading live progress…"}</p> : <>
      <section className="progress-intro"><span className="progress-live">{offline ? "Reconnecting" : "Live · refreshes every 5 seconds"}</span>
        <h2>{progress.wave}</h2><p>{progress.summary}</p><small>Last update: {new Date(progress.updated).toLocaleString()}</small></section>
      <div className="progress-columns"><section><h2>Independently reviewable pieces</h2><div className="progress-pieces">
        {progress.pieces.map((piece) => <article key={piece.id}><div className="progress-piece-top"><span>{piece.id}</span><b data-status={piece.status}>{piece.status}</b></div>
          <h3>{piece.name}</h3><p>{piece.detail}</p><footer>{piece.owner}{piece.evidence && <a href={piece.evidence}>View evidence ↗</a>}</footer></article>)}
      </div></section><aside><section><h2>Independent review</h2>{progress.reviews.map((review, index) => <article key={index}><h3>{review.title}</h3><p>{review.verdict}</p></article>)}</section>
        <section><h2>Verified checks</h2><ul>{progress.checks.map((check) => <li key={check}>{check}</li>)}</ul></section>
        <section><h2>Quality references</h2><p>Original assets, judged for readability, animation, atmosphere and meaningful choices.</p>
          <a href="https://store.steampowered.com/app/1948980/">Hero’s Adventure: Road to Passion ↗</a><a href="https://dokaponkingdom.com/">Dokapon Kingdom: Connect ↗</a>
          <p className="progress-note">Comparisons are reviewer judgments, not claims of commercial-game parity. Unresolved gaps stay visible.</p></section>
      </aside></div>
      <section className="progress-character-study"><h2>Character animation study</h2><p>The actual game atlases at their native pixel grid: eight heroes, four supporting archetypes and three individually drawn townspeople. Select a motion to inspect them.</p>
        <p className="progress-note">North and south views are available for the eight heroes. Supporting characters show their side-view walk for those selections.</p>
        <div className="progress-motion-controls">{(Object.keys(CHARACTER_CLIPS) as CharacterMotion[]).map((name) => <button key={name} aria-pressed={motion === name} onClick={() => setMotion(name)}>{name}</button>)}</div>
        <div className="progress-character-gallery">{CHARACTER_IDS.map((id) => <figure key={id}><CharacterPreview id={id} animate motion={motion} /><figcaption>{id.toUpperCase()}</figcaption></figure>)}</div>
      </section>
    </>}
  </main>;
}
