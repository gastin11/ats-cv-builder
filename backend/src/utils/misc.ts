import { randomUUID } from 'node:crypto';

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, januari: 1,
  feb: 2, february: 2, februari: 2,
  mar: 3, march: 3, maret: 3,
  apr: 4, april: 4,
  may: 5, mei: 5,
  jun: 6, june: 6, juni: 6,
  jul: 7, july: 7, juli: 7,
  aug: 8, august: 8, agu: 8, agustus: 8,
  sep: 9, september: 9,
  oct: 10, october: 10, okt: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, december: 12, des: 12, desember: 12,
};

/** Parse "Nov 2025", "2023", "Januari 2024" → { year, month } or null. */
export function parseMonthYear(value: string): { year: number; month: number } | null {
  const s = value.trim().toLowerCase();
  let m = s.match(/^([a-z]+)\.?\s+(\d{4})$/);
  if (m && MONTHS[m[1]]) return { month: MONTHS[m[1]], year: Number(m[2]) };
  m = s.match(/^(\d{4})$/);
  if (m) return { month: 0, year: Number(m[1]) };
  m = s.match(/^(\d{1,2})[/\-](\d{4})$/);
  if (m) return { month: Number(m[1]), year: Number(m[2]) };
  return null;
}

/**
 * Returns true when `end` is chronologically before `start`.
 * Unparseable values are ignored (not flagged).
 */
export function isEndDateBeforeStart(start: string, end: string): boolean {
  const a = parseMonthYear(start);
  const b = parseMonthYear(end);
  if (!a || !b || a.year === 0 || b.year === 0) return false;
  if (b.year !== a.year) return b.year < a.year;
  return b.month > 0 && a.month > 0 && b.month < a.month;
}
