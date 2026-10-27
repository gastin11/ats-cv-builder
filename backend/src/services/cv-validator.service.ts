import type { CVDocument } from '../../../shared/cv-schema/cv.schema.js';
import { isEndDateBeforeStart } from '../utils/misc.js';

export interface ValidationCheck {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ValidationResult {
  score: null; // deliberately not a numeric "ATS score" — heuristics only
  checks: ValidationCheck[];
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Bilingual heuristic check messages (en/id). */
const M = {
  nameOk: ['Name is present.', 'Nama tersedia.'],
  nameMissing: ['Name is missing. Add your full name to the header.', 'Nama belum ada. Tambahkan nama lengkap Anda di kepala CV.'],
  contactOk: ['Contact information (phone and email) is present.', 'Informasi kontak (telepon dan email) tersedia.'],
  contactPartial: ['Only one contact channel was found. Adding both phone and email is recommended.', 'Hanya satu kanal kontak ditemukan. Disarankan menambahkan telepon dan email sekaligus.'],
  contactMissing: ['Contact information is missing.', 'Informasi kontak tidak ada.'],
  entriesOk: ['At least one experience, education, project or organization entry is present.', 'Minimal ada satu entri pengalaman, pendidikan, proyek, atau organisasi.'],
  entriesMissing: ['No experience, education, project or organization entries found.', 'Belum ada entri pengalaman, pendidikan, proyek, atau organisasi.'],
  emptySections: (s: string) => [
    `Empty sections detected: ${s}. Fill or hide them.`,
    `Bagian masih kosong: ${s}. Isi atau sembunyikan.`,
  ],
  noEmpty: ['No empty visible sections.', 'Tidak ada bagian yang kosong.'],
  summaryLong: ['Summary is longer than recommended (aim for 2-4 sentences / under ~600 characters).', 'Ringkasan terlalu panjang (idealnya 2-4 kalimat / di bawah ~600 karakter).'],
  emptyBullets: (n: number) => [`${n} empty bullet point(s) found. Remove or fill them.`, `${n} poin kosong ditemukan. Hapus atau isi.`, ],
  bulletsNoImpact: ['Most bullets do not contain a measurable result. Add metrics only if you actually have them (users served, time saved, volume, % improvement).', 'Sebagian besar poin tidak memuat hasil terukur. Tambahkan angka hanya jika Anda memang memilikinya (pengguna terlayani, waktu dihemat, volume, % peningkatan).'],
  duplicates: (n: number) => [`${n} duplicated bullet(s) detected.`, `${n} poin duplikat terdeteksi.`],
  datesOk: ['Dates look consistent.', 'Tanggal terlihat konsisten.'],
  dateIssues: (n: number) => [`${n} date issue(s) found (end date before start date, or "Present" combined with an end date).`, `${n} masalah tanggal ditemukan (tanggal selesai sebelum tanggal mulai, atau "Saat ini" bersamaan dengan tanggal selesai).`],
  undated: (n: number) => [`${n} entry/entries are missing a start date.`, `${n} entri tidak memiliki tanggal mulai.`],
  textOk: ['Content is text-based (no text embedded in images).', 'Konten berupa teks (tidak ada teks di dalam gambar).'],
  singleColumn: ['Template uses a single-column layout, which parses reliably.', 'Template memakai tata letak satu kolom yang mudah dibaca ATS.'],
  specialChars: ['Unusual special characters detected; they may confuse some ATS parsers.', 'Karakter khusus tidak biasa terdeteksi; dapat membingungkan beberapa parser ATS.'],
  fontSmall: ['Font size is very small; 10-12 pt is recommended.', 'Ukuran font terlalu kecil; disarankan 10-12 pt.'],
  fontOk: ['Font size is readable.', 'Ukuran font mudah dibaca.'],
  ratingBars: ['Avoid skill rating levels/bars - ATS cannot read them.', 'Hindari rating/bar keahlian - ATS tidak bisa membacanya.'],
} as const;

/** Pick the message for the language; parameterized entries are functions. */
/* eslint-disable @typescript-eslint/no-explicit-any */
function t(
  entry: readonly string[] | ((...args: any[]) => readonly string[]),
  ...args: any[]
): string {
  const resolved = typeof entry === 'function' ? entry(...args) : entry;
  const template = Array.isArray(resolved) ? resolved[language === 'id' ? 1 : 0] : resolved;
  return template as string;
}

let language = 'en';

/** Local heuristic checks before export. Not an ATS guarantee or official score. */
export function validateCv(cv: CVDocument): ValidationResult {
  language = cv.settings.language;
  const checks: ValidationCheck[] = [];

  // ---------- Content ----------
  if (cv.personal.fullName.trim()) {
    checks.push({ id: 'name', status: 'pass', message: t(M.nameOk) });
  } else {
    checks.push({ id: 'name', status: 'fail', message: t(M.nameMissing) });
  }

  const hasPhone = PHONE_RE.test(cv.personal.phone);
  const hasEmail = EMAIL_RE.test(cv.personal.email);
  if (hasPhone && hasEmail) {
    checks.push({ id: 'contact', status: 'pass', message: t(M.contactOk) });
  } else if (hasPhone || hasEmail) {
    checks.push({ id: 'contact', status: 'warn', message: t(M.contactPartial) });
  } else {
    checks.push({ id: 'contact', status: 'fail', message: t(M.contactMissing) });
  }

  const entryCount = cv.experience.length + cv.projects.length + cv.education.length + cv.organizations.length;
  if (entryCount > 0) {
    checks.push({ id: 'entries', status: 'pass', message: t(M.entriesOk) });
  } else {
    checks.push({ id: 'entries', status: 'fail', message: t(M.entriesMissing) });
  }

  const emptySections: string[] = [];
  if (cv.summary.trim().length === 0 && !cv.settings.hiddenSections.includes('summary')) emptySections.push('summary');
  if (cv.education.length === 0 && !cv.settings.hiddenSections.includes('education')) emptySections.push('education');
  if (cv.experience.length === 0 && cv.projects.length === 0 && !cv.settings.hiddenSections.includes('experience') && !cv.settings.hiddenSections.includes('projects')) {
    emptySections.push('experience/projects');
  }
  if (cv.skills.length === 0 && !cv.settings.hiddenSections.includes('skills')) emptySections.push('skills');
  if (emptySections.length > 0) {
    checks.push({ id: 'empty-sections', status: 'warn', message: t(M.emptySections, emptySections.join(', ')) });
  } else {
    checks.push({ id: 'empty-sections', status: 'pass', message: t(M.noEmpty) });
  }

  if (cv.summary.trim().length > 0 && cv.summary.trim().length > 600) {
    checks.push({ id: 'summary-length', status: 'warn', message: t(M.summaryLong) });
  }

  // ---------- Structure ----------
  const bullets: string[] = [
    ...cv.experience.flatMap((e) => e.bullets),
    ...cv.projects.flatMap((p) => p.bullets),
    ...cv.organizations.flatMap((o) => o.bullets),
  ];

  const bareBullets = bullets.filter((b) => b.trim().length === 0);
  if (bareBullets.length > 0) {
    checks.push({ id: 'bullet-consistency', status: 'warn', message: t(M.emptyBullets, bareBullets.length) });
  }

  const withoutImpact = bullets.filter((b) => !/\d/.test(b));
  if (bullets.length > 0 && withoutImpact.length > bullets.length / 2) {
    checks.push({ id: 'measurable-impact', status: 'warn', message: t(M.bulletsNoImpact) });
  }

  const duplicateKeys = new Map<string, number>();
  for (const b of bullets) {
    const key = normalize(b);
    if (key) duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  }
  const duplicates = [...duplicateKeys.values()].filter((n) => n > 1).length;
  if (duplicates > 0) {
    checks.push({ id: 'duplicate-content', status: 'warn', message: t(M.duplicates, duplicates) });
  }

  // Date consistency
  let dateProblems = 0;
  const datedEntries: Array<{ start: string; end: string; isCurrent: boolean }> = [
    ...cv.experience.map((e) => ({ start: e.startDate, end: e.endDate, isCurrent: e.isCurrent })),
    ...cv.education.map((e) => ({ start: e.startDate, end: e.endDate, isCurrent: e.isCurrent })),
    ...cv.projects.map((p) => ({ start: p.startDate, end: p.endDate, isCurrent: p.isCurrent })),
    ...cv.organizations.map((o) => ({ start: o.startDate, end: o.endDate, isCurrent: o.isCurrent })),
  ];
  for (const d of datedEntries) {
    if (d.start && d.end && isEndDateBeforeStart(d.start, d.end)) dateProblems++;
    if (d.isCurrent && d.end) dateProblems++;
  }
  const undated = datedEntries.filter((d) => !d.start).length;
  if (dateProblems === 0) {
    checks.push({ id: 'date-consistency', status: 'pass', message: t(M.datesOk) });
  } else {
    checks.push({ id: 'date-consistency', status: 'warn', message: t(M.dateIssues, dateProblems) });
  }
  if (undated > 0) {
    checks.push({ id: 'date-coverage', status: 'warn', message: t(M.undated, undated) });
  }

  // ---------- ATS compatibility ----------
  checks.push({ id: 'text-content', status: 'pass', message: t(M.textOk) });
  checks.push({ id: 'single-column', status: 'pass', message: t(M.singleColumn) });

  const allowedNonAscii = new Set(['•', '–', '—', '’', '‘', '“', '”', '…']);
  const specialChars = ([...bullets, cv.summary].join('').match(/\P{ASCII}/gu) ?? []).filter(
    (c) => !allowedNonAscii.has(c),
  );
  if (specialChars.length > 20) {
    checks.push({ id: 'special-characters', status: 'warn', message: t(M.specialChars) });
  }

  if (cv.settings.fontSizePt < 9.5) {
    checks.push({ id: 'font-size', status: 'warn', message: t(M.fontSmall) });
  } else {
    checks.push({ id: 'font-size', status: 'pass', message: t(M.fontOk) });
  }

  if (cv.skills.some((g) => /rating|level|bar/i.test(g.label))) {
    checks.push({ id: 'decorative-elements', status: 'warn', message: t(M.ratingBars) });
  }

  return { score: null, checks };
}
