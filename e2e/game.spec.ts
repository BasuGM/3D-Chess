import { expect, test, type Page } from "@playwright/test";

async function moveTo(page: Page, square: string) {
  const board = page.getByTestId("board-keys");
  await board.focus();
  for (let step = 0; step < 20; step += 1) {
    const current = await board.getAttribute("data-square");
    if (current === square) return;
    if (!current) throw new Error("Missing board cursor");
    const fileDelta = square.charCodeAt(0) - current.charCodeAt(0);
    const rankDelta = Number(square[1]) - Number(current[1]);
    const black = (await board.getAttribute("data-orientation")) === "black";
    if (fileDelta !== 0) {
      const towardHigherFile = fileDelta > 0 ? !black : black;
      await page.keyboard.press(towardHigherFile ? "ArrowRight" : "ArrowLeft");
    } else {
      const towardHigherRank = rankDelta > 0 ? !black : black;
      await page.keyboard.press(towardHigherRank ? "ArrowUp" : "ArrowDown");
    }
  }
  throw new Error(`Could not reach ${square}`);
}

async function play(page: Page, from: string, to: string) {
  await moveTo(page, from);
  await page.keyboard.press("Enter");
  await moveTo(page, to);
  await page.keyboard.press("Enter");
}

async function importFen(page: Page, fen: string) {
  await page.getByRole("button", { name: "FEN" }).click();
  await page.getByRole("textbox", { name: "FEN" }).fill(fen);
  await page.getByRole("button", { name: "Import" }).click();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByTestId("status")).toHaveText("White to move");
  (page as Page & { __errors?: string[] }).__errors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = ((page as Page & { __errors?: string[] }).__errors ?? []).filter(
    (error) => !/favicon|Download the React DevTools|_next\/hmr|ERR_INVALID_HTTP_RESPONSE/i.test(error),
  );
  expect(errors).toEqual([]);
});

test("plays scholar's mate and rejects an illegal pawn push", async ({ page }) => {
  await play(page, "e2", "e5");
  await expect(page.getByText("No moves yet")).toBeVisible();

  const game = [
    ["e2", "e4"],
    ["e7", "e5"],
    ["d1", "h5"],
    ["b8", "c6"],
    ["f1", "c4"],
    ["g8", "f6"],
    ["h5", "f7"],
  ] as const;
  for (const [from, to] of game) await play(page, from, to);
  await expect(page.getByTestId("status")).toHaveText("Checkmate — White wins");
  await expect(page.getByRole("button", { name: "Qxf7#" })).toBeVisible();
});

test("castles, promotes, undoes, redoes, and restarts", async ({ page }) => {
  await importFen(page, "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  await play(page, "e1", "g1");
  await expect(page.getByRole("button", { name: "O-O" })).toBeVisible();

  await importFen(page, "8/P7/8/8/4k3/8/8/4K3 w - - 0 1");
  await play(page, "a7", "a8");
  await expect(page.getByRole("dialog", { name: "Promote pawn" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Promote pawn" })).toBeVisible();
  await page.getByRole("button", { name: "Queen" }).click();
  await expect(page.getByRole("button", { name: "a8=Q+" })).toBeVisible();

  await page.getByTestId("undo").click();
  await expect(page.getByText("Viewing history")).toBeVisible();
  await expect(page.getByRole("button", { name: "a8=Q+" })).toBeVisible();
  await page.getByTestId("redo").click();
  await expect(page.getByRole("button", { name: "a8=Q+" })).toHaveAttribute("aria-current", "step");

  await page.getByTestId("restart").click();
  await page.getByTestId("confirm-restart").click();
  await expect(page.getByTestId("status")).toHaveText("White to move");
  await expect(page.getByText("No moves yet")).toBeVisible();
});

test("uses a dock on a phone-sized screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("dock")).toBeVisible();
  await expect(page.getByRole("region", { name: "Scoresheet" })).toBeHidden();
  await page.getByRole("button", { name: "Game menu" }).click();
  await expect(page.getByRole("region", { name: "Scoresheet" })).toBeVisible();
});

test("the computer answers e4", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "grandmaster-ui",
      JSON.stringify({
        quality: "balanced",
        coordinates: true,
        hints: true,
        reducedMotion: true,
        opponent: "computer",
        playerColor: "w",
        level: "medium",
      }),
    );
  });
  await page.reload();
  await expect(page.getByTestId("status")).toHaveText("White to move");
  await play(page, "e2", "e4");
  await expect(page.locator('[aria-label="Scoresheet"] button')).toHaveCount(3);
});

test("stays idle and stays under the draw-call budget", async ({ page }) => {
  await page.waitForFunction(() => (window.__GM_STATS__?.frames ?? 0) > 0);
  await page.waitForFunction(() => {
    const frames = window.__GM_STATS__?.frames ?? 0;
    const now = performance.now();
    const stamp = window.__GM_IDLE__;
    if (!stamp || stamp.frames !== frames) {
      window.__GM_IDLE__ = { frames, at: now };
      return false;
    }
    return now - stamp.at > 500;
  });
  const first = await page.evaluate(() => window.__GM_STATS__);
  await page.waitForTimeout(800);
  const later = await page.evaluate(() => window.__GM_STATS__);
  expect(later?.frames).toBe(first?.frames);
  expect(later?.calls ?? 999).toBeLessThan(50);
  expect(later?.shadows).toBe(true);
  expect(later?.triangles ?? 0).toBeGreaterThan(0);
});
