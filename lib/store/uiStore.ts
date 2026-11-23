import { create } from "zustand";
import type { Color } from "@/lib/chess/engine";
import type { Level } from "@/lib/chess/search";
import type { Quality } from "@/lib/theme/graphics";

const KEY = "grandmaster-ui";

export type Opponent = "person" | "computer";

type Preferences = {
  quality: Quality;
  coordinates: boolean;
  hints: boolean;
  reducedMotion: boolean;
  opponent: Opponent;
  playerColor: Color;
  level: Level;
};

type UiState = Preferences & {
  setQuality: (quality: Quality) => void;
  setCoordinates: (coordinates: boolean) => void;
  setHints: (hints: boolean) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setOpponent: (opponent: Opponent) => void;
  setPlayerColor: (playerColor: Color) => void;
  setLevel: (level: Level) => void;
};

const defaults: Preferences = {
  quality: "balanced",
  coordinates: true,
  hints: true,
  reducedMotion: false,
  opponent: "person",
  playerColor: "w",
  level: "medium",
};

function persist(state: Preferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function snapshot(state: UiState): Preferences {
  return {
    quality: state.quality,
    coordinates: state.coordinates,
    hints: state.hints,
    reducedMotion: state.reducedMotion,
    opponent: state.opponent,
    playerColor: state.playerColor,
    level: state.level,
  };
}

export const useUiStore = create<UiState>((set, get) => ({
  ...defaults,
  setQuality: (quality) => {
    set({ quality });
    persist(snapshot(get()));
  },
  setCoordinates: (coordinates) => {
    set({ coordinates });
    persist(snapshot(get()));
  },
  setHints: (hints) => {
    set({ hints });
    persist(snapshot(get()));
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
    persist(snapshot(get()));
  },
  setOpponent: (opponent) => {
    set({ opponent });
    persist(snapshot(get()));
  },
  setPlayerColor: (playerColor) => {
    set({ playerColor });
    persist(snapshot(get()));
  },
  setLevel: (level) => {
    set({ level });
    persist(snapshot(get()));
  },
}));

export function hydrateUi() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) useUiStore.getState().setReducedMotion(true);
    return;
  }
  try {
    const stored = JSON.parse(raw) as Partial<Preferences>;
    useUiStore.setState({
      quality: stored.quality ?? defaults.quality,
      coordinates: stored.coordinates ?? defaults.coordinates,
      hints: stored.hints ?? defaults.hints,
      reducedMotion: stored.reducedMotion ?? defaults.reducedMotion,
      opponent: stored.opponent ?? defaults.opponent,
      playerColor: stored.playerColor ?? defaults.playerColor,
      level: stored.level ?? defaults.level,
    });
  } catch {
    window.localStorage.removeItem(KEY);
  }
}
