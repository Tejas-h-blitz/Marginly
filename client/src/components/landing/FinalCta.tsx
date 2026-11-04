import React from 'react';

interface FinalCtaProps {
  onLaunchApp: () => void;
  feedbackHref: string | null;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onLaunchApp, feedbackHref }) => (
  <section id="get-started" className="landing-section-enter scroll-mt-24 py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="landing-feature-card relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#121316] sm:p-10">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Free during early access
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Make your next usage export easier to understand.
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Upload a usage CSV and review costs by customer.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
            <button
              type="button"
              onClick={onLaunchApp}
              className="interaction-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white md:w-auto"
            >
              Upload your usage CSV <span aria-hidden="true">→</span>
            </button>
            {feedbackHref && (
              <a href={feedbackHref} className="text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:decoration-zinc-700 dark:hover:text-zinc-100">
                Give feedback
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);
