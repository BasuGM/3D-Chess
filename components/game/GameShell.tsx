"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { PieceSymbol } from "chess.js";
import { useGameStore, useGameView } from "@/lib/store/gameStore";
import { hydrateUi, useUiStore, type Opponent } from "@/lib/store/uiStore";
import type { Color } from "@/lib/chess/engine";
import type { Level } from "@/lib/chess/search";
import { useComputer } from "@/components/game/useComputer";
import type { Quality } from "@/lib/theme/graphics";
import { ChessStage } from "@/components/scene/ChessStage";
import { PlayerStack } from "@/components/game/PlayerCard";
import { ScoreSheet } from "@/components/game/ScoreSheet";
import { PieceIcon } from "@/components/game/PieceIcon";
import {
  FlipIcon,
  FullscreenIcon,
  MenuIcon,
  RedoIcon,
  RestartIcon,
  SettingsIcon,
  UndoIcon,
} from "@/components/game/icons";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const QUALITIES: Array<{ value: Quality; label: string }> = [
  { value: "high", label: "High" },
  { value: "balanced", label: "Balanced" },
  { value: "low", label: "Low" },
];

const OPPONENTS: Array<{ value: Opponent; label: string }> = [
  { value: "person", label: "Person" },
  { value: "computer", label: "Computer" },
];

const COLORS: Array<{ value: Color; label: string }> = [
  { value: "w", label: "White" },
  { value: "b", label: "Black" },
];

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const PROMOTIONS: Array<{ key: string; piece: PieceSymbol; label: string }> = [
  { key: "1", piece: "q", label: "Queen" },
  { key: "2", piece: "r", label: "Rook" },
  { key: "3", piece: "b", label: "Bishop" },
  { key: "4", piece: "n", label: "Knight" },
];

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function TextButton({
  children,
  onClick,
  tone = "ghost",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "ghost" | "solid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === "solid"
          ? "rounded-full bg-ivory px-4 py-2 text-sm text-charcoal"
          : "rounded-full border border-white/10 px-4 py-2 text-sm text-ivory hover:bg-white/5"
      }
    >
      {children}
    </button>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
      <h3 className="mb-1.5 text-[0.68rem] tracking-[0.16em] text-gold uppercase">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <p className="text-sm">{label}</p>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-1 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#c6a15b]"
      />
    </label>
  );
}

