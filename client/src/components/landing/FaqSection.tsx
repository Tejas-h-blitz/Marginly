import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Does Marginly store our raw LLM prompts or sensitive messages?',
    answer: 'Never. Marginly only ingests numerical token counts, customer identifiers, model identifiers, and timestamps. Your proprietary prompts, training data, and user messages never touch our database or code.'
  },
  {
    question: 'How are OpenAI and Anthropic costs calculated?',
    answer: 'Marginly uses a normalized rate card across 15+ models. We calculate prompt input costs and generation output costs separately using the exact official per-1,000 token rates. You can also view or override rates in the Pricing modal.'
  },
  {
    question: 'Can I connect my own hosted PostgreSQL database (Supabase / Neon / AWS RDS)?',
    answer: 'Yes! Marginly runs on Prisma. You can simply edit the DATABASE_URL in your .env file to point to your hosted PostgreSQL instance. If no external database is detected, Marginly seamlessly runs with a local embedded PostgreSQL engine.'
  },
  {
    question: 'Can I export reports for my finance or accounting team?',
    answer: 'Yes. With one click on "Export CSV Report", Marginly generates a clean spreadsheet containing Customer ID, total requests, input tokens, output tokens, total cost, average cost per request, and percentage share of your bill.'
  },
  {
    question: 'How does Whale Customer Detection protect gross margins?',
    answer: 'In most SaaS models, customers pay a flat subscription fee. If a power user consumes $60/month in LLM tokens on a $49/month tier, you are paying out of pocket to serve them. Marginly automatically flags these accounts so you can adjust rate limits or transition them to usage-based billing.'
  }
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 relative bg-slate-950/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Everything you need to know about tracking LLM unit economics.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-white hover:text-emerald-300 transition-colors"
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 shrink-0 transform transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
