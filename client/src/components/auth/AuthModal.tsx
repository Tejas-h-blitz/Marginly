import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useAuth } from '../../context/AuthContext.js';
import { isClerkConfigured } from '../../context/ClerkProviderWrapper.js';

const clerkDarkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#10b981',
    colorBackground: '#0b0f17',
    colorInputBackground: '#07090e',
    colorInputText: '#ffffff',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '1rem'
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-slate-900/95 border border-white/10 shadow-2xl rounded-3xl w-full',
    headerTitle: 'text-white font-extrabold text-lg',
    headerSubtitle: 'text-slate-400 text-xs',
    socialButtonsBlockButton: 'bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-xs rounded-xl py-2.5',
    socialButtonsBlockButtonText: 'text-white font-medium text-xs',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-500 text-[11px]',
    formFieldLabel: 'text-slate-300 text-xs font-medium',
    formFieldInput: 'bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-emerald-500',
    formButtonPrimary: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-500/20',
    footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold',
    footer: 'bg-slate-900 border-t border-white/5 rounded-b-3xl'
  }
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAsDemo, loginWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const clerkEnabled = isClerkConfigured();

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    loginAsDemo();
    onSuccess();
    onClose();
  };

  const handleManualEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    loginWithEmail(emailInput.trim());
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 sm:p-7 backdrop-blur-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all z-20"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {clerkEnabled ? (
          /* Live Clerk Authentication Flow */
          <div className="flex flex-col items-center space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs mb-2">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                  authMode === 'signin' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                  authMode === 'signup' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {authMode === 'signin' ? (
              <SignIn
                routing="hash"
                fallbackRedirectUrl="#/app"
                appearance={clerkDarkAppearance as any}
              />
            ) : (
              <SignUp
                routing="hash"
                fallbackRedirectUrl="#/app"
                appearance={clerkDarkAppearance as any}
              />
            )}

            <div className="w-full mt-4 pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                ⚡ Or test instantly with Demo Founder Pass
              </button>
            </div>
          </div>
        ) : (
          /* Clerk Scaffolding & Setup Guide (when key is pending in .env) */
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-indigo via-brand-emerald to-emerald-400 p-[1px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Sign in to Marginly</h3>
              <p className="text-xs text-slate-400">
                Clerk Authentication Scaffolded &amp; Ready
              </p>
            </div>

            {/* 1-Click Demo Founder Login (Always Available) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-brand-indigo/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>⚡</span> Instant Demo Access
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Zero Waiting
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Explore the complete SaaS platform right now as a demo founder.
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <span>Continue as Demo Founder</span>
                <svg className="w-4 h-4 stroke-slate-950 fill-none stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Clerk Keys Setup Notice Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Connect Live Clerk Account</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To activate live Google OAuth, GitHub OAuth, and email verification, paste your Clerk Publishable Key in <code className="text-emerald-400 font-mono">.env</code>:
              </p>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-slate-300 select-all overflow-x-auto">
                VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
              </div>
            </div>

            {/* Quick Email Form */}
            <form onSubmit={handleManualEmail} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Email (Quick Login)
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="founder@yourcompany.com"
                  required
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-all"
              >
                Sign In with Email
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
