import io

# ---------- CVPreview: dummy content + guard against pagination loop ----------
path = 'frontend/src/components/preview/CVPreview.tsx'
src = io.open(path, encoding='utf-8').read()

old = "import { cvDocumentSchema, type CVDocument } from '../../../../shared/cv-schema/cv.schema';"
if 'cvDocumentSchema' not in src:
    old = "import type { CVDocument } from '../../../../shared/cv-schema/cv.schema';"
assert old in src, 'schema import'
src = src.replace(old, "import { cvDocumentSchema, type CVDocument } from '../../../../shared/cv-schema/cv.schema';")

old = "function contactParts(cv: CVDocument): string[] {"
assert old in src, 'contactParts anchor'
src = src.replace(old, """/**
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

function contactParts(cv: CVDocument): string[] {""")

# use dummy source when the real CV is empty; drop the empty-state branch
old = """  const isEmpty =
    !cv.personal.fullName &&
    !cv.summary &&
    cv.education.length === 0 &&
    cv.experience.length === 0 &&
    cv.projects.length === 0 &&
    cv.organizations.length === 0 &&
    cv.skills.length === 0 &&
    cv.certifications.length === 0 &&
    cv.awards.length === 0;"""
assert old in src, 'isEmpty'
src = src.replace(old, """  // Dummy preview: shown whenever the real CV is empty, keeping the user's
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
  const source = isEmpty ? { ...DUMMY_CV, settings: cv.settings } : cv;""")

old = "  const blocks = useMemo(() => buildBlocks(cv), [cv]);"
assert old in src, 'blocks memo'
src = src.replace(old, "  const blocks = useMemo(() => buildBlocks(source), [source]);")

# pagination loop guard against identical-state rerender loops
old = """    if (currentPage.length > 0) result.push(currentPage);
    setPages(result.length > 0 ? result : [[]]);
  }, [blocks, contentH, blockGap, preset]);"""
assert old in src, 'setPages'
src = src.replace(old, """    if (currentPage.length > 0) result.push(currentPage);
    const next = result.length > 0 ? result : [[]];
    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [blocks, contentH, blockGap, preset]);""")

# remove the empty-state UI branch (dummy always renders now)
old = """        {isEmpty ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-24 text-center">
            <p className="text-lg font-medium text-ink-2">{ui(lang, 'emptyStatus')}</p>
            <p className="text-sm text-ink-2">{ui(lang, 'aiEmptyHint')}</p>
          </div>
        ) : (
          <div className="mx-auto" style={{ width: PAGE_W * zoom + 4, maxWidth: 'none' }}>"""
assert old in src, 'empty-state branch'
src = src.replace(old, """        {
          <div className="mx-auto" style={{ width: PAGE_W * zoom + 4, maxWidth: 'none' }}>""")

old = """      {/* Measurement pass: identical styles and width, rendered off-screen */}
      {!isEmpty && (
        <div className="cv-measure" aria-hidden>"""
assert old in src, 'measure guard'
src = src.replace(old, """      {/* Measurement pass: identical styles and width, rendered off-screen */}
      {
        <div className="cv-measure" aria-hidden>""")

io.open(path, 'w', encoding='utf-8', newline='').write(src)
print('CVPreview dummy patched')

# ---------- TopBar: language switch translates content ----------
path = 'src/components/TopBar.tsx'
src = io.open(path, encoding='utf-8').read()

old = "import { useCvStore } from '../stores/cvStore';"
assert old in src
src = src.replace(old, "import { useCvStore } from '../stores/cvStore';\nimport { api } from '../lib/api';")

old = "  const [languageOpen, setLanguageOpen] = useState(false);"
assert old in src
src = src.replace(old, "  const [languageOpen, setLanguageOpen] = useState(false);\n  const [languageBusy, setLanguageBusy] = useState(false);")

old = """  function handleNew() {"""
assert old in src
src = src.replace(old, """  // Switching language also translates the CV content via the backend, so the
  // whole document follows. Falls back to headings-only if translation fails.
  async function changeLanguage(next: 'en' | 'id') {
    setLanguageOpen(false);
    if (next === lang || languageBusy) return;
    setSettings({ language: next });
    const { cv, loadCv } = useCvStore.getState();
    const hasContent =
      Boolean(cv.summary.trim()) ||
      cv.experience.length > 0 ||
      cv.education.length > 0 ||
      cv.projects.length > 0 ||
      cv.organizations.length > 0 ||
      cv.awards.length > 0;
    if (!hasContent) return;
    setLanguageBusy(true);
    try {
      const res = await api.translateCv(cv, next);
      if (res.cv) loadCv(res.cv);
    } catch {
      // keep the original content; headings and UI already switched
    } finally {
      setLanguageBusy(false);
    }
  }

  function handleNew() {""")

old = """            <FontAwesomeIcon icon={faLanguage} aria-hidden />
            <span className="hidden sm:inline">{lang === 'id' ? 'Indonesia' : 'English'}</span>"""
assert old in src
src = src.replace(old, """            <FontAwesomeIcon icon={faLanguage} spin={languageBusy} aria-hidden />
            <span className="hidden sm:inline">{lang === 'id' ? 'Indonesia' : 'English'}</span>""")

old = """                onClick={() => {
                  setLanguageOpen(false);
                  setSettings({ language: 'en' });
                }}"""
assert old in src
src = src.replace(old, """                onClick={() => void changeLanguage('en')}""")
old = """                onClick={() => {
                  setLanguageOpen(false);
                  setSettings({ language: 'id' });
                }}"""
assert old in src
src = src.replace(old, """                onClick={() => void changeLanguage('id')}""")

io.open(path, 'w', encoding='utf-8', newline='').write(src)
print('TopBar language translate patched')

# ---------- i18n: short session warning ----------
path = 'shared/cv-schema/i18n.ts'
src = io.open(path, encoding='utf-8').read()
old = "    sessionWarning: 'Your CV is kept only in this session. Download your CV before leaving or refreshing the page.',"
assert old in src
src = src.replace(old, "    sessionWarning: 'Session only - download your CV before leaving.',")
old = "    sessionWarning: 'CV Anda hanya tersimpan di sesi ini. Unduh CV sebelum meninggalkan atau memuat ulang halaman.',"
assert old in src
src = src.replace(old, "    sessionWarning: 'Hanya tersimpan di sesi ini - unduh CV sebelum keluar.',")
io.open(path, 'w', encoding='utf-8', newline='').write(src)
print('i18n warning shortened')
