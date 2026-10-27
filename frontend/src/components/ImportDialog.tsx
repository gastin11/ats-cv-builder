import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faCheck, faTriangleExclamation, faXmark, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../stores/cvStore';
import { api, type ImportResponse } from '../lib/api';
import { ui } from '../../../shared/cv-schema/i18n';

type Step = 'choose' | 'working' | 'review' | 'ocr-confirm' | 'done';

const SECTION_LABELS: Record<string, string> = {
  personal: 'Personal Information',
  summary: 'Professional Summary',
  education: 'Education',
  experience: 'Work Experience',
  projects: 'Projects',
  organizations: 'Organizations',
  skills: 'Skills',
  certifications: 'Certifications',
  awards: 'Awards',
  additional: 'Additional sections',
};

export default function ImportDialog() {
  const lang = useCvStore((s) => s.cv.settings.language);
  const open = useCvStore((s) => s.importOpen);
  const setOpen = useCvStore((s) => s.setImportOpen);
  const loadCv = useCvStore((s) => s.loadCv);
  const cv = useCvStore((s) => s.cv);

  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('choose');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [translateTarget, setTranslateTarget] = useState<'none' | 'en' | 'id'>('none');
  const [dragActive, setDragActive] = useState(false);
  const [translating, setTranslating] = useState(false);

  async function applyResult() {
    if (!result?.cv) return;
    setError(null);
    const finish = (cv: unknown) => {
      loadCv(cv);
      // Reset the dialog so reopening it starts fresh at the upload step
      // instead of showing the previous file's data.
      resetDialogState();
    };
    if (translateTarget === 'none') {
      finish(result.cv);
      return;
    }
    setTranslating(true);
    try {
      const translated = await api.translateCv(result.cv, translateTarget);
      if (translated.cv) finish(translated.cv);
      else setError('Translation failed, but you can still apply the original content.');
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} You can still apply the original content.`
          : 'Translation failed, but you can still apply the original content.',
      );
    } finally {
      setTranslating(false);
    }
  }

  if (!open) return null;

  function resetDialogState() {
    setStep('choose');
    setFile(null);
    setResult(null);
    setError(null);
    setPendingFile(null);
    setTranslateTarget('none');
    setDragActive(false);
  }

  function close() {
    setOpen(false);
    resetDialogState();
  }

  function pickFile(selected: File | null) {
    if (!selected) return;
    setError(null);
    const name = selected.name.toLowerCase();
    const isDocx = name.endsWith('.docx');
    const isPdf = name.endsWith('.pdf');
    const isImage = /\.(png|jpe?g)$/.test(name);
    if (!isDocx && !isPdf && !isImage) {
      setError(ui(lang, 'unsupported'));
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError(ui(lang, 'tooLarge'));
      return;
    }
    setFile(selected);
    setStep('working');
    void startImport(selected, false);
  }

  async function startImport(selected: File, allowOcr: boolean) {
    setError(null);
    try {
      const name = selected.name.toLowerCase();
      const response = name.endsWith('.docx')
        ? await api.importDocx(selected)
        : name.endsWith('.pdf')
          ? await api.importPdf(selected)
          : await api.runOcr(selected);

      if (response.error) {
        setError(response.error);
        setStep('choose');
        return;
      }
      if (response.requiresOcr && !allowOcr) {
        setResult(response);
        setStep('ocr-confirm');
        return;
      }
      setResult(response);
      setStep('review');
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Your current CV is untouched.`
          : 'We could not read this file. Your current CV is untouched.',
      );
      setStep('choose');
    }
  }

  async function confirmOcr() {
    if (!file) return;
    setStep('working');
    await startImport(file, true);
  }

  const hasContent =
    cv.personal.fullName || cv.summary || cv.experience.length > 0 || cv.education.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import CV"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faFileImport} className="text-accent" aria-hidden />
            {ui(lang, 'importTitle')}
          </h2>
          <button onClick={close} aria-label="Close import dialog" className="rounded p-1.5 text-ink-2 hover:bg-bg">
            <FontAwesomeIcon icon={faXmark} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-4">
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-2">{ui(lang, 'importHint')}</p>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) pickFile(file);
                }}
                className={`w-full cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragActive ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-accent hover:bg-accent-soft/30'
                }`}
              >
                <FontAwesomeIcon icon={faFileImport} className="mb-2 text-xl text-ink-2" aria-hidden />
                <p className="font-medium">{ui(lang, 'chooseFile')}</p>
                <p className="text-sm text-ink-2">{ui(lang, 'dragDrop')}</p>
                <p className="text-sm text-ink-2">{ui(lang, 'formatsHint')}</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".docx,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              {error && <ErrorNote message={error} />}
            </div>
          )}

          {step === 'working' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-accent" aria-hidden />
              <p className="text-sm text-ink-2">{ui(lang, 'extracting')}</p>
            </div>
          )}

          {step === 'ocr-confirm' && result?.requiresOcr && (
            <div className="space-y-4">
              <p className="text-sm">
                {result.pageCount ?? 1} - {ui(lang, 'ocrNoText')}
              </p>
              <div className="rounded-md bg-warning/10 p-3 text-sm">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-warning">
                  <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden />
                  {ui(lang, 'beforeOcr')}
                </p>
                <p className="text-ink-2">{ui(lang, 'ocrWarnBody')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmOcr}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#173d2e]"
                >
                  {ui(lang, 'runOcr')} <FontAwesomeIcon icon={faArrowRight} aria-hidden />
                </button>
                <button onClick={close} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-bg">
                  {ui(lang, 'cancel')}
                </button>
              </div>
            </div>
          )}

          {step === 'review' && result && (
            <div className="space-y-4">
              <p className="text-sm text-ink-2">
                Extracted from <span className="font-medium text-ink">{file?.name}</span>. Check each
                section before applying; marked sections may need corrections.
              </p>
              {result.aiRefined && (
                <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
                  {ui(lang, 'aiRefinedNote')}
                </p>
              )}
              <ul className="space-y-1.5">
                {(result.reviews ?? []).map((review) => (
                  <li key={review.section} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm">
                    <span>{SECTION_LABELS[review.section] ?? review.section}</span>
                    <span className="flex items-center gap-1.5">
                      {review.status === 'complete' && (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="text-accent" aria-hidden />
                          <span className="text-accent">{ui(lang, 'found')}</span>
                        </>
                      )}
                      {review.status === 'review' && (
                        <>
                          <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" aria-hidden />
                          <span className="text-warning">{ui(lang, 'review')}</span>
                        </>
                      )}
                      {review.status === 'empty' && <span className="text-ink-2">{ui(lang, 'notFound')}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {reviewReasons(result.reviews ?? []).length > 0 && (
                <ul className="list-disc rounded-md bg-warning/10 px-6 py-3 text-sm text-warning">
                  {reviewReasons(result.reviews ?? []).map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-2">{ui(lang, 'contentLanguage')}</span>
                <select
                  className="w-full rounded-md border border-line bg-surface px-2 py-2 text-sm"
                  value={translateTarget}
                  onChange={(e) => setTranslateTarget(e.target.value as typeof translateTarget)}
                >
                  <option value="none">{ui(lang, 'keepOriginal')}</option>
                  <option value="id">{ui(lang, 'translateToId')}</option>
                  <option value="en">{ui(lang, 'translateToEn')}</option>
                </select>
                <span className="mt-1 block text-xs text-ink-2">{ui(lang, 'translateHint')}</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void applyResult()}
                  disabled={translating}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#173d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faSpinner} spin={translating} aria-hidden />
                  {translating ? ui(lang, 'translating') : ui(lang, 'apply')}
                </button>
                <button onClick={close} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-bg">
                  {ui(lang, 'cancel')}
                </button>
                {hasContent && (
                  <span className="text-sm text-warning">{ui(lang, 'replacesWarning')}</span>
                )}
              </div>
              {error && <ErrorNote message={error} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function reviewReasons(reviews: NonNullable<ImportResponse['reviews']>): string[] {
  return reviews.filter((r) => r.reason && r.status === 'review').map((r) => r.reason!);
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
