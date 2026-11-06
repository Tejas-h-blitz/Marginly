import React, { useEffect, useState } from 'react';
import { UserButton } from '@clerk/react';
import { useTheme } from '../../context/ThemeContext.js';
import { isClerkConfigured } from '../../context/ClerkProviderWrapper.js';
import { InlineSpinner } from '../InlineSpinner.js';
import { BrandLogo } from '../BrandLogo.js';

interface AppNavbarProps {
  onOpenPricing: () => void;
  onClearData: () => void;
  onBackToLanding: () => void;
  totalCustomers: number;
  clearing?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  onOpenPricing,
  onClearData,
  onBackToLanding,
  totalCustomers,
  clearing = false
}) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 4);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className="dashboard-navbar sticky top-0 z-40 bg-transparent px-4 pb-2.5 pt-3 sm:px-6 sm:pt-5">
      <div className={`dashboard-navbar-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-colors duration-200 sm:px-6 ${
        scrolled
          ? 'border-zinc-200/60 dark:border-white/15'
          : 'border-zinc-200/40 dark:border-white/10'
      }`}>
        {/* Left Section: Logo */}
        <button
          onClick={onBackToLanding}
          className="flex shrink-0 items-center rounded-lg p-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          title="Return to Landing Page"
          aria-label="Marginly home"
        >
          <BrandLogo className="w-[96px]" />
        </button>

        {/* Right Section: Actions, Theme Toggle & User */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Model Pricing Rate Card */}
          <button
            onClick={onOpenPricing}
            className="hidden md:flex min-h-10 items-center gap-2 px-3 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span>Model Rates</span>
          </button>

          {/* Return to home */}
          <button
            onClick={onBackToLanding}
            aria-label="Go to home"
            title="Go to home"
            className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <svg className="w-[18px] h-[18px] stroke-current fill-none stroke-2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 9v11h14V9M9 20v-6h6v6" />
            </svg>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {theme === 'dark' ? (
              // Sun icon for light mode
              <svg className="w-[18px] h-[18px] stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg className="w-[18px] h-[18px] stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Clear Data (if records exist) */}
          {totalCustomers > 0 && (
            <button
              onClick={onClearData}
              disabled={clearing}
              aria-busy={clearing}
              className="h-10 w-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-zinc-200/80 dark:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
              title="Clear all stored logs"
              aria-label="Clear all stored logs"
            >
              {clearing ? <InlineSpinner label="Clearing data" /> : <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>}
            </button>
          )}

          {/* User Profile Avatar & Dropdown */}
          {isClerkConfigured() ? (
            <div className="flex items-center ml-0.5">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8 rounded-lg ring-1 ring-zinc-300 dark:ring-zinc-700'
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
