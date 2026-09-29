# World renderer follow-up evidence

The style comparison is in `../world-three-style/`: wider desktop framing, warm character grading, semantic service badges and one focused label. This is an improvement pass, not a claim of parity with the reference art.

The navigation captures in this directory were recorded against the actual local app with Playwright. The capital scene was initialized by editing the test browser's local save to place it at the authored capital spawn; after that setup, each circuit used real pointer/touch input without teleporting. NPC and service interactions used the existing destination menu. Desktop and mobile recordings are in `video/`.

Verified behavior:

- North and south walking use frames 16–19 and 20–23. Stopping preserves north frame 16 or south frame 20.
- Holding north at the capital entrance stops at y=486.7, in front of the shop wall.
- The circuit visits the alley, west side of the well, the corridor above the lower stalls, the east side of the stalls, and the street before returning to the gate.
- The physician interaction and a shop service still open after automatic detours. A service painted on a wall resolves to reachable ground beside its entrance.
- Portrait (390 × 844) and landscape (844 × 390) touch circuits complete, then activate the route back toward home. Both keep one correctly sized world WebGL canvas.
- All three browser sessions reported no page errors. The desktop session also monitored console errors and reported none.

Pure collision/path assertions are in `lib/three/world-navigation.test.ts`, run with `bun test lib/three/world-navigation.test.ts`. Eleven tests cover well blocking and sliding, swept post collision, the open home gate, authored exit access, detours, capital alleys, shop services, lower stalls, a complete capital circuit, old embedded positions and unchanged behavior on unmapped scenes.

Coverage is intentionally limited to the authored home well/gateposts and capital storefront wall footprints, four market stalls and well. Foreground cutouts sample those paintings directly. Other architecture and other maps have not been converted into a full collision map.
