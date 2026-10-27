import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines,
  faFileImport,
  faDownload,
  faFilePdf,
  faFileWord,
  faChevronDown,
  faRotateLeft,
  faRotateRight,
  faSliders,
  faTrash,
  faLanguage,
  faCheck,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../stores/cvStore';
import { Button } from './common';
import { ui } from '../../../shared/cv-schema/i18n';

export default function TopBar() {
  const cv = useCvStore((s) => s.cv);
  const undo = useCvStore((s) => s.undo);
  const redo = useCvStore((s) => s.redo);
  const canUndo = useCvStore((s) => s.past.length > 0);
  const canRedo = useCvStore((s) => s.future.length > 0);
  const setScreen = useCvStore((s) => s.setScreen);
  const resetCv = useCvStore((s) => s.resetCv);
  const setShowSettings = useCvStore((s) => s.setShowSettings);
  const showSettings = useCvStore((s) => s.showSettings);
  const setImportOpen = useCvStore((s) => s.setImportOpen);
  const runExport = useCvStore((s) => s.runExport);
  const exporting = useCvStore((s) => s.exporting);
  const exportError = useCvStore((s) => s.exportError);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadName, setDownloadName] = useState('cv');
  const [newCvOpen, setNewCvOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageBusy = useCvStore((s) => s.languageBusy);
  const changeLanguage = useCvStore((s) => s.changeLanguage);
  const downloadRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const lang = useCvStore((s) => s.cv.settings.language);
  const setSettings = useCvStore((s) => s.setSettings);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Close dropdown menus on outside click or Escape.
  useEffect(() => {
    if (!downloadOpen && !languageOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!downloadRef.current?.contains(event.target as Node)) setDownloadOpen(false);
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDownloadOpen(false);
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [downloadOpen, languageOpen]);

  function handleNew() {
    setNewCvOpen(true);
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 font-semibold tracking-tight hover:bg-bg"
          title="Back to start page"
        >
          <FontAwesomeIcon icon={faFileLines} className="text-accent" aria-hidden />
          ATS CV Builder
        </button>

        <div className="mx-1 h-5 w-px bg-line" aria-hidden />

        <TopButton icon={faTrash} label={ui(lang, "new")} onClick={handleNew} />
        <TopButton icon={faFileImport} label={ui(lang, "import")} onClick={() => setImportOpen(true)} />

        <div className="relative" ref={downloadRef}>
          <button
            onClick={() => setDownloadOpen(!downloadOpen)}
            disabled={exporting !== null}
            aria-haspopup="menu"
            aria-expanded={downloadOpen}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              downloadOpen ? 'bg-accent-soft text-accent' : 'hover:bg-bg'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <FontAwesomeIcon icon={faDownload} spin={exporting !== null} aria-hidden />
            <span className="hidden sm:inline">{exporting !== null ? ui(lang, "exporting") : ui(lang, "download")}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-xs opacity-60" aria-hidden />
          </button>
          {downloadOpen && (
            <div
              role="menu"
              aria-label={ui(lang, "download")}
              className="absolute left-0 top-full z-40 mt-1 w-56 rounded-md border border-line bg-surface py-1 shadow-lg"
            >
              <div className="border-b border-line px-3 pb-2 pt-1.5">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-2">{ui(lang, 'downloadName')}</span>
                  <input
                    type="text"
                    value={downloadName}
                    onChange={(e) => setDownloadName(e.target.value)}
                    placeholder="cv"
                    className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm focus:border-accent"
                  />
                  <span className="mt-1 block text-xs text-ink-2">{ui(lang, 'downloadNameHint')}</span>
                </label>
              </div>
              <MenuItem
                icon={faFilePdf}
                title="PDF"
                description={ui(lang, 'pdfDesc')}
                onClick={() => {
                  setDownloadOpen(false);
                  void runExport('pdf', downloadName);
                }}
              />
              <MenuItem
                icon={faFileWord}
                title="DOCX"
                description={ui(lang, 'docxDesc')}
                onClick={() => {
                  setDownloadOpen(false);
                  void runExport('docx', downloadName);
                }}
              />
            </div>
          )}
        </div>

        {/* Language switcher: always visible so users can find it easily */}
        <div className="relative" ref={languageRef}>
          <button
            onClick={() => setLanguageOpen(!languageOpen)}
            disabled={languageBusy}
            aria-haspopup="menu"
            aria-expanded={languageOpen}
            aria-label={ui(lang, 'language')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              languageOpen ? 'bg-accent-soft text-accent' : 'hover:bg-bg'
            }`}
          >
            <FontAwesomeIcon icon={languageBusy ? faSpinner : faLanguage} spin={languageBusy} aria-hidden />
            <span className="hidden sm:inline">{lang === 'id' ? 'Indonesia' : 'English'}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-xs opacity-60" aria-hidden />
          </button>
          {languageOpen && (
            <div role="menu" aria-label={ui(lang, 'language')} className="absolute left-0 top-full z-40 mt-1 w-52 rounded-md border border-line bg-surface py-1 shadow-lg">
              <MenuItem
                icon={faLanguage}
                title="English"
                description=""
                selected={lang === 'en'}
                onClick={() => {
                  setLanguageOpen(false);
                  void changeLanguage("en");
                }}
              />
              <MenuItem
                icon={faLanguage}
                title="Bahasa Indonesia"
                description=""
                selected={lang === 'id'}
                onClick={() => {
                  setLanguageOpen(false);
                  void changeLanguage("id");
                }}
              />
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-line" aria-hidden />

        <TopButton icon={faRotateLeft} label={ui(lang, 'undo')} onClick={undo} disabled={!canUndo} />
        <TopButton icon={faRotateRight} label={ui(lang, 'redo')} onClick={redo} disabled={!canRedo} />

        <div className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />

        <TopButton
          icon={faSliders}
          label={ui(lang, 'layout')}
          onClick={() => setShowSettings(!showSettings)}
          active={showSettings}
        />

        <div className="ml-auto flex items-center gap-2">
          {exportError && (
            <span className="max-w-xs truncate text-sm text-danger" role="alert" title={exportError}>
              {exportError}
            </span>
          )}
          {(showSessionWarning || (!dismissedWarning && cv.personal.fullName)) && (
            <span className="hidden items-center gap-2 rounded-md bg-warning/10 px-3 py-1.5 text-sm text-warning md:flex">
              {ui(lang, 'sessionWarning')}
              <button
                className="font-medium underline underline-offset-2"
                onClick={() => {
                  setShowSessionWarning(false);
                  setDismissedWarning(true);
                }}
              >
                {ui(lang, 'dismiss')}
              </button>
            </span>
          )}
        </div>
      </div>

      {showSettings && <SettingsBar />}

      {newCvOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={ui(lang, 'newCvTitle')}
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewCvOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-surface p-5 shadow-xl">
            <h2 className="font-semibold">{ui(lang, 'newCvTitle')}</h2>
            <p className="mt-2 text-sm text-ink-2">{ui(lang, 'newCvBody')}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setNewCvOpen(false)}>{ui(lang, 'cancel')}</Button>
              <Button variant="primary" onClick={() => { setNewCvOpen(false); resetCv(); }}>
                {ui(lang, 'new')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({
  icon,
  title,
  description,
  onClick,
  selected,
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  title: string;
  description: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      role="menuitem"
      aria-checked={selected}
      onClick={onClick}
      className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-bg"
    >
      <FontAwesomeIcon icon={icon} className="mt-0.5 text-accent" aria-hidden />
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-ink-2">{description}</span>
      </span>
      {selected !== undefined &&
        (selected ? (
          <FontAwesomeIcon icon={faCheck} className="mt-0.5 text-accent" aria-hidden />
        ) : (
          <span className="mt-0.5 w-3.5 flex-none" aria-hidden />
        ))}
    </button>
  );
}

function TopButton({
  icon,
  label,
  onClick,
  disabled,
  busy,
  active,
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-accent-soft text-accent' : 'hover:bg-bg'
      } disabled:cursor-not-allowed disabled:opacity-40`}
      aria-label={label}
    >
      <FontAwesomeIcon icon={icon} spin={busy} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const TEMPLATE_INFO: Array<{ id: string; label: string }> = [
  { id: 'classic', label: 'Classic' },
  { id: 'compact', label: 'Compact' },
  { id: 'academic', label: 'Academic / Graduate' },
  { id: 'professional', label: 'Professional' },
];

const FONT_INFO: Array<{ id: string; label: string }> = [
  { id: 'arial', label: 'Arial' },
  { id: 'calibri', label: 'Calibri' },
  { id: 'georgia', label: 'Georgia' },
  { id: 'times', label: 'Times New Roman' },
];

function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => {
        const parsed = Number(e.target.value);
        if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
      }}
      className="w-14 rounded-md border border-line bg-surface px-1.5 py-1 text-right text-sm tabular-nums focus:border-accent"
      aria-label="Nilai angka"
    />
  );
}

