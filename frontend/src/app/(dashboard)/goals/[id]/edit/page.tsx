'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { GoalForm } from '@/components/forms/GoalForm';
import { ConflictModal } from '@/components/common/ConflictModal';
import { getGoal, updateGoal } from '@/lib/api/goals';
import type { GoalFormValues } from '@/lib/validations/goal.schema';

export default function EditGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => getGoal(id),
  });

  const goal = data?.goal;
  const [isConflict, setIsConflict] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      await updateGoal(id, {
        ...values,
        deadline: new Date(values.deadline).toISOString(),
      });
    },
    onSuccess: () => {
      router.push(`/goals/${id}`);
    },
    onError: (error: Error | unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof error === 'object' && error && 'response' in error && (error as any).response?.status === 409) {
        setIsConflict(true);
      } else {
        console.error('Update failed:', error);
      }
    }
  });

  async function handleUpdate(values: GoalFormValues) {
    mutation.mutate(values);
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Edit goal" />
        <div className="p-6">
          <div className="card h-64 animate-pulse bg-[var(--color-surface-2)]" />
        </div>
      </>
    );
  }

  if (!goal) return null;

  return (
    <>
      <TopBar title={`Edit: ${goal.title}`} />
      <div className="p-6">
        <GoalForm
          goalId={id}
          isShared={goal.is_shared}
          defaultValues={{
            thrust_area: goal.thrust_area,
            title: goal.title,
            description: goal.description,
            uom_type: goal.uom_type as GoalFormValues['uom_type'],
            goal_type: goal.goal_type as GoalFormValues['goal_type'],
            target_value: goal.target_value,
            weightage: goal.weightage,
            deadline: goal.deadline.slice(0, 10),
            category: goal.category as GoalFormValues['category'],
            self_achievement: goal.self_achievement ?? undefined,
            self_rating: goal.self_rating ?? undefined,
            self_notes: goal.self_notes ?? undefined,
          }}
          onSubmit={handleUpdate}
          submitLabel="Save changes"
        />
        <ConflictModal isOpen={isConflict} onReload={() => window.location.reload()} />
      </div>
    </>
  );
}
