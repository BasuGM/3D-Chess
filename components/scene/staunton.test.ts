import { describe, expect, it } from "vitest";
import { pieceGeometries, disposePieceGeometries } from "@/components/scene/staunton";

describe("staunton meshes", () => {
  it("builds six seated pieces with volume", () => {
    const geometries = pieceGeometries();
    for (const type of ["p", "n", "b", "r", "q", "k"] as const) {
      const box = geometries[type].boundingBox;
      expect(box).toBeTruthy();
      expect(box!.min.y).toBeLessThan(0.001);
      expect(box!.max.y).toBeGreaterThan(0.4);
      expect(geometries[type].getAttribute("position").count).toBeGreaterThan(30);
    }
    expect(geometries.k.boundingBox!.max.y).toBeGreaterThan(geometries.p.boundingBox!.max.y);
    disposePieceGeometries();
  });
});
