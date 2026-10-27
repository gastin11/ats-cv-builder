// Requests go to the relative path /api so the app works on localhost and behind
// a tunnel without a rebuild. Vite proxies that prefix to the backend (see
// vite.config.ts, API_TARGET); set VITE_API_URL only to target a backend that
// does not sit behind the same origin.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ngrok's free tier answers the first browser request with an HTML interstitial
// instead of the real response. This header opts out of it for API calls.
const BASE_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...BASE_HEADERS, ...(init.headers as Record<string, string> | undefined) },
  });
}

export interface SectionReviewStatus {
  section: string;
  status: 'empty' | 'complete' | 'review';
  reason?: string;
}

export interface ImportResponse {
  success: boolean;
  sourceType: string;
  text: string;
  cv?: unknown;
  reviews?: SectionReviewStatus[];
  confidence?: 'high' | 'medium' | 'low';
  requiresOcr?: boolean;
  pageCount?: number;
  ocrDisclosure?: string;
  requiresReview?: boolean;
  engine?: number;
  aiRefined?: boolean;
  error?: string;
}

export interface ValidationCheck {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ValidationResponse {
  success: boolean;
  score: null;
  checks: ValidationCheck[];
  error?: string;
}

export interface ImproveResult {
  original: string;
  suggestion: string;
  reason: string;
  missing_information: string[];
}

export interface CvSuggestion {
  section: string;
  target: string;
  type: string;
  message: string;
}

export interface RewriteModeInfo {
  id: 'professional' | 'concise' | 'achievement-focused' | 'technical' | 'business-focused' | 'ats-friendly';
  label: string;
}

export const REWRITE_MODES: RewriteModeInfo[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'concise', label: 'Concise' },
  { id: 'achievement-focused', label: 'Achievement-focused' },
  { id: 'technical', label: 'Technical' },
  { id: 'business-focused', label: 'Business-focused' },
  { id: 'ats-friendly', label: 'ATS-friendly' },
];

async function handleJsonError(response: Response): Promise<never> {
  let message = `Request failed (HTTP ${response.status}).`;
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    // keep default message
  }
  throw new Error(message);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await apiFetch(`${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return handleJsonError(response);
  return (await response.json()) as T;
}

async function postFile(path: string, file: File): Promise<ImportResponse> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiFetch(path, { method: 'POST', body: form });
  const body = (await response.json()) as ImportResponse;
  if (!response.ok && !body?.error) throw new Error(`Request failed (HTTP ${response.status}).`);
  return body;
}

export const api = {
  importDocx: (file: File) => postFile('/api/import/docx', file),
  importPdf: (file: File) => postFile('/api/import/pdf', file),
  runOcr: (file: File) => postFile('/api/ocr', file),

  exportDocx: async (cv: unknown, template: string): Promise<Blob> => {
    const response = await apiFetch('/api/export/docx', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cv, template }),
    });
    if (!response.ok) return handleJsonError(response);
    return response.blob();
  },

  exportPdf: async (cv: unknown, template: string): Promise<Blob> => {
    const response = await apiFetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cv, template }),
    });
    if (!response.ok) return handleJsonError(response);
    return response.blob();
  },

  validate: (cv: unknown) => postJson<ValidationResponse>('/api/validate', { cv }),
  translateCv: (cv: unknown, target: 'en' | 'id') =>
    postJson<{ success: boolean; cv: unknown; error?: string }>('/api/translate', { cv, target }),
  aiImprove: (payload: { text: string; mode: string; section?: string; context?: string; language?: string }) =>
    postJson<ImproveResult & { success: boolean }>('/api/ai/improve', payload),
  aiSuggestions: (cv: unknown) => postJson<{ suggestions: CvSuggestion[] }>('/api/ai/suggestions', { cv }),
  aiSummary: (cv: unknown) => postJson<ImproveResult & { success: boolean }>('/api/ai/summary', { cv }),
};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
