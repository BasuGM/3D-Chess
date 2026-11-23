import {
  Chess,
  DEFAULT_POSITION,
  validateFen,
  type Move,
  type PieceSymbol,
  type Square,
} from "chess.js";

export const START_FEN = DEFAULT_POSITION;

export type Color = "w" | "b";

export type HistoryMove = {
  san: string;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  capture: boolean;
  enPassant: boolean;
  kingside: boolean;
  queenside: boolean;
  fen: string;
};

export type Outcome =
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "insufficient" };

export type Claim = { reason: "threefold" | "fifty-move" };

export type PositionStatus = {
  turn: Color;
  inCheck: boolean;
  outcome: Outcome | null;
  claim: Claim | null;
};

export type LegalDest = {
  to: Square;
  capture: boolean;
  promotion: boolean;
};

export type PlayResult =
  | { kind: "ok"; move: HistoryMove }
  | { kind: "promotion" }
  | { kind: "illegal" };

function toHistory(move: Move): HistoryMove {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured,
    promotion: move.promotion,
    capture: move.isCapture(),
    enPassant: move.isEnPassant(),
    kingside: move.isKingsideCastle(),
    queenside: move.isQueensideCastle(),
    fen: move.after,
  };
}

export function lineChess(
  initialFen: string,
  history: HistoryMove[],
  cursor: number,
): Chess {
  const chess = new Chess(initialFen);
  const end = Math.min(cursor, history.length - 1);
  for (let i = 0; i <= end; i += 1) {
    const move = history[i];
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
  }
  return chess;
}

export function fenAt(
  initialFen: string,
  history: HistoryMove[],
  cursor: number,
): string {
  if (cursor < 0 || history.length === 0) return initialFen;
  return history[Math.min(cursor, history.length - 1)].fen;
}

export function statusFromLine(
  initialFen: string,
  history: HistoryMove[],
  cursor: number,
): PositionStatus {
  const chess = lineChess(initialFen, history, cursor);
  const turn = chess.turn();
  const inCheck = chess.inCheck();
  if (chess.isCheckmate()) {
    return {
      turn,
      inCheck,
      outcome: { kind: "checkmate", winner: turn === "w" ? "b" : "w" },
      claim: null,
    };
  }
  if (chess.isStalemate()) {
    return { turn, inCheck, outcome: { kind: "stalemate" }, claim: null };
  }
  if (chess.isInsufficientMaterial()) {
    return { turn, inCheck, outcome: { kind: "insufficient" }, claim: null };
  }
  let claim: Claim | null = null;
  if (chess.isThreefoldRepetition()) claim = { reason: "threefold" };
  else if (chess.isDrawByFiftyMoves()) claim = { reason: "fifty-move" };
  return { turn, inCheck, outcome: null, claim };
}

export function legalFrom(fen: string, square: Square): LegalDest[] {
  const chess = new Chess(fen);
  const moves = chess.moves({ square, verbose: true });
  const grouped = new Map<Square, LegalDest>();
  for (const move of moves) {
    const previous = grouped.get(move.to);
    grouped.set(move.to, {
      to: move.to,
      capture: move.isCapture() || previous?.capture || false,
      promotion: move.isPromotion() || previous?.promotion || false,
    });
  }
  return [...grouped.values()];
}

export function playMove(
  fen: string,
  from: Square,
  to: Square,
  promotion?: PieceSymbol,
): PlayResult {
  const chess = new Chess(fen);
  const options = chess
    .moves({ square: from, verbose: true })
    .filter((move) => move.to === to);
  if (options.length === 0) return { kind: "illegal" };
  if (options.some((move) => move.isPromotion()) && !promotion) {
    return { kind: "promotion" };
  }
  try {
    const move = chess.move({
      from,
      to,
      promotion: promotion ?? options[0].promotion,
    });
    return { kind: "ok", move: toHistory(move) };
  } catch {
    return { kind: "illegal" };
  }
}

export function inspectFen(fen: string): { ok: true } | { ok: false; error: string } {
  const trimmed = fen.trim();
  if (!trimmed) return { ok: false, error: "Enter a FEN string." };
  const result = validateFen(trimmed);
  if (!result.ok) return { ok: false, error: result.error ?? "Invalid FEN." };
  try {
    new Chess(trimmed);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid FEN.",
    };
  }
  return { ok: true };
}

export function pgnOf(
  initialFen: string,
  history: HistoryMove[],
  result: string,
  date = "????.??.??",
): string {
  const chess = new Chess(initialFen);
  chess.setHeader("Event", "Local game");
  chess.setHeader("Site", "Grandmaster 3D");
  chess.setHeader("Date", date);
  chess.setHeader("White", "White");
  chess.setHeader("Black", "Black");
  chess.setHeader("Result", result);
  if (initialFen !== START_FEN) {
    chess.setHeader("FEN", initialFen);
    chess.setHeader("SetUp", "1");
  }
  for (const move of history) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
  }
  return chess.pgn();
}

export function resultToken(
  initialFen: string,
  history: HistoryMove[],
  claimed: { fen: string; reason: Claim["reason"] } | null,
): string {
  const cursor = history.length - 1;
  const fen = fenAt(initialFen, history, cursor);
  if (claimed && claimed.fen === fen) return "1/2-1/2";
  const status = statusFromLine(initialFen, history, cursor);
  if (status.outcome?.kind === "checkmate") {
    return status.outcome.winner === "w" ? "1-0" : "0-1";
  }
  if (status.outcome) return "1/2-1/2";
  return "*";
}

const VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function capturedPieces(
  history: HistoryMove[],
  cursor: number,
): { w: PieceSymbol[]; b: PieceSymbol[] } {
  const taken = { w: [] as PieceSymbol[], b: [] as PieceSymbol[] };
  const end = Math.min(cursor, history.length - 1);
  for (let i = 0; i <= end; i += 1) {
    const move = history[i];
    if (!move.captured) continue;
    taken[move.color].push(move.captured);
  }
  return taken;
}

/** Positive when White has captured more material. */
export function materialDelta(taken: { w: PieceSymbol[]; b: PieceSymbol[] }): number {
  const sum = (pieces: PieceSymbol[]) =>
    pieces.reduce((total, piece) => total + VALUES[piece], 0);
  return sum(taken.w) - sum(taken.b);
}

export function statusLabel(
  status: PositionStatus,
  claimed: { reason: Claim["reason"] } | null,
): string {
  if (claimed?.reason === "threefold") return "Draw — threefold repetition";
  if (claimed?.reason === "fifty-move") return "Draw — fifty-move rule";
  if (status.outcome?.kind === "checkmate") {
    const winner = status.outcome.winner === "w" ? "White" : "Black";
    return `Checkmate — ${winner} wins`;
  }
  if (status.outcome?.kind === "stalemate") return "Stalemate";
  if (status.outcome?.kind === "insufficient") return "Draw — insufficient material";
  const name = status.turn === "w" ? "White" : "Black";
  if (status.inCheck) return `${name} is in check`;
  return `${name} to move`;
}
