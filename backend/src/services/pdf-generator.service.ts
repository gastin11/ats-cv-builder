import type { CVDocument } from '../../../shared/cv-schema/cv.schema.js';
import { renderCvHtml } from '../templates/cv-html.template.js';

type PlaywrightModule = typeof import('playwright');

let cachedModule: PlaywrightModule | null = null;

async function loadPlaywright(): Promise<PlaywrightModule> {
  if (cachedModule) return cachedModule;
  try {
    cachedModule = (await import('playwright')) as PlaywrightModule;
    return cachedModule;
  } catch {
    throw new Error('PDF engine is not installed. Run "npx playwright install chromium" on the server.');
  }
}

async function launchBrowser() {
  const { chromium } = await loadPlaywright();
  try {
    return await chromium.launch({ headless: true });
  } catch {
    // Bundled Chromium not downloaded — fall back to a system browser channel.
    for (const channel of ['chrome', 'msedge']) {
      try {
        return await chromium.launch({ headless: true, channel });
      } catch {
        // try next channel
      }
    }
    throw new Error(
      'PDF engine unavailable. Run "npx playwright install chromium" on the server, or install Chrome/Edge.',
    );
  }
}

/** Render CV JSON to PDF bytes via headless Chromium. In-memory only, no temp files. */
export async function generatePdf(cv: CVDocument): Promise<Buffer> {
  const html = renderCvHtml(cv);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf: Buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // @page rule defines A4 + margins
    });
    await page.close();
    return pdf;
  } finally {
    await browser.close();
  }
}
