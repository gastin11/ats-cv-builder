import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faCheck, faXmark, faPen, faTriangleExclamation, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../../stores/cvStore';
import { ui, type UiStringKey } from '../../../../shared/cv-schema/i18n';
import { api, REWRITE_MODES } from '../../lib/api';
import { Button, SectionCard } from '../common';

const MODE_KEYS: Record<string, UiStringKey> = {
  professional: 'modeProfessional',
  concise: 'modeConcise',
  'achievement-focused': 'modeAchievement',
  technical: 'modeTechnical',
  'business-focused': 'modeBusiness',
  'ats-friendly': 'modeAts',
};

export default function AIPanel() {
  const cv = useCvStore((s) => s.cv);
  const lang = useCvStore((s) => s.cv.settings.language);
  const aiTarget = useCvStore((s) => s.aiTarget);
  const aiCard = useCvStore((s) => s.aiCard);
  const setAiCard = useCvStore((s) => s.setAiCard);
  const applyAiCard = useCvStore((s) => s.applyAiCard);
  const openAi = useCvStore((s) => s.openAi);
  const setAiTarget = useCvStore((s) => s.setAiTarget);
  const setLeftTab = useCvStore((s) => s.setLeftTab);

  const [mode, setMode] = useState(REWRITE_MODES[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const [suggestions, setSuggestions] = useState<Array<{ section: string; target: string; type: string; message: string }> | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  async function runImprove() {
    if (!aiTarget) return;
    setLoading(true);
    setError(null);
    try {
      let text = '';
      let section = aiTarget.section;
      if (aiTarget.kind === 'summary') {
        text = cv.summary;
        section = 'summary';
      } else if (aiTarget.entryId && typeof aiTarget.bulletIndex === 'number') {
        const entry =
          cv.experience.find((e) => e.id === aiTarget.entryId) ??
          cv.projects.find((e) => e.id === aiTarget.entryId) ??
          cv.organizations.find((e) => e.id === aiTarget.entryId);
        text = entry?.bullets[aiTarget.bulletIndex] ?? '';
      }
      if (!text.trim()) {
        setError('The selected text is empty. Write something first, then ask for suggestions.');
        return;
      }
      const result = await api.aiImprove({ text, mode, section, language: lang });
      setAiCard({
        original: result.original || text,
        suggestion: result.suggestion,
        reason: result.reason,
        missing_information: result.missing_information ?? [],
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestions are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  async function runSuggestions() {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const result = await api.aiSuggestions(cv);
      setSuggestions(result.suggestions ?? []);
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : 'AI suggestions are temporarily unavailable.');
    } finally {
      setSuggestionsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title={ui(lang, "aiImproveTitle")}>
        {aiTarget ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-2">
                {ui(lang, 'target')}: <span className="font-medium text-ink">{aiTarget.label}</span>
              </p>
              <button
                onClick={() => {
                  setAiCard(null);
                  setAiTarget(null);
                  setLeftTab('sections');
                }}
                className="flex flex-none items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-2 transition-colors hover:bg-bg hover:text-ink"
              >
                <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
                {ui(lang, 'back')}
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-2">{ui(lang, 'style')}</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
                className="flex-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
              >
                {REWRITE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>{ui(lang, MODE_KEYS[m.id])}</option>
                ))}
              </select>
            </label>
            <Button variant="primary" onClick={runImprove} disabled={loading} className="w-full">
              <FontAwesomeIcon icon={faWandMagicSparkles} spin={loading} aria-hidden />
              {loading ? ui(lang, 'thinking') : ui(lang, 'getSuggestion')}
            </Button>
            {error && (
              <p role="alert" className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {aiCard && <SuggestionCard editing={editing} setEditing={setEditing} editedText={setEditedText} />}
          </div>
        ) : (
          <p className="text-sm text-ink-2">{ui(lang, 'aiEmptyHint')}</p>
        )}
      </SectionCard>

      <SectionCard
        title={ui(lang, "aiWholeTitle")}
        actions={
          <Button onClick={runSuggestions} disabled={suggestionsLoading}>
            <FontAwesomeIcon icon={faWandMagicSparkles} spin={suggestionsLoading} aria-hidden />
            {ui(lang, 'analyzeCv')}
          </Button>
        }
      >
        {suggestionsError && (
          <p role="alert" className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">
            {suggestionsError}
          </p>
        )}
        {suggestions === null && !suggestionsError && (
          <p className="text-sm text-ink-2">{ui(lang, 'aiWholeHint')}</p>
        )}
        {suggestions !== null && suggestions.length === 0 && (
          <p className="text-sm text-ink-2">No suggestions right now. Add more content first.</p>
        )}
        <ul className="space-y-2">
          {(suggestions ?? []).map((s, i) => (
            <li key={i} className="rounded-md border border-line p-3 text-sm">
              <span className="mb-1 inline-block rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                {s.section} / {s.type}
              </span>
              <p>{s.message}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function SuggestionCard({
  editing,
  setEditing,
  editedText,
}: {
  editing: boolean;
  setEditing: (v: boolean) => void;
  editedText: (v: string) => void;
}) {
  const lang = useCvStore((s) => s.cv.settings.language);
  const aiCard = useCvStore((s) => s.aiCard);
  const applyAiCard = useCvStore((s) => s.applyAiCard);
  const setAiCard = useCvStore((s) => s.setAiCard);
  const [edited, setEdited] = useState('');

  if (!aiCard) return null;

  return (
    <div className="rounded-md border border-accent/30 bg-accent-soft/50 p-3 text-sm">
      <div className="mb-2">
        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-ink-2">{ui(lang, "currentText")}</span>
        <p className="text-ink-2">{aiCard.original || '(empty)'}</p>
      </div>
      <div className="mb-2">
        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-ink-2">{ui(lang, "suggested")}</span>
        {editing ? (
          <textarea
            rows={3}
            className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
            value={edited || aiCard.suggestion}
            onChange={(e) => {
              setEdited(e.target.value);
              editedText(e.target.value);
            }}
          />
        ) : (
          <p>{aiCard.suggestion}</p>
        )}
      </div>
      {aiCard.reason && (
        <div className="mb-2">
          <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-ink-2">{ui(lang, "why")}</span>
          <p className="text-ink-2">{aiCard.reason}</p>
        </div>
      )}
      {aiCard.missing_information.length > 0 && (
        <div className="mb-3 rounded-md bg-warning/10 p-2.5">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-warning">
            <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden />
            {ui(lang, 'infoToAdd')}
          </p>
          <ul className="list-disc pl-5 text-ink-2">
            {aiCard.missing_information.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (editing && edited) setAiCard({ ...aiCard, suggestion: edited });
            applyAiCard();
          }}
        >
          <FontAwesomeIcon icon={faCheck} aria-hidden /> {ui(lang, "useSuggestion")}
        </Button>
        <Button onClick={() => setEditing(!editing)}>
          <FontAwesomeIcon icon={faPen} aria-hidden /> {editing ? ui(lang, "cancelEdit") : ui(lang, "edit")}
        </Button>
        <Button variant="ghost" onClick={() => setAiCard(null)}>
          <FontAwesomeIcon icon={faXmark} aria-hidden /> {ui(lang, "dismissB")}
        </Button>
      </div>
    </div>
  );
}
