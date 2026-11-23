import { beforeEach, describe, expect, it } from "vitest";
import type { Square } from "chess.js";
import { fenAt } from "@/lib/chess/engine";
import { chooseMove } from "@/lib/chess/search";
import { useGameStore } from "@/lib/store/gameStore";

beforeEach(() => {
  const store = useGameStore.getState();
  store.setComputer(null);
  store.setThinking(false);
  store.restart();
});

describe("computer opponent", () => {
  it("adds a reply to e4 and undo takes back both plies", () => {
    useGameStore.getState().setComputer("b");
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    const played = useGameStore.getState();
    const fen = fenAt(played.initialFen, played.history, played.cursor);
    const reply = chooseMove(fen, "medium");
    expect(reply).not.toBeNull();
    useGameStore.getState().playReply(reply!.from, reply!.to, reply!.promotion);
    expect(useGameStore.getState().history).toHaveLength(2);
    expect(useGameStore.getState().cursor).toBe(1);
    useGameStore.getState().undo();
    expect(useGameStore.getState().cursor).toBe(-1);
    expect(useGameStore.getState().history).toHaveLength(2);
    useGameStore.getState().redo();
    expect(useGameStore.getState().cursor).toBe(1);
  });

  it("ignores a click while the computer is thinking", () => {
    useGameStore.getState().setThinking(true);
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    expect(useGameStore.getState().history).toHaveLength(0);
  });
});
