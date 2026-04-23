import { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

/** See docs/privacy-policy-modal-pattern.md and docs/replicate-footer-privacy-text-link.md */
const PRIVACY_POLICY_PDF = `/assets/${encodeURIComponent('Zion HealthShare Privacy Policy.pdf')}`;

/**
 * Muted inline text control that opens the Zion HealthShare privacy PDF in a modal (not a navigation link).
 */
export default function ZionPrivacyPolicyFooterLink() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline p-0 m-0 align-baseline border-0 bg-transparent text-xs text-gray-500 hover:text-gray-600 hover:underline font-normal cursor-pointer"
      >
        Privacy Policy | Zion HealthShare
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative z-10 flex h-[722px] max-h-[90vh] w-[896px] max-w-[min(896px,calc(100vw-1rem))] min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zion-privacy-policy-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <h2
                id="zion-privacy-policy-title"
                className="pr-2 text-lg font-semibold text-gray-900 sm:text-xl"
              >
                Privacy Policy | Zion HealthShare
              </h2>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <a
                  href={PRIVACY_POLICY_PDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-blue-800 hover:bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close privacy policy"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
              <iframe
                title="Zion HealthShare Privacy Policy PDF"
                src={PRIVACY_POLICY_PDF}
                className="h-full w-full rounded border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
