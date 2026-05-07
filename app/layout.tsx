import type { Metadata } from "next";
import { Charm, Sarabun } from "next/font/google";
import "./globals.css";

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
  title: "กำลังภายใน — Battle Sim",
  description: "Wuxia turn-based battle simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${charm.variable} ${sarabun.variable}`}
    >
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
