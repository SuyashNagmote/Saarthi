'use client';

import { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
};

export function AnimatedNumber({
  value,
  duration = 720,
  decimals = 0,
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered value
  }, [value, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return <span className={`tabular-nums ${className}`.trim()}>{formatted}</span>;
}
