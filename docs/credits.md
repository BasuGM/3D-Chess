# Credits

## Pieces

The Staunton pieces are generated in `components/scene/staunton.ts` with lathe and extrude geometry. They are original to this project. No third-party mesh is vendored.

A CC0 Staunton GLB was reviewed and not used. The knight in that set was about 128 triangles and the file had no materials, which is too coarse for this board. The procedural meshes share one geometry per type and take the same animation path a compressed GLB would use later.

## Rules

[chess.js](https://github.com/jhlywa/chess.js) 1.4.0 by Jeff Hlywa, BSD-2-Clause. It is the only rules implementation in the app.

## Rendering

[Three.js](https://github.com/mrdoob/three.js), [React Three Fiber](https://github.com/pmndrs/react-three-fiber), and [Drei](https://github.com/pmndrs/drei), MIT. Camera control uses [camera-controls](https://github.com/yomotsu/camera-controls). That library currently logs a `THREE.Clock` deprecation warning on startup. It does not affect play.
