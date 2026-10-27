import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import type { CVDocument } from '../../../shared/cv-schema/cv.schema.js';
import { normalizeWhitespace } from '../utils/misc.js';
import { sectionHeading, presentLabel, defaultSkillLabel, type CVLanguage } from '../../../shared/cv-schema/i18n.js';

const FONT_MAP: Record<string, string> = {
  arial: 'Arial',
  calibri: 'Calibri',
  georgia: 'Georgia',
  times: 'Times New Roman',
};

function contactLine(cv: CVDocument): string {
  return [
    cv.personal.location,
    cv.personal.phone,
    cv.personal.email,
    cv.personal.linkedin,
    cv.personal.portfolio,
    cv.personal.github,
    ...cv.personal.otherLinks,
  ].map((p) => p.trim()).filter(Boolean).join(' | ');
}

function heading(text: string, font: string, sizeHalfPoints: number): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '171717', space: 2 } },
    children: [new TextRun({ text, bold: true, font, size: sizeHalfPoints })],
  });
}

/** Bold "Employer - Location" with right-aligned dates on the same line. */
function entryTitle(left: string, right: string, font: string, pageWidthTwips: number): Paragraph {
  return new Paragraph({
    tabStops: right ? [{ type: TabStopType.RIGHT, position: pageWidthTwips }] : undefined,
    spacing: { before: 120, after: 20 },
    children: [
      new TextRun({ text: left, bold: true, font, size: 22 }),
      ...(right ? [new TextRun({ text: `\t${right}`, font, size: 21 })] : []),
    ],
  });
}

/** Italic role/degree line below the entry title. */
function entrySub(text: string, font: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, italics: true, font, size: 21 })],
  });
}

/** Bulleted line, matching the reference resume layout. */
function bulletLine(text: string, font: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font, size: 21 })],
  });
}

function body(text: string, font: string, opts: { bold?: boolean; italics?: boolean; after?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: opts.after ?? 80 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, font, size: 21 })],
  });
}

function dateRange(start: string, end: string, isCurrent: boolean, language: CVLanguage): string {
  return [start, isCurrent ? presentLabel(language) : end].filter(Boolean).join(' - ');
}

const A4_CONTENT_WIDTH_TWIPS = 9026; // 210mm minus 18mm margins on both sides

/** Build the ATS-tested single-column DOCX from the canonical CV JSON. In-memory only. */
export async function generateDocx(cv: CVDocument): Promise<Buffer> {
  const font = FONT_MAP[cv.settings.font] ?? 'Arial';
  const sizeHalfPoints = Math.round(cv.settings.fontSizePt * 2);

  const children: Paragraph[] = [];

  if (cv.personal.fullName) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: cv.personal.fullName, bold: true, font, size: Math.round(sizeHalfPoints * 1.8) })],
      }),
    );
  }
  const language = cv.settings.language;
  const contact = contactLine(cv);
  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: contact, font, size: 21 })],
      }),
    );
  }
  // Summary renders as a tagline under the header.
  if (cv.summary.trim()) {
    children.push(body(cv.summary, font, { after: 120 }));
  }

  const order = cv.settings.sectionOrder;
  const hidden = new Set(cv.settings.hiddenSections);

  for (const sectionId of order) {
    if (hidden.has(sectionId) || sectionId === 'summary') continue;

    switch (sectionId) {
      case 'education': {
        if (cv.education.length === 0) break;
        children.push(heading(sectionHeading(language, 'education'), font, sizeHalfPoints));
        for (const e of cv.education) {
          children.push(entryTitle([e.institution, e.location].filter(Boolean).join(' - ') || '(Untitled entry)', dateRange(e.startDate, e.endDate, e.isCurrent, language), font, A4_CONTENT_WIDTH_TWIPS));
          if (e.degree) children.push(entrySub(e.degree, font));
          for (const d of e.details) children.push(bulletLine(d, font));
        }
        break;
      }
      case 'experience': {
        if (cv.experience.length === 0) break;
        children.push(heading(sectionHeading(language, 'experience'), font, sizeHalfPoints));
        for (const e of cv.experience) {
          children.push(entryTitle([e.company, e.location].filter(Boolean).join(' - ') || '(Untitled entry)', dateRange(e.startDate, e.endDate, e.isCurrent, language), font, A4_CONTENT_WIDTH_TWIPS));
          const sub = [e.jobTitle, e.employmentType].filter(Boolean).join(', ');
          if (sub) children.push(entrySub(sub, font));
          for (const b of e.bullets) children.push(bulletLine(b, font));
        }
        break;
      }
      case 'projects': {
        if (cv.projects.length === 0) break;
        children.push(heading(sectionHeading(language, 'projects'), font, sizeHalfPoints));
        for (const p of cv.projects) {
          children.push(entryTitle([p.name, p.url].filter(Boolean).join(' - ') || '(Untitled entry)', dateRange(p.startDate, p.endDate, p.isCurrent, language), font, A4_CONTENT_WIDTH_TWIPS));
          if (p.role) children.push(entrySub(p.role, font));
          for (const b of p.bullets) children.push(bulletLine(b, font));
        }
        break;
      }
      case 'organizations': {
        if (cv.organizations.length === 0) break;
        children.push(heading(sectionHeading(language, 'organizations'), font, sizeHalfPoints));
        for (const o of cv.organizations) {
          children.push(entryTitle([o.organization, o.location].filter(Boolean).join(' - ') || '(Untitled entry)', dateRange(o.startDate, o.endDate, o.isCurrent, language), font, A4_CONTENT_WIDTH_TWIPS));
          if (o.role) children.push(entrySub(o.role, font));
          for (const b of o.bullets) children.push(bulletLine(b, font));
        }
        break;
      }
      case 'skills': {
        if (cv.skills.length === 0) break;
        children.push(heading(sectionHeading(language, 'skills'), font, sizeHalfPoints));
        for (const g of cv.skills) {
          if (g.skills.length === 0) continue;
          const label = normalizeWhitespace(g.label) || defaultSkillLabel(language);
          children.push(bulletLine(`${label}: ${g.skills.join(', ')}`, font));
        }
        break;
      }
      default:
        break;
    }
  }

  // User-defined additional sections always render last.
  for (const extra of cv.additional) {
    if (extra.items.length === 0) continue;
    children.push(heading(extra.title || sectionHeading(language, 'additional'), font, sizeHalfPoints));
    for (const item of extra.items) children.push(bulletLine(item, font));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: sizeHalfPoints },
          paragraph: { spacing: { line: Math.round(cv.settings.lineHeight * 240) } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: cv.settings.marginMm * 57, // mm → twips (1mm ≈ 56.7)
              bottom: cv.settings.marginMm * 57,
              left: cv.settings.marginMm * 57,
              right: cv.settings.marginMm * 57,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
