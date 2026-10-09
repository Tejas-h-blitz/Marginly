import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { isClerkConfigured } from '../../context/ClerkProviderWrapper.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAsDemo, loginWithEmail } = useAuth();
  const { theme } = useTheme();
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

  const isDark = theme === 'dark';

  const clerkAppearance = isDark
    ? {
        baseTheme: dark,
        variables: {
          colorPrimary: '#f4f4f5',
          colorBackground: '#141518',
          colorInputBackground: '#0c0d0f',
          colorInputText: '#f4f4f5',
          colorText: '#f4f4f5',
          colorTextSecondary: '#a1a1aa',
          borderRadius: '0.5rem'
        },
        elements: {
          card: 'bg-transparent shadow-none border-0 p-0',
          formButtonPrimary: 'bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs py-2 rounded-lg',
          socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs rounded-lg py-2',
          formFieldInput: 'bg-zinc-900/80 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-100 focus:border-zinc-500',
          dividerLine: 'bg-zinc-800',
          footerActionLink: 'text-zinc-300 hover:text-white'
        }
      }
    : {
        variables: {
          colorPrimary: '#18181b',
          colorBackground: '#ffffff',
          colorInputBackground: '#f4f4f5',
          colorInputText: '#09090b',
          colorText: '#09090b',
          colorTextSecondary: '#71717a',
          borderRadius: '0.5rem'
        },
        elements: {
          card: 'bg-transparent shadow-none border-0 p-0',
          formButtonPrimary: 'bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs py-2 rounded-lg',
          socialButtonsBlockButton: 'bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs rounded-lg py-2',
          formFieldInput: 'bg-zinc-50 border border-zinc-200 text-xs rounded-lg px-3 py-2 text-zinc-900 focus:border-zinc-400',
          dividerLine: 'bg-zinc-200',
          footerActionLink: 'text-zinc-900 hover:underline'
        }
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close auth dialog"
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors z-20"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {clerkEnabled ? (
          /* Live Clerk Authentication Flow */
          <div className="flex flex-col items-center space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs mb-1">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  authMode === 'signin'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="w-full">
              {authMode === 'signin' ? (
                <SignIn
                  routing="hash"
                  fallbackRedirectUrl="#/app"
                  appearance={clerkAppearance as any}
                />
              ) : (
                <SignUp
                  routing="hash"
                  fallbackRedirectUrl="#/app"
                  appearance={clerkAppearance as any}
                />
              )}
            </div>

            <div className="w-full pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                ⚡ Test instantly with Demo Founder Pass
              </button>
            </div>
          </div>
        ) : (
          /* Standalone / Demo Login Form */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Sign in to Marginly
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Unit economics & margin tracking for founders.
              </p>
            </div>

            <form onSubmit={handleManualEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="alex@acme-ai.com"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium py-1.5 rounded-lg text-xs transition-colors"
              >
                Continue with Email
              </button>
            </form>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                ⚡ Launch Instant Demo Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
