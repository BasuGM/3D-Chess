import { Vector3 } from "three";
import type { Square } from "chess.js";

export const dragState = {
  active: false,
  from: null as Square | null,
  id: null as string | null,
  moved: false,
  point: new Vector3(),
};

export function clearDrag() {
  dragState.active = false;
  dragState.from = null;
  dragState.id = null;
  dragState.moved = false;
}
