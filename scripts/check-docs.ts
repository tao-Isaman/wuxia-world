/**
 * Keeps the docs pointing at real things. For every Markdown doc (root docs,
 * docs/, public/art/, review/README.md) it checks:
 *   - relative links [text](path) resolve to a file or folder in the repo;
 *   - repo paths written in backticks (`lib/world/quest-guide.ts`,
 *     `scripts/test-law.ts`, `app/manifest.ts`) exist;
 *   - `bun run <script>` commands name a script in package.json.
 * Placeholders (<id>, *, …) are skipped. The changelog and docs/specs/ may
 * name files that were removed or are only planned, so only their links are
 * checked. Exit 1 lists every broken reference.
 *
 *   bun scripts/check-docs.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ROOT_DOCS = ["README.md", "CLAUDE.md", "HANDOFF.md", "DESIGN.md", "ONBOARDING.md"];
const DOC_DIRS = ["docs", "public/art"];
const PATH_ROOTS = ["app", "components", "lib", "store", "scripts", "tests", "public", "docs", "review"];
const ROOT_FILES = new Set(["package.json", "playwright.config.ts", "next.config.ts", "tsconfig.json", "eslint.config.mjs",
  "tailwind.config.ts", "postcss.config.mjs", "components.json", "demo.html", "bun.lock", ".gitignore", ...ROOT_DOCS]);

function walk(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : rel.endsWith(".md") ? [rel] : [];
  });
}
const files = [...ROOT_DOCS.filter((f) => existsSync(join(ROOT, f))), ...DOC_DIRS.flatMap(walk), ...(existsSync(join(ROOT, "review/README.md")) ? ["review/README.md"] : [])];
const scripts = Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts ?? {});
const problems: string[] = [];

const placeholder = (p: string) => /[<>*{}…]|\.\.\.|\$|\s/.test(p);

for (const file of files) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const lines = text.split("\n");
  const historical = file === "docs/changelog.md" || file.startsWith("docs/specs/");
  let fence = false;
  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`;
    if (line.trimStart().startsWith("```")) { fence = !fence; }
    // Links (outside code fences).
    if (!fence) {
      for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const path = decodeURI(target.split("#")[0]);
        if (!path || placeholder(path)) continue;
        const abs = resolve(dirname(join(ROOT, file)), path);
        if (!existsSync(abs)) problems.push(`${at}: link to missing ${relative(ROOT, abs)}`);
      }
    }
    // Backticked repo paths (inside or outside fences: `lib/…` in prose, or bare in code blocks).
    for (const m of historical ? [] : line.matchAll(/`([^`]+)`/g)) {
      const token = m[1].trim().replace(/[.,;:]$/, "");
      const path = token.replace(/:\d+(-\d+)?$/, "").replace(/\/$/, "");
      if (placeholder(path)) continue;
      const first = path.split("/")[0];
      const isRepoPath = (PATH_ROOTS.includes(first) && path.includes("/")) || ROOT_FILES.has(path);
      if (!isRepoPath) continue;
      if (/^public\/.*\.(png|jpe?g|webp)$/.test(path) && /[#]/.test(path)) continue;
      if (!existsSync(join(ROOT, path))) problems.push(`${at}: path \`${path}\` does not exist`);
    }
    // bun run <script>
    for (const m of line.matchAll(/bun run ([\w:-]+)/g)) {
      const name = m[1];
      if (name.endsWith(":") || ["build", "dev", "start", "lint", "typecheck"].includes(name) || scripts.includes(name)) continue;
      problems.push(`${at}: \`bun run ${name}\` is not a package.json script`);
    }
    // bun scripts/<file>
    for (const m of line.matchAll(/bun (scripts\/[\w./-]+\.ts)/g)) {
      if (!existsSync(join(ROOT, m[1]))) problems.push(`${at}: \`bun ${m[1]}\` — no such script`);
    }
  });
}

if (problems.length) {
  console.error(`docs check: ${problems.length} broken reference(s)\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`docs check: ${files.length} docs, every link, repo path and script exists`);
