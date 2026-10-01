import React from 'react';

interface FooterProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchApp, onOpenAuth }) => {
  return (
    <footer className="border-t border-white/[0.08] bg-slate-950/80 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/[0.08]">
          
          {/* Brand Info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-emerald to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-dark-bg rounded-[11px] flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">Marginly</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS v1.2
              </span>
            </div>

            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Real-time per-customer LLM cost intelligence and margin protection for AI SaaS founders. Built with TypeScript, Express, Prisma, PostgreSQL, React, Tailwind CSS, and Recharts.
            </p>

            {/* Live System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (PostgreSQL Connected)</span>
            </div>
          </div>

          {/* Column: Product */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-sm">Product</div>
            <ul className="space-y-2">
              <li>
                <button onClick={onLaunchApp} className="hover:text-white transition-colors">
                  Interactive Dashboard
                </button>
              </li>
              <li><a href="#features" className="hover:text-white transition-colors">Whale Detection</a></li>
              <li><a href="#models" className="hover:text-white transition-colors">15+ Model Rate Cards</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Column: Platform & Stack */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-sm">Tech Stack</div>
            <ul className="space-y-2">
              <li className="text-slate-300">TypeScript (Strict)</li>
              <li className="text-slate-300">Node.js + Express</li>
              <li className="text-slate-300">Prisma ORM</li>
              <li className="text-slate-300">PostgreSQL</li>
              <li className="text-slate-300">React + Vite + Recharts</li>
            </ul>
          </div>

          {/* Column: Account & Legal */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-sm">Access</div>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenAuth} className="hover:text-white transition-colors">
                  Sign In / Demo Login
                </button>
              </li>
              <li><a href="#faq" className="hover:text-white transition-colors">Privacy &amp; Security</a></li>
              <li className="text-slate-500">Zero Prompt Retention</li>
              <li className="text-slate-500">Self-Hosted Ready</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Marginly. AI Usage Cost Tracker &amp; Margin Intelligence.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
