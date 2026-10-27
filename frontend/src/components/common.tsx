import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown, faEye, faEyeSlash, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-2">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-line bg-surface px-3 py-2 text-sm transition-colors focus:border-accent ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-line bg-surface px-3 py-2 text-sm transition-colors focus:border-accent ${props.className ?? ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent ${props.className ?? ''}`}
    />
  );
}

export function Button({
  children,
  variant = 'secondary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-accent text-white hover:bg-[#173d2e]',
    secondary: 'border border-line bg-surface hover:bg-bg',
    ghost: 'text-ink-2 hover:bg-bg',
    danger: 'border border-danger/30 text-danger hover:bg-danger/5',
  }[variant];
  return (
    <button
      {...rest}
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: Parameters<typeof FontAwesomeIcon>[0]['icon'];
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-md p-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'text-accent' : 'text-ink-2 hover:bg-bg hover:text-ink'
      }`}
    >
      <FontAwesomeIcon icon={icon} aria-hidden />
    </button>
  );
}

export { faPlus, faTrash, faArrowUp, faArrowDown, faEye, faEyeSlash, faWandMagicSparkles };

export function SectionCard({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-bg px-3 py-2 text-sm text-ink-2">{children}</p>;
}

export function AiImproveButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title ?? 'Improve with AI'}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
    >
      <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
      AI
    </button>
  );
}
