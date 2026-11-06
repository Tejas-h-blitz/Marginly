import React from 'react';
import { useTheme } from '../context/ThemeContext.js';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const logo = theme === 'dark' ? '/marginly-logo-on-dark.png' : '/marginly-logo-on-light.png';

  return <img src={logo} alt="Marginly" className={`h-auto object-contain ${className}`} />;
};
