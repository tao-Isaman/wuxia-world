// Re-export wrapper so callers can `import { SkillIcon, ArtIcon } from "./skill-icon"`
// without depending on Next.js / webpack folder-index resolution. The
// real implementation lives in the `skill-icon/` folder beside this file.
export { SkillIcon, ArtIcon } from "./skill-icon/index";
