import type { AuthUser } from '@/lib/stores/auth.store';
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  Users,
  CheckCircle2,
  Shield,
  FileBarChart,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: string;
  keywords?: string;
};

export const NAV_BY_ROLE: Record<AuthUser['role'], NavItem[]> = {
  EMPLOYEE: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview', keywords: 'home overview' },
    { href: '/goals', label: 'Goals', icon: Target, keywords: 'objectives okr' },
    { href: '/checkins', label: 'Check-ins', icon: ClipboardCheck, keywords: 'progress updates' },
    { href: '/notifications', label: 'Notifications', icon: Bell, section: 'Account', keywords: 'alerts inbox' },
    { href: '/profile', label: 'Profile', icon: UserCircle, keywords: 'account settings' },
  ],
  MANAGER: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview', keywords: 'home team' },
    { href: '/goals', label: 'Goals', icon: Target, keywords: 'objectives' },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle2, keywords: 'review pending' },
    { href: '/team', label: 'Team', icon: Users, keywords: 'direct reports' },
    { href: '/checkins', label: 'Check-ins', icon: ClipboardCheck, keywords: 'progress' },
    { href: '/reports', label: 'Reports', icon: FileBarChart, keywords: 'export csv' },
    { href: '/notifications', label: 'Notifications', icon: Bell, section: 'Account', keywords: 'alerts' },
    { href: '/profile', label: 'Profile', icon: UserCircle, keywords: 'account' },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview', keywords: 'admin home' },
    { href: '/goals', label: 'Goals', icon: Target, keywords: 'objectives' },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, keywords: 'insights charts' },
    { href: '/audit', label: 'Audit Trail', icon: Shield, keywords: 'compliance logs' },
    { href: '/admin/users', label: 'Users', icon: Users, section: 'Admin', keywords: 'people directory' },
    { href: '/admin/cycles', label: 'Cycles', icon: CalendarDays, keywords: 'performance period' },
    { href: '/admin/templates', label: 'Templates', icon: ClipboardList, keywords: 'goal templates' },
    { href: '/reports', label: 'Reports', icon: FileBarChart, keywords: 'export' },
    { href: '/notifications', label: 'Notifications', icon: Bell, section: 'Account', keywords: 'alerts' },
    { href: '/profile', label: 'Profile', icon: UserCircle, keywords: 'account' },
  ],
};
