/**
 * Generates landscape PDF + cover thumbnail from portfolio doc/index.html
 * Requires: npx playwright install chromium (one-time)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(dir, "index.html");
const pdfPath = path.join(dir, "VALENCE-Portfolio-Case-Study.pdf");
const thumbDir = path.join(dir, "..", "thumbnail");
const thumbPath = path.join(thumbDir, "valence-portfolio-cover.png");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing index.html in portfolio doc/");
  process.exit(1);
}

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();

const fileUrl = pathToFileURL(htmlPath).href;
await page.goto(fileUrl, { waitUntil: "networkidle" });

await page.emulateMedia({ media: "print" });
await page.pdf({
  path: pdfPath,
  preferCSSPageSize: true,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

await page.emulateMedia({ media: "screen" });
await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(fileUrl, { waitUntil: "networkidle" });
fs.mkdirSync(thumbDir, { recursive: true });
await page.locator("#s1").screenshot({ path: thumbPath, type: "png" });

await browser.close();
console.log(JSON.stringify({ pdf: pdfPath, thumbnail: thumbPath }, null, 2));
