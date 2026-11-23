# Interview notes

Study notes for this repo. Each answer is something the code actually does. Open the file named in the answer if you are asked to show it. The longer map is [architecture.md](architecture.md). The dependency list is [stack.md](stack.md).

## Pitch

Grandmaster 3D is local chess in the browser, for two people or against a small search. chess.js is the rules authority. The board is a demand-rendered Three.js scene, and the game state is a FEN plus a move list in Zustand.

## Screenshare

Walk in this order. Stay on the function until the question is answered.

1. `components/game/GameShell.tsx` — the overlay, settings, and the `useComputer()` call.
2. `lib/store/gameStore.ts` — `commit`, then `locked`.
3. `lib/chess/engine.ts` — `playMove` and `lineChess`.
4. `lib/chess/pieceDiff.ts` — stable ids, then `components/scene/Pieces.tsx` for the instanced meshes.
5. `components/game/useComputer.ts` — the thinking lock, then `chooseMove` in `lib/chess/search.ts`.
6. `components/scene/ChessScene.tsx` — `frameloop="demand"` and the store subscription that calls `invalidate`.

## Questions

### Why not put a `Chess` object in the store?

The store is data you can replay: `initialFen`, `history`, and `cursor`. A `Chess` instance is a mutable class. Putting it in Zustand would make undo, redo, and a scoresheet jump into hidden mutations. `lineChess` rebuilds a position when a rule check is needed, then throws the instance away. Components never hold one.

`pieceDiff.ts` is the exception that still constructs `Chess`. It only reads `board()` to assign ids. It does not play moves.

### Why rebuild the position from FEN plus history?

`cursor` can sit in the middle of the line while you browse the scoresheet. Replaying from `initialFen` up to `cursor` makes that position the same one `playMove` and `statusFromLine` see. A single long-lived instance would need its own undo stack, and it would drift from the history the UI renders. The cost is a replay of a short game, which is cheap next to a frame.

### Why two Zustand stores, and why does only one touch `localStorage`?

`gameStore` changes on every click. `uiStore` changes when a setting changes. Splitting them keeps a graphics toggle from looking like a move, and the scene can subscribe to both.

`uiStore` writes `grandmaster-ui` from each setter. That object is quality, coordinates, hints, reduced motion, opponent, color, level, and the three visibility toggles. The game is absent on purpose. A refresh starts at the initial position, and a half-finished game cannot come back with a stale `thinking` flag or a cursor the meshes do not match.

### Why procedural meshes and instancing?

`staunton.ts` builds one geometry per piece type with lathe and extrude. `Pieces.tsx` draws one `InstancedMesh` per type and color, twelve of them, plus two bishop-slit instances. A reviewed CC0 GLB had a knight of about 128 triangles and no materials. The procedural set shares geometry, so a move updates matrices instead of remounting meshes. Credits and the triangle counts are in [credits.md](credits.md) and [performance.md](performance.md).

### Why `frameloop="demand"`, and what did it cost?

The board is still most of the time. `ChessScene` renders a frame when a store changes, and `Pieces` asks for another frame while a slide or a drag is in progress. After the camera settles, an 800ms idle window added no frames.

On a desktop pane, High and Balanced were 32 draw calls and 47,998 triangles. Low, with shadows off, was 20 draw calls and 24,470 triangles. A move adds two last-move squares. The numbers are from 23 Nov 2026 in [performance.md](performance.md). Quote those, and say which machine you measured on if you remeasure.

### How strong is the computer, and what does the eval ignore?

`chooseMove` is negamax, alpha-beta, depth 1, 2, or 3. The score is material (pawn 100, knight and bishop 300, rook 500, queen 900) plus the count of legal moves, from the side to move. Captures are ordered first. Hard adds a capture-only quiescence search two plies past the horizon. A transposition table keeps bounds for the position key, which is the first four FEN fields.

Easy picks at random among equal best scores. Medium and Hard play the first tied move. The search finds mate in one at every level. The test is `lib/chess/search.test.ts`.

The eval has no piece-square tables, no opening book, and no endgame table. It will hang a piece it cannot see past depth 3, and it will trade down without a plan. Say that before anyone calls it an engine.

### Why does undo sometimes move two plies?

Against a person, `plyStep` returns 1. Against the computer, undo returns 2 when the cursor is on the last move and that move is the computer's color, and there is a ply before it. Redo returns 2 when the step would land on that same reply. One button press takes back your move and the answer. In the middle of the line the step stays one ply, so the scoresheet can still walk move by move.

### Why does the Pages build disable cache components?

`next.config.ts` sets `output: "export"` only when `GITHUB_PAGES=true`. Next.js throws if partial prerendering is on in export mode, so that same flag sets `cacheComponents` and `partialPrefetching` to false. Local `next build` leaves them on. The workflow passes `GITHUB_PAGES` and the Pages base path, then uploads `out`.

### How is a rules bug caught, and how is a click-path bug caught?

A rules bug belongs in Vitest, next to `engine.ts` or `gameStore`. The engine tests play mate, stalemate, insufficient material, castle, en passant, promotion, claims, and a bad FEN without a canvas. Search tests assert mate in one. Computer tests assert the reply and the two-ply undo.

A click-path bug belongs in Playwright. `e2e/game.spec.ts` plays scholar's mate, rejects an illegal pawn push, castles, promotes, undoes, and checks that the computer answers e4. It also asserts the canvas goes idle and stays under the draw-call budget. If a test needs a `Chess` instance inside a component, the boundary has already slipped.

## Limits

Say these out loud if the question is about strength, persistence, or the rules boundary.

The computer is a depth-3 material search with a short capture extension on Hard. It is not Stockfish, and it has no book.

The game is not saved. Only `grandmaster-ui` is in `localStorage`.

`engine.ts` is the only module that applies moves. It is not the only file that imports the `Chess` class. `pieceDiff.ts` imports it to read the board.
