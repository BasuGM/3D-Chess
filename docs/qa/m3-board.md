# M3 — Board

The board is instanced light and dark squares, a merged walnut frame, a plinth, and a merged coordinate atlas. One shadow-casting directional light, plus fill and rim on the higher presets. No post-processing and no HDRI. Tone mapping is ACES.

White and Black views call `setLookAt`. Orbit stays above the board. After the preset settles, the demand loop adds no frames. Confirmed in the browser and in `e2e/game.spec.ts`.
