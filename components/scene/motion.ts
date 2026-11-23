import { Vector3 } from "three";

const DURATION = 0.22;
const latest = new Map<string, Vector3>();
const motions = new Map<string, { from: Vector3; to: Vector3; elapsed: number }>();
const scratch = new Vector3();

export function rememberPiece(id: string, position: Vector3) {
  if (!latest.has(id)) latest.set(id, position.clone());
}

export function pieceIsMoving() {
  return motions.size > 0;
}

/** Returns a scratch vector valid until the next sample. */
export function samplePiece(id: string, target: Vector3, delta: number, reduced: boolean) {
  const motion = motions.get(id);
  if (reduced) {
    motions.delete(id);
    latest.set(id, target.clone());
    return scratch.copy(target);
  }
  if (motion && motion.to.distanceTo(target) < 1e-4) {
    motion.elapsed = Math.min(1, motion.elapsed + delta / DURATION);
    const eased = 1 - (1 - motion.elapsed) ** 3;
    scratch.copy(motion.from).lerp(motion.to, eased);
    latest.set(id, scratch.clone());
    if (motion.elapsed >= 1) motions.delete(id);
    return scratch;
  }
  const previous = latest.get(id);
  if (!previous || previous.distanceTo(target) < 1e-4) {
    motions.delete(id);
    latest.set(id, target.clone());
    return scratch.copy(target);
  }
  motions.set(id, { from: previous.clone(), to: target.clone(), elapsed: 0 });
  latest.set(id, previous.clone());
  return scratch.copy(previous);
}

export function parkPiece(id: string, position: Vector3) {
  motions.delete(id);
  latest.set(id, position.clone());
  return scratch.copy(position);
}
