import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const FPS = Number(process.env.FPS || 30);
const OUT = process.env.OUT || 'frames';
const FILE = 'file:///C:/Users/Asus/Documents/CV%20builder/index.html?clean=1';

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--mute-audio',
    '--font-render-hinting=none',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(FILE, { waitUntil: 'networkidle0', timeout: 120000 });

// tunggu GSAP + fonts + OPENER ready
await page.waitForFunction('window.OPENER && window.OPENER.ready', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { window.OPENER.tl.pause(0); });

const DURATION = await page.evaluate(() => window.OPENER.DURATION);
const total = Math.ceil(DURATION * FPS);
console.log(`${total} frame @ ${FPS} fps (${DURATION}s) -> ${OUT}/`);

for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await page.evaluate(async (time) => {
    window.OPENER.seek(time);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);

  await page.screenshot({
    path: path.join(OUT, `f${String(i).padStart(5, '0')}.png`),
  });

  if (i % 30 === 0) process.stdout.write(`\r${i}/${total} ${(t).toFixed(1)}s`);
}

console.log(`\nselesai — ${total} frame di ${OUT}/`);
await browser.close();
