"use client";

import { graphicsPresets } from "@/lib/theme/graphics";
import { useUiStore } from "@/lib/store/uiStore";

export function Lights() {
  const quality = useUiStore((state) => state.quality);
  const preset = graphicsPresets[quality];
  const map = preset.shadows ? preset.shadowMapSize : 256;

  return (
    <>
      <ambientLight intensity={0.34} color="#f7f2ea" />
      <directionalLight
        position={[4.4, 9.2, 3.4]}
        intensity={2.35}
        color="#fff5e8"
        castShadow={preset.shadows}
        shadow-mapSize={[map, map]}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />
      {preset.lightCount > 1 && (
        <directionalLight position={[-6.2, 4.8, 2.2]} intensity={0.5} color="#d7e0f4" />
      )}
      {preset.lightCount > 2 && (
        <directionalLight position={[0.4, 3.6, -7.2]} intensity={0.38} color="#ffd8b0" />
      )}
    </>
  );
}
