import type { Mesh, MeshPhysicalMaterial } from "three";

/** Three materials are mutable. Kept out of the component so capture fades stay on the mesh. */
export function fadeCaptured(mesh: Mesh, material: MeshPhysicalMaterial, eased: number) {
  material.opacity = 1 - eased;
  mesh.position.y = -eased * 0.35;
}
