# Stack

Versions are the ranges in `package.json`. The app is one route. `app/page.tsx` renders `GameShell`, a client component that owns the board, the overlay, and the computer hook.

## App

Next.js 16.4.6 uses the App Router. React and React DOM are 19.3.0. TypeScript is 5. Tailwind CSS is 4.3.3, loaded through `@tailwindcss/turbopack` in `next.config.ts`.

`app/layout.tsx` sets the page title and the two fonts. There are no server actions and no API routes. `components/scene/ChessStage.tsx` loads `ChessScene` with `next/dynamic` and `ssr: false`, because the canvas needs WebGL in the browser.

Local development stays a normal Next server. The GitHub Pages build is the special case below.

## 3D

`three` 0.187 draws the board. `@react-three/fiber` 9.8.2 hosts the canvas. `@react-three/drei` 10.7.9 is the helper layer. Camera control uses `camera-controls`, noted in [credits.md](credits.md).

Pieces are procedural Staunton meshes in `components/scene/staunton.ts`. They are original geometry, shared per type and color. A CC0 GLB was reviewed and left out. The reason is in [credits.md](credits.md).

Quality presets live in `lib/theme/graphics.ts`: High, Balanced, and Low change shadow map size, device pixel ratio, and whether shadows are on. Measured frame cost is in [performance.md](performance.md).

## Rules and state

`chess.js` 1.4.0 is the rules library. `lib/chess/engine.ts` is the module that applies moves. `lib/chess/pieceDiff.ts` also constructs a `Chess` instance, and only to read the board when it assigns piece ids. Other files import chess.js types and do not run rules.

Zustand 5.1.0 holds two stores. `lib/store/gameStore.ts` is the game. `lib/store/uiStore.ts` is preferences, saved under the `grandmaster-ui` key in `localStorage`. The game itself is not saved.

## Tests and lint

Vitest 5 runs `npm test`: engine and store cases in `lib/chess/engine.test.ts`, search in `lib/chess/search.test.ts`, the computer reply in `lib/store/computer.test.ts`, the shell in `components/game/GameShell.test.tsx`, and mesh counts in `components/scene/staunton.test.ts`.

Playwright 1.65 runs `npm run test:e2e` against `e2e/game.spec.ts`. That file plays scholar's mate, castling and promotion with undo and redo, the phone dock, a computer reply to e4, and an idle draw-call check.

ESLint 9 uses `eslint-config-next` 16.4.6.

## Pages deploy

`.github/workflows/nextjs.yml` builds on a push to `main` and on `workflow_dispatch`. The build sets `GITHUB_PAGES=true`. `next.config.ts` then sets `output: "export"`, `images.unoptimized`, and `basePath` from `NEXT_PUBLIC_BASE_PATH`. The same flag turns `cacheComponents` and `partialPrefetching` off. Next.js refuses partial prerendering in export mode.

The workflow uploads the `out` directory and deploys it with GitHub Pages actions.

## Left out

There is no Stockfish binary and no WASM engine. Search is the TypeScript in `lib/chess/search.ts`. There is no account, no server, and no saved game. A refresh starts a new position. Settings are the only thing that survives.
