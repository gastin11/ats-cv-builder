import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useCvStore } from '../stores/cvStore';
import { ui } from '../../../shared/cv-schema/i18n';
import { api, type ValidationCheck } from '../lib/api';
import { Button, SectionCard } from './common';

export default function CheckPanel() {
  const cv = useCvStore((s) => s.cv);
  const lang = useCvStore((s) => s.cv.settings.language);
  const [checks, setChecks] = useState<ValidationCheck[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.validate(cv);
      setChecks(result.checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The check could not run.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title={ui(lang, "cvCheck")}
      actions={
        <Button onClick={run} disabled={loading}>
          {loading ? ui(lang, 'checking') : ui(lang, 'runCheck')}
        </Button>
      }
    >
      <p className="mb-3 text-sm text-ink-2">{ui(lang, 'checkHint')}</p>
      {error && (
        <p role="alert" className="rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {checks && (
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2.5 rounded-md border border-line p-3 text-sm">
              {check.status === 'pass' && <FontAwesomeIcon icon={faCheck} className="mt-0.5 text-accent" aria-label="Pass" />}
              {check.status === 'warn' && <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-warning" aria-label="Warning" />}
              {check.status === 'fail' && <FontAwesomeIcon icon={faCircleXmark} className="mt-0.5 text-danger" aria-label="Missing" />}
              <span>{check.message}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
