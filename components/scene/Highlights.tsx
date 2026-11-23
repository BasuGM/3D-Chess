"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, InstancedMesh, Matrix4, Quaternion, TorusGeometry, Vector3 } from "three";
import { fenAt, legalFrom, statusFromLine } from "@/lib/chess/engine";
import { squareToXZ } from "@/lib/chess/squares";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";

const MAX = 32;
const identity = new Quaternion();

function place(mesh: InstancedMesh | null, points: Array<[number, number, number]>) {
  if (!mesh) return;
  const matrix = new Matrix4();
  for (let index = 0; index < MAX; index += 1) {
    const point = points[index];
    if (!point) {
      matrix.makeScale(0, 0, 0);
    } else {
      matrix.compose(new Vector3(point[0], point[1], point[2]), identity, new Vector3(1, 1, 1));
    }
    mesh.setMatrixAt(index, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function MarkerSet({
  points,
  geometry,
  color,
  opacity,
}: {
  points: Array<[number, number, number]>;
  geometry: CylinderGeometry | TorusGeometry;
  color: string;
  opacity: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    place(ref.current, points);
  }, [points]);
  if (points.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, MAX]} raycast={() => null}>
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </instancedMesh>
  );
}

function FlatSquare({
  square,
  color,
  opacity,
}: {
  square: string;
  color: string;
  opacity: number;
}) {
  const [x, z] = squareToXZ(square);
  return (
    <mesh position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export function Highlights() {
  const selected = useGameStore((state) => state.selected);
  const focusSquare = useGameStore((state) => state.focusSquare);
  const history = useGameStore((state) => state.history);
  const cursor = useGameStore((state) => state.cursor);
  const initialFen = useGameStore((state) => state.initialFen);
  const pieces = useGameStore((state) => state.pieces);
  const hints = useUiStore((state) => state.hints);
  const fen = fenAt(initialFen, history, cursor);
  const status = statusFromLine(initialFen, history, cursor);
  const destinations =
    selected && !status.outcome ? legalFrom(fen, selected) : [];
  const dot = useMemo(() => new CylinderGeometry(0.075, 0.075, 0.012, 18), []);
  const ring = useMemo(() => {
    const geometry = new TorusGeometry(0.3, 0.016, 8, 28);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }, []);

  const dots = hints
    ? destinations
        .filter((dest) => !dest.capture)
        .map((dest) => {
          const [x, z] = squareToXZ(dest.to);
          return [x, 0.02, z] as [number, number, number];
        })
    : [];
  const rings = hints
    ? destinations
        .filter((dest) => dest.capture)
        .map((dest) => {
          const [x, z] = squareToXZ(dest.to);
          return [x, 0.02, z] as [number, number, number];
        })
    : [];
  const last = cursor >= 0 ? history[cursor] : null;
  const king = status.inCheck
    ? pieces.find((piece) => piece.type === "k" && piece.color === status.turn)
    : null;

  return (
    <group>
      {last && (
        <>
          <FlatSquare square={last.from} color="#c6a15b" opacity={0.22} />
          <FlatSquare square={last.to} color="#c6a15b" opacity={0.32} />
        </>
      )}
      <FlatSquare square={focusSquare} color="#f4efe6" opacity={0.08} />
      {selected && <FlatSquare square={selected} color="#c6a15b" opacity={0.18} />}
      {king && <FlatSquare square={king.square} color="#c45c4a" opacity={0.38} />}
      <MarkerSet points={dots} geometry={dot} color="#c6a15b" opacity={0.95} />
      <MarkerSet points={rings} geometry={ring} color="#c6a15b" opacity={0.95} />
    </group>
  );
}
