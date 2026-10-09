import React, { useState } from 'react';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { isClerkConfigured } from '../../context/ClerkProviderWrapper.js';

interface AppNavbarProps {
  onOpenImport: () => void;
  onOpenPricing: () => void;
  onClearData: () => void;
  onBackToLanding: () => void;
  totalCustomers: number;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  onOpenImport,
  onOpenPricing,
  onClearData,
  onBackToLanding,
  totalCustomers
}) => {
  const { user, workspace, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0c0d0f]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Section: Logo & Workspace Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-lg p-0.5"
            title="Return to Landing Page"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-100 dark:text-zinc-950 font-bold transition-all shadow-sm">
              <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Marginly
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-700/60">
                SaaS Instrument
              </span>
            </div>
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Workspace Selector */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100/70 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="max-w-[120px] sm:max-w-none truncate text-[11px] font-mono">{workspace.name}</span>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                ({workspace.tier})
              </span>
              <svg className="w-3 h-3 text-zinc-400 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                  Active Workspace
                </div>
                <button
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800/60 text-xs text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <span className="truncate">{workspace.name}</span>
                  <span className="text-zinc-600 dark:text-zinc-300 text-xs">✓</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions, Theme Toggle & User */}
        <div className="flex items-center gap-2">
          
          {/* Model Pricing Rate Card */}
          <button
            onClick={onOpenPricing}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span>Model Rates</span>
          </button>

          {/* Landing Page Link Button */}
          <button
            onClick={onBackToLanding}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
          >
            <span>Landing</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            {theme === 'dark' ? (
              // Sun icon for light mode
              <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Clear Data (if records exist) */}
          {totalCustomers > 0 && (
            <button
              onClick={onClearData}
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-zinc-200/80 dark:border-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              title="Clear all stored logs"
              aria-label="Clear all stored logs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Import Logs Button (Primary Action) */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium px-3 py-1.5 rounded-md text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Import Logs</span>
          </button>

          {/* User Profile Avatar & Dropdown */}
          {isClerkConfigured() ? (
            <div className="flex items-center ml-1">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-6 h-6 rounded-md ring-1 ring-zinc-300 dark:ring-zinc-700'
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative ml-1">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  {user ? user.name.slice(0, 2).toUpperCase() : 'DF'}
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50">
                  <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user ? user.name : 'Founder'}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate">
                      {user ? user.email : 'alex@acme-ai.com'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      onBackToLanding();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-xs text-rose-600 dark:text-rose-400 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
