import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAddressCard,
  faCheck,
  faCircleHalfStroke,
  faWandMagicSparkles,
  faClipboardCheck,
  faPlus,
  faArrowUp,
  faArrowDown,
  faEye,
  faEyeSlash,
  faGripLinesVertical,
} from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../stores/cvStore';
import { SECTIONS, type SectionKey } from '../types';
import { ui, type UiStringKey } from '../../../shared/cv-schema/i18n';

function sectionCount(cv: unknown, key: SectionKey): number {
  const c = cv as Record<string, unknown[]>;
  return Array.isArray(c[key]) ? c[key].length : 0;
}

function sectionFilled(cv: unknown, key: SectionKey): 'empty' | 'progress' | 'complete' {
  const c = cv as Record<string, unknown>;
  if (key === 'summary') {
    const len = typeof c.summary === 'string' ? c.summary.length : 0;
    return len === 0 ? 'empty' : 'complete';
  }
  if (key === 'skills') {
    const groups = (c.skills ?? []) as Array<{ skills?: string[] }>;
    const total = groups.reduce((n, g) => n + (g.skills?.length ?? 0), 0);
    return total === 0 ? 'empty' : total >= 4 ? 'complete' : 'progress';
  }
  const count = sectionCount(cv as never, key);
  if (count === 0) return 'empty';
  const first = ((c[key] ?? []) as Array<Record<string, unknown>>)[0];
  const hasCore = first && Object.entries(first).some(([k, v]) => k !== 'id' && k !== 'isCurrent' && typeof v === 'string' && v.length > 0);
  return hasCore ? 'complete' : 'progress';
}

