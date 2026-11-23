import type { PieceSymbol } from "chess.js";
import {
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  SphereGeometry,
  Vector2,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function seat(geo: BufferGeometry) {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (!box) return geo;
  geo.translate(
    -((box.min.x + box.max.x) / 2),
    -box.min.y,
    -((box.min.z + box.max.z) / 2),
  );
  geo.computeVertexNormals();
  return geo;
}

function lathe(points: Array<[number, number]>, segments = 28) {
  return new LatheGeometry(
    points.map(([radius, y]) => new Vector2(Math.max(radius, 0.001), y)),
    segments,
  );
}

function box(width: number, height: number, depth: number, x: number, y: number, z: number) {
  const geo = new BoxGeometry(width, height, depth);
  geo.translate(x, y, z);
  return geo;
}

function merge(parts: BufferGeometry[]) {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error("Could not merge piece geometry.");
  parts.forEach((part) => {
    if (part !== merged) part.dispose();
  });
  return seat(merged);
}

function pawn() {
  return seat(
    lathe([
      [0.001, 0],
      [0.16, 0],
      [0.18, 0.035],
      [0.14, 0.06],
      [0.1, 0.08],
      [0.075, 0.2],
      [0.09, 0.25],
      [0.13, 0.28],
      [0.09, 0.31],
      [0.055, 0.36],
      [0.07, 0.4],
      [0.105, 0.45],
      [0.09, 0.5],
      [0.04, 0.53],
      [0.001, 0.53],
    ]),
  );
}

function rook() {
  const body = lathe([
    [0.001, 0],
    [0.18, 0],
    [0.2, 0.04],
    [0.15, 0.07],
    [0.12, 0.1],
    [0.1, 0.28],
    [0.13, 0.36],
    [0.15, 0.4],
    [0.15, 0.5],
    [0.11, 0.5],
    [0.11, 0.54],
    [0.001, 0.54],
  ]);
  const merlons = [0, 1, 2, 3].map((index) => {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    return box(0.07, 0.07, 0.07, Math.cos(angle) * 0.08, 0.575, Math.sin(angle) * 0.08);
  });
  return merge([body, ...merlons]);
}

function bishop() {
  return seat(
    lathe([
      [0.001, 0],
      [0.17, 0],
      [0.19, 0.04],
      [0.14, 0.07],
      [0.1, 0.11],
      [0.075, 0.32],
      [0.1, 0.4],
      [0.13, 0.44],
      [0.07, 0.48],
      [0.045, 0.56],
      [0.07, 0.62],
      [0.055, 0.68],
      [0.02, 0.72],
      [0.001, 0.72],
    ]),
  );
}

function queen() {
  const body = lathe([
    [0.001, 0],
    [0.18, 0],
    [0.2, 0.045],
    [0.15, 0.08],
    [0.09, 0.14],
    [0.07, 0.4],
    [0.1, 0.52],
    [0.14, 0.58],
    [0.08, 0.64],
    [0.05, 0.7],
    [0.07, 0.74],
    [0.001, 0.74],
  ]);
  const balls = [0, 1, 2, 3, 4, 5].map((index) => {
    const angle = (index / 6) * Math.PI * 2;
    const sphere = new SphereGeometry(0.028, 10, 8);
    sphere.translate(Math.cos(angle) * 0.055, 0.77, Math.sin(angle) * 0.055);
    return sphere;
  });
  const finial = new SphereGeometry(0.03, 10, 8);
  finial.translate(0, 0.8, 0);
  return merge([body, ...balls, finial]);
}

function king() {
  const body = lathe([
    [0.001, 0],
    [0.19, 0],
    [0.21, 0.05],
    [0.16, 0.09],
    [0.1, 0.15],
    [0.078, 0.42],
    [0.12, 0.56],
    [0.16, 0.64],
    [0.1, 0.72],
    [0.06, 0.8],
    [0.08, 0.84],
    [0.001, 0.84],
  ]);
  const upright = box(0.028, 0.12, 0.028, 0, 0.91, 0);
  const arm = box(0.1, 0.028, 0.028, 0, 0.93, 0);
  return merge([body, upright, arm]);
}

function knight() {
  const shape = new Shape();
  const points: Array<[number, number]> = [
    [0.02, 0],
    [0.36, 0],
    [0.38, 0.045],
    [0.28, 0.08],
    [0.24, 0.12],
    [0.22, 0.26],
    [0.28, 0.38],
    [0.42, 0.48],
    [0.58, 0.54],
    [0.54, 0.6],
    [0.44, 0.58],
    [0.4, 0.66],
    [0.36, 0.78],
    [0.24, 0.86],
    [0.14, 0.8],
    [0.1, 0.66],
    [0.09, 0.42],
    [0.07, 0.2],
    [0.04, 0.1],
    [0.02, 0.05],
  ];
  shape.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.translate(0, 0, -0.07);
  geo.scale(0.78, 0.78, 0.78);
  return seat(geo);
}

const builders: Record<PieceSymbol, () => BufferGeometry> = {
  p: pawn,
  r: rook,
  n: knight,
  b: bishop,
  q: queen,
  k: king,
};

let geometries: Record<PieceSymbol, BufferGeometry> | null = null;

export function pieceGeometries() {
  if (!geometries) {
    geometries = {
      p: builders.p(),
      r: builders.r(),
      n: builders.n(),
      b: builders.b(),
      q: builders.q(),
      k: builders.k(),
    };
  }
  return geometries;
}

export function disposePieceGeometries() {
  if (!geometries) return;
  Object.values(geometries).forEach((geo) => geo.dispose());
  geometries = null;
}
