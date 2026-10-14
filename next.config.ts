import type { NextConfig } from "next";

// One id per deploy: the service worker is registered as /sw.js?v=<id>, so a
// new deploy installs a new worker and drops the previous code cache.
const buildId = (process.env.WORKERS_CI_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA)?.slice(0, 12) ?? Date.now().toString(36);

// `STATIC_EXPORT=1 next build` writes the game as static files into out/,
// served by Cloudflare Workers Static Assets (site/wrangler.jsonc,
// docs/design/cloud-architecture.md §1). The one route handler, the map
// editor's file writer (`route.dev.ts`), exists only in the other builds
// (`bun dev`, `next start` for the e2e suite); there the editor offers
// downloads instead. Caching for the export lives in public/_headers.
const staticExport = process.env.STATIC_EXPORT === "1";

const config: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
  pageExtensions: staticExport ? ["tsx", "ts"] : ["dev.ts", "tsx", "ts"],
  ...(staticExport ? { output: "export" as const } : {
    async headers() {
      return [{
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      }];
    },
  }),
};

export default config;
