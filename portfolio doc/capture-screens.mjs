/**
 * Captures live VALENCE UI — viewport matches device frame aspect to avoid cropped/overlapping look.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(dir, "assets");
const base = process.env.PORTFOLIO_BASE_URL?.trim() || "https://valence-commerce.vercel.app";

fs.mkdirSync(assets, { recursive: true });

/** 16:10 — matches .screen aspect-ratio in portfolio styles (iMac / laptop). */
const DESKTOP = { width: 1600, height: 1000 };
/** ~ iPhone 16 screen ratio in portfolio mock. */
const MOBILE = { width: 390, height: 844 };

async function stabilize(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `*, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }`,
  });
  await page.waitForLoadState("networkidle", { timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

const { chromium } = await import("playwright");
const browser = await chromium.launch();

async function desktopShot(name, url) {
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  try {
    await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await stabilize(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(assets, name), type: "png", fullPage: false });
    console.log("OK", name);
  } catch (error) {
    console.error("FAIL", name, error instanceof Error ? error.message : error);
  } finally {
    await context.close();
  }
}

async function mobileShot(name, url) {
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  try {
    await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await stabilize(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(assets, name), type: "png", fullPage: false });
    console.log("OK", name);
  } catch (error) {
    console.error("FAIL", name, error instanceof Error ? error.message : error);
  } finally {
    await context.close();
  }
}

/** Hero only — avoids nav + headline stacking in a tight crop. */
async function landingHeroShot() {
  const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const name = "01-landing-desktop.png";
  try {
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await stabilize(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const hero = page.locator("main#content section").first();
    await hero.waitFor({ state: "visible", timeout: 30000 });
    await hero.screenshot({ path: path.join(assets, name), type: "png" });
    console.log("OK", name, "(hero clip)");
  } catch (error) {
    console.error("FAIL", name, error instanceof Error ? error.message : error);
    await desktopShot(name, "/shop");
  } finally {
    await context.close();
  }
}

await landingHeroShot();
await desktopShot("02-shop-desktop.png", "/shop");
await desktopShot("03-pdp-desktop.png", "/product/obsidian-shell-parka");
await mobileShot("04-shop-mobile.png", "/shop");
await mobileShot("05-pdp-mobile.png", "/product/voltage-knit-crew");
await desktopShot("06-checkout-desktop.png", "/checkout");
await desktopShot("07-admin-desktop.png", "/admin/login");
await mobileShot("08-wishlist-mobile.png", "/wishlist");
await mobileShot("09-checkout-mobile.png", "/checkout");

await browser.close();
console.log("Done.", assets);
