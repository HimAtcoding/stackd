// What every screen's suite shares: the browser, the server's address, a running count of failed checks, and a way to
// open a screen as the test student at a phone size.
import { install, makeState } from "./standin.mjs";

export function createRun({ browser, base, shots }) {
  let failed = 0;
  const check = (name, ok, detail) => {
    if (!ok) failed++;
    console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail ?? null).slice(0, 400));
  };
  const settle = (page, ms = 600) => page.waitForTimeout(ms);
  const shot = (page, name, fullPage = false) => (shots ? page.screenshot({ path: `${shots}/${name}.png`, fullPage }) : null);

  // A fresh context per call, so each check starts from the student's seeded rows. Options go to makeState.
  async function open(path, width, height, options = {}) {
    const state = makeState(options);
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await install(context, state);
    const page = await context.newPage();
    page.on("pageerror", (e) => check(`no page error (${e.message.slice(0, 80)})`, false));
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await settle(page, 1500);
    return { state, context, page };
  }

  // No sideways scroll and the tab bar inside the screen
  async function fitsWidth(page, width, label) {
    check(`${label}: no sideways scroll at ${width}`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
  }

  return { base, browser, check, settle, shot, open, fitsWidth, failed: () => failed };
}
