import React from 'react';
import { DataSection } from './DataSection.js';
import { FinalCta } from './FinalCta.js';
import { Footer } from './Footer.js';
import { HeroSection } from './HeroSection.js';
import { HowItWorks } from './HowItWorks.js';
import { LandingNavbar } from './LandingNavbar.js';
import { ModelRateTicker } from './ModelRateTicker.js';
import { ProductShowcase } from './ProductShowcase.js';
import { WhatYouGet } from './WhatYouGet.js';
import { FEEDBACK_HREF } from './feedback.js';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onOpenAuth }) => (
  <div className="app-canvas min-h-screen font-sans text-zinc-900 dark:text-zinc-100">
    <LandingNavbar onLaunchApp={onLaunchApp} onOpenAuth={onOpenAuth} />
    <main>
      <HeroSection onLaunchApp={onLaunchApp} />
      <HowItWorks />
      <ProductShowcase onLaunchApp={onLaunchApp} />
      <WhatYouGet />
      <ModelRateTicker />
      <DataSection />
      <FinalCta onLaunchApp={onLaunchApp} feedbackHref={FEEDBACK_HREF} />
    </main>
    <Footer feedbackHref={FEEDBACK_HREF} />
  </div>
);
