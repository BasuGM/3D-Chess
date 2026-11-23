import { listMoves, statusFromLine, type ListedMove } from "@/lib/chess/engine";

export type Level = "easy" | "medium" | "hard";

const DEPTH: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };
const VALUES: Record<string, number> = { p: 100, n: 300, b: 300, r: 500, q: 900 };
const MATE = 100_000;
const INF = 1_000_000;

type Flag = "exact" | "lower" | "upper";
type Entry = { depth: number; score: number; flag: Flag };
type Table = Map<string, Entry>;

function terminal(fen: string, ply: number): number | null {
  const status = statusFromLine(fen, [], -1);
  if (status.outcome?.kind === "checkmate") return -MATE + ply;
  if (status.outcome) return 0;
  return null;
}

function evaluate(fen: string, mobility: number): number {
  const [placement, turn] = fen.split(" ");
  let material = 0;
  for (const char of placement) {
    const value = VALUES[char.toLowerCase()];
    if (!value) continue;
    material += char === char.toUpperCase() ? value : -value;
  }
  const side = turn === "w" ? material : -material;
  return side + mobility;
}

function ordered(fen: string): ListedMove[] {
  return listMoves(fen).sort(
    (a, b) => (VALUES[b.captured ?? ""] ?? 0) - (VALUES[a.captured ?? ""] ?? 0),
  );
}

function positionKey(fen: string) {
  return fen.split(" ").slice(0, 4).join(" ");
}

function remembered(table: Table, fen: string, depth: number, alpha: number, beta: number) {
  const entry = table.get(positionKey(fen));
  if (!entry || entry.depth < depth) return null;
  if (entry.flag === "exact") return entry.score;
  if (entry.flag === "lower" && entry.score >= beta) return entry.score;
  if (entry.flag === "upper" && entry.score <= alpha) return entry.score;
  return null;
}

function remember(table: Table, fen: string, depth: number, score: number, flag: Flag) {
  const key = positionKey(fen);
  const entry = table.get(key);
  if (!entry || entry.depth <= depth) table.set(key, { depth, score, flag });
}

function quiesce(fen: string, alpha: number, beta: number, left: number, ply: number): number {
  const moves = listMoves(fen);
  if (moves.length === 0) return terminal(fen, ply) ?? 0;
  const stand = evaluate(fen, moves.length);
  if (left === 0 || stand >= beta) return stand >= beta ? beta : stand;
  let nextAlpha = Math.max(alpha, stand);
  for (const move of moves) {
    if (!move.capture) continue;
    const score = -quiesce(move.fen, -beta, -nextAlpha, left - 1, ply + 1);
    if (score >= beta) return beta;
    if (score > nextAlpha) nextAlpha = score;
  }
  return nextAlpha;
}

function negamax(
  fen: string,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  quiet: boolean,
  table: Table,
): number {
  if (depth === 0 && quiet) return quiesce(fen, alpha, beta, 2, ply);
  const cached = remembered(table, fen, depth, alpha, beta);
  if (cached !== null) return cached;

  const moves = ordered(fen);
  if (moves.length === 0) return terminal(fen, ply) ?? 0;
  if (depth === 0) return evaluate(fen, moves.length);

  const start = alpha;
  let best = -INF;
  for (const move of moves) {
    const score = -negamax(move.fen, depth - 1, -beta, -alpha, ply + 1, quiet, table);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  const flag: Flag = best <= start ? "upper" : best >= beta ? "lower" : "exact";
  remember(table, fen, depth, best, flag);
  return best;
}

export function chooseMove(fen: string, level: Level): ListedMove | null {
  const moves = ordered(fen);
  if (moves.length === 0) return null;
  const quiet = level === "hard";
  const depth = DEPTH[level];
  const table: Table = new Map();
  let alpha = -INF;
  const tied: ListedMove[] = [];
  for (const move of moves) {
    const score = -negamax(move.fen, depth - 1, -INF, -alpha, 1, quiet, table);
    if (score > alpha) {
      alpha = score;
      tied.length = 0;
      tied.push(move);
    } else if (score === alpha) {
      tied.push(move);
    }
  }
  const index = level === "easy" ? Math.floor(Math.random() * tied.length) : 0;
  return tied[index] ?? null;
}
