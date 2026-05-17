'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/labels';
import type { Goal } from '@/lib/api/goals';
import { GoalStatusBadge } from './GoalStatusBadge';
import { CATEGORY_COLORS } from '@/lib/constants/status-colors';
import { Target, Flag, AlertTriangle, ChevronRight, Users } from 'lucide-react';
import { STATUS_STYLES } from '@/lib/constants/status-colors';

export function GoalCard({ goal }: { goal: Goal }) {
  const initials = goal.thrust_area.slice(0, 2).toUpperCase();
  const catColor = CATEGORY_COLORS[goal.category] ?? '#64748b';
  const score = goal.computed_score;
  const isHighRisk = goal.ai_risk_flag === 'HIGH';
  const isShared = goal.is_shared;
  const statusColor = STATUS_STYLES[goal.status]?.text ?? 'var(--color-border-2)';
  const employeeName = goal.employee?.name;

  return (
    <Link href={`/goals/${goal.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] rounded-[var(--radius-lg)]">
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3, scale: 1.004 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="card group relative flex min-h-[88px] flex-col gap-4 p-5 transition-all duration-300 hover:bg-[var(--color-surface-2)] sm:flex-row sm:items-center"
        style={{
          border: isHighRisk ? '1px solid rgba(220, 38, 38, 0.3)' : undefined,
        }}
      >
        {isHighRisk && (
          <div className="absolute right-0 top-0 overflow-hidden rounded-tr-[var(--radius-lg)]">
            <div className="absolute -right-6 -top-6 h-12 w-12 rotate-45 bg-[var(--color-danger-bg)]" />
            <AlertTriangle className="absolute right-1.5 top-1.5 z-10 text-[var(--color-danger)]" size={12} />
          </div>
        )}

        <div className="flex flex-1 items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${catColor}cc, ${catColor})`,
              boxShadow: `0 4px 10px ${catColor}33`
            }}
          >
            {initials}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--color-text-1)]">
                {goal.title}
              </h3>
              {isShared && (
                <span className="badge bg-[var(--color-accent-dim)] text-[var(--color-accent)] text-[10px]">
                  <Users size={10} className="inline mr-1" /> Shared
                </span>
              )}
              {employeeName && (
                <span className="text-[11px] text-[var(--color-text-3)]">{employeeName}</span>
              )}
            </div>
            {goal.description && (
              <p className="mt-1 line-clamp-1 text-[13px] text-[var(--color-text-2)]">{goal.description}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--color-text-2)] font-medium">
              <span className="flex items-center gap-1">
                <Target size={14} /> {goal.thrust_area}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Flag size={14} /> Due {formatDate(goal.deadline)}
              </span>
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.weightage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: statusColor }}
                />
              </div>
              <span className="text-[12px] font-medium text-[var(--color-text-2)]">
                Weight {goal.weightage}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex shrink-0 flex-row items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2">
          <GoalStatusBadge status={goal.status} />
          {score != null ? (
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[24px] font-bold tracking-tight text-[var(--color-text-1)]">
                {Math.round(score)}
              </span>
              <span className="text-[11px] font-medium text-[var(--color-text-3)] uppercase tracking-wider">Score</span>
            </div>
          ) : (
             <div className="flex flex-col items-end gap-0.5 opacity-70" title="Score will be computed after lock">
               <span className="font-mono text-[20px] font-semibold tracking-tight text-[var(--color-text-3)]">—</span>
               <span className="text-[11px] font-medium text-[var(--color-text-3)]">Not scored yet</span>
             </div>
          )}
          <ChevronRight size={18} className="hidden text-[var(--color-text-3)] transition-colors group-hover:text-[var(--color-text-2)] sm:block" />
        </div>
      </motion.article>
    </Link>
  );
}
