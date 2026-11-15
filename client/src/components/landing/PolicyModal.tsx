import React, { useEffect } from 'react';

export type PolicyName = 'privacy' | 'terms' | null;

interface PolicyModalProps {
  policy: PolicyName;
  onClose: () => void;
}

const POLICY_CONTENT = {
  privacy: {
    title: 'Privacy notice',
    sections: [
      {
        heading: 'Information Marginly processes',
        body: 'Marginly processes the customer identifiers, model names, input and output token counts, and timestamps in usage files, plus any monthly revenue and custom pricing rates you enter. Import history stores source names, record counts, and import dates. Authentication is provided by Clerk; Marginly receives the verified account identifier used to separate your records.'
      },
      {
        heading: 'Uploaded files',
        body: 'Uploaded files and pasted content are transmitted to the Marginly service and processed in memory. Marginly stores supported usage fields, not prompt or completion text. Do not include prompt contents, responses, secrets, or other data that is not needed for cost analysis.'
      },
      {
        heading: 'Use, separation, and deletion',
        body: 'Your account data is used to calculate cost and margin reports and provide import, pricing, and export features. Application queries scope account records to the verified user. The dashboard clear action deletes your usage records, customer and revenue records, import history, and account-specific pricing rates from the active application database. It does not delete your Clerk account or guarantee removal of infrastructure logs or backups.'
      },
      {
        heading: 'Deployment details to confirm before publication',
        body: 'The service operator must complete this draft with the production hosting and database providers, processing locations, retention periods for logs and backups, contact details, and any applicable user-rights process. Those operational details are deployment-specific and are not asserted here.'
      }
    ]
  },
  terms: {
    title: 'Terms of use',
    sections: [
      {
        heading: 'Draft for review',
        body: 'These draft terms describe the intended use of Marginly and are not final legal terms. The service operator should have them reviewed and completed before publication, including governing law, contact information, availability commitments, and any required notices.'
      },
      {
        heading: 'Appropriate use and submitted data',
        body: 'Use Marginly only with data you are authorized to process. Prefer pseudonymous customer identifiers and submit only the fields needed for analysis. You remain responsible for the accuracy and lawful use of data you upload or enter.'
      },
      {
        heading: 'Reports are estimates',
        body: 'Marginly calculates costs from token counts and configured pricing versions. Provider billing may differ because of model variants, discounts, caching, rounding, rate changes, or other provider-specific rules. Unpriced models are excluded from cost totals and must not be interpreted as zero-cost usage. Verify results against provider invoices before making financial decisions.'
      },
      {
        heading: 'Account data controls',
        body: 'You may export customer breakdowns and clear supported account data from the dashboard. Clearing is irreversible for the active application database and does not delete your Clerk account or necessarily remove operational logs or backups.'
      }
    ]
  }
} as const;

export const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  useEffect(() => {
    if (!policy) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, policy]);

  if (!policy) return null;

  const content = POLICY_CONTENT[policy];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-title"
        className="max-h-[min(85vh,760px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-[#121316] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
              Draft — legal review required
            </p>
            <h2 id="policy-title" className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close policy"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="mt-6 space-y-5">
          {content.sections.map(section => (
            <section key={section.heading}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
};
