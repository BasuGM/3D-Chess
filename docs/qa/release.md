# Release QA

Checked against the local-play definition of done.

- The app opens on the board. There is no marketing page, account, backend, AI, or online play.
- Desktop shows the wordmark, graphics preset, settings, fullscreen, player cards with the side to move first, the scoresheet, the undo/redo/restart dock, and White, Black, and reset camera buttons.
- A phone-width layout keeps a top status line and a bottom dock. The game sheet stays in the lower portion of the screen.
- chess.js is the only rules module. Mate, stalemate, and insufficient material end the game. Threefold and fifty-move ask before they draw. Promotion cannot be skipped.
- Illegal destinations are not highlighted. Check is a rim and a status line. The last move is an amber wash.
- The canvas is demand-rendered. Idle time adds no frames. Draw calls at the start are 32 with shadows and 20 without, under the 50-call aim. Numbers are in [docs/performance.md](../performance.md).
- UI preferences persist. The game does not.
- `npm test` and `npm run test:e2e` pass, and `npm run build` completes.

Browser pass: starting position, e2–e4 from the keyboard, the mobile sheet, and High / Balanced / Low. The camera shows the full set above the dock.
