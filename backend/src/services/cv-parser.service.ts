import {
  cvDocumentSchema,
  type CVDocument,
  type EducationEntry,
  type ExperienceEntry,
  type OrganizationEntry,
  type ProjectEntry,
} from '../../../shared/cv-schema/cv.schema.js';
import { isEndDateBeforeStart, newId, normalizeWhitespace } from '../utils/misc.js';
import { detectLanguage } from './translation.service.js';
import type { DocxBlock } from './docx-parser.service.js';

export interface SectionReviewStatus {
  section: string;
  status: 'empty' | 'complete' | 'review';
  reason?: string;
}

export interface CvParseResult {
  cv: CVDocument;
  reviews: SectionReviewStatus[];
  confidence: 'high' | 'medium' | 'low';
}

const SECTION_PATTERNS: Array<{ id: string; re: RegExp }> = [
  {
    id: 'personal',
    re: /^(informasi\s*pribadi|data\s*pribadi|data\s*diri|biodata|personal\s*information|personal\s*details|identitas\s*diri)\b/i,
  },
  {
    id: 'summary',
    re: /^(profil\s*singkat|profil\s*profesional|profil\s*pribadi|profil|ringkasan\s*profesional|ringkasan\s*pribadi|ringkasan\s*eksekutif|ringkasan|ikhtisar|deskripsi\s*diri|tentang\s*saya|professional\s+summary|executive\s+summary|summary|profile|about\s*me|overview)\b/i,
  },
  {
    id: 'education',
    re: /^(pendidikan|riwayat\s*pendidikan|pendidikan\s*formal|pendidikan\s*non[- ]?formal|pendidikan\s*terakhir|latar\s*belakang\s*pendidikan|education|academic\s*background|educational\s*background)\b/i,
  },
  {
    id: 'experience',
    re: /^(pengalaman\s*kerja|riwayat\s*pekerjaan|pengalaman\s*profesional|pengalaman\s*kerja\s*(?:&|\/|dan)\s*magang|pengalaman\s*magang|riwayat\s*kerja|pengalaman|work\s*experience|professional\s*experience|experience|employment\s*history|career\s*history)\b/i,
  },
  {
    id: 'projects',
    re: /^(proyek\s*portofolio|pengalaman\s*proyek|pengerjaan\s*proyek|proyek|projects?|portfolio\s*projects?)\b/i,
  },
  {
    id: 'organizations',
    re: /^(pengalaman\s*organisasi|aktivitas\s*organisasi|organisasi\s*(?:&|\/|dan)\s*kepemimpinan|organisasi|organi[zs]ational?|organization|organisations?|leadership|kepanitiaan)\b/i,
  },
  {
    id: 'skills',
    re: /^(keahlian\s*(?:&|\/|dan)\s*keterampilan|keterampilan\s*(?:&|\/|dan)\s*keahlian|kemampuan\s*teknis|keahlian\s*teknis|hard\s*skills?\s*(?:&|\/|dan)\s*soft\s*skills?|kompetensi|kemampuan|keterampilan|skills?|keahlian|technical\s*skills)\b/i,
  },
  {
    id: 'certifications',
    re: /^(sertifikasi\s*(?:&|\/|dan)\s*pelatihan|pelatihan\s*(?:&|\/|dan)\s*sertifikasi|sertifikasi|certifications?|pelatihan|kursus\s*(?:&|\/|dan)\s*pelatihan|kursus|licenses?|licenses\s*&\s*certifications)\b/i,
  },
  {
    id: 'awards',
    re: /^(penghargaan\s*(?:&|\/|dan)\s*prestasi|prestasi\s*(?:&|\/|dan)\s*penghargaan|penghargaan|awards?|achievements?|prestasi|pencapaian|honors?(?:\s*&\s*awards)?)\b/i,
  },
  {
    id: 'additional',
    re: /^(informasi\s*tambahan|informasi\s*lainnya|lain[- ]lain|additional\s*information|others?)\b/i,
  },
];

const BULLET_PREFIX = /^(?:[•●▪◦‣·∙○*–—-]\s+|\d+[.)]\s+)/;
const DATE_RANGE_RE =
  /([A-Za-z]{3,9}\.?\s*\d{4}|\d{4}|\d{1,2}[/\-]\d{4})\s*(?:-|–|—|s\/d|s\.d\.|sampai|hingga|to|until)\s*([A-Za-z]{3,9}\.?\s*\d{4}|\d{4}|\d{1,2}[/\-]\d{4}|present|sekarang|saat\s*ini|current|now)/i;
