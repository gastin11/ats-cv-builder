import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../stores/cvStore';

export default function Landing() {
  const setScreen = useCvStore((s) => s.setScreen);
  const setImportOpen = useCvStore((s) => s.setImportOpen);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <FontAwesomeIcon icon={faFileLines} className="text-accent" aria-hidden />
          <span className="font-semibold tracking-tight">ATS CV Builder</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight">
          Build an ATS-friendly CV without starting from a blank page.
        </h1>
        <p className="mt-4 max-w-2xl text-ink-2">
          Create, import, improve, preview, and export your CV in one workspace.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setScreen('editor')}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#173d2e]"
          >
            Create CV
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-2.5 font-medium transition-colors hover:bg-bg"
          >
            <FontAwesomeIcon icon={faFileImport} aria-hidden />
            Import CV
          </button>
        </div>

        <ul className="mt-12 grid max-w-3xl gap-3 text-ink-2 sm:grid-cols-2">
          <li className="flex gap-2"><Dot /> No account required for the application.</li>
          <li className="flex gap-2"><Dot /> No CV database. Your data stays in this session.</li>
          <li className="flex gap-2"><Dot /> Live A4 preview with multi-page support.</li>
          <li className="flex gap-2"><Dot /> AI writing assistance that never invents facts.</li>
          <li className="flex gap-2"><Dot /> Import existing PDF, DOCX, or scanned CV.</li>
          <li className="flex gap-2"><Dot /> Export to PDF and DOCX.</li>
        </ul>

        <p className="mt-10 max-w-3xl text-sm text-ink-2">
          Note: when OCR is needed for scanned files, the file is processed by a third-party OCR
          service. The application itself does not store your CV. No tool can guarantee results in
          every applicant tracking system; the built-in check gives formatting heuristics only.
        </p>
      </main>
    </div>
  );
}

function Dot() {
  return <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden />;
}
