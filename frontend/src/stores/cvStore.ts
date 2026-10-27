import { create } from 'zustand';
import {
  cvDocumentSchema,
  emptyCV,
  type CVDocument,
  type CVSettings,
  type SectionId,
} from '../../../shared/cv-schema/cv.schema';
import { api, downloadBlob } from '../lib/api';
import type { AiSuggestionCard, AiTarget, LeftTab, SectionKey } from '../types';

function withId<T extends { id: string }>(entry: T, prefix: string): T {
  return { ...entry, id: entry.id || `${prefix}_${Math.random().toString(36).slice(2, 10)}` };
}

function sectionArray(cv: CVDocument, key: SectionKey): Array<{ id: string }> | null {
  switch (key) {
    case 'education': return cv.education;
    case 'experience': return cv.experience;
    case 'projects': return cv.projects;
    case 'organizations': return cv.organizations;
    case 'certifications': return cv.certifications;
    case 'awards': return cv.awards;
    default: return null;
  }
}

function sectionLabel(key: SectionKey): string {
  return {
    summary: 'Summary', education: 'Education', experience: 'Experience', projects: 'Projects',
    organizations: 'Organizations', skills: 'Skills', certifications: 'Certifications', awards: 'Awards',
  }[key];
}

export interface CVStore {
  cv: CVDocument;
  past: CVDocument[];
  future: CVDocument[];

  screen: 'landing' | 'editor';
  activeSection: 'personal' | SectionKey;
  leftTab: LeftTab;
  mobileTab: 'editor' | 'preview';
  zoom: number; // 1 = 100%
  fitWidth: boolean;
  showSettings: boolean;
  importOpen: boolean;

  aiTarget: AiTarget | null;
  aiCard: AiSuggestionCard | null;

  exporting: 'pdf' | 'docx' | null;
  exportError: string | null;
  languageBusy: boolean;

  // derived
  canUndo: () => boolean;
  canRedo: () => boolean;

  // document mutations
  update: (mutate: (cv: CVDocument) => void) => void;
  undo: () => void;
  redo: () => void;
  resetCv: () => void;
  loadCv: (cv: unknown) => void;
  runExport: (kind: 'pdf' | 'docx', filename?: string) => Promise<void>;
  changeLanguage: (next: 'en' | 'id') => Promise<void>;

  setSettings: (patch: Partial<CVSettings>) => void;
  moveSection: (key: SectionKey, direction: -1 | 1) => void;
  toggleSectionHidden: (key: SectionId) => void;
  togglePageBreak: (key: SectionId) => void;
  moveEntry: (section: SectionKey, id: string, direction: -1 | 1) => void;

