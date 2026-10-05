import type { Metadata, Viewport } from "next";
import { Charm, Sarabun } from "next/font/google";
import "./globals.css";
import "./pixel-game.css";
import "./game-menu.css";
import "./game-hud.css";
import "./dq-theme.css";
import "./pwa.css";
import "./mobile-hud.css";
import "./profile.css";
import "./menu-layout.css";
import "./meridian.css";
import { PwaRegister } from "@/components/pwa";

// Charm — calligraphic display font reserved for proper nouns, sect /
// character / skill names, and section headers (≥18px). Thai tone-mark
// rendering breaks below 16px, so consumers must not drop this font into
// body copy.
const charm = Charm({
  weight: ["400", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-display",
});

// Sarabun — high-coverage Thai sans-serif for dialog, narration, and any
// readable body / number display. Default `font-sans` in Tailwind via the
// `--font-body` variable.
const sarabun = Sarabun({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "กำลังภายใน — ยุทธภพ",
  description: "เกมจอมยุทธ์ผจญภัย ฝึกวิชา ประลองยุทธ์ และสร้างตำนานของเจ้าในยุทธภพ",
  applicationName: "กำลังภายใน",
  // iOS home-screen app: no browser chrome, content under the status bar.
  appleWebApp: { capable: true, title: "กำลังภายใน", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

// viewport-fit=cover lets the HUD use env(safe-area-inset-*) around notches.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#140a07",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${charm.variable} ${sarabun.variable}`}
    >
      <body className="antialiased font-sans">{children}<PwaRegister /></body>
    </html>
  );
}