const SINGLE_DATE_RE = /\b([A-Za-z]{3,9}\.?\s*\d{4}|\d{4})\b/;

const DEGREE_HINT = /\b(S[12]\b|S3|D3|D4|SMA|SMK|SMKN?\s*\d|MA\s|Bachelor|Master|Sarjana|Magister|Universitas|University|Institut|Sekolah\s*Tinggi|Politeknik|Akademi|High\s*School|College)/i;
const ROLE_HINT = /\b(cto|ceo|cfo|coo|intern|internship|magang|analis|analyst|engineer|insinyur|manager|manajer|developer|pengembang|consultant|konsultan|officer|director|direktur|designer|desainer|specialist|spesialis|administrator|admin|staff|staf|lead|head|kepala|president|presiden|secretary|sekretaris|treasurer|bendahara|coordinator|koordinator|founder|pendiri|assistant|asisten|supervisor|researcher|peneliti|lecturer|dosen)\b/i;

function stripBullet(text: string): string {
  return text.replace(BULLET_PREFIX, '').trim();
}

function matchSectionHeading(text: string): string | null {
  const cleaned = normalizeWhitespace(text).replace(/[:：]\s*$/, '');
  if (cleaned.length > 60 || cleaned.split(/\s+/).length > 6) return null;
  for (const { id, re } of SECTION_PATTERNS) {
    if (re.test(cleaned)) return id;
  }
  return null;
}

function looksLikeHeading(text: string): boolean {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length > 60) return false;
  const letters = cleaned.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;
  return matchSectionHeading(cleaned) !== null;
}

interface Line {
  text: string;
  isBullet: boolean;
  isHeading: boolean;
  headingLevel: number;
}

// Worst-case guard: a single CV line/paragraph is never longer than this.
// Truncation keeps every downstream per-line regex (contact, date, heading)
// linear-time even on adversarial single-line megabyte inputs.
const MAX_LINE_LEN = 2000;

function truncateLine(text: string): string {
  return text.length > MAX_LINE_LEN ? text.slice(0, MAX_LINE_LEN) : text;
}

function linesFromBlocks(blocks: DocxBlock[]): Line[] {
  return blocks.map((b) => {
    const raw = truncateLine(b.text);
    const isBullet = b.type === 'list-item' || BULLET_PREFIX.test(raw);
    const text = isBullet ? stripBullet(raw) : raw;
    return {
      text,
      isBullet,
      isHeading: b.type === 'heading' || (!isBullet && looksLikeHeading(text)),
      headingLevel: b.level,
    };
  });
}

function linesFromText(raw: string): Line[] {
  return raw
    .split(/\r?\n/)
    .map((l) => truncateLine(l.trim()))
    .filter(Boolean)
    .map((line) => {
      const isBullet = BULLET_PREFIX.test(line);
      const text = isBullet ? stripBullet(line) : line;
      return { text, isBullet, isHeading: !isBullet && looksLikeHeading(text), headingLevel: 0 };
    });
}

function extractContact(line: string) {
  const out: Partial<{ email: string; phone: string; linkedin: string; github: string; portfolio: string; location: string }> = {};
  // Scan a bounded prefix only: contact data always sits in short header lines.
  // This also keeps the email/URL regexes linear-time on hostile inputs
  // (e.g. a megabyte-long line without '@' caused quadratic backtracking).
  const scannable = line.length > MAX_LINE_LEN ? line.slice(0, MAX_LINE_LEN) : line;

  const email = scannable.includes('@') ? scannable.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) : null;
  if (email) out.email = email[0];

  // Strip the email (and any text inside it) before matching URLs so that the
  // domain of an email address is never misread as a portfolio link.
  const lineForUrls = email ? scannable.replace(email[0], ' ') : scannable;

  const phone = /[+\d]/.test(scannable) ? scannable.match(/(?:\+?\d[\d\s().-]{7,}\d)/) : null;
  if (phone) out.phone = phone[0].trim();

  const linkedin = /linkedin\.com/i.test(lineForUrls)
    ? lineForUrls.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w\-/%.]+|linkedin\.com\/[\w\-/%.]+/i)
    : null;
  if (linkedin) out.linkedin = linkedin[0];

  const github = /github\.com/i.test(lineForUrls)
    ? lineForUrls.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-/%.]+/i)
    : null;
  if (github) out.github = github[0];

  const url = /https?:\/\/|www\./i.test(lineForUrls)
    ? lineForUrls.match(/(?:https?:\/\/)(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w\-/%.#?=&]*)?|(?:www\.)[\w-]+\.[a-z]{2,}(?:\/[\w\-/%.#?=&]*)?/i)
    : null;
  if (url) out.portfolio = url[0];

  const locMatch = scannable.match(/(?:alamat|domisili|lokasi|address|location|city)\s*[:：]\s*([^\n|]+)/i);
  if (locMatch) {
    out.location = locMatch[1].trim();
  } else {
    const cityMatch = lineForUrls.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);
    if (cityMatch && !/@|http|\.com|github|linkedin/i.test(cityMatch[0])) {
      out.location = cityMatch[1].trim();
    }
  }

  return out;
}

