"use client";

import type { HistoryMove } from "@/lib/chess/engine";
import { useGameStore, useGameView } from "@/lib/store/gameStore";

function Ply({
  move,
  index,
  active,
  onJump,
}: {
  move?: HistoryMove;
  index: number;
  active: boolean;
  onJump: (cursor: number) => void;
}) {
  if (!move) return <span />;
  return (
    <button
      type="button"
      onClick={() => onJump(index)}
      aria-current={active ? "step" : undefined}
      className={`rounded px-2 py-1 text-left text-sm tabular-nums ${active ? "bg-gold/15 text-gold" : "text-ivory hover:bg-white/5"}`}
    >
      {move.san}
    </button>
  );
}

export function ScoreSheet() {
  const history = useGameStore((state) => state.history);
  const cursor = useGameStore((state) => state.cursor);
  const jump = useGameStore((state) => state.jump);
  const browsing = useGameView().browsing;
  const rows: Array<{
    number: number;
    white?: HistoryMove;
    whiteIndex: number;
    black?: HistoryMove;
    blackIndex: number;
  }> = [];
  for (let index = 0; index < history.length; index += 2) {
    rows.push({
      number: index / 2 + 1,
      white: history[index],
      whiteIndex: index,
      black: history[index + 1],
      blackIndex: index + 1,
    });
  }

  return (
    <section
      aria-label="Scoresheet"
      className="flex max-h-[min(58vh,520px)] flex-col rounded-xl border border-white/10 bg-panel p-4 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">Scoresheet</h2>
        {browsing && <p className="text-xs text-gold">Viewing history</p>}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ivory/60">No moves yet</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li
              key={row.number}
              className="grid grid-cols-[2.2rem_1fr_1fr] items-center border-t border-white/5 py-0.5 first:border-t-0"
            >
              <span className="tabular-nums text-sm text-ivory/45">{row.number}.</span>
              <Ply move={row.white} index={row.whiteIndex} active={cursor === row.whiteIndex} onJump={jump} />
              <Ply move={row.black} index={row.blackIndex} active={cursor === row.blackIndex} onJump={jump} />
            </li>
          ))}
        </ol>
      )}
      {history.length > 0 && (
        <button
          type="button"
          onClick={() => jump(-1)}
          className="mt-3 self-start text-xs text-ivory/60 hover:text-ivory"
        >
          Starting position
        </button>
      )}
    </section>
  );
}
