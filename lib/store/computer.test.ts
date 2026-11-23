import { beforeEach, describe, expect, it } from "vitest";
import type { Square } from "chess.js";
import { fenAt } from "@/lib/chess/engine";
import { chooseMove } from "@/lib/chess/search";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";

beforeEach(() => {
  const store = useGameStore.getState();
  store.setComputer(null);
  store.setThinking(false);
  store.restart();
  useUiStore.getState().setTurnBoard(true);
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

  it("turns the board toward the side about to move when the opponent is a person", () => {
    expect(useGameStore.getState().orientation).toBe("white");
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    expect(useGameStore.getState().orientation).toBe("black");
    useGameStore.getState().jump(-1);
    expect(useGameStore.getState().orientation).toBe("white");
    useGameStore.getState().jump(0);
    expect(useGameStore.getState().orientation).toBe("black");
    useGameStore.getState().undo();
    expect(useGameStore.getState().orientation).toBe("white");

    useGameStore.getState().setComputer("b");
    useGameStore.getState().setOrientation("white");
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    expect(useGameStore.getState().orientation).toBe("white");
  });

  it("keeps the camera still when turn after each move is off", () => {
    useUiStore.getState().setTurnBoard(false);
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    expect(useGameStore.getState().orientation).toBe("white");
    useGameStore.getState().undo();
    expect(useGameStore.getState().orientation).toBe("white");
  });

  it("ignores a click while the computer is thinking", () => {
    useGameStore.getState().setThinking(true);
    useGameStore.getState().selectOrMove("e2" as Square);
    useGameStore.getState().selectOrMove("e4" as Square);
    expect(useGameStore.getState().history).toHaveLength(0);
  });
});