const NON_NAME_RE =
  /^(curriculum\s*vitae|resume|daftar\s*riwayat\s*hidup|biodata|data\s*diri|data\s*pribadi|informasi\s*pribadi|personal\s*information|personal\s*details|profile|profil|tentang\s*saya|about\s*me)\b/i;

function isProbablyName(line: string): boolean {
  const cleaned = line.trim();
  if (NON_NAME_RE.test(cleaned)) return false;
  const words = cleaned.split(/\s+/);
  if (words.length < 1 || words.length > 6) return false;
  if (/\d|@|http|\.com/i.test(cleaned)) return false;
  if (matchSectionHeading(cleaned)) return false;
  return true;
}

function splitDateRange(text: string): { main: string; startDate: string; endDate: string; isCurrent: boolean } {
  const m = text.match(DATE_RANGE_RE);
  if (!m) return { main: text, startDate: '', endDate: '', isCurrent: false };
  const isCurrent = /present|sekarang|saat\s*ini|current|now/i.test(m[2]);
  const endDate = isCurrent ? '' : m[2];
  return {
    main: text.slice(0, m.index).trim(),
    startDate: m[1],
    endDate,
    isCurrent,
  };
}

/** Split a skill list on separators that are not inside (), [] or ""-style parentheses groups. */
function splitTopLevelSkills(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';' || ch === '|') && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((s) => s.trim()).filter(Boolean);
}

function isContinuationLine(prevText: string, currentLine: Line): boolean {
  if (currentLine.isBullet) return false;
  const curr = currentLine.text.trim();
  if (!curr) return false;

  // Starts with lowercase character (English or Indonesian)
  if (/^[a-z]/.test(curr)) return true;

  // Starts with common continuation words in EN or ID
  const continuationWords =
    /^(?:dan|atau|serta|yang|untuk|dengan|pada|dalam|sebagai|hingga|sampai|karena|sehingga|termasuk|yaitu|yakni|and|or|with|for|in|to|of|that|which|by|including|such\s+as|as\s+well\s+as|resulting\s+in|leading\s+to)\b/i;
  if (continuationWords.test(curr)) return true;

  const prev = prevText.trim();
  // If previous does not end with sentence-ending punctuation (. ! ? : ;)
  if (prev && !/[.!?:]$/.test(prev)) {
    return true;
  }

  return false;
}

