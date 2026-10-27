import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faWandMagicSparkles, faFileExport, faEye } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from './stores/cvStore';
import Landing from './components/Landing';
import TopBar from './components/TopBar';
import EditorSidebar from './components/EditorSidebar';
import EditorPanel from './components/EditorPanel';
import AIPanel from './components/ai/AIPanel';
import CheckPanel from './components/CheckPanel';
import CVPreview from './components/preview/CVPreview';
import ImportDialog from './components/ImportDialog';

export default function App() {
  const screen = useCvStore((s) => s.screen);
  const leftTab = useCvStore((s) => s.leftTab);
  const mobileTab = useCvStore((s) => s.mobileTab);
  const setMobileTab = useCvStore((s) => s.setMobileTab);
  const setLeftTab = useCvStore((s) => s.setLeftTab);
  const runExport = useCvStore((s) => s.runExport);

  // Warn once if the user tries to leave with content in the editor.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  if (screen === 'landing') {
    return (
      <>
        <Landing />
        <ImportDialog />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        {/* Editor column: full width on mobile, fixed sidebar column on desktop */}
        <div
          className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} min-h-0 w-full min-w-0 flex-col lg:flex lg:w-[420px] lg:flex-none`}
        >
          <div className="max-h-[38%] min-h-0 flex-[0_0_auto] overflow-y-auto">
            <EditorSidebar />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-4">
            {leftTab === 'ai' ? <AIPanel /> : <SectionOrCheckPanel />}
          </div>
        </div>

        {/* Live preview: single instance, always visible on desktop,
            behind the Preview tab on mobile */}
        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 lg:flex`}>
          <CVPreview />
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <nav className="flex border-t border-line bg-surface lg:hidden" aria-label="Main">
        <MobileTabButton icon={faPenToSquare} label="Editor" active={mobileTab === 'editor'} onClick={() => setMobileTab('editor')} />
        <MobileTabButton icon={faWandMagicSparkles} label="AI" active={false} onClick={() => { setMobileTab('editor'); setLeftTab('ai'); }} />
        <MobileTabButton icon={faEye} label="Preview" active={mobileTab === 'preview'} onClick={() => setMobileTab('preview')} />
        <MobileTabButton icon={faFileExport} label="PDF" active={false} onClick={() => void runExport('pdf')} />
      </nav>

      <ImportDialog />
    </div>
  );
}

function SectionOrCheckPanel() {
  const leftTab = useCvStore((s) => s.leftTab);
  const activeSection = useCvStore((s) => s.activeSection);
  if (leftTab === 'check') return <CheckPanel />;
  if (leftTab === 'ai') return <AIPanel />;
  return <EditorPanel key={activeSection} />;
}

function MobileTabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
        active ? 'text-accent' : 'text-ink-2'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <FontAwesomeIcon icon={icon} aria-hidden />
      {label}
    </button>
  );
}
