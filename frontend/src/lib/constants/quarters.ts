/**
 * Quarter window definitions per §6.4
 * OUTSIDE WINDOW UX RULE: Show banner explaining WHY they cannot submit.
 */

export const QUARTER_WINDOWS = {
  GOAL_SETTING: { months: [3, 4], label: 'Goal Setting (April–May)' },
  Q1_CHECKIN: { months: [5, 6], label: 'Q1 Check-in (June–July)' },
  Q2_CHECKIN: { months: [8, 9], label: 'Q2 Check-in (September–October)' },
  Q3_CHECKIN: { months: [0, 1], label: 'Q3 Check-in (January–February)' },
  Q4_FINAL: { months: [2, 3], label: 'Q4 Final Review (March–April)' },
} as const;

export type WindowType = keyof typeof QUARTER_WINDOWS;

export function getCurrentWindow(): { type: WindowType; isOpen: boolean } | null {
  const month = new Date().getMonth();
  for (const [type, config] of Object.entries(QUARTER_WINDOWS)) {
    if ((config.months as readonly number[]).includes(month)) {
      return { type: type as WindowType, isOpen: true };
    }
  }
  return null;
}

export function getNextWindow(): { type: WindowType; label: string } {
  const month = new Date().getMonth();
  const ordered: WindowType[] = ['GOAL_SETTING', 'Q1_CHECKIN', 'Q2_CHECKIN', 'Q3_CHECKIN', 'Q4_FINAL'];

  for (const type of ordered) {
    const windowMonths = QUARTER_WINDOWS[type].months;
    if (windowMonths[0]! > month) {
      return { type, label: QUARTER_WINDOWS[type].label };
    }
  }
  // Wrap around to next year
  return { type: 'Q3_CHECKIN', label: QUARTER_WINDOWS.Q3_CHECKIN.label };
}
