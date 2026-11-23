import { describe, expect, it } from "vitest";
import type { Square } from "chess.js";
import {
  START_FEN,
  legalFrom,
  pgnOf,
  playMove,
  resultToken,
  statusFromLine,
  statusLabel,
} from "@/lib/chess/engine";
import { piecesAt, piecesFromFen } from "@/lib/chess/pieceDiff";
import { shiftSquare, squareColor, xzToSquare } from "@/lib/chess/squares";
import { useGameStore } from "@/lib/store/gameStore";

function play(from: string, to: string) {
  const store = useGameStore.getState();
  store.selectOrMove(from as Square);
  store.selectOrMove(to as Square);
}

describe("squares", () => {
  it("maps a1 to the near-left corner and back", () => {
    expect(xzToSquare(-3.5, 3.5)).toBe("a1");
    expect(xzToSquare(3.5, -3.5)).toBe("h8");
    expect(squareColor("a1")).toBe("dark");
    expect(squareColor("h1")).toBe("light");
  });

  it("walks screen arrows from White's side", () => {
    expect(shiftSquare("e2", 1, 0, "white")).toBe("f2");
    expect(shiftSquare("e2", 0, 1, "white")).toBe("e3");
    expect(shiftSquare("e2", 0, 1, "black")).toBe("e1");
    expect(shiftSquare("a1", -1, -1, "white")).toBe("a1");
  });
});

describe("engine", () => {
  it("starts with 32 pieces and pawn moves from e2", () => {
    expect(piecesFromFen(START_FEN)).toHaveLength(32);
    expect(legalFrom(START_FEN, "e2").map((move) => move.to).sort()).toEqual(["e3", "e4"]);
  });

  it("detects mate, stalemate, and insufficient material", () => {
    expect(statusFromLine(START_FEN, [], -1).outcome).toBeNull();

    const stalemate = statusFromLine("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", [], -1);
    expect(stalemate.outcome).toEqual({ kind: "stalemate" });

    const bare = statusFromLine("8/8/8/4k3/8/8/8/4K3 w - - 0 1", [], -1);
    expect(bare.outcome).toEqual({ kind: "insufficient" });
    expect(statusLabel(bare, null)).toBe("Draw — insufficient material");
  });

  it("records castling, en passant, and promotion on the piece ids", () => {
    const castleFen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const before = piecesFromFen(castleFen);
    const castle = playMove(castleFen, "e1", "g1");
    expect(castle.kind).toBe("ok");
    if (castle.kind !== "ok") return;
    const afterCastle = piecesAt(castleFen, [castle.move], 0);
    const king = before.find((piece) => piece.square === "e1");
    const rook = before.find((piece) => piece.square === "h1");
    expect(afterCastle.find((piece) => piece.id === king?.id)?.square).toBe("g1");
    expect(afterCastle.find((piece) => piece.id === rook?.id)?.square).toBe("f1");

    const epStart = piecesFromFen(START_FEN);
    const line = ["e2e4", "e7e6", "e4e5", "d7d5", "e5d6"] as const;
    let fen = START_FEN;
    const history = [];
    for (const lan of line) {
      const result = playMove(fen, lan.slice(0, 2) as Square, lan.slice(2, 4) as Square);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      history.push(result.move);
      fen = result.move.fen;
    }
    const ep = history[history.length - 1];
    expect(ep.enPassant).toBe(true);
    const epPieces = piecesAt(START_FEN, history, history.length - 1);
    const captured = epStart.find((piece) => piece.square === "d7");
    expect(epPieces.some((piece) => piece.id === captured?.id)).toBe(false);
    expect(epPieces.some((piece) => piece.square === "d5")).toBe(false);
    expect(epPieces.some((piece) => piece.square === "d6")).toBe(true);

    const promoFen = "8/P7/8/8/4k3/8/8/4K3 w - - 0 1";
    const pawn = piecesFromFen(promoFen).find((piece) => piece.square === "a7");
    expect(playMove(promoFen, "a7", "a8").kind).toBe("promotion");
    const promoted = playMove(promoFen, "a7", "a8", "q");
    expect(promoted.kind).toBe("ok");
    if (promoted.kind !== "ok") return;
    const queen = piecesAt(promoFen, [promoted.move], 0).find((piece) => piece.id === pawn?.id);
    expect(queen).toMatchObject({ square: "a8", type: "q" });
  });
});

describe("game store", () => {
  it("plays, undoes, and truncates the redo stack", () => {
    useGameStore.getState().restart();
    play("e2", "e4");
    play("e7", "e5");
    expect(useGameStore.getState().history.map((move) => move.san)).toEqual(["e4", "e5"]);
    useGameStore.getState().undo();
    play("e7", "e6");
    const history = useGameStore.getState().history;
    expect(history.map((move) => move.san)).toEqual(["e4", "e6"]);
    expect(useGameStore.getState().cursor).toBe(1);
    useGameStore.getState().undo();
    useGameStore.getState().redo();
    expect(useGameStore.getState().history[useGameStore.getState().cursor].san).toBe("e6");
  });

  it("finishes scholar's mate and locks the board", () => {
    useGameStore.getState().restart();
    const moves = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["d1", "h5"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["g8", "f6"],
      ["h5", "f7"],
    ];
    for (const [from, to] of moves) play(from, to);
    const state = useGameStore.getState();
    const status = statusFromLine(state.initialFen, state.history, state.cursor);
    expect(status.outcome).toEqual({ kind: "checkmate", winner: "w" });
    const before = state.history.length;
    play("a7", "a6");
    expect(useGameStore.getState().history).toHaveLength(before);
    expect(state.exportPgn()).toContain("Qxf7#");
  });

  it("offers and resolves draw claims", () => {
    useGameStore.getState().restart();
    const dance = [
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
    ];
    for (const [from, to] of dance) play(from, to);
    let status = statusFromLine(
      useGameStore.getState().initialFen,
      useGameStore.getState().history,
      useGameStore.getState().cursor,
    );
    expect(status.claim).toEqual({ reason: "threefold" });
    useGameStore.getState().declineClaim();
    play("b1", "c3");
    expect(useGameStore.getState().history.at(-1)?.san).toBe("Nc3");

    useGameStore.getState().restart();
    const error = useGameStore.getState().importFen("8/5k2/8/8/8/8/4P3/4K2N w - - 99 80");
    expect(error).toBeNull();
    play("h1", "f2");
    status = statusFromLine(
      useGameStore.getState().initialFen,
      useGameStore.getState().history,
      useGameStore.getState().cursor,
    );
    expect(status.claim).toEqual({ reason: "fifty-move" });
    useGameStore.getState().claimDraw();
    expect(
      resultToken(
        useGameStore.getState().initialFen,
        useGameStore.getState().history,
        useGameStore.getState().claimed,
      ),
    ).toBe("1/2-1/2");
    const pgn = pgnOf(
      useGameStore.getState().initialFen,
      useGameStore.getState().history,
      "1/2-1/2",
    );
    expect(pgn).toContain("Nf2");
    expect(pgn).toContain("1/2-1/2");
  });

  it("rejects a broken FEN and jumps the scoresheet", () => {
    useGameStore.getState().restart();
    expect(useGameStore.getState().importFen("not-a-fen")).toMatch(/invalid|FEN/i);
    play("e2", "e4");
    play("e7", "e5");
    useGameStore.getState().jump(0);
    expect(useGameStore.getState().cursor).toBe(0);
    expect(useGameStore.getState().exportFen()).toContain("4P3");
    useGameStore.getState().jump(-1);
    expect(useGameStore.getState().exportFen()).toBe(START_FEN);
  });
});
