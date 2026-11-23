"use client";

import { useEffect } from "react";
import type { Color } from "@/lib/chess/engine";
import { fenAt } from "@/lib/chess/engine";
import { chooseMove } from "@/lib/chess/search";
import { useGameStore, useGameView } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";

export function computerColor(opponent: "person" | "computer", playerColor: Color): Color | null {
  if (opponent !== "computer") return null;
  return playerColor === "w" ? "b" : "w";
}

export function useComputer() {
  const opponent = useUiStore((state) => state.opponent);
  const playerColor = useUiStore((state) => state.playerColor);
  const level = useUiStore((state) => state.level);
  const reduced = useUiStore((state) => state.reducedMotion);
  const cursor = useGameStore((state) => state.cursor);
  const pending = useGameStore((state) => state.pendingPromotion);
  const view = useGameView();
  const computer = computerColor(opponent, playerColor);

  useEffect(() => {
    useGameStore.getState().setComputer(computer);
  }, [computer]);

  useEffect(() => {
    if (!computer || pending || view.outcome || view.browsing) return;
    if (view.status.turn !== computer) return;
    if (view.claim) {
      useGameStore.getState().claimDraw();
      return;
    }

    const fen = view.fen;
    const seen = cursor;
    useGameStore.getState().setThinking(true);
    const id = window.setTimeout(() => {
      const live = useGameStore.getState();
      const liveFen = fenAt(live.initialFen, live.history, live.cursor);
      if (live.cursor !== seen || liveFen !== fen || live.pendingPromotion) {
        live.setThinking(false);
        return;
      }
      const move = chooseMove(fen, level);
      if (!move) {
        live.setThinking(false);
        return;
      }
      live.playReply(move.from, move.to, move.promotion);
    }, reduced ? 0 : 240);

    return () => {
      window.clearTimeout(id);
      useGameStore.getState().setThinking(false);
    };
  }, [
    computer,
    cursor,
    level,
    pending,
    reduced,
    view.browsing,
    view.claim,
    view.fen,
    view.outcome,
    view.status.turn,
  ]);
}
