import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Square } from "chess.js";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";

vi.mock("@/components/scene/ChessStage", () => ({
  ChessStage: () => <div data-testid="chess-stage" />,
}));

describe("GameShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.getState().restart();
    useUiStore.setState({
      quality: "balanced",
      coordinates: true,
      hints: true,
      reducedMotion: false,
      scoresheet: true,
      fenPgn: true,
    });
  });

  it("shows the opening shell and plays e4 from the keyboard", async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    expect(screen.getByText("Grandmaster")).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("White to move");
    expect(screen.getByText("No moves yet")).toBeInTheDocument();
    expect(screen.getByTestId("player-w")).toBeInTheDocument();
    expect(screen.getByTestId("player-b")).toBeInTheDocument();
    expect(screen.getByTestId("undo")).toBeDisabled();

    await user.keyboard("{Enter}{ArrowUp}{ArrowUp}{Enter}");
    expect(screen.getByRole("button", { name: "e4" })).toBeInTheDocument();
    expect(screen.getByTestId("status")).toHaveTextContent("Black to move");
    expect(screen.getByTestId("undo")).toBeEnabled();
  });

  it("hides the scoresheet when the setting is off", () => {
    useUiStore.setState({ scoresheet: false });
    render(<GameShell />);
    expect(screen.queryByRole("region", { name: "Scoresheet" })).not.toBeInTheDocument();
    expect(screen.queryByText("No moves yet")).not.toBeInTheDocument();
    expect(screen.getByTestId("player-w")).toBeInTheDocument();
  });

  it("hides FEN and PGN when the setting is off", () => {
    useUiStore.setState({ fenPgn: false });
    render(<GameShell />);
    expect(screen.queryByRole("button", { name: "FEN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PGN" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Scoresheet" })).toBeInTheDocument();
  });

  it("groups settings by play, board, record, and graphics", async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Record" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Graphics" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Turn after each move" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Computer" }));
    expect(screen.getByRole("radio", { name: "Medium" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Turn after each move" })).not.toBeInTheDocument();
  });

  it("confirms a restart and clears the scoresheet", async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectOrMove("e2");
    useGameStore.getState().selectOrMove("e4");
    render(<GameShell />);
    await user.click(screen.getByTestId("restart"));
    expect(screen.getByRole("dialog", { name: "Restart game" })).toBeInTheDocument();
    await user.click(screen.getByTestId("confirm-restart"));
    expect(screen.getByText("No moves yet")).toBeInTheDocument();
  });

  it("imports a FEN and promotes a pawn", async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByRole("button", { name: "FEN" }));
    const field = screen.getByRole("textbox", { name: "FEN" });
    await user.clear(field);
    await user.paste("8/P7/8/8/4k3/8/8/4K3 w - - 0 1");
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(useGameStore.getState().initialFen).toContain("P7");
    act(() => {
      useGameStore.getState().selectOrMove("a7" as Square);
      useGameStore.getState().selectOrMove("a8" as Square);
    });
    expect(screen.getByRole("dialog", { name: "Promote pawn" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Promote pawn" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Queen" }));
    expect(screen.getByRole("button", { name: "a8=Q+" })).toBeInTheDocument();
  });

  it("jumps the scoresheet and shows a draw claim", async () => {
    const user = userEvent.setup();
    const dance: Array<[Square, Square]> = [
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
    ];
    for (const [from, to] of dance) {
      useGameStore.getState().selectOrMove(from);
      useGameStore.getState().selectOrMove(to);
    }
    render(<GameShell />);
    expect(screen.getByRole("dialog", { name: "Threefold repetition" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("dialog", { name: "Threefold repetition" })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Nf3" })[0]);
    expect(screen.getByText("Viewing history")).toBeInTheDocument();
  });

  it("reports an invalid FEN", async () => {
    const user = userEvent.setup();
    render(<GameShell />);
    await user.click(screen.getByRole("button", { name: "FEN" }));
    const field = screen.getByRole("textbox", { name: "FEN" });
    await user.clear(field);
    await user.type(field, "not-a-fen");
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(screen.getByText(/must contain six/i)).toBeInTheDocument();
  });
});
