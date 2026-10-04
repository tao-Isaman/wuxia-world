import type { Metadata } from "next";
import "./engine.css";

// The game's own editor. Not linked from the game; kept out of search engines.
export const metadata: Metadata = {
  title: "เอนจิน — กำลังภายใน",
  description: "เครื่องมือแก้ไขคลังภาพ แผนที่ และข้อความวิชาของเกม",
  robots: { index: false, follow: false },
};

export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
