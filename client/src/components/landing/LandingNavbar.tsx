import React, { useEffect, useState } from 'react';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { isClerkConfigured } from '../../context/ClerkProviderWrapper.js';

interface LandingNavbarProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLaunchApp, onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 4);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b bg-white/96 backdrop-blur-md transition-[background-color,border-color] duration-200 dark:bg-[#0c0d0f]/96 ${
      scrolled
        ? 'border-zinc-200/80 dark:border-zinc-800/80'
        : 'border-transparent'
    }`}>
      <div className="flex w-full items-center justify-between gap-4 px-5 py-2.5 sm:px-8 lg:px-12 xl:px-16">
        <a href="#top" className="inline-flex min-h-9 shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" aria-hidden="true">
            <svg className="h-4 w-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Marginly</span>
        </a>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="h-4 w-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={onLaunchApp} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white">
              Dashboard
            </button>
          ) : (
            <button type="button" onClick={onOpenAuth} className="inline-flex min-h-8 items-center rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white">
              Sign in
            </button>
          )}
          {isClerkConfigured() && isAuthenticated && (
            <div className="ml-0.5 flex items-center">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-8 w-8 rounded-lg ring-1 ring-zinc-300 dark:ring-zinc-700' } }} />
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