export function GameShell() {
  const view = useGameView();
  const cursor = useGameStore((state) => state.cursor);
  const history = useGameStore((state) => state.history);
  const focusSquare = useGameStore((state) => state.focusSquare);
  const orientation = useGameStore((state) => state.orientation);
  const pending = useGameStore((state) => state.pendingPromotion);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const restart = useGameStore((state) => state.restart);
  const moveFocus = useGameStore((state) => state.moveFocus);
  const confirmFocus = useGameStore((state) => state.confirmFocus);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const choosePromotion = useGameStore((state) => state.choosePromotion);
  const claimDraw = useGameStore((state) => state.claimDraw);
  const declineClaim = useGameStore((state) => state.declineClaim);
  const flipOrientation = useGameStore((state) => state.flipOrientation);
  const setOrientation = useGameStore((state) => state.setOrientation);
  const resetView = useGameStore((state) => state.resetView);
  const importFen = useGameStore((state) => state.importFen);
  const exportFen = useGameStore((state) => state.exportFen);
  const exportPgn = useGameStore((state) => state.exportPgn);

  const quality = useUiStore((state) => state.quality);
  const setQuality = useUiStore((state) => state.setQuality);
  const coordinates = useUiStore((state) => state.coordinates);
  const setCoordinates = useUiStore((state) => state.setCoordinates);
  const hints = useUiStore((state) => state.hints);
  const setHints = useUiStore((state) => state.setHints);
  const scoresheet = useUiStore((state) => state.scoresheet);
  const setScoresheet = useUiStore((state) => state.setScoresheet);
  const fenPgn = useUiStore((state) => state.fenPgn);
  const setFenPgn = useUiStore((state) => state.setFenPgn);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const setReducedMotion = useUiStore((state) => state.setReducedMotion);
  const opponent = useUiStore((state) => state.opponent);
  const setOpponent = useUiStore((state) => state.setOpponent);
  const playerColor = useUiStore((state) => state.playerColor);
  const setPlayerColor = useUiStore((state) => state.setPlayerColor);
  const level = useUiStore((state) => state.level);
  const setLevel = useUiStore((state) => state.setLevel);
  const turnBoard = useUiStore((state) => state.turnBoard);
  const setTurnBoard = useUiStore((state) => state.setTurnBoard);
  const thinking = useGameStore((state) => state.thinking);

  useComputer();

  const [restartOpen, setRestartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fenOpen, setFenOpen] = useState(false);
  const [pgnOpen, setPgnOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fenDraft, setFenDraft] = useState("");
  const [fenError, setFenError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pgnText, setPgnText] = useState("");

  useEffect(() => {
    hydrateUi();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
      if (pending) {
        const picked = PROMOTIONS.find(
          (item) => event.key === item.key || event.key.toLowerCase() === item.piece,
        );
        if (picked) {
          event.preventDefault();
          choosePromotion(picked.piece);
        }
        return;
      }
      if (view.claim) {
        if (event.key === "Escape") declineClaim();
        return;
      }
      if (restartOpen || settingsOpen || fenOpen || pgnOpen || sheetOpen) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(0, 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(0, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveFocus(1, 0);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveFocus(-1, 0);
      } else if (event.key === "Enter") {
        event.preventDefault();
        confirmFocus();
      } else if (event.key === "Escape") {
        clearSelection();
      } else if (event.key === "z" && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
        undo();
      } else if ((event.key === "Z" || (event.key === "z" && event.shiftKey)) && !event.metaKey && !event.ctrlKey) {
        redo();
      } else if (event.key === "f" && !event.metaKey && !event.ctrlKey) {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    choosePromotion,
    clearSelection,
    confirmFocus,
    declineClaim,
    fenOpen,
    moveFocus,
    pending,
    pgnOpen,
    redo,
    restartOpen,
    settingsOpen,
    sheetOpen,
    undo,
    view.claim,
  ]);

  function beginMatch(nextOpponent: Opponent, color: Color) {
    if (nextOpponent === opponent && color === playerColor) return;
    setOpponent(nextOpponent);
    setPlayerColor(color);
    const store = useGameStore.getState();
    store.restart();
    if (nextOpponent === "computer") {
      store.setOrientation(color === "w" ? "white" : "black");
    }
  }

  function openFen() {
    setFenDraft(exportFen());
    setFenError(null);
    setCopied(null);
    setFenOpen(true);
  }

  function openPgn() {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join(".");
    setCopied(null);
    setPgnText(exportPgn(date));
    setPgnOpen(true);
  }

  const record = (
    <div className="flex flex-col gap-4">
      <PlayerStack />
      {scoresheet && <ScoreSheet />}
      {fenPgn && (
        <div className="flex gap-2">
          <TextButton onClick={openFen}>FEN</TextButton>
          <TextButton onClick={openPgn}>PGN</TextButton>
        </div>
      )}
    </div>
  );

  return (
    <main className="relative h-dvh overflow-hidden bg-charcoal text-ivory">
      <div className="absolute inset-0">
        <ChessStage />
        <div
          id="board-keys"
          data-testid="board-keys"
          data-square={focusSquare}
          data-orientation={orientation}
          tabIndex={0}
          aria-label="Chessboard. Arrow keys move the cursor. Enter selects or moves."
          className="pointer-events-none absolute inset-0 outline-none"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="pointer-events-auto">
          <p className="font-display text-[1.7rem] leading-none tracking-tight">Grandmaster</p>
          <div className="mt-2 h-px w-10 bg-gold" />
          <p className="mt-2 text-sm text-ivory/85" data-testid="status">
            {thinking ? "Computer is thinking" : view.label}
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden md:block">
            <SegmentedControl
              label="Graphics quality"
              value={quality}
              options={QUALITIES}
              onChange={setQuality}
            />
          </div>
          <button
            type="button"
            className="hidden h-11 items-center rounded-full border border-white/10 px-3 text-sm md:inline-flex min-[1280px]:hidden"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            Scoresheet
          </button>
          <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
          <IconButton label="Fullscreen" onClick={toggleFullscreen}>
            <FullscreenIcon />
          </IconButton>
        </div>
      </header>

      <aside className="pointer-events-none absolute top-32 left-6 z-20 hidden w-[280px] min-[1280px]:block">
        <PlayerStack />
      </aside>
      <aside className="pointer-events-none absolute top-32 right-6 z-20 hidden w-[320px] min-[1280px]:block">
        <div className="pointer-events-auto flex flex-col gap-3">
          {scoresheet && <ScoreSheet />}
          {fenPgn && (
            <div className="flex gap-2">
              <TextButton onClick={openFen}>FEN</TextButton>
              <TextButton onClick={openPgn}>PGN</TextButton>
            </div>
          )}
        </div>
      </aside>

      {drawerOpen && (
        <aside className="absolute top-0 right-0 z-30 hidden h-full w-[360px] overflow-y-auto border-l border-white/10 bg-charcoal/90 p-5 pt-28 backdrop-blur-xl md:block min-[1280px]:hidden">
          {record}
        </aside>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          data-testid="dock"
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-panel px-1.5 py-1 backdrop-blur-xl"
        >
          <IconButton label="Undo" data-testid="undo" onClick={undo} disabled={cursor < 0}>
            <UndoIcon />
          </IconButton>
          <IconButton
            label="Redo"
            data-testid="redo"
            onClick={redo}
            disabled={cursor >= history.length - 1}
          >
            <RedoIcon />
          </IconButton>
          <IconButton label="Restart" data-testid="restart" onClick={() => setRestartOpen(true)}>
            <RestartIcon />
          </IconButton>
          <span className="mx-1 h-6 w-px bg-white/10 md:hidden" />
          <IconButton label="Flip view" className="md:hidden" onClick={flipOrientation}>
            <FlipIcon />
          </IconButton>
          <IconButton label="Game menu" className="md:hidden" onClick={() => setSheetOpen(true)}>
            <MenuIcon />
          </IconButton>
        </div>
      </div>

      <div className="pointer-events-none absolute right-6 bottom-24 z-20 hidden flex-col gap-2 md:flex">
        <div className="pointer-events-auto flex flex-col gap-1 rounded-full border border-white/10 bg-panel p-1 backdrop-blur-xl">
          <IconButton label="White view" onClick={() => setOrientation("white")}>
            <span className={`h-3 w-3 rounded-full ${orientation === "white" ? "bg-ivory" : "bg-ivory/35"}`} />
          </IconButton>
          <IconButton label="Black view" onClick={() => setOrientation("black")}>
            <span className={`h-3 w-3 rounded-full ${orientation === "black" ? "bg-[#161311] ring-1 ring-ivory" : "bg-[#161311]/70 ring-1 ring-white/20"}`} />
          </IconButton>
          <IconButton label="Reset view" onClick={resetView}>
            <FlipIcon />
          </IconButton>
        </div>
      </div>

      {sheetOpen && (
        <div className="absolute inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-elevated p-4 pb-8 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Game</h2>
            <TextButton onClick={() => setSheetOpen(false)}>Close</TextButton>
          </div>
          {record}
        </div>
      )}

      <Dialog open={restartOpen} title="Restart game" onClose={() => setRestartOpen(false)}>
        <p className="text-sm text-ivory/75">This clears the scoresheet and returns to the starting position.</p>
        <div className="mt-5 flex justify-end gap-2">
          <TextButton onClick={() => setRestartOpen(false)}>Cancel</TextButton>
          <TextButton
            tone="solid"
            onClick={() => {
              restart();
              setRestartOpen(false);
            }}
          >
            <span data-testid="confirm-restart">Restart</span>
          </TextButton>
        </div>
      </Dialog>

      <Dialog open={settingsOpen} title="Settings" onClose={() => setSettingsOpen(false)} scroll>
        <div className="flex flex-col gap-3">
          <SettingsSection title="Play">
            <ChoiceRow label="Opponent">
              <SegmentedControl
                label="Opponent"
                value={opponent}
                options={OPPONENTS}
                onChange={(next) => beginMatch(next, playerColor)}
              />
            </ChoiceRow>
            <ChoiceRow label="You play">
              <SegmentedControl
                label="You play"
                value={playerColor}
                options={COLORS}
                onChange={(next) => beginMatch(opponent, next)}
              />
            </ChoiceRow>
            {opponent === "person" ? (
              <ToggleRow
                label="Turn after each move"
                checked={turnBoard}
                onChange={(next) => {
                  setTurnBoard(next);
                  if (next) setOrientation(view.status.turn === "w" ? "white" : "black");
                }}
              />
            ) : (
              <ChoiceRow label="Level">
                <SegmentedControl label="Level" value={level} options={LEVELS} onChange={setLevel} />
              </ChoiceRow>
            )}
          </SettingsSection>
          <SettingsSection title="Board">
            <ToggleRow label="Coordinates" checked={coordinates} onChange={setCoordinates} />
            <ToggleRow label="Legal move hints" checked={hints} onChange={setHints} />
          </SettingsSection>
          <SettingsSection title="Record">
            <ToggleRow label="Scoresheet" checked={scoresheet} onChange={setScoresheet} />
            <ToggleRow label="FEN and PGN" checked={fenPgn} onChange={setFenPgn} />
          </SettingsSection>
          <SettingsSection title="Graphics">
            <ChoiceRow label="Quality">
              <SegmentedControl label="Graphics quality" value={quality} options={QUALITIES} onChange={setQuality} />
            </ChoiceRow>
            <ToggleRow label="Reduced motion" checked={reducedMotion} onChange={setReducedMotion} />
          </SettingsSection>
        </div>
      </Dialog>

      <Dialog open={fenOpen} title="FEN" onClose={() => setFenOpen(false)} wide>
        <textarea
          aria-label="FEN"
          value={fenDraft}
          onChange={(event) => setFenDraft(event.target.value)}
          className="h-28 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-ivory"
        />
        {fenError && <p className="mt-2 text-sm text-danger">{fenError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <TextButton
            onClick={() => {
              void copyText(fenDraft).then((ok) => setCopied(ok ? "Copied" : "Copy failed"));
            }}
          >
            {copied ?? "Copy"}
          </TextButton>
          <TextButton
            tone="solid"
            onClick={() => {
              const error = importFen(fenDraft);
              if (error) {
                setFenError(error);
                return;
              }
              setFenOpen(false);
            }}
          >
            Import
          </TextButton>
        </div>
      </Dialog>

      <Dialog open={pgnOpen} title="PGN" onClose={() => setPgnOpen(false)} wide>
        <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-5 whitespace-pre-wrap text-ivory/90">
          {pgnText}
        </pre>
        <div className="mt-4 flex justify-end">
          <TextButton
            tone="solid"
            onClick={() => {
              void copyText(pgnText).then((ok) => setCopied(ok ? "Copied" : "Copy failed"));
            }}
          >
            {copied ?? "Copy"}
          </TextButton>
        </div>
      </Dialog>

      <Dialog open={pending !== null} title="Promote pawn" onClose={() => {}} dismissable={false}>
        <p className="text-sm text-ivory/70">Choose the piece. Keys 1 to 4, or Q, R, B, N.</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PROMOTIONS.map((item) => (
            <button
              key={item.piece}
              type="button"
              onClick={() => choosePromotion(item.piece)}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 px-2 py-3 text-sm hover:border-gold/60"
            >
              <PieceIcon type={item.piece} className="h-7 w-7" />
              {item.label}
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={view.claim !== null}
        title={view.claim?.reason === "fifty-move" ? "Fifty-move rule" : "Threefold repetition"}
        onClose={declineClaim}
      >
        <p className="text-sm text-ivory/75">
          {view.claim?.reason === "fifty-move"
            ? "Fifty moves have passed without a capture or a pawn move."
            : "This position has occurred three times."}{" "}
          The side to move can claim a draw, or the game can continue.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <TextButton onClick={declineClaim}>Continue</TextButton>
          <TextButton tone="solid" onClick={claimDraw}>
            Claim draw
          </TextButton>
        </div>
      </Dialog>

      <div className="sr-only" aria-live="polite">
        {thinking ? "Computer is thinking" : view.label}. Cursor {focusSquare}.
      </div>
    </main>
  );
}

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen();
}
