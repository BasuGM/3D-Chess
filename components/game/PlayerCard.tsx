"use client";

import type { Color } from "@/lib/chess/engine";
import { useGameView } from "@/lib/store/gameStore";
import { useUiStore } from "@/lib/store/uiStore";
import { computerColor } from "@/components/game/useComputer";
import { PieceIcon } from "@/components/game/PieceIcon";

export function PlayerCard({ color }: { color: Color }) {
  const view = useGameView();
  const opponent = useUiStore((state) => state.opponent);
  const playerColor = useUiStore((state) => state.playerColor);
  const name = computerColor(opponent, playerColor) === color ? "Computer" : color === "w" ? "White" : "Black";
  const active = !view.outcome && view.status.turn === color;
  const advantage = color === "w" ? view.delta : -view.delta;
  const captured = color === "w" ? view.taken.w : view.taken.b;
  const wins = view.outcome?.kind === "checkmate" && view.outcome.winner === color;
  const draw = view.outcome !== null && view.outcome.kind !== "checkmate";

  return (
    <section
      aria-label={name}
      data-testid={`player-${color}`}
      className={`rounded-xl border bg-panel p-4 backdrop-blur-xl ${active ? "border-gold/60" : "border-white/10"}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-3.5 w-3.5 rounded-full ${color === "w" ? "bg-ivory" : "bg-[#161311] ring-1 ring-white/30"}`}
        />
        <h2 className="font-display text-xl leading-none">{name}</h2>
        <span className="ml-auto text-sm text-gold">
          {wins ? "Wins" : draw ? "Draw" : advantage > 0 ? `+${advantage}` : ""}
        </span>
      </div>
      {active && view.status.inCheck && <p className="mt-2 text-sm text-danger">In check</p>}
      {captured.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 text-ivory/80" aria-label={`${name} captured pieces`}>
          {captured.map((type, index) => (
            <PieceIcon key={`${type}-${index}`} type={type} />
          ))}
        </div>
      )}
    </section>
  );
}

export function PlayerStack() {
  const turn = useGameView().status.turn;
  const order = turn === "w" ? (["w", "b"] as const) : (["b", "w"] as const);
  return (
    <div className="flex flex-col gap-3">
      {order.map((color) => (
        <PlayerCard key={color} color={color} />
      ))}
    </div>
  );
}
