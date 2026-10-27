import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useCvStore, withId } from '../stores/cvStore';
import { Button, EmptyHint, Field, IconButton, SectionCard, TextArea, TextInput, faArrowDown, faArrowUp, faPlus } from './common';
import { ui, type UiStringKey } from '../../../shared/cv-schema/i18n';
import type { SectionKey } from '../types';
import type {
  CVDocument,
  EducationEntry,
  ExperienceEntry,
  OrganizationEntry,
  ProjectEntry,
} from '../../../shared/cv-schema/cv.schema';

function useLang() {
  return useCvStore((s) => s.cv.settings.language);
}

export default function EditorPanel() {
  const activeSection = useCvStore((s) => s.activeSection);

  switch (activeSection) {
    case 'personal': return <PersonalForm />;
    case 'summary': return <SummaryForm />;
    case 'skills': return <SkillsForm />;
    case 'education': return <EducationForm />;
    case 'experience': return <ExperienceForm />;
    case 'projects': return <ProjectsForm />;
    case 'organizations': return <OrganizationsForm />;
  }
}

/* ---------------- Personal ---------------- */

function PersonalForm() {
  const cv = useCvStore((s) => s.cv);
  const lang = useLang();
  const update = useCvStore((s) => s.update);

  const set = (patch: Partial<CVDocument['personal']>) =>
    update((draft) => {
      Object.assign(draft.personal, patch);
    });

  return (
    <div className="space-y-4">
      <SectionCard title={ui(lang, 'personal')}>
        <p className="mb-4 text-sm text-ink-2">{ui(lang, 'personalHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ui(lang, 'fullName')}>
            <TextInput value={cv.personal.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Alex Morgan" />
          </Field>
          <Field label={ui(lang, 'location')}>
            <TextInput value={cv.personal.location} onChange={(e) => set({ location: e.target.value })} placeholder="Jakarta" />
          </Field>
          <Field label={ui(lang, 'phone')}>
            <TextInput value={cv.personal.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+62 812 3456 7890" />
          </Field>
          <Field label={ui(lang, 'email')}>
            <TextInput value={cv.personal.email} onChange={(e) => set({ email: e.target.value })} placeholder="alex@example.com" type="email" />
          </Field>
          <Field label={ui(lang, 'linkedin')}>
            <TextInput value={cv.personal.linkedin} onChange={(e) => set({ linkedin: e.target.value })} placeholder="linkedin.com/in/alexmorgan" />
          </Field>
          <Field label={ui(lang, 'portfolio')}>
            <TextInput value={cv.personal.portfolio} onChange={(e) => set({ portfolio: e.target.value })} placeholder="example.com" />
          </Field>
          <Field label={ui(lang, 'github')}>
            <TextInput value={cv.personal.github} onChange={(e) => set({ github: e.target.value })} placeholder="github.com/alexmorgan" />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- Summary ---------------- */

function SummaryForm() {
  const cv = useCvStore((s) => s.cv);
  const lang = useLang();
  const update = useCvStore((s) => s.update);
  const openAi = useCvStore((s) => s.openAi);

  return (
    <SectionCard title={ui(lang, 'summary')}>
      <p className="mb-3 text-sm text-ink-2">{ui(lang, 'summaryHint')}</p>
      <Field label={ui(lang, 'summaryField')}>
        <TextArea
          rows={6}
          className="text-justify"
          value={cv.summary}
          onChange={(e) => update((draft) => { draft.summary = e.target.value; })}
          placeholder="Fresh graduate in information systems with internship experience in data analysis."
        />
      </Field>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={() => openAi({ kind: 'summary', section: 'summary', label: ui(lang, 'summary') })}>
          <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
          {ui(lang, 'generateWithAi')}
        </Button>
      </div>
    </SectionCard>
  );
}

/* ---------------- Skills ---------------- */

function SkillsForm() {
  const cv = useCvStore((s) => s.cv);
  const lang = useLang();
  const update = useCvStore((s) => s.update);

  return (
    <SectionCard
      title={ui(lang, 'skills')}
      actions={
        <Button onClick={() => update((draft) => { draft.skills.push(withId({ id: '', label: '', skills: [] }, 'skl')); })}>
          <FontAwesomeIcon icon={faPlus} aria-hidden /> {ui(lang, 'addGroup')}
        </Button>
      }
    >
      <p className="mb-3 text-sm text-ink-2">{ui(lang, 'skillsHint')}</p>
      {cv.skills.length === 0 && <EmptyHint>{ui(lang, 'emptyStatus')}</EmptyHint>}
      <div className="space-y-4">
        {cv.skills.map((group, groupIndex) => (
          <div key={group.id} className="rounded-md border border-line p-3">
            <div className="mb-2 flex items-center gap-2">
              <TextInput
                value={group.label}
                placeholder={ui(lang, 'groupLabel')}
                onChange={(e) => update((draft) => { draft.skills[groupIndex].label = e.target.value; })}
              />
              <IconButton icon={faTrash} label={ui(lang, 'deleteGroup')} onClick={() => update((draft) => { draft.skills.splice(groupIndex, 1); })} />
            </div>
            <TextArea
              rows={2}
              value={group.skills.join(', ')}
              placeholder="Python, SQL, Excel"
              onChange={(e) =>
                update((draft) => {
                  draft.skills[groupIndex].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                })
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ---------------- Generic list section ---------------- */

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  full?: boolean;
}

interface ListSectionConfig {
  title: string;
  addLabel: string;
  emptyHint: string;
  fields: FieldConfig[];
  dateFields: boolean;
  bullets: { label: string; itemLabel: string } | null;
  create: () => Record<string, unknown>;
}

function entryTitle(entry: Record<string, unknown>, titleKey: string, fallbackKey: string): string {
  const a = String(entry[titleKey] ?? '');
  const b = String(entry[fallbackKey] ?? '');
  return (a || b || 'Untitled entry').slice(0, 60);
}

function ListSectionForm({ section, config }: { section: SectionKey; config: ListSectionConfig }) {
  const cv = useCvStore((s) => s.cv);
  const lang = useLang();
  const update = useCvStore((s) => s.update);
  const moveEntry = useCvStore((s) => s.moveEntry);
  const openAi = useCvStore((s) => s.openAi);

  const list = (cv as unknown as Record<string, Array<Record<string, unknown>>>)[section] ?? [];
  const mutateList = (fn: (list: Array<Record<string, unknown>>) => void) =>
    update((draft) => {
      const target = (draft as unknown as Record<string, Array<Record<string, unknown>>>)[section];
      fn(target);
    });

  return (
    <SectionCard
      title={config.title}
      actions={
        <Button onClick={() => mutateList((list2) => { list2.push(config.create()); })}>
          <FontAwesomeIcon icon={faPlus} aria-hidden /> {config.addLabel}
        </Button>
      }
    >
      {list.length === 0 && <EmptyHint>{config.emptyHint}</EmptyHint>}
      <div className="space-y-4">
        {list.map((entry, index) => (
          <div key={String(entry.id)} className="rounded-md border border-line p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-ink-2">
                {index + 1}. {entryTitle(entry, config.fields[0].key, config.fields[1]?.key ?? '')}
              </span>
              <div className="flex items-center">
                <IconButton icon={faArrowUp} label={ui(lang, 'moveUp')} disabled={index === 0} onClick={() => moveEntry(section, String(entry.id), -1)} />
                <IconButton icon={faArrowDown} label={ui(lang, 'moveDown')} disabled={index === list.length - 1} onClick={() => moveEntry(section, String(entry.id), 1)} />
                <IconButton icon={faTrash} label={ui(lang, 'deleteEntry')} onClick={() => mutateList((list2) => { list2.splice(index, 1); })} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {config.fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  <TextInput
                    value={String(entry[f.key] ?? '')}
                    placeholder={f.placeholder}
                    onChange={(e) => mutateList((list2) => { list2[index][f.key] = e.target.value; })}
                  />
                </Field>
              ))}
            </div>

            {config.dateFields && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label={ui(lang, 'startDate')}>
                  <TextInput
                    value={String(entry.startDate ?? '')}
                    placeholder="Aug 2019"
                    onChange={(e) => mutateList((list2) => { list2[index].startDate = e.target.value; })}
                  />
                </Field>
                <Field label={ui(lang, 'endDate')}>
                  <div className="flex items-center gap-3">
                    <TextInput
                      value={entry.isCurrent ? '' : String(entry.endDate ?? '')}
                      placeholder="Jul 2023"
                      disabled={Boolean(entry.isCurrent)}
                      onChange={(e) => mutateList((list2) => { list2[index].endDate = e.target.value; })}
                    />
                    <label className="flex flex-none items-center gap-1.5 text-sm text-ink-2">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.isCurrent)}
                        onChange={(e) => mutateList((list2) => {
                          list2[index].isCurrent = e.target.checked;
                          if (e.target.checked) list2[index].endDate = '';
                        })}
                        className="accent-accent"
                      />
                      {ui(lang, 'present')}
                    </label>
                  </div>
                </Field>
              </div>
            )}

            {config.bullets && (
              <div className="mt-4">
                <span className="mb-1 block text-sm font-medium text-ink-2">{config.bullets.label}</span>
                <div className="space-y-2">
                  {((entry.bullets ?? []) as string[]).map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex items-start gap-2">
                      <span className="mt-2.5 text-ink-2" aria-hidden>&bull;</span>
                      <TextArea
                        rows={2}
                        value={bullet}
                        className="flex-1"
                        onChange={(e) => mutateList((list2) => { (list2[index].bullets as string[])[bulletIndex] = e.target.value; })}
                      />
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() =>
                            openAi({
                              kind: 'bullet',
                              section,
                              entryId: String(entry.id),
                              bulletIndex,
                              label: `${config.bullets!.itemLabel} ${bulletIndex + 1} - ${entryTitle(entry, config.fields[0].key, config.fields[1]?.key ?? '')}`,
                            })
                          }
                          title={ui(lang, 'improveAi')}
                          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
                        >
                          <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
                          AI
                        </button>
                        <IconButton
                          icon={faTrash}
                          label={ui(lang, 'deleteBullet')}
                          onClick={() => mutateList((list2) => { (list2[index].bullets as string[]).splice(bulletIndex, 1); })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-2" onClick={() => mutateList((list2) => { (list2[index].bullets as string[]).push(''); })}>
                  <FontAwesomeIcon icon={faPlus} aria-hidden /> {ui(lang, 'addBullet')}
                </Button>
              </div>
            )}

            {section === 'education' && (
              <div className="mt-4">
                <span className="mb-1 block text-sm font-medium text-ink-2">{ui(lang, 'details')}</span>
                <div className="space-y-2">
                  {((entry.details ?? []) as string[]).map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start gap-2">
                      <span className="mt-2.5 text-ink-2" aria-hidden>&bull;</span>
                      <TextArea
                        rows={2}
                        value={detail}
                        className="flex-1"
                        onChange={(e) => mutateList((list2) => { (list2[index].details as string[])[detailIndex] = e.target.value; })}
                      />
                      <IconButton
                        icon={faTrash}
                        label={ui(lang, 'deleteDetail')}
                        onClick={() => mutateList((list2) => { (list2[index].details as string[]).splice(detailIndex, 1); })}
                      />
                    </div>
                  ))}
                </div>
                <Button className="mt-2" onClick={() => mutateList((list2) => { (list2[index].details as string[]).push(''); })}>
                  <FontAwesomeIcon icon={faPlus} aria-hidden /> {ui(lang, 'addDetail')}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EducationForm() {
  const lang = useLang();
  return (
    <ListSectionForm
      section="education"
      config={{
        title: ui(lang, 'education'),
        addLabel: ui(lang, 'addEducation'),
        emptyHint: 'No education entries yet. Start with your most recent school or degree.',
        fields: [
          { key: 'institution', label: ui(lang, 'institution'), placeholder: 'Universitas Contoh' },
          { key: 'degree', label: ui(lang, 'degree'), placeholder: 'S1 Information Systems' },
          { key: 'location', label: ui(lang, 'location'), placeholder: 'Surabaya' },
        ],
        dateFields: true,
        bullets: null,
        create: (): EducationEntry => withId({ id: '', institution: '', degree: '', location: '', startDate: '', endDate: '', isCurrent: false, details: [] }, 'edu'),
      }}
    />
  );
}

function ExperienceForm() {
  const lang = useLang();
  return (
    <ListSectionForm
      section="experience"
      config={{
        title: ui(lang, 'experience'),
        addLabel: ui(lang, 'addExperience'),
        emptyHint: 'No experience entries yet. Include internships and part-time work.',
        fields: [
          { key: 'jobTitle', label: ui(lang, 'jobTitle'), placeholder: 'Data Analyst Intern' },
          { key: 'company', label: ui(lang, 'company'), placeholder: 'PT Contoh Jaya' },
          { key: 'employmentType', label: ui(lang, 'employmentType'), placeholder: 'Internship' },
          { key: 'location', label: ui(lang, 'location'), placeholder: 'Jakarta' },
        ],
        dateFields: true,
        bullets: { label: ui(lang, 'bulletsLabel'), itemLabel: 'Bullet' },
        create: (): ExperienceEntry => withId({ id: '', company: '', jobTitle: '', employmentType: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [] }, 'exp'),
      }}
    />
  );
}

function ProjectsForm() {
  const lang = useLang();
  return (
    <ListSectionForm
      section="projects"
      config={{
        title: ui(lang, 'projects'),
        addLabel: ui(lang, 'addProject'),
        emptyHint: 'No projects yet. Academic and personal projects count.',
        fields: [
          { key: 'name', label: 'Project name', placeholder: 'Analytics Dashboard', full: true },
          { key: 'role', label: ui(lang, 'projectRole'), placeholder: 'Frontend developer' },
          { key: 'url', label: ui(lang, 'url'), placeholder: 'github.com/you/project' },
        ],
        dateFields: true,
        bullets: { label: ui(lang, 'bulletsLabel'), itemLabel: 'Bullet' },
        create: (): ProjectEntry => withId({ id: '', name: '', role: '', url: '', startDate: '', endDate: '', isCurrent: false, bullets: [] }, 'prj'),
      }}
    />
  );
}

function OrganizationsForm() {
  const lang = useLang();
  return (
    <ListSectionForm
      section="organizations"
      config={{
        title: ui(lang, 'organizations'),
        addLabel: ui(lang, 'addOrganization'),
        emptyHint: 'No organizations yet. Committees, clubs, and volunteering belong here.',
        fields: [
          { key: 'organization', label: ui(lang, 'orgName'), placeholder: 'Student Executive Board' },
          { key: 'role', label: ui(lang, 'role'), placeholder: 'Treasurer' },
          { key: 'location', label: ui(lang, 'location'), placeholder: 'Surabaya' },
        ],
        dateFields: true,
        bullets: { label: ui(lang, 'bulletsLabel'), itemLabel: 'Bullet' },
        create: (): OrganizationEntry => withId({ id: '', organization: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [] }, 'org'),
      }}
    />
  );
}
