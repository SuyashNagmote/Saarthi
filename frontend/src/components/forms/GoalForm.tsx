'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, Loader2 } from 'lucide-react';
import { goalFormSchema, type GoalFormValues } from '@/lib/validations/goal.schema';
import { WeightageBar } from '@/components/common/WeightageBar';
import { checkTitle, getWeightageSummary } from '@/lib/api/goals';
import { generateGoalAI } from '@/lib/api/ai';
import { useAuthStore } from '@/lib/stores/auth.store';
import type { WeightageSummary } from '@/lib/api/goals';

const UOM_OPTIONS = [
  { value: 'NUMERIC', label: 'Numeric' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'TIMELINE', label: 'Timeline' },
  { value: 'ZERO_BASED', label: 'Zero-based' },
] as const;

function goalTypesForUom(uom: string) {
  if (uom === 'TIMELINE') return [{ value: 'TIMELINE', label: 'Timeline' }];
  if (uom === 'ZERO_BASED') return [{ value: 'ZERO_BASED', label: 'Zero-based' }];
  return [
    { value: 'MIN_TYPE', label: 'Minimum (higher is better)' },
    { value: 'MAX_TYPE', label: 'Maximum (lower is better)' },
  ];
}

function targetLabel(uom: string, goalType: string) {
  if (uom === 'PERCENTAGE') return 'Target percentage (e.g. 90)';
  if (uom === 'TIMELINE') return 'Deadline is the target';
  if (goalType === 'ZERO_BASED') return 'Zero incidents required';
  return 'Target number (e.g. 1,200,000)';
}

