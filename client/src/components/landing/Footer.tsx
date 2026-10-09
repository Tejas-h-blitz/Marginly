import React from 'react';

interface FooterProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchApp, onOpenAuth }) => {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#0c0d0f] py-10 text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-100 dark:text-zinc-950 font-bold text-[10px]">
            M
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Marginly
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span>LLM unit economics for SaaS founders</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={onLaunchApp}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium"
          >
            Launch Demo
          </button>
          <button
            onClick={onOpenAuth}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium"
          >
            Sign In
          </button>
          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
};
