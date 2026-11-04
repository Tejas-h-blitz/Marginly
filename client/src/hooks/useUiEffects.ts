import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';

type SpotlightHandlers = {
  onMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
};

export function useCardSpotlight(): SpotlightHandlers {
  const frame = useRef(0);
  const pointer = useRef<{ element: HTMLElement; x: number; y: number } | null>(null);
  const onMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (
      !window.matchMedia('(hover: hover)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;
    pointer.current = { element: event.currentTarget, x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const current = pointer.current;
      if (!current) return;
      const bounds = current.element.getBoundingClientRect();
      current.element.style.setProperty('--mx', `${current.x - bounds.left}px`);
      current.element.style.setProperty('--my', `${current.y - bounds.top}px`);
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { onMouseMove };
}

export function useCountUp(value: string, duration = 700): string {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef<string | null>(null);

  useEffect(() => {
    const match = value.match(/^(\$?)(-?\d[\d,]*(?:\.\d+)?)(%|M|k| accounts)?$/);
    if (!match) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const [, prefix, numericText, suffix = ''] = match;
    const decimals = numericText.split('.')[1]?.length ?? 0;
    const multiplier = suffix === 'M' ? 1_000_000 : suffix === 'k' ? 1_000 : 1;
    const target = Number(numericText.replace(/,/g, '')) * multiplier;
    const previousMatch = previousValue.current?.match(/^(\$?)(-?\d[\d,]*(?:\.\d+)?)(%|M|k| accounts)?$/);
    const previousMultiplier = previousMatch?.[3] === 'M'
      ? 1_000_000
      : previousMatch?.[3] === 'k'
        ? 1_000
        : 1;
    const start = previousMatch
      ? Number(previousMatch[2].replace(/,/g, '')) * previousMultiplier
      : 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let startTime = 0;

    const format = (number: number, final = false) => {
      if (final) return value;
      const displayed = number / multiplier;
      const formatted = displayed.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return `${prefix}${formatted}${suffix}`;
    };

    if (reducedMotion || duration <= 0) {
      setDisplayValue(value);
    } else {
      setDisplayValue(format(start));
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min(1, (time - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(format(start + (target - start) * eased, progress === 1));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }

    previousValue.current = value;
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayValue;
}

type TiltHandlers = {
  onMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: (event: React.MouseEvent<HTMLElement>) => void;
};

export type RangeProgressStyle = React.CSSProperties & { '--range-progress': string };

export function rangeProgressStyle(value: number, min: number, max: number): RangeProgressStyle {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return { '--range-progress': `${percent}%` } as RangeProgressStyle;
}

export function usePreviewTilt(): TiltHandlers {
  const onMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (
      !window.matchMedia('(hover: hover)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--tilt-x', `${-y * 8}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${x * 8}deg`);
  };
  const onMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };
  return { onMouseMove, onMouseLeave };
}
