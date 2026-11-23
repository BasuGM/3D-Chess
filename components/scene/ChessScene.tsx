"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, type WebGLRenderer } from "three";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";
import { graphicsPresets, type Quality } from "@/lib/theme/graphics";
import { disposeAssets } from "@/components/scene/assets";
import { Board } from "@/components/scene/Board";
import { CameraRig } from "@/components/scene/CameraRig";
import { dragState } from "@/components/scene/drag";
import { Highlights } from "@/components/scene/Highlights";
import { Lights } from "@/components/scene/Lights";
import { Pieces } from "@/components/scene/Pieces";
import { sceneApi } from "@/components/scene/sceneApi";

function applyQuality(renderer: WebGLRenderer, quality: Quality) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, graphicsPresets[quality].dprMax));
  renderer.shadowMap.enabled = graphicsPresets[quality].shadows;
}

function BindScene() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const quality = useUiStore((state) => state.quality);

  useEffect(() => {
    sceneApi.camera = camera;
    sceneApi.gl = gl;
    sceneApi.invalidate = invalidate;
    return () => {
      sceneApi.camera = null;
      sceneApi.gl = null;
      sceneApi.invalidate = () => {};
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    applyQuality(gl, quality);
    invalidate();
  }, [gl, invalidate, quality]);

  useEffect(() => {
    const stopGame = useGameStore.subscribe(() => invalidate());
    const stopUi = useUiStore.subscribe(() => invalidate());
    invalidate();
    return () => {
      stopGame();
      stopUi();
    };
  }, [invalidate]);

  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    window.__GM_STATS__ = {
      frames: frames.current,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      shadows: gl.shadowMap.enabled,
      pixelRatio: gl.getPixelRatio(),
    };
  });

  return null;
}

export function ChessScene() {
  useEffect(() => () => disposeAssets(), []);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      shadows="percentage"
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 32, position: [0.2, 9.6, 11.6], near: 0.1, far: 48 }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
      onPointerMissed={() => {
        if (!dragState.active) useGameStore.getState().clearSelection();
      }}
    >
      <color attach="background" args={["#141311"]} />
      <BindScene />
      <Lights />
      <Board />
      <Highlights />
      <Pieces />
      <CameraRig />
    </Canvas>
  );
}
