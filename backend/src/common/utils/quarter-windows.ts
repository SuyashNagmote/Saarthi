export const QUARTER_WINDOWS: Record<string, { months: number[] }> = {
  GOAL_SETTING: { months: [3, 4] },
  Q1_CHECKIN: { months: [5, 6] },
  Q2_CHECKIN: { months: [8, 9] },
  Q3_CHECKIN: { months: [0, 1] },
  Q4_FINAL: { months: [2, 3] },
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function computeNextOpen(): Date {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (let offset = 1; offset <= 12; offset++) {
    const month = (currentMonth + offset) % 12;
    const year = currentMonth + offset >= 12 ? currentYear + 1 : currentYear;
    for (const [, config] of Object.entries(QUARTER_WINDOWS)) {
      if (config.months[0] === month) {
        return new Date(year, month, 1);
      }
    }
  }
  return new Date(currentYear, currentMonth + 1, 1);
}

export function getActiveWindow(): {
  isOpen: boolean;
  window: string | null;
  nextOpen: Date | null;
  nextOpenLabel: string | null;
} {
  const month = new Date().getMonth();
  for (const [name, config] of Object.entries(QUARTER_WINDOWS)) {
    if (config.months.includes(month)) {
      return { isOpen: true, window: name, nextOpen: null, nextOpenLabel: null };
    }
  }
  const nextOpen = computeNextOpen();
  return {
    isOpen: false,
    window: null,
    nextOpen,
    nextOpenLabel: `${MONTH_NAMES[nextOpen.getMonth()]} ${nextOpen.getFullYear()}`,
  };
}
