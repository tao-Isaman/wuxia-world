import type { MetadataRoute } from "next";

// Installable game: full screen on Android, standalone on iOS (which ignores
// "fullscreen"). Landscape only: a phone held upright shows the game turned on its side.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "กำลังภายใน — ยุทธภพ",
    short_name: "กำลังภายใน",
    description: "เกมจอมยุทธ์ผจญภัย ฝึกวิชา ประลองยุทธ์ และสร้างตำนานของเจ้าในยุทธภพ",
    lang: "th",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "landscape",
    background_color: "#10201b",
    theme_color: "#140a07",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
