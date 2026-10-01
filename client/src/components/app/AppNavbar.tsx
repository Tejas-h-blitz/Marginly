import React, { useState } from 'react';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext.js';
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border px-4 sm:px-6 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Section: Logo & Workspace Selector */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 text-left group"
            title="Return to Landing Page"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-emerald to-emerald-400 p-[1px] shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all">
              <div className="w-full h-full bg-dark-bg rounded-[11px] flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold text-white tracking-tight">Marginly</span>
            </div>
          </button>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Workspace Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-secondary/80 border border-dark-border hover:border-white/20 text-xs font-semibold text-slate-200 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[130px] sm:max-w-none truncate">{workspace.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {workspace.tier}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>
                <button
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-xs text-white font-medium"
                >
                  <span>Acme AI / Production</span>
                  <span className="text-emerald-400">✓</span>
                </button>
                <button
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-400 font-medium"
                >
                  <span>Staging / Sandbox</span>
                  <span className="text-[10px] text-slate-500">Free</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions & User Avatar */}
        <div className="flex items-center gap-2.5">
          
          {/* Import Logs Button (Highlighted) */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
          >
            <svg className="w-3.5 h-3.5 stroke-slate-950 fill-none stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Import Logs</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* Model Pricing Rate Card */}
          <button
            onClick={onOpenPricing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-secondary hover:bg-slate-800 border border-dark-border text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span>Model Rates</span>
          </button>

          {/* Clear Data (if records exist) */}
          {totalCustomers > 0 && (
            <button
              onClick={onClearData}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
              title="Clear all stored logs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Landing Page Link Button */}
          <button
            onClick={onBackToLanding}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <span>Landing Page</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* User Profile Avatar & Dropdown */}
          {isClerkConfigured() ? (
            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-7 h-7 ring-2 ring-emerald-500/30'
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-indigo to-emerald-400 p-[1px]">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-[11px] text-white">
                    {user ? user.name.slice(0, 2).toUpperCase() : 'DF'}
                  </div>
                </div>
              </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <div className="text-xs font-bold text-white">{user?.name || 'Demo Founder'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email || 'founder@demo.ai'}</div>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onBackToLanding();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-300 font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Marketing Page</span>
                </button>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenPricing();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-xs text-slate-300 font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  <span>Model Pricing</span>
                </button>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    onBackToLanding();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-xs text-rose-400 font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
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
