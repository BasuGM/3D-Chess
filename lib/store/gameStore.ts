import { useMemo } from "react";
import { create } from "zustand";
import type { Color, PieceSymbol, Square } from "chess.js";
import {
  START_FEN,
  capturedPieces,
  fenAt,
  inspectFen,
  legalFrom,
  materialDelta,
  pgnOf,
  playMove,
  resultToken,
  statusFromLine,
  statusLabel,
  type Claim,
  type HistoryMove,
  type Outcome,
  type PositionStatus,
} from "@/lib/chess/engine";
import { piecesAt, type PieceInstance } from "@/lib/chess/pieceDiff";
import { shiftSquare, type Side } from "@/lib/chess/squares";
import { useUiStore } from "@/lib/store/uiStore";

type ClaimRecord = { fen: string; reason: Claim["reason"] };

type GameState = {
  initialFen: string;
  history: HistoryMove[];
  cursor: number;
  selected: Square | null;
  focusSquare: Square;
  orientation: Side;
  viewNonce: number;
  pendingPromotion: { from: Square; to: Square } | null;
  thinking: boolean;
  computer: Color | null;
  dismissedClaimFen: string | null;
  claimed: ClaimRecord | null;
  pieces: PieceInstance[];
  selectOrMove: (square: Square) => void;
  moveBetween: (from: Square, to: Square) => void;
  choosePromotion: (piece: PieceSymbol) => void;
  setThinking: (thinking: boolean) => void;
  setComputer: (computer: Color | null) => void;
  playReply: (from: Square, to: Square, promotion?: PieceSymbol) => void;
  undo: () => void;
  redo: () => void;
  jump: (cursor: number) => void;
  restart: () => void;
  importFen: (fen: string) => string | null;
  exportPgn: (date?: string) => string;
  exportFen: () => string;
  setOrientation: (side: Side) => void;
  flipOrientation: () => void;
  resetView: () => void;
  moveFocus: (dx: number, dy: number) => void;
  confirmFocus: () => void;
  clearSelection: () => void;
  claimDraw: () => void;
  declineClaim: () => void;
};

function freshPieces(fen: string) {
  return piecesAt(fen, [], -1);
}

const initial = {
  initialFen: START_FEN,
  history: [] as HistoryMove[],
  cursor: -1,
  selected: null as Square | null,
  focusSquare: "e2" as Square,
  orientation: "white" as Side,
  viewNonce: 0,
  pendingPromotion: null,
  thinking: false,
  computer: null,
  dismissedClaimFen: null,
  claimed: null,
  pieces: freshPieces(START_FEN),
};

function locked(state: GameState, fen: string, status: PositionStatus) {
  if (state.thinking || state.pendingPromotion) return true;
  if (status.outcome) return true;
  return state.claimed?.fen === fen;
}

function facingSide(state: GameState, initialFen: string, history: HistoryMove[], cursor: number) {
  if (state.computer || !useUiStore.getState().turnBoard) return undefined;
  return statusFromLine(initialFen, history, cursor).turn === "w" ? "white" : "black";
}

function plyStep(state: GameState, direction: "undo" | "redo") {
  const computer = state.computer;
  if (!computer) return 1;
  if (direction === "undo") {
    const last = state.history[state.cursor];
    if (state.cursor === state.history.length - 1 && state.cursor >= 1 && last?.color === computer) {
      return 2;
    }
    return 1;
  }
  const landing = state.cursor + 2;
  if (landing === state.history.length - 1 && state.history[landing]?.color === computer) return 2;
  return 1;
}

