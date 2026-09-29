"use client";

import { useEffect, useRef } from "react";
import { CharacterPreview } from "@/components/game/character-preview";
import styles from "./upgrade-payoff.module.css";

export interface UpgradeReceipt {
  rawId: string;
  name: string;
  bodyId: string;
  previousLevel: number;
  level: number;
  cost: number;
  remaining: number;
  changes: { label: string; before: number; after: number }[];
  detail: string;
}

const number = (value: number) => value.toLocaleString("th-TH", { maximumFractionDigits: 1 });

/** Ephemeral click feedback; never reconstructed from persisted levels. */
export function UpgradePayoff({ receipt, onDismiss }: {
  receipt: UpgradeReceipt;
  onDismiss: () => void;
}) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    // Keep an upgrade near the bottom of a long slot list visible. An instant,
    // nearest-edge adjustment also respects reduced-motion preferences.
    panel.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, []);

  return (
    <section ref={panel} className={styles.payoff} aria-label={`เลื่อนขั้น ${receipt.name} สำเร็จ`}>
      <div role="status" aria-live="polite" aria-atomic="true">
        <div className={styles.heading}>
          <div className={styles.hero}>
            <CharacterPreview id={receipt.bodyId} motion="victory" />
          </div>
          <div className={styles.title}>
            <strong>สำเร็จอีกขั้น</strong>
            <span>{receipt.name}</span>
          </div>
          <div className={styles.level}>
            <span>ขั้นวิชา</span>
            <b><span>{receipt.previousLevel}</span><i aria-hidden="true"> → </i><span className="sr-only"> เป็น </span>{receipt.level}</b>
          </div>
        </div>
        <dl className={styles.changes}>
          {receipt.changes.map((change) => {
            const gain = change.after - change.before;
            return (
              <div key={change.label}>
                <dt>{change.label}</dt>
                <dd>
                  <span className={styles.previous}>{number(change.before)}</span>
                  <span aria-hidden="true"> → </span><span className="sr-only"> เป็น </span>
                  <strong>{number(change.after)}</strong>
                  {gain > 0 && <small>+{number(gain)}</small>}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className={styles.detail}>{receipt.detail}</p>
      </div>
      <div className={styles.footer}>
        <p>ใช้ <b>{number(receipt.cost)}</b> W-EXP <span>· เหลือ {number(receipt.remaining)}</span></p>
        <button type="button" onClick={onDismiss}>รับทราบ</button>
      </div>
    </section>
  );
}
