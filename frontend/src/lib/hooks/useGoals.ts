import { useQuery } from '@tanstack/react-query';
import { listGoals } from '../api/goals';

export function useGoals(status?: string) {
  return useQuery({
    queryKey: ['goals', status ?? 'all'],
    queryFn: () => listGoals(status ? { status } : undefined),
  });
}
