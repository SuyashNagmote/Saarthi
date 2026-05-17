'use client';

import { createContext, useContext } from 'react';

export type DashboardChromeControls = {
  openMobileNav: () => void;
  openCommand: () => void;
};

export const DashboardChromeContext = createContext<DashboardChromeControls | null>(null);

export function useDashboardChrome() {
  return useContext(DashboardChromeContext);
}
