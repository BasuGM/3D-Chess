import { Vector3 } from "three";
import type { Square } from "chess.js";
import { useGameStore } from "@/lib/store/gameStore";
import { squareToXZ } from "@/lib/chess/squares";
import { clearDrag, dragState } from "@/components/scene/drag";
import { sceneApi } from "@/components/scene/sceneApi";

const origin = new Vector3();

export function startPointerDrag(from: Square, id: string | null) {
  const state = useGameStore.getState();
  const wasSelected = state.selected === from;
  const [x, z] = squareToXZ(from);
  origin.set(x, 0, z);
  dragState.active = true;
  dragState.from = from;
  dragState.id = id;
  dragState.moved = false;
  dragState.point.copy(origin);
  sceneApi.setControlsEnabled(false);
  if (id) useGameStore.setState({ selected: from, focusSquare: from });

  const onMove = (event: PointerEvent) => {
    const hit = sceneApi.raycastBoard(event);
    if (!hit) return;
    dragState.point.copy(hit.point);
    if (hit.point.distanceTo(origin) > 0.2) dragState.moved = true;
    sceneApi.invalidate();
  };

  const onUp = (event: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    const hit = sceneApi.raycastBoard(event);
    const fromSquare = dragState.from;
    const moved = dragState.moved;
    const draggedId = dragState.id;
    clearDrag();
    sceneApi.setControlsEnabled(true);
    sceneApi.invalidate();
    document.getElementById("board-keys")?.focus();
    if (!fromSquare) return;
    const square = (hit?.square ?? fromSquare) as Square;
    if (moved && draggedId && square !== fromSquare) {
      useGameStore.getState().moveBetween(fromSquare, square);
      return;
    }
    if (!moved) {
      if (wasSelected && draggedId) {
        useGameStore.getState().clearSelection();
        return;
      }
      if (!draggedId) useGameStore.getState().selectOrMove(square);
    }
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp, { once: true });
}
