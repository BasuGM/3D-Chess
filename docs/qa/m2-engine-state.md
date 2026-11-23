# M2 — Engine and state

`lib/chess/engine.ts` wraps chess.js. The game store keeps FEN, history, cursor, selection, and orientation. Undo, redo, and scoresheet jumps move the cursor. A new move drops the future line.

Unit tests cover legal moves, check, mate, stalemate, castling, en passant, promotion, threefold repetition, the fifty-move rule, undo truncation, and piece-id diffs. A game can be played from the scoresheet and from FEN without the 3D scene, which is what the component tests do.
