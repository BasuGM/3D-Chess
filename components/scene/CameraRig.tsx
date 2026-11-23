"use client";

import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";
import { sceneApi } from "@/components/scene/sceneApi";

const VIEWS = {
  white: [0.2, 9.6, 11.6],
  black: [0.2, 9.6, -11.6],
} as const;
const TARGET = [0, -0.55, 0] as const;

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const orientation = useGameStore((state) => state.orientation);
  const viewNonce = useGameStore((state) => state.viewNonce);
  const reduced = useUiStore((state) => state.reducedMotion);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
    controls.mouseButtons.middle = CameraControlsImpl.ACTION.DOLLY;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
    controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY;
    controls.touches.three = CameraControlsImpl.ACTION.NONE;
    controls.minPolarAngle = 0.42;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minDistance = 6;
    controls.maxDistance = 18;
    controls.smoothTime = reduced ? 0 : 0.35;
    sceneApi.setControlsEnabled = (enabled) => {
      controls.enabled = enabled;
    };
    const view = VIEWS[orientation];
    void controls.setLookAt(view[0], view[1], view[2], TARGET[0], TARGET[1], TARGET[2], !reduced);
    return () => {
      sceneApi.setControlsEnabled = () => {};
    };
  }, [orientation, reduced, viewNonce]);

  return <CameraControls ref={ref} makeDefault />;
}
