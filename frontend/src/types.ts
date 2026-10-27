export type SectionKey =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'organizations'
  | 'skills'
  | 'certifications'
  | 'awards';

export interface SectionMeta {
  key: SectionKey;
  label: string;
  icon: string; // Font Awesome icon name (free solid)
}

export const SECTIONS: SectionMeta[] = [
  { key: 'summary', label: 'Summary', icon: 'fa-user' },
  { key: 'education', label: 'Education', icon: 'fa-graduation-cap' },
  { key: 'experience', label: 'Experience', icon: 'fa-briefcase' },
  { key: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
  { key: 'organizations', label: 'Organizations', icon: 'fa-people-group' },
  { key: 'skills', label: 'Skills', icon: 'fa-list-check' },
];

export type LeftTab = 'sections' | 'ai' | 'check';

export interface AiTarget {
  kind: 'bullet' | 'summary';
  section: SectionKey;
  entryId?: string;
  bulletIndex?: number;
  label: string;
}

export interface AiSuggestionCard {
  original: string;
  suggestion: string;
  reason: string;
  missing_information: string[];
}