function SettingsBar() {
  const cv = useCvStore((s) => s.cv);
  const setSettings = useCvStore((s) => s.setSettings);

  return (
    <div className="grid gap-x-6 gap-y-3 border-t border-line bg-bg px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-2">Template</span>
        <select
          className="w-full flex-1 rounded-md border border-line bg-surface px-2 py-1"
          value={cv.settings.template}
          onChange={(e) => setSettings({ template: e.target.value as typeof cv.settings.template })}
        >
          {TEMPLATE_INFO.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-2">Font</span>
        <select
          className="w-full flex-1 rounded-md border border-line bg-surface px-2 py-1"
          value={cv.settings.font}
          onChange={(e) => setSettings({ font: e.target.value as typeof cv.settings.font })}
        >
          {FONT_INFO.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-2">Size</span>
        <input
          type="range"
          min={9}
          max={12}
          step={0.5}
          value={cv.settings.fontSizePt}
          onChange={(e) => setSettings({ fontSizePt: Number(e.target.value) })}
          className="flex-1 accent-accent"
        />
        <NumberInput
          value={cv.settings.fontSizePt}
          min={9}
          max={12}
          step={0.5}
          onChange={(v) => setSettings({ fontSizePt: v })}
        />
        <span className="w-6 tabular-nums text-ink-2">pt</span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-2">Margin</span>
        <input
          type="range"
          min={12}
          max={30}
          step={1}
          value={cv.settings.marginMm}
          onChange={(e) => setSettings({ marginMm: Number(e.target.value) })}
          className="flex-1 accent-accent"
        />
        <NumberInput
          value={cv.settings.marginMm}
          min={12}
          max={30}
          step={1}
          onChange={(v) => setSettings({ marginMm: v })}
        />
        <span className="w-6 tabular-nums text-ink-2">mm</span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-2">Spacing</span>
        <input
          type="range"
          min={1.1}
          max={1.6}
          step={0.05}
          value={cv.settings.lineHeight}
          onChange={(e) => setSettings({ lineHeight: Number(e.target.value) })}
          className="flex-1 accent-accent"
        />
        <NumberInput
          value={cv.settings.lineHeight}
          min={1.1}
          max={1.6}
          step={0.05}
          onChange={(v) => setSettings({ lineHeight: v })}
        />
      </label>
    </div>
  );
}
