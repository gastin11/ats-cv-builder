import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus, faExpand, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../../stores/cvStore';
import { cvDocumentSchema, type CVDocument } from '../../../../shared/cv-schema/cv.schema';
import { sectionHeading, presentLabel, defaultSkillLabel, ui, type CVLanguage } from '../../../../shared/cv-schema/i18n';

const MM_TO_PX = 96 / 25.4;
const PT_TO_PX = 96 / 72;
const PAGE_W = 210 * MM_TO_PX; // ~794 px
const PAGE_H = 297 * MM_TO_PX; // ~1123 px

const FONT_STACKS: Record<string, string> = {
  arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, serif",
};

const TEMPLATE_PRESETS: Record<string, { secGap: number; entryGap: number; bulletGap: number; nameScale: number; sectionScale: number }> = {
  classic: { secGap: 14, entryGap: 7, bulletGap: 2.5, nameScale: 2.1, sectionScale: 1.2 },
  compact: { secGap: 8, entryGap: 4, bulletGap: 1, nameScale: 1.9, sectionScale: 1.1 },
  academic: { secGap: 14, entryGap: 7, bulletGap: 2.5, nameScale: 2.1, sectionScale: 1.2 },
  professional: { secGap: 12, entryGap: 6, bulletGap: 2, nameScale: 2.0, sectionScale: 1.15 },
};

/**
 * Short lorem-ipsum sample shown in the preview whenever the real CV is
 * empty, so users see the layout immediately. Replaced automatically as soon
 * as the user enters content or imports a CV.
 */
const DUMMY_CV: CVDocument = cvDocumentSchema.parse({
  personal: {
    fullName: 'Alex Morgan',
    location: 'Jakarta',
    phone: '+62 812 3456 7890',
    email: 'alex@example.com',
    linkedin: 'linkedin.com/in/alexmorgan',
  },
  summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  experience: [
    {
      id: 'dummy-exp',
      company: 'Lorem Corporation',
      jobTitle: 'Lorem Analyst',
      location: 'Jakarta',
      startDate: 'Jan 2023',
      endDate: '',
      isCurrent: true,
      bullets: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea.',
      ],
    },
  ],
  skills: [{ id: 'dummy-skl', label: 'Skills', skills: ['Lorem', 'Ipsum', 'Dolor'] }],
});

