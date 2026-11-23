# Grandmaster 3D

Local two-player chess. The board fills the window, the overlay stays out of the way, and [chess.js](https://github.com/jhlywa/chess.js) is the only rules authority.

## Scripts

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
npm test           # unit and component tests
npm run test:e2e   # Playwright, desktop Chromium
```

`test:e2e` starts the dev server on port 3000 when one is not already running.

## Architecture

Next.js App Router, React, TypeScript, Tailwind, React Three Fiber, and Zustand.

- `lib/chess/engine.ts` is the only module that imports chess.js. It creates positions, lists legal moves, applies moves, and reports check, mate, stalemate, insufficient material, threefold repetition, and the fifty-move rule.
- `lib/store/gameStore.ts` keeps serialisable game data: FEN, the move list, the scoresheet cursor, selection, and orientation. Components never hold a `Chess` instance.
- `lib/store/uiStore.ts` keeps graphics quality, coordinates, legal-move hints, and reduced motion. Those preferences are the only `localStorage` data. The game itself is not saved.
- `lib/chess/pieceDiff.ts` gives each piece a stable id so meshes can slide, castle, capture en passant, and promote without remounting.
- `components/scene/ChessScene.tsx` renders on demand. The canvas is idle when nothing is animating.
- Pieces are procedural Staunton meshes, instanced by type and color. See [docs/credits.md](docs/credits.md).

Mate, stalemate, and insufficient material end the game. Threefold repetition and the fifty-move rule open a claim. Promotion cannot be skipped.

## Controls

| Action | Pointer | Keyboard |
| --- | --- | --- |
| Select a piece | Click it | Arrows, then Enter |
| Move | Click or drag onto a legal square | Enter on the destination |
| Cancel | Click empty board | Esc |
| Undo / redo | Dock buttons | `z` / `Shift+z` |
| Fullscreen | Header button | `f` |
| Camera | Drag the frame or the background. Scroll or pinch to zoom | — |
| White / Black / reset view | Buttons at the canvas corner on tablet and desktop. Flip is in the mobile dock | — |

Arrow keys follow the side you are looking from. Illegal squares are not highlighted. Check is a red rim on the king plus the status line.

On a phone, the dock holds undo, redo, restart, flip, and the game sheet. The sheet covers the lower part of the screen and leaves the board visible.

## Credits

Piece geometry, chess.js, and the rest of the stack are credited in [docs/credits.md](docs/credits.md). Measured frame and draw-call numbers are in [docs/performance.md](docs/performance.md).
