# M6 — UI finish

Settings holds the graphics preset, coordinates, legal-move hints, and reduced motion. Fullscreen is the header button and the `f` key. Dialogs trap focus. A visually hidden live region announces the turn and the cursor square.

Component tests cover the dock, scoresheet jumps, promotion, the FEN dialog, and restart confirmation. Playwright covers scholar's mate, an illegal move, castling, promotion, undo, redo, restart, a 390px dock, and a clean console. Desktop Chromium is the e2e browser.
