import { useQuery } from '@tanstack/react-query';
import {
  getAdminDashboard,
  getEmployeeDashboard,
  getManagerDashboard,
} from '../api/dashboard';

export function useEmployeeDashboard() {
  return useQuery({ queryKey: ['dashboard', 'employee'], queryFn: getEmployeeDashboard });
}

export function useManagerDashboard() {
  return useQuery({ queryKey: ['dashboard', 'manager'], queryFn: getManagerDashboard });
}

export function useAdminDashboard() {
  return useQuery({ queryKey: ['dashboard', 'admin'], queryFn: getAdminDashboard });
}
