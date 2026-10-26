import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible modal dialog with focus handling and Escape to close. */
export default function Modal({ open, onClose, title, children, footer = null, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previouslyFocused = document.activeElement;
    // Move focus into the dialog.
    const focusable = panelRef.current?.querySelector('input, textarea, select, button');
    focusable?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/50 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${sizes[size] || sizes.md} max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-card-hover animate-fade-in sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-navy-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-navy-100 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
