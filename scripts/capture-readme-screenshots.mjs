/**
 * Captures README screenshots from a running local stack.
 * Usage: npm run dev (client + server), then: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const BASE = process.env.SCREENSHOT_BASE_URL || "http://localhost:5173";
const API = process.env.SCREENSHOT_API_URL || "http://localhost:3000";

async function snap(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ✓", name);
}

async function waitForApp(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  console.log("Capturing from", BASE);

  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForApp(page);
  await snap(page, "01-auth.png");

  await page.getByRole("button", { name: /Use demo account/i }).click();
  await page.waitForFunction(
    () => localStorage.getItem("token") && document.querySelector('[data-tour="tour-welcome"], nav, aside'),
    { timeout: 15000 },
  );
  await waitForApp(page);
  await snap(page, "02-collection.png");

  await page.goto(`${BASE}/community`);
  await waitForApp(page);
  await snap(page, "03-community-members.png");

  await page.getByRole("button", { name: "Statistics" }).click();
  await page.waitForTimeout(800);
  await snap(page, "04-community-stats.png");

  await page.getByRole("button", { name: "Activity" }).click();
  await page.waitForTimeout(800);
  await snap(page, "05-community-activity.png");

  await page.getByRole("button", { name: /Find group/i }).click();
  await page.waitForTimeout(800);
  await snap(page, "06-community-lfg.png");

  await page.goto(`${BASE}/game/new`);
  await waitForApp(page);
  await snap(page, "07-add-game.png");

  await page.goto(`${BASE}/settings`);
  await waitForApp(page);
  await snap(page, "08-settings.png");

  await page.goto(`${BASE}/recommendations`);
  await waitForApp(page);
  await snap(page, "09-recommendations.png");

  await page.goto(`${BASE}/search?q=zelda`);
  await waitForApp(page);
  await snap(page, "10-search.png");

  const token = await page.evaluate(() => localStorage.getItem("token"));
  const gamesRes = await fetch(`${API}/api/games`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const games = await gamesRes.json();
  const gameId = Array.isArray(games) ? games[0]?.id : null;
  if (gameId) {
    await page.goto(`${BASE}/juego/${gameId}/discussion`);
    await waitForApp(page);
    await snap(page, "11-discussion.png");
  } else {
    console.warn("  ! skipped 11-discussion.png (no games in demo collection)");
  }

  const usersRes = await fetch(`${API}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = await usersRes.json();
  const me = await page.evaluate(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const other = Array.isArray(users)
    ? users.find((u) => u.id !== me.id)
    : null;
  if (other?.id) {
    await page.goto(`${BASE}/user/${other.id}`);
    await waitForApp(page);
    await snap(page, "12-public-profile.png");
  }

  const meUser = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (meUser?.user?.rol === "admin") {
    await page.goto(`${BASE}/admin`);
    await waitForApp(page);
    await snap(page, "13-admin.png");
  }

  await browser.close();
  console.log("\nSaved to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
