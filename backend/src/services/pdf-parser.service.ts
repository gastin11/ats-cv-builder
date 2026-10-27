import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface PdfParseResult {
  text: string;
  pageCount: number;
  charsPerPage: number[];
}

/**
 * Extract the text layer of a PDF with pdfjs-dist. Returns per-page character
 * counts so callers can decide whether OCR fallback is needed.
 * The buffer is copied because pdfjs transfers/detaches the underlying ArrayBuffer.
 */
export async function parsePdfText(buffer: Buffer, password?: string): Promise<PdfParseResult> {
  const data = new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  const doc: PDFDocumentProxy = await getDocument({
    data,
    password,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;

  try {
    const charsPerPage: number[] = [];
    const pageTexts: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let text = '';
      let lastY: number | null = null;
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean; transform?: number[] }>) {
        if (typeof item.str !== 'string') continue;
        const y = Array.isArray(item.transform) ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && !text.endsWith('\n')) {
          text += '\n';
        }
        text += item.str;
        if (item.hasEOL) text += '\n';
        if (y !== null) lastY = y;
      }
      const cleaned = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      pageTexts.push(cleaned);
      charsPerPage.push(cleaned.length);
      page.cleanup();
    }

    return { text: pageTexts.join('\n\n'), pageCount: doc.numPages, charsPerPage };
  } finally {
    await doc.destroy();
  }
}
