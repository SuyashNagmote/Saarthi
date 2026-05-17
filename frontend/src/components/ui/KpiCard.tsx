'use client';

import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

type KpiCardProps = {
  label: string;
  value: number;
  suffix?: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  valueColor?: string;
  decimals?: number;
  animate?: boolean;
};

export function KpiCard({
  label,
  value,
  suffix,
  sub,
  accent = 'var(--color-accent)',
  valueColor,
  decimals = 0,
  animate = true,
}: KpiCardProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      className="kpi-card"
      style={{ borderTop: 'none', borderLeft: `3px solid ${accent}` }}
    >
      <p className="kpi-label">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="kpi-value" style={{ color: valueColor }}>
          {animate ? (
            <AnimatedNumber value={value} decimals={decimals} />
          ) : (
            <span className="tabular-nums">
              {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
            </span>
          )}
        </span>
        {suffix}
      </div>
      {sub ? <div className="kpi-sub mt-1">{sub}</div> : null}
    </motion.div>
  );
}
