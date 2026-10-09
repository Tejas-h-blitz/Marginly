import React from 'react';
import { useTheme } from '../../context/ThemeContext.js';

interface LandingNavbarProps {
  onOpenAuth: () => void;
  onLaunchApp: () => void;
  isAuthenticated: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenAuth,
  onLaunchApp,
  isAuthenticated
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0c0d0f]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-100 dark:text-zinc-950 font-bold shadow-sm">
            <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Marginly
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <button
              onClick={onLaunchApp}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs shadow-sm transition-all"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAuth}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onLaunchApp}
                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs shadow-sm transition-all"
              >
                Launch Demo
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
