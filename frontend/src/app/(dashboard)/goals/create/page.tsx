'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { GoalForm } from '@/components/forms/GoalForm';
import { createGoal } from '@/lib/api/goals';
import type { GoalFormValues } from '@/lib/validations/goal.schema';

export default function CreateGoalPage() {
  const router = useRouter();

  async function handleCreate(values: GoalFormValues) {
    try {
      const deadline = new Date(values.deadline).toISOString();
      await createGoal({
        ...values,
        deadline,
      });
      toast.success('Goal created successfully');
      router.push('/goals');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create goal');
    }
  }

  return (
    <>
      <TopBar title="Add goal" />
      <div className="p-6">
        <GoalForm onSubmit={handleCreate} submitLabel="Create goal" />
      </div>
    </>
  );
}

