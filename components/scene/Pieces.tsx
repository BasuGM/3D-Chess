"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { Color, PieceSymbol } from "chess.js";
import { fenAt, statusFromLine } from "@/lib/chess/engine";
import type { PieceInstance } from "@/lib/chess/pieceDiff";
import { squareToXZ } from "@/lib/chess/squares";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";
import { getAssets } from "@/components/scene/assets";
import { dragState } from "@/components/scene/drag";
import { fadeCaptured } from "@/components/scene/fade";
import { startPointerDrag } from "@/components/scene/interaction";
import { parkPiece, pieceIsMoving, rememberPiece, samplePiece } from "@/components/scene/motion";
import { sceneApi } from "@/components/scene/sceneApi";
import { pieceGeometries } from "@/components/scene/staunton";

const DURATION = 0.22;
const CAPACITY = 16;
const TYPES: PieceSymbol[] = ["p", "r", "n", "b", "q", "k"];
const COLORS: Color[] = ["w", "b"];

const matrix = new Matrix4();
const slitMatrix = new Matrix4();
const slitOffset = new Matrix4().makeTranslation(0, 0.55, 0.04);
const position = new Vector3();
const target = new Vector3();
const quaternion = new Quaternion();
const euler = new Euler();
const scale = new Vector3(1, 1, 1);

function pieceLocked() {
  const state = useGameStore.getState();
  const fen = fenAt(state.initialFen, state.history, state.cursor);
  const status = statusFromLine(state.initialFen, state.history, state.cursor);
  return Boolean(state.thinking || state.pendingPromotion || status.outcome || state.claimed?.fen === fen);
}

function writeInstances(
  mesh: InstancedMesh,
  slit: InstancedMesh | null,
  pieces: PieceInstance[],
  delta: number,
  reduced: boolean,
) {
  const selected = useGameStore.getState().selected;
  pieces.forEach((piece, index) => {
    const [x, z] = squareToXZ(piece.square);
    const lift = selected === piece.square ? 0.14 : 0;
    const dragged = dragState.active && dragState.id === piece.id;
    if (dragged) {
      target.set(dragState.point.x, 0.28, dragState.point.z);
      position.copy(parkPiece(piece.id, target));
    } else {
      target.set(x, lift, z);
      position.copy(samplePiece(piece.id, target, delta, reduced));
    }
    const yaw = piece.type === "n" ? (piece.color === "w" ? 0 : Math.PI) : 0;
    euler.set(0, yaw, 0);
    quaternion.setFromEuler(euler);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
    if (slit) {
      slitMatrix.copy(matrix).multiply(slitOffset);
      slit.setMatrixAt(index, slitMatrix);
    }
  });
  mesh.count = pieces.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (slit) {
    slit.count = pieces.length;
    slit.instanceMatrix.needsUpdate = true;
  }
}

function PieceSet({
  type,
  color,
  pieces,
}: {
  type: PieceSymbol;
  color: Color;
  pieces: PieceInstance[];
}) {
  const ref = useRef<InstancedMesh>(null);
  const slitRef = useRef<InstancedMesh>(null);
  const assets = getAssets();
  const geometry = pieceGeometries()[type];
  const material = color === "w" ? assets.ivory : assets.ebony;
  const reduced = useUiStore((state) => state.reducedMotion);
  const selected = useGameStore((state) => state.selected);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (const piece of pieces) {
      const [x, z] = squareToXZ(piece.square);
      const lift = selected === piece.square ? 0.14 : 0;
      target.set(x, lift, z);
      rememberPiece(piece.id, target);
    }
    writeInstances(mesh, slitRef.current, pieces, 0, reduced);
  }, [pieces, reduced, selected]);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh || pieces.length === 0) return;
    writeInstances(mesh, slitRef.current, pieces, delta, reduced);
    if (pieceIsMoving() || dragState.active) sceneApi.invalidate();
  });

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const index = event.instanceId;
    if (index === undefined) return;
    const piece = pieces[index];
    if (!piece || pieceLocked()) return;
    const status = statusFromLine(
      useGameStore.getState().initialFen,
      useGameStore.getState().history,
      useGameStore.getState().cursor,
    );
    if (piece.color !== status.turn) {
      useGameStore.getState().selectOrMove(piece.square);
      document.getElementById("board-keys")?.focus();
      return;
    }
    startPointerDrag(piece.square, piece.id);
  }

  return (
    <group>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, CAPACITY]}
        geometry={geometry}
        material={material}
        count={pieces.length}
        frustumCulled={false}
        castShadow
        dispose={null}
        onPointerDown={onPointerDown}
      />
      {type === "b" && (
        <instancedMesh
          ref={slitRef}
          args={[undefined, undefined, CAPACITY]}
          count={pieces.length}
          frustumCulled={false}
          raycast={() => null}
          dispose={null}
        >
          <boxGeometry args={[0.018, 0.14, 0.03]} />
          <primitive
            object={color === "w" ? assets.slitLight : assets.slitDark}
            attach="material"
          />
        </instancedMesh>
      )}
    </group>
  );
}

