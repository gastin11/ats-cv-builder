import { z } from 'zod';

/**
 * Canonical CV data model.
 * A single schema shared by the editor, live preview, validator,
 * PDF/DOCX exporters and the AI assistant. Do not fork per-template formats.
 */

export const personalInfoSchema = z.object({
  fullName: z.string().default(''),
  professionalTitle: z.string().default(''),
  location: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  linkedin: z.string().default(''),
  portfolio: z.string().default(''),
  github: z.string().default(''),
  otherLinks: z.array(z.string()).default([]),
});
export type PersonalInfo = z.infer<typeof personalInfoSchema>;

export const educationEntrySchema = z.object({
  id: z.string().default(''),
  institution: z.string().default(''),
  degree: z.string().default(''),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  isCurrent: z.boolean().default(false),
  details: z.array(z.string()).default([]), // GPA, relevant coursework, thesis, etc.
});
export type EducationEntry = z.infer<typeof educationEntrySchema>;

export const experienceEntrySchema = z.object({
  id: z.string().default(''),
  company: z.string().default(''),
  jobTitle: z.string().default(''),
  employmentType: z.string().default(''), // e.g. Internship, Full-time
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;

export const projectEntrySchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  role: z.string().default(''),
  url: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});
export type ProjectEntry = z.infer<typeof projectEntrySchema>;

export const organizationEntrySchema = z.object({
  id: z.string().default(''),
  organization: z.string().default(''),
  role: z.string().default(''),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});
export type OrganizationEntry = z.infer<typeof organizationEntrySchema>;

export const skillGroupSchema = z.object({
  id: z.string().default(''),
  label: z.string().default(''), // e.g. "Hard Skills", "Soft Skills"
  skills: z.array(z.string()).default([]),
});
export type SkillGroup = z.infer<typeof skillGroupSchema>;

export const certificationEntrySchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  issuer: z.string().default(''),
  issueDate: z.string().default(''),
  expiryDate: z.string().default(''),
  credentialId: z.string().default(''),
  url: z.string().default(''),
});
export type CertificationEntry = z.infer<typeof certificationEntrySchema>;

export const awardEntrySchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  description: z.string().default(''),
});
export type AwardEntry = z.infer<typeof awardEntrySchema>;

export const additionalSectionSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''), // user-defined section heading
  items: z.array(z.string()).default([]),
});
export type AdditionalSection = z.infer<typeof additionalSectionSchema>;

export const sectionIdSchema = z.enum([
  'summary',
  'education',
  'experience',
  'projects',
  'organizations',
  'skills',
  'certifications',
  'awards',
]);

export type SectionId = z.infer<typeof sectionIdSchema>;

export const templateIdSchema = z.enum(['classic', 'compact', 'academic', 'professional']);

export const cvSettingsSchema = z.object({
  template: templateIdSchema.default('classic'),
  language: z.enum(['en', 'id']).default('en'),
  font: z.enum(['arial', 'calibri', 'georgia', 'times']).default('arial'),
  fontSizePt: z.number().min(9).max(14).default(10.5),
  marginMm: z.number().min(10).max(35).default(18),
  lineHeight: z.number().min(1.0).max(1.8).default(1.35),
  showPageNumbers: z.boolean().default(false),
  sectionOrder: z
    .array(sectionIdSchema)
    .default(['experience', 'education', 'organizations', 'projects', 'skills']),
  hiddenSections: z.array(sectionIdSchema).default([]),
  // Section ids that force a page break before them.
  manualPageBreaks: z.array(sectionIdSchema).default([]),
});
export type CVSettings = z.infer<typeof cvSettingsSchema>;

export const cvDocumentSchema = z.object({
  version: z.string().default('1'),
  personal: personalInfoSchema.default(personalInfoSchema.parse({})),
  summary: z.string().default(''),
  education: z.array(educationEntrySchema).default([]),
  experience: z.array(experienceEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  organizations: z.array(organizationEntrySchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  awards: z.array(awardEntrySchema).default([]),
  additional: z.array(additionalSectionSchema).default([]),
  settings: cvSettingsSchema.default(cvSettingsSchema.parse({})),
});
export type CVDocument = z.infer<typeof cvDocumentSchema>;

export function emptyCV(): CVDocument {
  return cvDocumentSchema.parse({});
}
