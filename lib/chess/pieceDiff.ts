import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Color, HistoryMove } from "@/lib/chess/engine";
import { FILES } from "@/lib/chess/squares";

export type PieceInstance = {
  id: string;
  type: PieceSymbol;
  color: Color;
  square: Square;
};

export function piecesFromFen(fen: string): PieceInstance[] {
  const board = new Chess(fen).board();
  const counts = new Map<string, number>();
  const pieces: PieceInstance[] = [];
  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      const cell = board[rankIndex][fileIndex];
      if (!cell) continue;
      const key = `${cell.color}${cell.type}`;
      const n = counts.get(key) ?? 0;
      counts.set(key, n + 1);
      const rank = 8 - rankIndex;
      pieces.push({
        id: `${key}${n}`,
        type: cell.type,
        color: cell.color,
        square: `${FILES[fileIndex]}${rank}` as Square,
      });
    }
  }
  return pieces;
}

export function applyMove(pieces: PieceInstance[], move: HistoryMove): PieceInstance[] {
  const next = pieces.map((piece) => ({ ...piece }));
  const remove = (square: Square) => {
    const index = next.findIndex((piece) => piece.square === square);
    if (index >= 0) next.splice(index, 1);
  };

  if (move.enPassant) {
    const rank = Number(move.to[1]) + (move.color === "w" ? -1 : 1);
    remove(`${move.to[0]}${rank}` as Square);
  } else if (move.capture) {
    remove(move.to);
  }

  const mover = next.find((piece) => piece.square === move.from);
  if (!mover) return next;
  mover.square = move.to;
  if (move.promotion) mover.type = move.promotion;

  const home = move.color === "w" ? "1" : "8";
  if (move.kingside) {
    const rook = next.find((piece) => piece.square === `h${home}`);
    if (rook) rook.square = `f${home}` as Square;
  } else if (move.queenside) {
    const rook = next.find((piece) => piece.square === `a${home}`);
    if (rook) rook.square = `d${home}` as Square;
  }
  return next;
}

export function piecesAt(
  initialFen: string,
  history: HistoryMove[],
  cursor: number,
): PieceInstance[] {
  let pieces = piecesFromFen(initialFen);
  const end = Math.min(cursor, history.length - 1);
  for (let i = 0; i <= end; i += 1) {
    pieces = applyMove(pieces, history[i]);
  }
  return pieces;
}
