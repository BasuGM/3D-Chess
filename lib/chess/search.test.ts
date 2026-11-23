import { describe, expect, it } from "vitest";
import { listMoves, playMove, statusFromLine } from "@/lib/chess/engine";
import { chooseMove, type Level } from "@/lib/chess/search";

const MATE = "k7/1Q6/1K6/8/8/8/8/8 w - - 0 1";
const PROMOTE = "8/P7/8/8/4k3/8/8/4K3 w - - 0 1";

describe("search", () => {
  it("lists queen and knight promotions only", () => {
    const promotions = listMoves(PROMOTE).filter((move) => move.to === "a8");
    expect(promotions.map((move) => move.promotion).sort()).toEqual(["n", "q"]);
    expect(promotions.every((move) => move.fen.includes("k"))).toBe(true);
  });

  it("finds mate in one at every level", () => {
    const levels: Level[] = ["easy", "medium", "hard"];
    for (const level of levels) {
      const move = chooseMove(MATE, level);
      expect(move).not.toBeNull();
      const played = playMove(MATE, move!.from, move!.to, move!.promotion);
      expect(played.kind).toBe("ok");
      if (played.kind !== "ok") continue;
      expect(statusFromLine(played.move.fen, [], -1).outcome).toEqual({
        kind: "checkmate",
        winner: "w",
      });
    }
  });

  it("promotes to a queen or a knight", () => {
    const move = chooseMove(PROMOTE, "medium");
    expect(move?.promotion === "q" || move?.promotion === "n").toBe(true);
    const played = playMove(PROMOTE, move!.from, move!.to, move!.promotion);
    expect(played.kind).toBe("ok");
  });
});
