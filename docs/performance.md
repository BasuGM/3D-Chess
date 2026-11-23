# Performance

Measured in the Cursor browser on 23 Nov 2026, starting position, after the camera preset had settled. `renderer.info` is sampled in `window.__GM_STATS__` on each rendered frame. Draw calls and triangles include the shadow pass when shadows are on.

The scene uses `frameloop="demand"`. After the opening camera move, an 800ms idle window added no frames on both the desktop pane and a 390×844 phone emulation.

Pieces are one instanced mesh per type and color (12), plus two instanced bishop slits that do not cast shadows. Squares are two instanced meshes. There is no GLB. Procedural geometry lives in the JavaScript bundle.

## Desktop pane

664×582 CSS pixels, device pixel ratio 2. JS heap about 29 MB used (36 MB allocated).

| Preset | Shadows | Pixel ratio | Draw calls | Triangles | Textures |
| --- | --- | ---: | ---: | ---: | ---: |
| High | 2048 | 2 | 32 | 47,998 | 6 |
| Balanced | 1024 | 1.5 | 32 | 47,998 | 6 |
| Low | off | 1 | 20 | 24,470 | 4 |

Geometries stayed at 14. High and Balanced share the same draw-call count because the shadow map resolution does not add objects. Low drops the 12 shadow draws from the piece instances.

## Phone emulation

390×844, device pixel ratio 2, Balanced preset. Draw calls 32, triangles 47,998, geometries 14, textures 6. JS heap about 25 MB used (38 MB allocated). Idle frames stayed flat across 800ms.

A move adds two last-move squares, so the call count rises by two and remains under 50. The draw-call aim is met without a further preset change.

## What stays quiet

Shared piece geometries are cached and marked `dispose={null}` on the instanced meshes so a preset change does not free them. `disposeAssets()` runs when the canvas unmounts. The tween driver calls `invalidate()` only while a piece is moving or a drag is active.
