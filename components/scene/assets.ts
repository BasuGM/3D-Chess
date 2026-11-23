import {
  CanvasTexture,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import { disposePieceGeometries, pieceGeometries } from "@/components/scene/staunton";

export type SceneAssets = {
  lightSquare: MeshPhysicalMaterial;
  darkSquare: MeshPhysicalMaterial;
  frame: MeshPhysicalMaterial;
  plinth: MeshPhysicalMaterial;
  ivory: MeshPhysicalMaterial;
  ebony: MeshPhysicalMaterial;
  slitLight: MeshPhysicalMaterial;
  slitDark: MeshPhysicalMaterial;
  label: MeshPhysicalMaterial;
  textures: Texture[];
};

let assets: SceneAssets | null = null;

function paintGrain(
  base: string,
  streak: string,
  count: number,
): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i += 1) {
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const y = (i / count) * size;
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.07 + i * 1.7) * 1.6);
    }
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeLabelTexture() {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cell * 8;
  canvas.height = cell * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#8c7340";
  ctx.font = "500 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  "abcdefgh".split("").forEach((file, index) => {
    ctx.fillText(file, cell * index + cell / 2, cell / 2);
  });
  "12345678".split("").forEach((rank, index) => {
    ctx.fillText(rank, cell * index + cell / 2, cell + cell / 2);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function getAssets(): SceneAssets {
  if (assets) return assets;
  const walnut = paintGrain("#6b4423", "rgba(36,18,8,0.28)", 22);
  const ivoryBoard = paintGrain("#e7dcc8", "rgba(120,96,64,0.16)", 16);
  const label = makeLabelTexture();
  pieceGeometries();
  assets = {
    lightSquare: new MeshPhysicalMaterial({
      map: ivoryBoard,
      roughness: 0.72,
      metalness: 0,
      clearcoat: 0.04,
    }),
    darkSquare: new MeshPhysicalMaterial({
      map: walnut,
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.05,
    }),
    frame: new MeshPhysicalMaterial({
      color: "#3d2914",
      roughness: 0.55,
      metalness: 0.04,
      clearcoat: 0.12,
    }),
    plinth: new MeshPhysicalMaterial({
      color: "#1a1816",
      roughness: 0.86,
      metalness: 0,
    }),
    ivory: new MeshPhysicalMaterial({
      color: "#f3ede2",
      roughness: 0.34,
      metalness: 0.03,
      clearcoat: 0.22,
      clearcoatRoughness: 0.4,
    }),
    ebony: new MeshPhysicalMaterial({
      color: "#1a1614",
      roughness: 0.42,
      metalness: 0.06,
      clearcoat: 0.16,
      clearcoatRoughness: 0.45,
    }),
    slitLight: new MeshPhysicalMaterial({ color: "#2a241c", roughness: 0.5 }),
    slitDark: new MeshPhysicalMaterial({ color: "#3d3832", roughness: 0.5 }),
    label: new MeshPhysicalMaterial({
      map: label,
      transparent: true,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    }),
    textures: [walnut, ivoryBoard, label],
  };
  return assets;
}

export function disposeAssets() {
  if (!assets) return;
  [
    assets.lightSquare,
    assets.darkSquare,
    assets.frame,
    assets.plinth,
    assets.ivory,
    assets.ebony,
    assets.slitLight,
    assets.slitDark,
    assets.label,
  ].forEach((material) => material.dispose());
  assets.textures.forEach((texture) => texture.dispose());
  assets = null;
  disposePieceGeometries();
}
