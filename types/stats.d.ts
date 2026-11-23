export type GmStats = {
  frames: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  shadows: boolean;
  pixelRatio: number;
};

declare global {
  interface Window {
    __GM_STATS__?: GmStats;
    __GM_IDLE__?: { frames: number; at: number };
  }
}

export {};