function Ghost({
  piece,
  onDone,
}: {
  piece: PieceInstance;
  onDone: (id: string) => void;
}) {
  const ref = useRef<Mesh>(null);
  const assets = getAssets();
  const reduced = useUiStore((state) => state.reducedMotion);
  const baseMaterial = piece.color === "w" ? assets.ivory : assets.ebony;
  const [fadeMaterial] = useState<MeshPhysicalMaterial | null>(() => {
    const material = baseMaterial.clone();
    material.transparent = true;
    material.opacity = 1;
    return material;
  });
  useEffect(() => () => fadeMaterial?.dispose(), [fadeMaterial]);
  const start = useRef(new Vector3());
  const elapsed = useRef(0);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const [x, z] = squareToXZ(piece.square);
    start.current.set(x, 0, z);
    mesh.position.copy(start.current);
    if (reduced) onDone(piece.id);
  }, [onDone, piece.id, piece.square, reduced]);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh || !fadeMaterial || reduced) return;
    elapsed.current = Math.min(1, elapsed.current + delta / DURATION);
    const eased = 1 - (1 - elapsed.current) ** 3;
    mesh.position.copy(start.current);
    fadeCaptured(mesh, fadeMaterial, eased);
    if (elapsed.current < 1) sceneApi.invalidate();
    else onDone(piece.id);
  });

  const yaw = piece.type === "n" ? (piece.color === "w" ? 0 : Math.PI) : 0;

  return (
    <mesh
      ref={ref}
      geometry={pieceGeometries()[piece.type]}
      material={fadeMaterial ?? baseMaterial}
      rotation={[0, yaw, 0]}
      raycast={() => null}
    />
  );
}

export function Pieces() {
  const pieces = useGameStore((state) => state.pieces);
  const reduced = useUiStore((state) => state.reducedMotion);
  const [ghosts, setGhosts] = useState<PieceInstance[]>([]);
  const [tracked, setTracked] = useState(pieces);
  const groups = useMemo(() => {
    return COLORS.flatMap((color) =>
      TYPES.map((type) => ({
        color,
        type,
        pieces: pieces.filter((piece) => piece.color === color && piece.type === type),
      })),
    );
  }, [pieces]);

  if (tracked !== pieces) {
    const removed = reduced
      ? []
      : tracked.filter((piece) => !pieces.some((next) => next.id === piece.id));
    setTracked(pieces);
    if (reduced) {
      if (ghosts.length > 0) setGhosts([]);
    } else if (removed.length > 0) {
      setGhosts((current) => [
        ...current.filter((ghost) => !pieces.some((piece) => piece.id === ghost.id)),
        ...removed.filter((piece) => !current.some((ghost) => ghost.id === piece.id)),
      ]);
    }
  }

  return (
    <group>
      {groups.map((group) => (
        <PieceSet
          key={`${group.color}${group.type}`}
          type={group.type}
          color={group.color}
          pieces={group.pieces}
        />
      ))}
      {ghosts.map((piece) => (
        <Ghost
          key={`ghost-${piece.id}`}
          piece={piece}
          onDone={(id) => setGhosts((current) => current.filter((ghost) => ghost.id !== id))}
        />
      ))}
    </group>
  );
}