export const useGameStore = create<GameState>((set, get) => {
  function commit(from: Square, to: Square, promotion?: PieceSymbol) {
    const state = get();
    const fen = fenAt(state.initialFen, state.history, state.cursor);
    const status = statusFromLine(state.initialFen, state.history, state.cursor);
    if (status.outcome || state.claimed?.fen === fen) return;
    if (state.pendingPromotion && !promotion) return;
    if (
      promotion &&
      state.pendingPromotion &&
      (state.pendingPromotion.from !== from || state.pendingPromotion.to !== to)
    ) {
      return;
    }

    const result = playMove(fen, from, to, promotion);
    if (result.kind === "promotion") {
      set({ pendingPromotion: { from, to }, selected: from, focusSquare: to });
      return;
    }
    if (result.kind === "illegal") return;

    const history = state.history.slice(0, state.cursor + 1);
    history.push(result.move);
    const cursor = history.length - 1;
    const orientation = facingSide(state, state.initialFen, history, cursor);
    set({
      history,
      cursor,
      selected: null,
      pendingPromotion: null,
      focusSquare: result.move.to,
      dismissedClaimFen: null,
      claimed: null,
      pieces: piecesAt(state.initialFen, history, cursor),
      ...(orientation ? { orientation } : {}),
    });
  }

  return {
    ...initial,
    selectOrMove: (square) => {
      const state = get();
      const fen = fenAt(state.initialFen, state.history, state.cursor);
      const status = statusFromLine(state.initialFen, state.history, state.cursor);
      if (locked(state, fen, status)) return;

      if (state.selected) {
        const destinations = legalFrom(fen, state.selected);
        if (destinations.some((dest) => dest.to === square)) {
          commit(state.selected, square);
          return;
        }
      }

      const piece = state.pieces.find((item) => item.square === square);
      if (piece && piece.color === status.turn) {
        set({
          selected: state.selected === square ? null : square,
          focusSquare: square,
        });
        return;
      }
      set({ selected: null, focusSquare: square });
    },
    moveBetween: (from, to) => {
      const state = get();
      const fen = fenAt(state.initialFen, state.history, state.cursor);
      const status = statusFromLine(state.initialFen, state.history, state.cursor);
      if (locked(state, fen, status)) return;
      const piece = state.pieces.find((item) => item.square === from);
      if (!piece || piece.color !== status.turn) return;
      set({ selected: from });
      commit(from, to);
    },
    choosePromotion: (piece) => {
      const pending = get().pendingPromotion;
      if (!pending) return;
      commit(pending.from, pending.to, piece);
    },
    setThinking: (thinking) => set({ thinking }),
    setComputer: (computer) => set({ computer, thinking: false }),
    playReply: (from, to, promotion) => {
      set({ thinking: false });
      commit(from, to, promotion);
    },
    undo: () => {
      const state = get();
      if (state.cursor < 0) return;
      const cursor = state.cursor - plyStep(state, "undo");
      const orientation = facingSide(state, state.initialFen, state.history, cursor);
      set({
        cursor,
        thinking: false,
        selected: null,
        pendingPromotion: null,
        pieces: piecesAt(state.initialFen, state.history, cursor),
        ...(orientation ? { orientation } : {}),
      });
    },
    redo: () => {
      const state = get();
      if (state.cursor >= state.history.length - 1) return;
      const cursor = Math.min(state.history.length - 1, state.cursor + plyStep(state, "redo"));
      const orientation = facingSide(state, state.initialFen, state.history, cursor);
      set({
        cursor,
        thinking: false,
        selected: null,
        pendingPromotion: null,
        pieces: piecesAt(state.initialFen, state.history, cursor),
        ...(orientation ? { orientation } : {}),
      });
    },
    jump: (cursor) => {
      const state = get();
      const next = Math.min(state.history.length - 1, Math.max(-1, cursor));
      const orientation = facingSide(state, state.initialFen, state.history, next);
      set({
        cursor: next,
        thinking: false,
        selected: null,
        pendingPromotion: null,
        pieces: piecesAt(state.initialFen, state.history, next),
        ...(orientation ? { orientation } : {}),
      });
    },
    restart: () => {
      const state = get();
      set({
        ...initial,
        computer: state.computer,
        orientation: state.computer ? state.orientation : initial.orientation,
        pieces: freshPieces(START_FEN),
        viewNonce: state.viewNonce + 1,
      });
    },
    importFen: (fen) => {
      const inspected = inspectFen(fen);
      if (!inspected.ok) return inspected.error;
      const trimmed = fen.trim();
      const state = get();
      const chessTurn = statusFromLine(trimmed, [], -1).turn;
      const orientation = state.computer
        ? state.orientation
        : chessTurn === "w"
          ? "white"
          : "black";
      set({
        initialFen: trimmed,
        history: [],
        cursor: -1,
        selected: null,
        focusSquare: chessTurn === "w" ? "e2" : "e7",
        orientation,
        pendingPromotion: null,
        thinking: false,
        dismissedClaimFen: null,
        claimed: null,
        pieces: freshPieces(trimmed),
        viewNonce: state.viewNonce + 1,
      });
      return null;
    },
    exportPgn: (date) => {
      const state = get();
      return pgnOf(
        state.initialFen,
        state.history,
        resultToken(state.initialFen, state.history, state.claimed),
        date,
      );
    },
    exportFen: () => fenAt(get().initialFen, get().history, get().cursor),
    setOrientation: (orientation) =>
      set((state) => ({ orientation, viewNonce: state.viewNonce + 1 })),
    flipOrientation: () =>
      set((state) => ({
        orientation: state.orientation === "white" ? "black" : "white",
        viewNonce: state.viewNonce + 1,
      })),
    resetView: () => set((state) => ({ viewNonce: state.viewNonce + 1 })),
    moveFocus: (dx, dy) => {
      const state = get();
      set({
        focusSquare: shiftSquare(
          state.focusSquare,
          dx,
          dy,
          state.orientation,
        ) as Square,
      });
    },
    confirmFocus: () => {
      get().selectOrMove(get().focusSquare);
    },
    clearSelection: () => set({ selected: null }),
    claimDraw: () => {
      const state = get();
      const fen = fenAt(state.initialFen, state.history, state.cursor);
      const status = statusFromLine(state.initialFen, state.history, state.cursor);
      if (!status.claim || state.dismissedClaimFen === fen) return;
      set({
        claimed: { fen, reason: status.claim.reason },
        selected: null,
        pendingPromotion: null,
      });
    },
    declineClaim: () => {
      const state = get();
      set({
        dismissedClaimFen: fenAt(state.initialFen, state.history, state.cursor),
      });
    },
  };
});

export function useGameView() {
  const initialFen = useGameStore((state) => state.initialFen);
  const history = useGameStore((state) => state.history);
  const cursor = useGameStore((state) => state.cursor);
  const dismissedClaimFen = useGameStore((state) => state.dismissedClaimFen);
  const claimed = useGameStore((state) => state.claimed);
  return useMemo(() => {
    const fen = fenAt(initialFen, history, cursor);
    const status = statusFromLine(initialFen, history, cursor);
    const claim =
      status.claim && dismissedClaimFen !== fen && claimed?.fen !== fen
        ? status.claim
        : null;
    const outcome: Outcome | { kind: "draw"; reason: Claim["reason"] } | null =
      status.outcome ??
      (claimed?.fen === fen ? { kind: "draw", reason: claimed.reason } : null);
    const taken = capturedPieces(history, cursor);
    return {
      fen,
      status,
      claim,
      outcome,
      history,
      cursor,
      taken,
      delta: materialDelta(taken),
      label: statusLabel(status, claimed?.fen === fen ? claimed : null),
      browsing: cursor < history.length - 1,
      locked: outcome !== null,
    };
  }, [claimed, cursor, dismissedClaimFen, history, initialFen]);
}
