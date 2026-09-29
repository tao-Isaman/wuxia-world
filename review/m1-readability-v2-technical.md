# Hero A/B rendering: technical validation

The isolated diagnostic completed with exit code 0. Chromium closed and temporary entry/bundle files were removed. The production server, original artwork, runtime source and active catalog were not changed.

- Uses the actual `lib/characters/sheet.ts` atlas loader and `lib/three/world-runtime.ts` renderer from the workspace.
- Both variants use separate browser contexts, a 1440 × 900 viewport, capital spawn x45/y31.5, time 8, identical camera/lighting, and the same terrain and chest.
- All 32 base poses were nonempty with zero atlas-edge pixels. Forty 128 × 128 crops cover sixteen static poses and four genuine walking frames for each variant.
- World and screen positions and frame numbers matched across both variants. The actual keyboard-driven walk advanced from world x432 to reported x487 at y201.6. Runtime nominal sprite-box height was 84 screen pixels for both; visible body height is smaller because atlas cells include transparent padding.
- Zero page errors. Four full-world images are 1440 × 900. The comparison PNG is 1100 × 1800, and both overview images fit fully.

The static pose inspection sets the diagnostic idle clip to each base frame. Attack images therefore show posed attack frames, not a played combat action. Genuine walking dispatches KeyD through the actual input/movement system and advances the runtime RAF clock deterministically at 60 Hz. NPC and UI layers are omitted equally. The original north/south supplement is still loaded for compatibility; no revised directional sheet or vertical-animation continuity is validated.

Fresh visual review should receive `review/m1-readability-v2/comparison.png`, the A/B full-world images, and individual A/B pose/walk crops. Keep `mapping.json` and `rendered-report.json` (which includes source hashes) separate until the reviewer records their first judgement. The comparison uses neutral labels, but this is not a claim of a scientifically blinded commercial benchmark.

No aesthetic winner, terrain-readability verdict, or commercial-parity claim is made here.