export function GoalForm({
  defaultValues,
  goalId,
  isShared,
  onSubmit,
  submitLabel = 'Save goal',
}: {
  defaultValues?: Partial<GoalFormValues>;
  goalId?: string;
  isShared?: boolean;
  onSubmit: (values: GoalFormValues) => Promise<void>;
  submitLabel?: string;
}) {
  const [summary, setSummary] = useState<WeightageSummary | null>(null);
  const [titleWarning, setTitleWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const user = useAuthStore((s) => s.user);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      uom_type: 'NUMERIC',
      goal_type: 'MIN_TYPE',
      category: 'Strategic',
      weightage: 25,
      thrust_area: 'Engineering',
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  const uom = form.watch('uom_type');
  const goalType = form.watch('goal_type');
  const weightage = form.watch('weightage');
  const title = form.watch('title');
  const category = form.watch('category');

  const loadSummary = useCallback(async () => {
    try {
      const data = await getWeightageSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const types = goalTypesForUom(uom);
    if (!types.some((t) => t.value === goalType)) {
      form.setValue('goal_type', types[0]!.value as GoalFormValues['goal_type']);
    }
    if (uom === 'TIMELINE') form.setValue('goal_type', 'TIMELINE');
    if (uom === 'ZERO_BASED') form.setValue('goal_type', 'ZERO_BASED');
  }, [uom, goalType, form]);

  useEffect(() => {
    if (!title || title.length < 3) {
      setTitleWarning(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { duplicate } = await checkTitle(title, goalId);
        setTitleWarning(
          duplicate ? `A goal titled '${title}' already exists in this cycle.` : null
        );
      } catch {
        setTitleWarning(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title, goalId]);

  async function handleSubmit(values: GoalFormValues) {
    if (titleWarning) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAIGenerate() {
    if (!title || title.length < 3 || !user) return;
    setGenerating(true);
    try {
      const response = await generateGoalAI({
        title,
        department: user.department,
        designation: user.designation,
        cycle_name: 'Current Cycle', // Simplified for demo
        existing_goals: summary?.goals.map(g => ({ title: g.title, weightage: g.weightage })) || []
      });

      // Typewriter effect function
      const typeText = async (field: 'thrust_area' | 'description', text: string) => {
        let current = '';
        for (let i = 0; i < text.length; i++) {
          current += text[i];
          form.setValue(field, current, { shouldValidate: true, shouldDirty: true });
          await new Promise(r => setTimeout(r, 20)); // Typewriter speed
        }
      };

      // Set instantaneous fields
      form.setValue('uom_type', response.uom_type as GoalFormValues['uom_type']);
      form.setValue('goal_type', response.goal_type as GoalFormValues['goal_type']);
      form.setValue('target_value', response.target_value);
      form.setValue('category', response.category);
      form.setValue('weightage', response.weightage_suggestion);
      
      // Clear description before typing
      form.setValue('description', '');
      
      // Type out thrust area then description
      await typeText('thrust_area', response.thrust_area);
      await typeText('description', response.description);

    } catch (err) {
      console.error('AI Generation failed', err);
    } finally {
      setGenerating(false);
    }
  }

  const segments =
    summary?.goals
      .filter((g) => g.id !== goalId)
      .map((g) => ({
        id: g.id,
        title: g.title,
        weightage: g.weightage,
        category: g.category,
      })) ?? [];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Thrust area" error={form.formState.errors.thrust_area?.message}>
            <input className="input" {...form.register('thrust_area')} />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-[var(--color-text-2)]">Title</label>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={generating || !title || title.length < 3 || isShared}
                className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-dim)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)] transition-all hover:bg-[rgba(201,168,76,0.18)] disabled:opacity-50 disabled:hover:bg-[var(--color-accent-dim)]"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Suggest goal details
              </button>
            </div>
            <input className="input" disabled={isShared} {...form.register('title')} />
            {(form.formState.errors.title?.message ?? titleWarning) && (
              <p className="mt-1 text-[13px] text-[var(--color-danger)]">
                {form.formState.errors.title?.message ?? titleWarning}
              </p>
            )}
          </div>

          <Field 
            label="Description" 
            error={form.formState.errors.description?.message}
            maxLength={1000}
            currentLength={form.watch('description')?.length || 0}
          >
            <textarea maxLength={1000} className="input min-h-[100px] py-2" {...form.register('description')} />
          </Field>

          <Field label="Unit of measure">
            <select className="input" {...form.register('uom_type')}>
              {UOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Goal type">
            <select className="input" {...form.register('goal_type')}>
              {goalTypesForUom(uom).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={targetLabel(uom, goalType)} error={form.formState.errors.target_value?.message}>
            <input
              type="number"
              className="input font-mono"
              disabled={isShared}
              {...form.register('target_value')}
            />
          </Field>

          <Field label="Deadline" error={form.formState.errors.deadline?.message}>
            <input type="date" className="input" {...form.register('deadline')} />
          </Field>

          <Field label="Category">
            <select className="input" {...form.register('category')}>
              <option value="Strategic">Strategic</option>
              <option value="Operational">Operational</option>
              <option value="Development">Development</option>
            </select>
          </Field>

          <Field label="Weightage (%)" error={form.formState.errors.weightage?.message}>
            <input
              type="number"
              step={5}
              min={10}
              max={50}
              className="input font-mono"
              {...form.register('weightage')}
            />
          </Field>

          <div className="rounded-lg border border-[var(--color-border)] p-4">
            <p className="mb-3 text-[13px] font-medium text-[var(--color-text-2)]">
              Self-rating (required before submit)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Self achievement">
                <input
                  type="number"
                  className="input font-mono"
                  {...form.register('self_achievement')}
                />
              </Field>
              <Field label="Self rating (1–5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input font-mono"
                  {...form.register('self_rating')}
                />
              </Field>
            </div>
            <Field 
              label="Self notes" 
              error={form.formState.errors.self_notes?.message}
              maxLength={500}
              currentLength={form.watch('self_notes')?.length || 0}
            >
              <textarea maxLength={500} className="input mt-2 min-h-[60px] py-2" {...form.register('self_notes')} />
            </Field>
          </div>

          {/* Submit button at bottom of left column for natural reading flow */}
          <div className="pt-2">
            {form.formState.errors.root && (
              <p className="mb-3 text-[13px] text-[var(--color-danger)]">{form.formState.errors.root.message}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={submitting || !!titleWarning}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-2)]">Weightage allocation</p>
            <div className="mt-3">
              <WeightageBar
                segments={segments}
                currentWeightage={Number(weightage) || 0}
                currentCategory={category}
                currentTitle={title || 'New goal'}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  maxLength,
  currentLength = 0,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  maxLength?: number;
  currentLength?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between items-center">
        <label className="block text-[13px] font-medium text-[var(--color-text-2)]">{label}</label>
        {maxLength !== undefined && (
          <span className="text-[11px] text-[var(--color-text-3)]">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      {children}
      {error && <p className="mt-1 text-[13px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
