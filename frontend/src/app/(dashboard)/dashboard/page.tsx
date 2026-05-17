'use client';

import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/lib/stores/auth.store';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const title =
    user.role === 'ADMIN'
      ? 'Admin Dashboard'
      : user.role === 'MANAGER'
        ? 'Manager Dashboard'
        : 'My Dashboard';

  return (
    <>
      <TopBar title={title} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-auto p-6"
      >
        {user.role === 'EMPLOYEE' && <EmployeeDashboard />}
        {user.role === 'MANAGER' && <ManagerDashboard />}
        {user.role === 'ADMIN' && <AdminDashboard />}
      </motion.div>
    </>
  );
}
