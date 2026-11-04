import React from 'react';

interface InlineSpinnerProps {
  label?: string;
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({ label }) => (
  <span
    className="inline-flex h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
    role={label ? 'status' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  />
);
