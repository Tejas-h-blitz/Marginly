import React from 'react';
import { LandingNavbar } from './LandingNavbar.js';
import { HeroSection } from './HeroSection.js';
import { ProductShowcase } from './ProductShowcase.js';
import { BentoFeatures } from './BentoFeatures.js';
import { ModelRateTicker } from './ModelRateTicker.js';
import { PricingSection } from './PricingSection.js';
import { FaqSection } from './FaqSection.js';
import { Footer } from './Footer.js';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenAuth,
  isAuthenticated
}) => {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <LandingNavbar
        onOpenAuth={onOpenAuth}
        onLaunchApp={onLaunchApp}
        isAuthenticated={isAuthenticated}
      />
      <main className="flex-1">
        <HeroSection onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
        <ProductShowcase onLaunchApp={onLaunchApp} />
        <BentoFeatures />
        <ModelRateTicker />
        <PricingSection onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
        <FaqSection />
      </main>
      <Footer onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
    </div>
  );
};
