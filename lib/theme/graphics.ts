export type Quality = "high" | "balanced" | "low";

export type GraphicsPreset = {
  shadows: boolean;
  shadowMapSize: number;
  dprMax: number;
  lightCount: number;
};

export const graphicsPresets: Record<Quality, GraphicsPreset> = {
  high: { shadows: true, shadowMapSize: 2048, dprMax: 2, lightCount: 3 },
  balanced: { shadows: true, shadowMapSize: 1024, dprMax: 1.5, lightCount: 3 },
  low: { shadows: false, shadowMapSize: 0, dprMax: 1, lightCount: 2 },
};
