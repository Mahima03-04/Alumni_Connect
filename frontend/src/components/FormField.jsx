import { forwardRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

/** Accessible label + error wrapper used by every form control. */
export function Field({ label, htmlFor, error, required = false, hint = '', children, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
      {error ? (
        <p className="field-error">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {typeof error === 'string' ? error : error.message}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ error, className = '', ...props }, ref) {
  return <input ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />;
});

export const TextArea = forwardRef(function TextArea({ error, className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ error, className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} {...props}>
      {children}
    </select>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, error, className = '', ...props }, ref) {
  return (
    <label className={`flex items-center gap-2.5 text-sm text-navy-700 ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="h-4 w-4 rounded border-navy-300 text-royal-600 focus:ring-royal-500"
        {...props}
      />
      <span>{label}</span>
      {error ? <span className="text-xs text-red-600">{typeof error === 'string' ? error : error.message}</span> : null}
    </label>
  );
});

/**
 * Free-form tag editor for array fields such as skills and interests.
 * Commas or Enter add a tag; the small x removes one.
 */
export function TagInput({ id, value = [], onChange, placeholder = 'Type and press Enter', error, max = 60, className = '' }) {
  const [draft, setDraft] = useState('');

  const commit = (raw) => {
    const parts = String(raw)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((part) => {
      if (!next.includes(part) && next.length < max) next.push(part);
    });
    onChange(next);
    setDraft('');
  };

  const remove = (tag) => onChange(value.filter((item) => item !== tag));

  return (
    <div className={className}>
      <div className={`input flex min-h-[46px] flex-wrap items-center gap-2 py-2 ${error ? 'input-error' : ''}`}>
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700">
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="rounded-full text-navy-400 hover:text-navy-700"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none"
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(event) => {
            const val = event.target.value;
            if (val.endsWith(',')) commit(val);
            else setDraft(val);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(draft);
            } else if (event.key === 'Backspace' && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => commit(draft)}
        />
      </div>
      {error ? <p className="field-error">{typeof error === 'string' ? error : error.message}</p> : null}
    </div>
  );
}

/** Two column responsive grid for grouping form fields. */
export function FormGrid({ children, className = '' }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>;
}

/** Footer row with submit / cancel buttons. */
export function FormActions({ children, className = '' }) {
  return <div className={`mt-6 flex flex-wrap items-center justify-end gap-2 ${className}`}>{children}</div>;
}
