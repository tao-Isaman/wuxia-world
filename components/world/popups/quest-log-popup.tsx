"use client";

import { Modal } from "@/components/ui/modal";
import { QuestLog } from "../quest-log";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Modal wrapper around the existing QuestLog. The QuestLog component
// already handles empty state, sectioning (active / done / failed), and
// the per-stage checklist — we just frame it inside the menu-bar popup
// pattern so quests show up alongside the other top-level tabs instead of
// in the sidebar.
export function QuestLogPopup({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="📋 ภารกิจ" maxWidth="max-w-2xl">
      <QuestLog variant="popup" />
    </Modal>
  );
}
