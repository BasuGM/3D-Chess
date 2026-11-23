export const FILES = "abcdefgh";

export type Side = "white" | "black";

export function squareToXZ(square: string): [number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return [-3.5 + file, 3.5 - rank];
}

export function xzToSquare(x: number, z: number): string | null {
  const file = Math.round(x + 3.5);
  const rank = Math.round(3.5 - z);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${rank + 1}`;
}

export function indexToSquare(index: number): string {
  const file = index % 8;
  const rank = Math.floor(index / 8);
  return `${FILES[file]}${rank + 1}`;
}

export function squareColor(square: string): "light" | "dark" {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return (file + rank) % 2 === 0 ? "dark" : "light";
}

/** Screen arrows. Up increases rank when White is at the bottom of the view. */
export function shiftSquare(
  square: string,
  dx: number,
  dy: number,
  orientation: Side,
): string {
  let file = square.charCodeAt(0) - 97;
  let rank = Number(square[1]) - 1;
  if (orientation === "black") {
    file -= dx;
    rank -= dy;
  } else {
    file += dx;
    rank += dy;
  }
  file = Math.min(7, Math.max(0, file));
  rank = Math.min(7, Math.max(0, rank));
  return `${FILES[file]}${rank + 1}`;
}
