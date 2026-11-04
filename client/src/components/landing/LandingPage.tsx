import React from 'react';
import { LandingNavbar } from './LandingNavbar.js';
import { HeroSection } from './HeroSection.js';
import { ProductShowcase } from './ProductShowcase.js';
import { ModelRateTicker } from './ModelRateTicker.js';
import { Footer } from './Footer.js';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenAuth
}) => {
  return (
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0c0d0f] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <LandingNavbar onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
      <main className="flex-1">
        <HeroSection onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
        <ProductShowcase onLaunchApp={onLaunchApp} />
        <ModelRateTicker />
      </main>
      <Footer />
    </div>
  );
};