  // ui
  setScreen: (screen: 'landing' | 'editor') => void;
  setActiveSection: (section: 'personal' | SectionKey) => void;
  setLeftTab: (tab: LeftTab) => void;
  setMobileTab: (tab: 'editor' | 'preview') => void;
  setZoom: (zoom: number) => void;
  setFitWidth: (fit: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setImportOpen: (open: boolean) => void;
  openAi: (target: AiTarget) => void;
  setAiTarget: (target: AiTarget | null) => void;
  setAiCard: (card: AiSuggestionCard | null) => void;
  applyAiCard: () => void;
}

export const useCvStore = create<CVStore>((set, get) => ({
  cv: emptyCV(),
  past: [],
  future: [],

  // Remember the editor screen across refreshes (UI state only, never CV data).
  screen: (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ats-screen') === 'editor' ? 'editor' : 'landing') as 'landing' | 'editor',
  activeSection: 'personal',
  leftTab: 'sections',
  mobileTab: 'editor',
  zoom: 0.75,
  fitWidth: false,
  showSettings: false,
  importOpen: false,

  aiTarget: null,
  aiCard: null,

  exporting: null,
  exportError: null,
  languageBusy: false,

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  changeLanguage: async (next) => {
    const { cv, languageBusy } = get();
    if (next === cv.settings.language || languageBusy) return;
    set({ languageBusy: true });
    get().setSettings({ language: next });
    const hasContent =
      Boolean(cv.summary.trim()) ||
      cv.experience.length > 0 ||
      cv.education.length > 0 ||
      cv.projects.length > 0 ||
      cv.organizations.length > 0 ||
      cv.awards.length > 0;
    if (!hasContent) {
      set({ languageBusy: false });
      return;
    }
    try {
      const res = await api.translateCv(cv, next);
      if (res.cv) get().loadCv(res.cv);
    } catch (err) {
      // keep the original content; headings and UI already switched
      set({
        exportError:
          err instanceof Error
            ? err.message
            : 'Translation failed. The imported content stays in its current language.',
      });
    }
    set({ languageBusy: false });
  },

  runExport: async (kind, filename) => {
    set({ exporting: kind, exportError: null });
    try {
      const { cv } = get();
      const blob =
        kind === 'pdf' ? await api.exportPdf(cv, cv.settings.template) : await api.exportDocx(cv, cv.settings.template);
      const safeName = ((filename ?? 'cv').trim().replace(/[\/:*?"<>|]+/g, '-') || 'cv');
      downloadBlob(blob, `${safeName}.${kind}`);
      set({ exporting: null });
    } catch (err) {
      set({
        exporting: null,
        exportError: err instanceof Error ? err.message : 'The CV could not be exported.',
      });
    }
  },

  update: (mutate) =>
    set((state) => {
      const draft = cvDocumentSchema.parse(structuredClone(state.cv));
      mutate(draft);
      return {
        cv: draft,
        past: [...state.past.slice(-49), state.cv],
        future: [],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        cv: previous,
        past: state.past.slice(0, -1),
        future: [state.cv, ...state.future.slice(0, 49)],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        cv: next,
        past: [...state.past, state.cv],
        future: rest,
      };
    }),

  resetCv: () =>
    set((state) => ({
      cv: emptyCV(),
      past: [...state.past, state.cv],
      future: [],
      activeSection: 'personal',
      leftTab: 'sections',
      aiTarget: null,
      aiCard: null,
    })),

  loadCv: (cv) => {
    set((state) => ({
      cv: cvDocumentSchema.parse(cv),
      past: [...state.past, state.cv],
      future: [],
      screen: 'editor',
      activeSection: 'personal',
      leftTab: 'sections',
      importOpen: false,
      aiCard: null,
    }));
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('ats-screen', 'editor');
  },

  setSettings: (patch) => get().update((cv) => Object.assign(cv.settings, patch)),

  moveSection: (key, direction) =>
    get().update((cv) => {
      const order = [...cv.settings.sectionOrder];
      const index = order.indexOf(key as SectionId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= order.length) return;
      [order[index], order[target]] = [order[target], order[index]];
      cv.settings.sectionOrder = order;
    }),

  toggleSectionHidden: (key) =>
    get().update((cv) => {
      const hidden = new Set(cv.settings.hiddenSections);
      if (hidden.has(key)) hidden.delete(key);
      else hidden.add(key);
      cv.settings.hiddenSections = [...hidden];
    }),

  togglePageBreak: (key) =>
    get().update((cv) => {
      const breaks = new Set(cv.settings.manualPageBreaks);
      if (breaks.has(key)) breaks.delete(key);
      else breaks.add(key);
      cv.settings.manualPageBreaks = [...breaks];
    }),

  moveEntry: (section, id, direction) =>
    get().update((cv) => {
      const list = sectionArray(cv, section);
      if (!list) return;
      const index = list.findIndex((e) => e.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= list.length) return;
      const copy = [...list] as Array<{ id: string }>;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      (cv as unknown as Record<string, Array<{ id: string }>>)[section] = copy;
    }),

  setScreen: (screen) => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('ats-screen', screen);
    set({ screen });
  },
  setActiveSection: (activeSection) => set({ activeSection, leftTab: 'sections' }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setMobileTab: (mobileTab) => set({ mobileTab }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.4, zoom)), fitWidth: false }),
  setFitWidth: (fitWidth) => set({ fitWidth }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setImportOpen: (importOpen) => set({ importOpen }),

  openAi: (target) => set({ aiTarget: target, aiCard: null, leftTab: 'ai' }),
  setAiTarget: (aiTarget) => set({ aiTarget }),
  setAiCard: (aiCard) => set({ aiCard }),

  applyAiCard: () => {
    const { aiTarget, aiCard, update } = get();
    if (!aiTarget || !aiCard) return;
    update((cv) => {
      if (aiTarget.kind === 'summary') {
        cv.summary = aiCard.suggestion;
        return;
      }
      if (aiTarget.section === 'experience' && aiTarget.entryId && typeof aiTarget.bulletIndex === 'number') {
        const entry = cv.experience.find((e) => e.id === aiTarget.entryId);
        if (entry && entry.bullets[aiTarget.bulletIndex] !== undefined) {
          entry.bullets[aiTarget.bulletIndex] = aiCard.suggestion;
        }
        return;
      }
      if (aiTarget.section === 'projects' && aiTarget.entryId && typeof aiTarget.bulletIndex === 'number') {
        const entry = cv.projects.find((e) => e.id === aiTarget.entryId);
        if (entry && entry.bullets[aiTarget.bulletIndex] !== undefined) {
          entry.bullets[aiTarget.bulletIndex] = aiCard.suggestion;
        }
        return;
      }
      if (aiTarget.section === 'organizations' && aiTarget.entryId && typeof aiTarget.bulletIndex === 'number') {
        const entry = cv.organizations.find((e) => e.id === aiTarget.entryId);
        if (entry && entry.bullets[aiTarget.bulletIndex] !== undefined) {
          entry.bullets[aiTarget.bulletIndex] = aiCard.suggestion;
        }
      }
    });
    set({ aiCard: null, aiTarget: null, leftTab: 'sections' });
  },
}));

export { sectionLabel, withId };
