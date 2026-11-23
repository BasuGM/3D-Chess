import { Plane, Raycaster, Vector2, Vector3, type Camera, type WebGLRenderer } from "three";
import { xzToSquare } from "@/lib/chess/squares";

const raycaster = new Raycaster();
const pointer = new Vector2();
const boardPlane = new Plane(new Vector3(0, 1, 0), 0);
const hitPoint = new Vector3();

export const sceneApi = {
  invalidate: () => {},
  setControlsEnabled: (enabled: boolean) => {
    void enabled;
  },
  camera: null as Camera | null,
  gl: null as WebGLRenderer | null,
  raycastBoard(event: PointerEvent): { point: Vector3; square: string | null } | null {
    const camera = this.camera;
    const gl = this.gl;
    if (!camera || !gl) return null;
    const rect = gl.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const point = raycaster.ray.intersectPlane(boardPlane, hitPoint);
    if (!point) return null;
    return { point: point.clone(), square: xzToSquare(point.x, point.z) };
  },
};
