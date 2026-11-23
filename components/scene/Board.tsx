"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { BoxGeometry, BufferGeometry, InstancedMesh, Matrix4, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Square } from "chess.js";
import { fenAt, statusFromLine } from "@/lib/chess/engine";
import { indexToSquare } from "@/lib/chess/squares";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";
import { getAssets } from "@/components/scene/assets";
import { startPointerDrag } from "@/components/scene/interaction";

const THICKNESS = 0.12;

function BoardSquares({
  tone,
  indices,
}: {
  tone: "light" | "dark";
  indices: number[];
}) {
  const ref = useRef<InstancedMesh>(null);
  const assets = getAssets();
  const material = tone === "light" ? assets.lightSquare : assets.darkSquare;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    indices.forEach((index, instance) => {
      const file = index % 8;
      const rank = Math.floor(index / 8);
      matrix.makeTranslation(-3.5 + file, -THICKNESS / 2, 3.5 - rank);
      mesh.setMatrixAt(instance, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [indices]);

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const instance = event.instanceId;
    if (instance === undefined) return;
    const index = indices[instance];
    if (index === undefined) return;
    const square = indexToSquare(index) as Square;
    const state = useGameStore.getState();
    const status = statusFromLine(state.initialFen, state.history, state.cursor);
    const occupant = state.pieces.find((piece) => piece.square === square);
    const ownPiece =
      occupant && occupant.color === status.turn && !state.pendingPromotion && !status.outcome
        ? occupant.id
        : null;
    if (state.pendingPromotion || status.outcome || state.claimed?.fen === fenAt(state.initialFen, state.history, state.cursor)) {
      return;
    }
    startPointerDrag(square, ownPiece);
  }

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, indices.length]}
      material={material}
      receiveShadow
      onPointerDown={onPointerDown}
    >
      <boxGeometry args={[1, THICKNESS, 1]} />
    </instancedMesh>
  );
}

function Frame() {
  const assets = getAssets();
  const geometry = useMemo(() => {
    const lip = 0.62;
    const outer = 8 + lip * 2;
    const height = 0.16;
    const y = -0.08;
    const north = new BoxGeometry(outer, height, lip);
    north.translate(0, y, 4 + lip / 2);
    const south = new BoxGeometry(outer, height, lip);
    south.translate(0, y, -(4 + lip / 2));
    const east = new BoxGeometry(lip, height, 8);
    east.translate(4 + lip / 2, y, 0);
    const west = new BoxGeometry(lip, height, 8);
    west.translate(-(4 + lip / 2), y, 0);
    const parts = [north, south, east, west];
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!merged) throw new Error("Could not build the frame.");
    return merged;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={assets.frame} receiveShadow />;
}

function labelPlane(
  column: number,
  row: number,
  x: number,
  y: number,
  z: number,
  rotationY: number,
) {
  const geo = new PlaneGeometry(0.34, 0.34);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) {
    const u = (column + uv.getX(i)) / 8;
    const v = row === 0 ? 0.5 + uv.getY(i) * 0.5 : uv.getY(i) * 0.5;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(rotationY);
  geo.translate(x, y, z);
  return geo;
}

function Coordinates() {
  const show = useUiStore((state) => state.coordinates);
  const assets = getAssets();
  const geometry = useMemo(() => {
    const planes: BufferGeometry[] = [];
    for (let index = 0; index < 8; index += 1) {
      const along = -3.5 + index;
      planes.push(labelPlane(index, 0, along, 0.025, 4.32, 0));
      planes.push(labelPlane(index, 0, along, 0.025, -4.32, Math.PI));
      const rankZ = 3.5 - index;
      planes.push(labelPlane(index, 1, -4.32, 0.025, rankZ, Math.PI / 2));
      planes.push(labelPlane(index, 1, 4.32, 0.025, rankZ, -Math.PI / 2));
    }
    const merged = mergeGeometries(planes, false);
    planes.forEach((plane) => plane.dispose());
    if (!merged) throw new Error("Could not build coordinates.");
    return merged;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  if (!show) return null;
  return <mesh geometry={geometry} material={assets.label} raycast={() => null} />;
}

export function Board() {
  const { light, dark } = useMemo(() => {
    const lightSquares: number[] = [];
    const darkSquares: number[] = [];
    for (let index = 0; index < 64; index += 1) {
      const file = index % 8;
      const rank = Math.floor(index / 8);
      if ((file + rank) % 2 === 0) darkSquares.push(index);
      else lightSquares.push(index);
    }
    return { light: lightSquares, dark: darkSquares };
  }, []);
  const assets = getAssets();

  return (
    <group>
      <mesh position={[0, -0.38, 0]} material={assets.plinth} receiveShadow>
        <boxGeometry args={[10.4, 0.4, 10.4]} />
      </mesh>
      <Frame />
      <BoardSquares tone="light" indices={light} />
      <BoardSquares tone="dark" indices={dark} />
      <Coordinates />
    </group>
  );
}
