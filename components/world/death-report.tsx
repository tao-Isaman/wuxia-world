"use client";

import { Modal } from "@/components/ui/modal";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { useWorldStore } from "@/store/world-store";

/**
 * After a fatal loss the hero wakes at home (lib/world/death.ts): this tells
 * the player what the fall cost. Shown once; the action log keeps the line.
 */
export function DeathReport() {
  const death = useWorldStore((s) => s.lastDeath);
  const dismiss = useWorldStore((s) => s.dismissDeath);
  if (!death) return null;
  return (
    <Modal open onClose={dismiss} title="ฟื้นคืนสติ" maxWidth="max-w-md">
      <div className="space-y-3 text-center" data-testid="death-report">
        <p className="text-sm leading-relaxed">
          ท่านล้มลงกลางการต่อสู้… ชาวบ้านผ่านมาพบร่างและพากลับมาที่บ้าน
          ท่านฟื้นขึ้นในวันรุ่งขึ้น แต่สิ่งที่ติดตัวไปไม่ได้กลับมาครบ
        </p>
        <ul className="text-sm space-y-1" aria-label="สิ่งที่สูญเสีย">
          {death.lines.map((line) => <li key={line} className="text-rose-700 font-semibold">{line}</li>)}
        </ul>
        <WuxiaButton variant="default" onClick={dismiss} autoFocus>ลุกขึ้นเดินทางต่อ</WuxiaButton>
      </div>
    </Modal>
  );
}
