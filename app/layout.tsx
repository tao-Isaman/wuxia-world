import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "กำลังภายใน — Battle Sim",
  description: "Wuxia turn-based battle simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
