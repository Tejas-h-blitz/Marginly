import React from 'react';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';

const CLERK_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' &&
    ((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ||
     (import.meta as any).env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) ||
  '';

export const isClerkConfigured = (): boolean => {
  return typeof CLERK_PUBLISHABLE_KEY === 'string' && CLERK_PUBLISHABLE_KEY.trim().startsWith('pk_');
};

export const ClerkProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured()) {
    return (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: dark
        } as any}
      >
        {children}
      </ClerkProvider>
    );
  }

  return <>{children}</>;
};