export default function EditorSidebar() {
  const cv = useCvStore((s) => s.cv);
  const lang = useCvStore((s) => s.cv.settings.language);
  const activeSection = useCvStore((s) => s.activeSection);
  const setActiveSection = useCvStore((s) => s.setActiveSection);
  const leftTab = useCvStore((s) => s.leftTab);
  const setLeftTab = useCvStore((s) => s.setLeftTab);
  const moveSection = useCvStore((s) => s.moveSection);
  const toggleSectionHidden = useCvStore((s) => s.toggleSectionHidden);
  const togglePageBreak = useCvStore((s) => s.togglePageBreak);

  return (
    <nav className="flex h-full w-full flex-col border-r border-line bg-surface" aria-label="Sections">
      <div className="flex border-b border-line" role="tablist" aria-label="Editor panels">
        <TabButton active={leftTab === 'sections'} onClick={() => setLeftTab('sections')} icon={faAddressCard} label={ui(lang, "tabSections")} />
        <TabButton active={leftTab === 'ai'} onClick={() => setLeftTab('ai')} icon={faWandMagicSparkles} label="AI" />
        <TabButton active={leftTab === 'check'} onClick={() => setLeftTab('check')} icon={faClipboardCheck} label={ui(lang, "tabCheck")} />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <SidebarItem
          label={ui(lang, 'personal')}
          icon="fa-address-card"
          status={cv.personal.fullName ? 'complete' : cv.personal.email || cv.personal.phone ? 'progress' : 'empty'}
          active={activeSection === 'personal'}
          onClick={() => setActiveSection('personal')}
        />
        {/* Summary always renders as the header tagline, so it has no ordering controls */}
        <SidebarItem
          label={ui(lang, 'summary')}
          icon="fa-user"
          status={cv.summary.trim() ? 'complete' : 'empty'}
          active={activeSection === 'summary'}
          onClick={() => setActiveSection('summary')}
        />
        {cv.settings.sectionOrder.filter((key) => key !== 'summary').map((key, index, visibleOrder) => {
          const meta = SECTIONS.find((s) => s.key === key)!;
          const hidden = cv.settings.hiddenSections.includes(key);
          const pageBreak = cv.settings.manualPageBreaks.includes(key);
          return (
            <SidebarItem
              key={key}
              label={ui(lang, meta.key as UiStringKey)}
              icon={meta.icon}
              status={hidden ? 'hidden' : sectionFilled(cv, key)}
              active={activeSection === key}
              onClick={() => setActiveSection(key)}
              actions={
                <>
                  {pageBreak && (
                    <FontAwesomeIcon icon={faGripLinesVertical} className="text-accent" title="Manual page break before this section" aria-label="Manual page break before this section" />
                  )}
                  <IconMiniButton
                    icon={faArrowUp}
                    label={ui(lang, "moveUp")}
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(key, -1);
                    }}
                  />
                  <IconMiniButton
                    icon={faArrowDown}
                    label={ui(lang, "moveDown")}
                    disabled={index === visibleOrder.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(key, 1);
                    }}
                  />
                  <IconMiniButton
                    icon={hidden ? faEyeSlash : faEye}
                    label={hidden ? ui(lang, "showSection") : ui(lang, "hideSection")}
                    active={hidden}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionHidden(key);
                    }}
                  />
                  <IconMiniButton
                    icon={pageBreak ? faGripLinesVertical : faPlus}
                    label={pageBreak ? ui(lang, "removePageBreak") : ui(lang, "pageBreakBefore")}
                    active={pageBreak}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePageBreak(key);
                    }}
                  />
                </>
              }
            />
          );
        })}
      </div>

      <div className="border-t border-line p-3 text-xs text-ink-2">
        <p className="flex items-start gap-1.5">
          <FontAwesomeIcon icon={faCircleHalfStroke} className="mt-0.5" aria-hidden />
          {ui(lang, 'changesHint')}
        </p>
      </div>
    </nav>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-medium transition-colors ${
        active ? 'border-b-2 border-accent text-accent' : 'text-ink-2 hover:text-ink'
      }`}
    >
      <FontAwesomeIcon icon={icon} aria-hidden />
      {label}
    </button>
  );
}

function SidebarItem({
  label,
  icon,
  status,
  active,
  onClick,
  actions,
}: {
  label: string;
  icon: string;
  status: 'empty' | 'progress' | 'complete' | 'hidden';
  active: boolean;
  onClick: () => void;
  actions?: React.ReactNode;
}) {
  const lang = useCvStore((s) => s.cv.settings.language);
  const statusIcon =
    status === 'complete' ? (
      <FontAwesomeIcon icon={faCheck} className="text-accent" title={ui(lang, 'complete')} aria-label={ui(lang, 'complete')} />
    ) : status === 'progress' ? (
      <span className="h-2 w-2 rounded-full bg-warning" title={ui(lang, "inProgress")} aria-label={ui(lang, "inProgress")} />
    ) : status === 'hidden' ? (
      <FontAwesomeIcon icon={faEyeSlash} className="text-line" title={ui(lang, "hiddenStatus")} aria-label={ui(lang, "hiddenStatus")} />
    ) : (
      <span className="h-2 w-2 rounded-full border border-line" title={ui(lang, "emptyStatus")} aria-label={ui(lang, "emptyStatus")} />
    );

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-2 py-2 text-sm transition-colors ${
        active ? 'bg-accent-soft text-accent' : 'hover:bg-bg'
      }`}
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-current={active ? 'true' : undefined}>
        <FontAwesomeIcon icon={icon as never} className="w-4 flex-none text-center opacity-70" aria-hidden />
        <span className="flex-1 truncate">{label}</span>
        {/* fixed-width slot keeps every status icon on the same column */}
        <span className="flex w-5 flex-none items-center justify-center">{statusIcon}</span>
      </button>
      {/* reserved action slot: identical width on every row so alignment never shifts */}
      <div
        className={`flex w-[104px] flex-none items-center justify-end gap-0.5 transition-opacity ${
          active ? '' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {actions}
      </div>
    </div>
  );
}

function IconMiniButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded p-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
        active ? 'text-accent' : 'text-ink-2 hover:text-ink'
      }`}
    >
      <FontAwesomeIcon icon={icon} aria-hidden />
    </button>
  );
}
