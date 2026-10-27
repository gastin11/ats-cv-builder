import mammoth from 'mammoth';

export interface DocxBlock {
  type: 'heading' | 'paragraph' | 'list-item';
  level: number; // heading level 1..6, 0 otherwise
  text: string;
}

/** Minimal HTML entity decoder for mammoth output. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function htmlToBlocks(html: string): DocxBlock[] {
  const blocks: DocxBlock[] = [];
  const elementRe = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = elementRe.exec(html)) !== null) {
    const tag = match[1];
    let text = decodeEntities(match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (!text) continue;
    if (tag === 'li') {
      // Mammoth may emit nested lists as <li> containing <p> — text already flattened above.
      text = text.replace(/^[•\-*▪◦–]\s*/, '');
      blocks.push({ type: 'list-item', level: 0, text });
    } else if (/^h[1-6]$/.test(tag)) {
      blocks.push({ type: 'heading', level: Number(tag[1]), text });
    } else {
      blocks.push({ type: 'paragraph', level: 0, text });
    }
  }
  return blocks;
}

export interface DocxParseResult {
  blocks: DocxBlock[];
  rawText: string;
}

/**
 * Extract structured blocks (headings, paragraphs, list items) from a DOCX
 * buffer. Processing happens fully in memory.
 */
export async function parseDocx(buffer: Buffer): Promise<DocxParseResult> {
  const options = {
    styleMap: [
      "p[style-name='Title'] => h1:fresh",
      "p[style-name='Subtitle'] => h2:fresh",
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
    ],
  };

  const { value: html } = await mammoth.convertToHtml({ buffer }, options);
  const blocks = htmlToBlocks(html);

  const { value: rawText } = await mammoth.extractRawText({ buffer });

  if (blocks.length === 0 && rawText.trim().length === 0) {
    throw new Error('No text could be extracted from this document.');
  }

  return { blocks, rawText };
}