function contactParts(cv: CVDocument): string[] {
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

function dateRange(start: string, end: string, isCurrent: boolean, language: CVLanguage): string {
  return [start, isCurrent ? presentLabel(language) : end].filter(Boolean).join(' - ');
}

interface Block {
  key: string;
  node: ReactNode;
  forceBreak: boolean;
}

function entryRow(left: string, right: string): ReactNode {
  return (
    <div className="cv-entry-title">
      <span className="cv-entry-left">{left}</span>
      {right && <span className="cv-entry-right">{right}</span>}
    </div>
  );
}

/** Bulleted lines with markers, matching the ATS reference layout. */
function bulletLines(bullets: string[], keyPrefix: string): ReactNode {
  return (
    <ul>
      {bullets.map((b, i) => (
        <li key={`${keyPrefix}-${i}`}>{b}</li>
      ))}
    </ul>
  );
}

function buildBlocks(cv: CVDocument): Block[] {
  const blocks: Block[] = [];
  const hidden = new Set(cv.settings.hiddenSections);
  const breaks = new Set<string>(cv.settings.manualPageBreaks);
  const language = cv.settings.language;

  blocks.push({
    key: 'header',
    forceBreak: false,
    node: (
      <header>
        {cv.personal.fullName && <h1>{cv.personal.fullName}</h1>}
        {contactParts(cv).length > 0 && <div className="cv-contact">{contactParts(cv).join(' | ')}</div>}
        {cv.summary.trim() && <div className="cv-tagline">{cv.summary}</div>}
      </header>
    ),
  });

  const pushEntry = (key: string, node: ReactNode) =>
    blocks.push({ key, forceBreak: false, node: <div className="cv-entry-block">{node}</div> });

  for (const sectionKey of cv.settings.sectionOrder) {
    if (hidden.has(sectionKey) || sectionKey === 'summary') continue;
    const forceBreak = breaks.has(sectionKey);
    const pushHeading = (title: string, key: string) =>
      blocks.push({ key, forceBreak, node: <h2>{title}</h2> });

    switch (sectionKey) {
      case 'education': {
        if (cv.education.length === 0) break;
        pushHeading(sectionHeading(language, 'education'), 'h-education');
        for (const e of cv.education) {
          pushEntry(
            `edu-${e.id}`,
            <>
              {entryRow([e.institution, e.location].filter(Boolean).join(' - '), dateRange(e.startDate, e.endDate, e.isCurrent, language))}
              {e.degree && <div className="cv-entry-sub">{e.degree}</div>}
              {bulletLines(e.details, `edu-${e.id}`)}
            </>,
          );
        }
        break;
      }
      case 'experience': {
        if (cv.experience.length === 0) break;
        pushHeading(sectionHeading(language, 'experience'), 'h-experience');
        for (const e of cv.experience) {
          pushEntry(
            `exp-${e.id}`,
            <>
              {entryRow([e.company, e.location].filter(Boolean).join(' - '), dateRange(e.startDate, e.endDate, e.isCurrent, language))}
              {(e.jobTitle || e.employmentType) && <div className="cv-entry-sub">{[e.jobTitle, e.employmentType].filter(Boolean).join(', ')}</div>}
              {bulletLines(e.bullets, `exp-${e.id}`)}
            </>,
          );
        }
        break;
      }
      case 'projects': {
        if (cv.projects.length === 0) break;
        pushHeading(sectionHeading(language, 'projects'), 'h-projects');
        for (const p of cv.projects) {
          pushEntry(
            `prj-${p.id}`,
            <>
              {entryRow([p.name, p.url].filter(Boolean).join(' - '), dateRange(p.startDate, p.endDate, p.isCurrent, language))}
              {p.role && <div className="cv-entry-sub">{p.role}</div>}
              {bulletLines(p.bullets, `prj-${p.id}`)}
            </>,
          );
        }
        break;
      }
      case 'organizations': {
        if (cv.organizations.length === 0) break;
        pushHeading(sectionHeading(language, 'organizations'), 'h-organizations');
        for (const o of cv.organizations) {
          pushEntry(
            `org-${o.id}`,
            <>
              {entryRow([o.organization, o.location].filter(Boolean).join(' - '), dateRange(o.startDate, o.endDate, o.isCurrent, language))}
              {o.role && <div className="cv-entry-sub">{o.role}</div>}
              {bulletLines(o.bullets, `org-${o.id}`)}
            </>,
          );
        }
        break;
      }
      case 'skills': {
        const groups = cv.skills.filter((g) => g.skills.length > 0);
        if (groups.length === 0) break;
        pushHeading(sectionHeading(language, 'skills'), 'h-skills');
        blocks.push({
          key: 'skl-items',
          forceBreak: false,
          node: (
            <ul>
              {groups.map((g) => (
                <li key={g.id}>
                  <span className="cv-skill-label">{g.label || defaultSkillLabel(language)}: </span>
                  {g.skills.join(', ')}
                </li>
              ))}
            </ul>
          ),
        });
        break;
      }
      default:
        break;
    }
  }

  for (const extra of cv.additional) {
    if (extra.items.length === 0) continue;
    blocks.push({ key: `addh-${extra.id}`, forceBreak: false, node: <h2>{extra.title || sectionHeading(language, 'additional')}</h2> });
    blocks.push({
      key: `add-${extra.id}`,
      forceBreak: false,
      node: <div className="cv-entry-block">{bulletLines(extra.items, `add-${extra.id}`)}</div>,
    });
  }

  return blocks;
}

export default function CVPreview() {
  const cv = useCvStore((s) => s.cv);
  const zoom = useCvStore((s) => s.zoom);
  const setZoom = useCvStore((s) => s.setZoom);
  const fitWidth = useCvStore((s) => s.fitWidth);
  const setFitWidth = useCvStore((s) => s.setFitWidth);
  const lang = useCvStore((s) => s.cv.settings.language);
  const languageBusy = useCvStore((s) => s.languageBusy);

  const marginPx = cv.settings.marginMm * MM_TO_PX;
  const contentW = PAGE_W - marginPx * 2;
  const contentH = PAGE_H - marginPx * 2;

  // Dummy preview: shown whenever the real CV is empty, keeping the user's
  // current template/language settings so the layout stays accurate.
  const isEmpty =
    !cv.personal.fullName &&
    !cv.summary &&
    cv.education.length === 0 &&
    cv.experience.length === 0 &&
    cv.projects.length === 0 &&
    cv.organizations.length === 0 &&
    cv.skills.length === 0 &&
    cv.certifications.length === 0 &&
    cv.awards.length === 0;
  const source = isEmpty ? { ...DUMMY_CV, settings: cv.settings } : cv;

  const blocks = useMemo(() => buildBlocks(source), [source]);
  const preset = TEMPLATE_PRESETS[cv.settings.template] ?? TEMPLATE_PRESETS.classic;

  const measureRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([[]]);
  const [activePage, setActivePage] = useState(1);


  // Vertical spacing is applied on block wrappers (padding, never margin) so
  // that measured heights and rendered heights are identical. A heading right
  // after the header gets no extra top padding: the header bottom gap already
  // provides it (keeps the summary-to-experience distance like the reference).
  const blockGap = useCallback(
    (key: string, position: 'top' | 'bottom', prevKey?: string): number => {
      if (key === 'header') return position === 'bottom' ? preset.secGap * PT_TO_PX : 0;
      if (key.startsWith('h-')) return position === 'top' && prevKey !== 'header' ? preset.secGap * PT_TO_PX : 0;
      return position === 'top' ? preset.entryGap * PT_TO_PX : 0;
    },
    [preset],
  );

  // Pagination: measure blocks in a hidden container of identical width and
  // styles, then distribute them over A4 pages. A heading is always kept
  // together with the block that follows it; manual breaks are honored.
  useLayoutEffect(() => {
    const container = measureRef.current;
    if (!container) return;
    const heights = Array.from(container.children).map((child) => child.getBoundingClientRect().height);

    const result: number[][] = [];
    let currentPage: number[] = [];
    let y = 0;

    for (let i = 0; i < blocks.length; i++) {
      const isHeading = blocks[i].key.startsWith('h-');
      if (blocks[i].forceBreak && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [];
        y = 0;
      }

      let need = heights[i] ?? 0;
      if (isHeading && i + 1 < blocks.length && !blocks[i + 1].forceBreak) {
        need += heights[i + 1] ?? 0;
      }

      if (y + need > contentH && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [];
        y = 0;
      }
      currentPage.push(i);
      y += heights[i] ?? 0;
    }
    if (currentPage.length > 0) result.push(currentPage);
    const next = result.length > 0 ? result : [[]];
    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [blocks, contentH, blockGap, preset]);

  // Fit-to-width zoom
  useLayoutEffect(() => {
    if (!fitWidth || !scrollRef.current) return;
    const observer = new ResizeObserver(() => {
      const available = (scrollRef.current?.clientWidth ?? PAGE_W) - 48;
      setZoom(Math.min(2, Math.max(0.3, available / PAGE_W)));
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [fitWidth, setZoom]);

  // Track the page currently at the top of the viewport
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const onScroll = () => {
      const containerTop = element.getBoundingClientRect().top;
      let current = 1;
      for (const child of Array.from(element.querySelectorAll<HTMLElement>('[data-page]'))) {
        if (child.getBoundingClientRect().top - containerTop <= 100) {
          current = Number(child.dataset.page);
        }
      }
      setActivePage(current);
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => element.removeEventListener('scroll', onScroll);
  }, [pages, zoom]);

  const cssVars = {
    '--cv-font': FONT_STACKS[cv.settings.font] ?? FONT_STACKS.arial,
    '--cv-fs': cv.settings.fontSizePt * PT_TO_PX,
    '--cv-lh': String(cv.settings.lineHeight),
    '--cv-name-scale': preset.nameScale,
    '--cv-section-scale': preset.sectionScale,
    '--cv-bullet-gap': `${preset.bulletGap * PT_TO_PX}px`,
  } as CSSProperties;

  const renderBlock = (blockIndex: number, firstOnPage: boolean, prevKey?: string) => {
    const block = blocks[blockIndex];
    // After undo/redo the pending pages state may still reference indices of
    // the previous block list; skip them until the effect recomputes.
    if (!block) return null;
    return (
      <div
        key={block.key}
        style={{
          paddingTop: firstOnPage ? 0 : blockGap(block.key, 'top', prevKey),
          paddingBottom: blockGap(block.key, 'bottom'),
        }}
      >
        {block.node}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="flex items-center justify-center gap-3 border-b border-line bg-surface px-4 py-2 text-sm">
        <span className="text-ink-2">
          {ui(lang, 'page')} {Math.min(activePage, pages.length) || 1} / {pages.length}
        </span>
        <span className="h-4 w-px bg-line" aria-hidden />
        <button
          className="rounded p-1.5 text-ink-2 hover:bg-bg hover:text-ink"
          onClick={() => setZoom(zoom - 0.1)}
          aria-label={ui(lang, "zoomOut")}
        >
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} aria-hidden />
        </button>
        <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          className="rounded p-1.5 text-ink-2 hover:bg-bg hover:text-ink"
          onClick={() => setZoom(zoom + 0.1)}
          aria-label={ui(lang, "zoomIn")}
        >
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} aria-hidden />
        </button>
        <button
          className={`rounded px-2 py-1 ${fitWidth ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-bg hover:text-ink'}`}
          onClick={() => setFitWidth(!fitWidth)}
          aria-pressed={fitWidth}
        >
          <FontAwesomeIcon icon={faExpand} aria-hidden />{' '}{ui(lang, 'fitWidth')}
        </button>
      </div>

      <div ref={scrollRef} className="relative flex-1 overflow-auto bg-bg p-6">
        {languageBusy ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-2">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-accent" aria-hidden />
            <p className="text-sm">{ui(lang, 'loading')}</p>
          </div>
        ) : (
          <div className="mx-auto" style={{ width: PAGE_W * zoom + 4, maxWidth: 'none' }}>
            {pages.map((pageIndices, pageIndex) => (
              <div
                key={pageIndex}
                data-page={pageIndex + 1}
                style={{ width: PAGE_W * zoom, height: PAGE_H * zoom, margin: '0 auto 24px' }}
              >
                <div
                  className="cv-page"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <div className="cv-doc" style={{ ...cssVars, padding: marginPx, height: '100%' }}>
                    {pageIndices.map((blockIndex, position) =>
                      renderBlock(blockIndex, position === 0, position > 0 ? blocks[pageIndices[position - 1]]?.key : undefined),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      </div>

      {/* Measurement pass: identical styles and width, rendered off-screen */}
      {
        <div className="cv-measure" aria-hidden>
          <div style={{ width: contentW }}>
            <div className="cv-doc" ref={measureRef} style={cssVars}>
              {blocks.map((block, i) => (
                <div
                  key={block.key}
                  style={{
                    paddingTop: blockGap(block.key, 'top', i > 0 ? blocks[i - 1].key : undefined),
                    paddingBottom: blockGap(block.key, 'bottom'),
                  }}
                >
                  {block.node}
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    </div>
  );
}
