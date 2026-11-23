"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const ChessScene = dynamic(
  () => import("@/components/scene/ChessScene").then((mod) => mod.ChessScene),
  { ssr: false },
);

function subscribe() {
  return () => {};
}

export function ChessStage() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <div className="h-full w-full bg-charcoal" />;
  return <ChessScene />;
}