interface ParsedEntry {
  id: string;
  _title: string;
  _subtitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

function parseExperienceLike(lines: Line[], startIdx: number): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i];
    if (matchSectionHeading(line.text)) break;
    if (line.isBullet && entries.length === 0) {
      i++;
      continue; // orphan bullet without an entry header
    }

    const hasDate = DATE_RANGE_RE.test(line.text);
    const prev = entries[entries.length - 1];
    if (!hasDate && prev && !line.isHeading) {
      // No date range → continuation/bullet line of the previous entry
      // (PDF text extraction often loses list markers).
      const clean = stripBullet(line.text);
      if (clean) {
        if (prev.bullets.length > 0 && isContinuationLine(prev.bullets[prev.bullets.length - 1], line)) {
          prev.bullets[prev.bullets.length - 1] += ` ${clean}`;
        } else {
          prev.bullets.push(clean);
        }
      }
      i++;
      continue;
    }
    if (!hasDate && prev && line.isHeading && !matchSectionHeading(line.text) && line.text.length <= 60 && !prev._subtitle && prev.bullets.length === 0) {
      // Short all-caps line right after the header (e.g. "CTO") is the role.
      prev._subtitle = stripBullet(line.text);
      i++;
      continue;
    }

    const { main, startDate, endDate, isCurrent } = splitDateRange(line.text);
    const entry: ParsedEntry = { id: newId('e'), _title: main || line.text, _subtitle: '', startDate, endDate, isCurrent, bullets: [] };
    i++;

    // Reference-style layouts put the role/degree on its own short line
    // between the entry title and its bullets (e.g. "kiboni - Singapore" /
    // "CTO" / bullets). PDF text extraction loses list markers, so only a
    // short non-bullet line qualifies as the subtitle.
    const next = i < lines.length ? lines[i] : undefined;
    if (
      next &&
      !next.isBullet &&
      !matchSectionHeading(next.text) &&
      !DATE_RANGE_RE.test(next.text) &&
      next.text.length <= 60
    ) {
      entry._subtitle = stripBullet(next.text);
      i++;
    }

    // Collect everything up to the next dated/heading line as bullets, merging continuation lines.
    while (i < lines.length) {
      const l2 = lines[i];
      if (matchSectionHeading(l2.text) || l2.isHeading || DATE_RANGE_RE.test(l2.text)) break;
      const clean = stripBullet(l2.text);
      if (clean) {
        if (entry.bullets.length > 0 && isContinuationLine(entry.bullets[entry.bullets.length - 1], l2)) {
          entry.bullets[entry.bullets.length - 1] += ` ${clean}`;
        } else {
          entry.bullets.push(clean);
        }
      }
      i++;
    }

    if (entry._title || entry.bullets.length > 0) entries.push(entry);
  }
  return entries;
}

function titleCaseName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Parse extracted text/blocks into a structured CV.
 * Heuristic and tolerant to section-order variation; every section carries a
 * review status so the UI can mark uncertain data before it is applied.
 */
