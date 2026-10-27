import { escapeHtml } from '../utils/html.js';
import { sectionHeading, presentLabel, defaultSkillLabel } from '../../../shared/cv-schema/i18n.js';
import type { CVDocument } from '../../../shared/cv-schema/cv.schema.js';

const FONT_STACKS: Record<string, string> = {
  arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, serif",
};

/** Template density presets — all single-column, no decoration (ATS-first). */
const TEMPLATE_PRESETS: Record<string, { sectionGap: number; entryGap: number; bulletGap: number; nameSize: number; sectionSize: number }> = {
  classic: { sectionGap: 14, entryGap: 7, bulletGap: 2.5, nameSize: 2.1, sectionSize: 1.2 },
  compact: { sectionGap: 8, entryGap: 4, bulletGap: 1, nameSize: 1.9, sectionSize: 1.1 },
  academic: { sectionGap: 14, entryGap: 7, bulletGap: 2.5, nameSize: 2.1, sectionSize: 1.2 },
  professional: { sectionGap: 12, entryGap: 6, bulletGap: 2, nameSize: 2.0, sectionSize: 1.15 },
};

function contactLine(cv: CVDocument): string[] {
  return [
    cv.personal.location,
    cv.personal.phone,
    cv.personal.email,
    cv.personal.linkedin,
    cv.personal.portfolio,
    cv.personal.github,
    ...cv.personal.otherLinks,
  ].map((p) => p.trim()).filter(Boolean);
}

function entryRow(left: string, right: string): string {
  return `<div class="entry-title"><span class="entry-left">${escapeHtml(left)}</span>${
    right ? `<span class="entry-right">${escapeHtml(right)}</span>` : ''
  }</div>`;
}

/**
 * Render the CV JSON into the printable HTML used for server-side PDF
 * generation (Playwright). Structure mirrors the ATS-tested reference layout:
 * centered header with tagline, bold "Employer - Location" rows with
 * right-aligned dates, italic role line, and marker-free bullet lines.
 * Pagination is CSS-driven: entries and headings avoid splitting across pages.
 */
