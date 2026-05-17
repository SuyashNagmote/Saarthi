'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon && (
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-40"
            style={{ background: 'var(--color-accent)' }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-[var(--shadow-sm)]">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text-1)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--color-text-2)]">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" className="btn-primary mt-6" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