export function parseTextToCv(blocksOrText: DocxBlock[] | string): CvParseResult {
  const lines = typeof blocksOrText === 'string' ? linesFromText(blocksOrText) : linesFromBlocks(blocksOrText);

  const cv = cvDocumentSchema.parse({});
  const reviews: SectionReviewStatus[] = [];

  // ---------- Personal information: leading lines before the first section ----------
  let firstSectionIdx = lines.findIndex((l) => matchSectionHeading(l.text) !== null);
  if (firstSectionIdx === -1) firstSectionIdx = lines.length;

  const personalLines = lines.slice(0, firstSectionIdx).map((l) => l.text).filter(Boolean);

  let explicitNameFound = false;
  for (const line of personalLines) {
    const nameMatch = line.match(/^(?:nama\s*(?:lengkap)?|full\s*name|name)\s*[:：]\s*(.+)$/i);
    if (nameMatch && nameMatch[1].trim()) {
      cv.personal.fullName = titleCaseName(nameMatch[1].trim());
      explicitNameFound = true;
      break;
    }
  }

  if (!explicitNameFound) {
    for (const line of personalLines) {
      if (NON_NAME_RE.test(line)) continue;
      if (isProbablyName(line)) {
        cv.personal.fullName = titleCaseName(line.replace(/[|,;]+$/, '').trim());
        break;
      }
    }
  }

  for (const line of personalLines) {
    const locMatch = line.match(/^(?:alamat|domisili|lokasi|tempat\s*tinggal|address|location|city)\s*[:：]\s*(.+)$/i);
    if (locMatch && locMatch[1].trim() && !cv.personal.location) {
      cv.personal.location = locMatch[1].trim();
    }
    const sumMatch = line.match(/^(?:tentang\s*saya|deskripsi\s*(?:diri)?|profil\s*(?:singkat)?|ringkasan|about\s*me|summary|profile)\s*[:：]\s*(.+)$/i);
    if (sumMatch && sumMatch[1].trim() && !cv.summary) {
      cv.summary = sumMatch[1].trim();
    }
    const contact = extractContact(line);
    if (contact.email && !cv.personal.email) cv.personal.email = contact.email;
    if (contact.phone && !cv.personal.phone) cv.personal.phone = contact.phone;
    if (contact.location && !cv.personal.location) cv.personal.location = contact.location;
    if (contact.linkedin && !cv.personal.linkedin) cv.personal.linkedin = contact.linkedin;
    if (contact.github && !cv.personal.github) cv.personal.github = contact.github;
    if (contact.portfolio && !cv.personal.portfolio) cv.personal.portfolio = contact.portfolio;
  }
  // If no separate contact lines, scan the first 3 lines overall for contacts.
  if (!cv.personal.email && !cv.personal.phone) {
    for (const line of lines.slice(0, 3)) {
      const contact = extractContact(line.text);
      if (contact.email && !cv.personal.email) cv.personal.email = contact.email;
      if (contact.phone && !cv.personal.phone) cv.personal.phone = contact.phone;
      if (contact.location && !cv.personal.location) cv.personal.location = contact.location;
    }
  }

  // ---------- Sections ----------
  let current: string | null = null;
  let sectionStart = 0;

  const commit = (id: string, sectionLines: Line[]) => {
    switch (id) {
      case 'personal': {
        for (const line of sectionLines) {
          const text = line.text;
          const nameMatch = text.match(/^(?:nama\s*(?:lengkap)?|full\s*name|name)\s*[:：]\s*(.+)$/i);
          if (nameMatch && nameMatch[1].trim()) {
            cv.personal.fullName = titleCaseName(nameMatch[1].trim());
          }
          const locMatch = text.match(/^(?:alamat|domisili|lokasi|tempat\s*tinggal|address|location|city)\s*[:：]\s*(.+)$/i);
          if (locMatch && locMatch[1].trim() && !cv.personal.location) {
            cv.personal.location = locMatch[1].trim();
          }
          const sumMatch = text.match(/^(?:tentang\s*saya|deskripsi\s*(?:diri)?|profil\s*(?:singkat)?|ringkasan|about\s*me|summary|profile)\s*[:：]\s*(.+)$/i);
          if (sumMatch && sumMatch[1].trim() && !cv.summary) {
            cv.summary = sumMatch[1].trim();
          }
          const contact = extractContact(text);
          if (contact.email && !cv.personal.email) cv.personal.email = contact.email;
          if (contact.phone && !cv.personal.phone) cv.personal.phone = contact.phone;
          if (contact.location && !cv.personal.location) cv.personal.location = contact.location;
          if (contact.linkedin && !cv.personal.linkedin) cv.personal.linkedin = contact.linkedin;
          if (contact.github && !cv.personal.github) cv.personal.github = contact.github;
          if (contact.portfolio && !cv.personal.portfolio) cv.personal.portfolio = contact.portfolio;
        }
        break;
      }
      case 'summary': {
        const summaryText = sectionLines.map((l) => l.text).join(' ').trim();
        if (summaryText) cv.summary = summaryText;
        reviews.push({ section: 'summary', status: cv.summary ? 'complete' : 'empty' });
        break;
      }
      case 'education': {
        const entries: EducationEntry[] = [];
        let i = 0;
        while (i < sectionLines.length) {
          const line = sectionLines[i];
          if (line.isBullet && entries.length > 0 && !DATE_RANGE_RE.test(line.text)) {
            const clean = stripBullet(line.text);
            if (clean) {
              const prev = entries[entries.length - 1];
              if (prev.details.length > 0 && isContinuationLine(prev.details[prev.details.length - 1], line)) {
                prev.details[prev.details.length - 1] += ` ${clean}`;
              } else {
                prev.details.push(clean);
              }
            }
            i++;
            continue;
          }
          const { main, startDate, endDate, isCurrent } = splitDateRange(line.text);
          const title = main || line.text;
          // "Institution - Degree" pattern
          const dash = title.split(/\s+-\s+|\s+—\s+/);
          let institution = dash[0]?.trim() ?? title;
          let eduDegree = '';
          let eduLocation = '';
          if (dash[1]) {
            if (DEGREE_HINT.test(dash[1])) eduDegree = dash[1].trim();
            else eduLocation = dash[1].trim();
          }
          const entry: EducationEntry = {
            id: newId('edu'),
            institution,
            degree: eduDegree,
            location: eduLocation,
            startDate,
            endDate,
            isCurrent,
            details: [],
          };
          i++;
          const details: string[] = [];
          while (i < sectionLines.length) {
            const l2 = sectionLines[i];
            if (matchSectionHeading(l2.text) || DATE_RANGE_RE.test(l2.text)) break;
            const clean = stripBullet(l2.text);
            if (clean) {
              if (details.length > 0 && isContinuationLine(details[details.length - 1], l2)) {
                details[details.length - 1] += ` ${clean}`;
              } else {
                details.push(clean);
              }
            }
            i++;
          }
          // The degree often sits on its own line under the institution
          if (!eduDegree && details.length > 0 && details[0].length <= 80 && DEGREE_HINT.test(details[0])) {
            eduDegree = details[0];
            details.shift();
          }
          entry.degree = eduDegree;
          entry.details.push(...details);
          if (entry.institution || entry.degree) entries.push(entry);
        }
        cv.education = entries;
        reviews.push({
          section: 'education',
          status: entries.length === 0 ? 'empty' : entries.some((e) => !e.startDate) ? 'review' : 'complete',
          reason: entries.some((e) => !e.startDate) ? 'Some education entries have no dates.' : undefined,
        });
        break;
      }
      case 'experience': {
        const raw = parseExperienceLike(sectionLines, 0);
        cv.experience = raw.map((e) => {
          const title = e._title;
          // Reference layout: "Company - Location" bold, role on its own line.
          // Proper nouns stay untouched; only role-like text maps to jobTitle.
          const dash = title.split(/\s+-\s+/);
          const company = dash[0]?.trim() || title;
          let jobTitle = '';
          let location = '';
          if (dash[1]) {
            if (ROLE_HINT.test(dash[1])) jobTitle = dash[1].trim();
            else location = dash[1].trim();
          }
          if (!jobTitle && e._subtitle && !DEGREE_HINT.test(e._subtitle)) jobTitle = e._subtitle;
          return {
            id: newId('exp'),
            company,
            jobTitle,
            employmentType: '',
            location,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            bullets: e.bullets,
          } satisfies ExperienceEntry;
        });
        const missingDates = cv.experience.filter((e) => !e.startDate && !e.endDate).length;
        reviews.push({
          section: 'experience',
          status: cv.experience.length === 0 ? 'empty' : missingDates > 0 ? 'review' : 'complete',
          reason: missingDates > 0 ? `${missingDates} experience entr${missingDates === 1 ? 'y has' : 'ies have'} no dates.` : undefined,
        });
        break;
      }
      case 'projects': {
        const raw = parseExperienceLike(sectionLines, 0);
        cv.projects = raw.map((e) => ({
          id: newId('prj'),
          name: e._title,
          role: e._subtitle || '',
          url: '',
          startDate: e.startDate,
          endDate: e.endDate,
          isCurrent: e.isCurrent,
          bullets: e.bullets,
        }) satisfies ProjectEntry);
        reviews.push({ section: 'projects', status: cv.projects.length === 0 ? 'empty' : 'complete' });
        break;
      }
      case 'organizations': {
        const raw = parseExperienceLike(sectionLines, 0);
        cv.organizations = raw.map((e) => {
          const title = e._title;
          const dash = title.split(/\s+-\s+/);
          let orgRole = '';
          let orgLocation = '';
          if (dash[1]) {
            if (ROLE_HINT.test(dash[1])) orgRole = dash[1].trim();
            else orgLocation = dash[1].trim();
          }
          if (!orgRole && e._subtitle && !DEGREE_HINT.test(e._subtitle)) orgRole = e._subtitle;
          return {
            id: newId('org'),
            organization: dash[0]?.trim() || title,
            role: orgRole,
            location: orgLocation,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            bullets: e.bullets,
          } satisfies OrganizationEntry;
        });
        reviews.push({ section: 'organizations', status: cv.organizations.length === 0 ? 'empty' : 'complete' });
        break;
      }
      case 'skills': {
        const groups = new Map<string, string[]>();
        for (const line of sectionLines) {
          const m = line.text.match(/^([^:]{0,40}):\s*(.+)$/);
          if (m && /^(hard\s*skills?|soft\s*skills?|technical|teknis|non[- ]?teknis|tools?|languages?|sertifikasi|certificates?|licenses?)/i.test(m[1])) {
            const label = normalizeWhitespace(m[1]).replace(/\b\w/g, (c) => c.toUpperCase());
            const skills = splitTopLevelSkills(m[2]);
            const existing = groups.get(label) ?? [];
            groups.set(label, [...existing, ...skills]);
          } else {
            const skills = splitTopLevelSkills(line.text);
            const existing = groups.get('Skills') ?? [];
            groups.set('Skills', [...existing, ...skills]);
          }
        }
        cv.skills = [...groups.entries()].map(([label, skills]) => ({ id: newId('skl'), label, skills }));
        reviews.push({ section: 'skills', status: cv.skills.length === 0 ? 'empty' : 'complete' });
        break;
      }
      case 'certifications': {
        cv.certifications = sectionLines
          .filter((l) => !l.isHeading)
          .map((l) => {
            const { main } = splitDateRange(stripBullet(l.text));
            const dateMatch = l.text.match(SINGLE_DATE_RE);
            return {
              id: newId('crt'),
              name: main || stripBullet(l.text),
              issuer: '',
              issueDate: dateMatch ? dateMatch[1] : '',
              expiryDate: '',
              credentialId: '',
              url: '',
            };
          })
          .filter((c) => c.name);
        reviews.push({
          section: 'certifications',
          status: cv.certifications.length === 0 ? 'empty' : cv.certifications.some((c) => !c.issuer) ? 'review' : 'complete',
          reason: cv.certifications.some((c) => !c.issuer) ? 'Certification issuers were not detected — review recommended.' : undefined,
        });
        break;
      }
      case 'awards': {
        cv.awards = sectionLines
          .filter((l) => !l.isHeading)
          .map((l) => {
            const dateMatch = l.text.match(SINGLE_DATE_RE);
            return {
              id: newId('awd'),
              title: stripBullet(l.text),
              issuer: '',
              date: dateMatch ? dateMatch[1] : '',
              description: '',
            };
          })
          .filter((a) => a.title);
        reviews.push({ section: 'awards', status: cv.awards.length === 0 ? 'empty' : 'complete' });
        break;
      }
      default: {
        // Unknown / additional: keep as user-defined section
        const headingMatch = sectionLines.find((l) => l.isHeading);
        const nonHeadingLines = sectionLines.filter((l) => !l.isHeading);
        const items: string[] = [];
        for (const l of nonHeadingLines) {
          const clean = stripBullet(l.text);
          if (!clean) continue;
          if (items.length > 0 && isContinuationLine(items[items.length - 1], l)) {
            items[items.length - 1] += ` ${clean}`;
          } else {
            items.push(clean);
          }
        }
        if (headingMatch || items.length > 0) {
          cv.additional.push({
            id: newId('add'),
            title: headingMatch?.text ?? 'Additional',
            items,
          });
        }
        reviews.push({ section: 'additional', status: 'complete' });
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const sectionId = matchSectionHeading(lines[i].text);
    if (sectionId) {
      if (current !== null) commit(current, lines.slice(sectionStart, i));
      current = sectionId;
      sectionStart = i + 1;
    }
  }
  if (current !== null) commit(current, lines.slice(sectionStart));

  // Cross-cutting sanity flags
  for (const e of cv.experience) {
    if (e.startDate && e.endDate && isEndDateBeforeStart(e.startDate, e.endDate)) {
      const review = reviews.find((r) => r.section === 'experience');
      if (review) {
        review.status = 'review';
        review.reason = 'At least one experience entry has an end date before its start date.';
      }
    }
  }

  if (!cv.personal.fullName || (!cv.personal.email && !cv.personal.phone)) {
    reviews.unshift({
      section: 'personal',
      status: 'review',
      reason: !cv.personal.fullName ? 'Name was not detected.' : 'Contact information was not detected.',
    });
  } else {
    reviews.unshift({ section: 'personal', status: 'complete' });
  }

  const reviewCount = reviews.filter((r) => r.status === 'review').length;
  const totalContent =
    cv.summary.length +
    cv.education.length +
    cv.experience.length +
    cv.projects.length +
    cv.organizations.length +
    cv.skills.reduce((n, g) => n + g.skills.length, 0) +
    cv.certifications.length;

  const confidence = totalContent === 0 ? 'low' : reviewCount === 0 ? 'high' : reviewCount <= 2 ? 'medium' : 'low';

  // Auto-detect the CV content language so section headings and fixed labels
  // ("Present"/"Saat ini") match the document without user action.
  const sample = lines.map((l) => l.text).filter((t) => t.trim().length > 0).slice(0, 200);
  cv.settings.language = detectLanguage(sample.length > 0 ? sample : [cv.summary]);

  return { cv, reviews, confidence };
}