export function renderCvHtml(cv: CVDocument): string {
  const preset = TEMPLATE_PRESETS[cv.settings.template] ?? TEMPLATE_PRESETS.classic;
  const fontStack = FONT_STACKS[cv.settings.font] ?? FONT_STACKS.arial;
  const fs = cv.settings.fontSizePt;
  const order = cv.settings.sectionOrder;
  const hidden = new Set(cv.settings.hiddenSections);
  const pageBreaks = new Set<string>(cv.settings.manualPageBreaks);

  const language = cv.settings.language;
  const contact = contactLine(cv);

  const parts: string[] = [];

  // Header: name, contact, and the summary rendered as a tagline line
  parts.push('<header>');
  if (cv.personal.fullName) parts.push(`<h1>${escapeHtml(cv.personal.fullName)}</h1>`);
  if (contact.length > 0) parts.push(`<div class="contact">${contact.map((c) => escapeHtml(c)).join(' | ')}</div>`);
  if (cv.summary.trim()) parts.push(`<div class="tagline">${escapeHtml(cv.summary)}</div>`);
  parts.push('</header>');

  const section = (id: string, title: string, body: string) => {
    if (!body.trim()) return;
    parts.push(`<section data-section="${id}">`);
    parts.push(`<h2${id && pageBreaks.has(id) ? ' class="page-break-before"' : ''}>${escapeHtml(title)}</h2>`);
    parts.push(body);
    parts.push('</section>');
  };

  const bulletsHtml = (bullets: string[]) =>
    `<ul>${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`;

  for (const id of order) {
    if (hidden.has(id) || id === 'summary') continue; // summary renders as the header tagline

    switch (id) {
      case 'education': {
        const body = cv.education.map((e) => {
          const left = [e.institution, e.location].filter(Boolean).join(' - ');
          const right = [e.startDate, e.isCurrent ? presentLabel(language) : e.endDate].filter(Boolean).join(' - ');
          const sub = [e.degree].filter(Boolean).join(', ');
          return `<div class="entry">${entryRow(left || '(Untitled entry)', right)}${sub ? `<div class="entry-sub">${escapeHtml(sub)}</div>` : ''}${bulletsHtml(e.details)}</div>`;
        }).join('');
        section('education', sectionHeading(language, 'education'), body);
        break;
      }

      case 'experience': {
        const body = cv.experience.map((e) => {
          const left = [e.company, e.location].filter(Boolean).join(' - ');
          const right = [e.startDate, e.isCurrent ? presentLabel(language) : e.endDate].filter(Boolean).join(' - ');
          const sub = [e.jobTitle, e.employmentType].filter(Boolean).join(', ');
          return `<div class="entry">${entryRow(left || '(Untitled entry)', right)}${sub ? `<div class="entry-sub">${escapeHtml(sub)}</div>` : ''}${bulletsHtml(e.bullets)}</div>`;
        }).join('');
        section('experience', sectionHeading(language, 'experience'), body);
        break;
      }

      case 'projects': {
        const body = cv.projects.map((p) => {
          const left = [p.name, p.url].filter(Boolean).join(' - ');
          const right = [p.startDate, p.isCurrent ? presentLabel(language) : p.endDate].filter(Boolean).join(' - ');
          const sub = [p.role].filter(Boolean).join(', ');
          return `<div class="entry">${entryRow(left || '(Untitled entry)', right)}${sub ? `<div class="entry-sub">${escapeHtml(sub)}</div>` : ''}${bulletsHtml(p.bullets)}</div>`;
        }).join('');
        section('projects', sectionHeading(language, 'projects'), body);
        break;
      }

      case 'organizations': {
        const body = cv.organizations.map((o) => {
          const left = [o.organization, o.location].filter(Boolean).join(' - ');
          const right = [o.startDate, o.isCurrent ? presentLabel(language) : o.endDate].filter(Boolean).join(' - ');
          const sub = [o.role].filter(Boolean).join(', ');
          return `<div class="entry">${entryRow(left || '(Untitled entry)', right)}${sub ? `<div class="entry-sub">${escapeHtml(sub)}</div>` : ''}${bulletsHtml(o.bullets)}</div>`;
        }).join('');
        section('organizations', sectionHeading(language, 'organizations'), body);
        break;
      }

      case 'skills': {
        const groups = cv.skills.filter((g) => g.skills.length > 0);
        if (groups.length === 0) break;
        const body = `<ul>${groups
          .map((g) => `<li><strong>${escapeHtml(g.label || defaultSkillLabel(language))}:</strong> ${g.skills.map((s) => escapeHtml(s)).join(', ')}</li>`)
          .join('')}</ul>`;
        section('skills', sectionHeading(language, 'skills'), body);
        break;
      }

      default:
        break;
    }
  }

  for (const extra of cv.additional) {
    if (extra.items.length === 0) continue;
    const body = bulletsHtml(extra.items);
    section('additional', extra.title || sectionHeading(language, 'additional'), body);
  }

  const pageNumberCss = cv.settings.showPageNumbers
    ? `@page { @bottom-center { content: counter(page) " / " counter(pages); font-family: ${fontStack}; font-size: ${fs * 0.8}pt; color: #525252; } }`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CV</title>
<style>
  @page {
    size: A4;
    margin: ${cv.settings.marginMm}mm;
  }
  ${pageNumberCss}
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${fontStack};
    font-size: ${fs}pt;
    line-height: ${cv.settings.lineHeight};
    color: #171717;
  }
  header { text-align: center; margin-bottom: ${preset.sectionGap}pt; }
  h1 {
    font-size: ${fs * preset.nameSize}pt;
    margin: 0;
    letter-spacing: 0.5pt;
    text-transform: uppercase;
    font-weight: 700;
  }
  .contact { font-size: ${fs * 0.95}pt; margin-top: 2pt; }
  .tagline { text-align: justify; text-justify: inter-word; font-size: ${fs * 0.95}pt; margin-top: 8pt; }
  h2 {
    font-size: ${fs * preset.sectionSize}pt;
    font-weight: 700;
    border-bottom: 0.7pt solid #171717;
    padding-bottom: 2pt;
    margin: ${preset.sectionGap}pt 0 ${Math.max(3, preset.entryGap)}pt;
    break-after: avoid;
    page-break-after: avoid;
  }
  section:first-of-type h2 { margin-top: 0; }
  .entry {
    margin-bottom: ${preset.entryGap}pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .entry-title { display: flex; justify-content: space-between; gap: 8pt; }
  .entry-left { font-weight: bold; }
  .entry-right { white-space: nowrap; color: #171717; }
  .entry-sub { font-style: italic; }
  ul { margin: 1pt 0 0; padding-left: 15pt; }
  li { margin: 0 0 ${preset.bulletGap}pt; padding-left: 2pt; }
  p { margin: 0; }
  .skill-line { margin-bottom: ${preset.bulletGap}pt; }
  .page-break-before { break-before: page; page-break-before: always; }
</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>`;
}
