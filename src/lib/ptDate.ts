/**
 * Pacific Time (America/Los_Angeles) helpers for wrap window and report dates.
 */

export function getPtDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export function getPtHourMinute(): { hour: number; minute: number } {
  const pt = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const d = new Date(pt);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

/** Whether current PT time is in wrap window (1:05pmâ€“1:25pm) */
export function isInWrapWindow(): boolean {
  const { hour, minute } = getPtHourMinute();
  const totalMins = hour * 60 + minute;
  return totalMins >= 785 && totalMins <= 805;
}

/** Today's date in PT (YYYY-MM-DD). For "do doÃ¡n hÃ´m nay". */
export function getTodayPtDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

/** Report date for wrap: next trading day. Mon-Thu +1, Fri +3, Sat +2, Sun +1. For cron + "do doÃ¡n ngÃ y mai". */
export function getTargetReportDate(): string {
  const now = new Date();
  const ptDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const ptWeekday = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' });
  let daysToAdd = 1;
  if (ptWeekday === 'Fri') daysToAdd = 3;
  else if (ptWeekday === 'Sat') daysToAdd = 2;
  else if (ptWeekday === 'Sun') daysToAdd = 1;
  const [y, m, d] = ptDateStr.split('-').map(Number);
  const d2 = new Date(y, m - 1, d);
  d2.setDate(d2.getDate() + daysToAdd);
  const y2 = d2.getFullYear();
  const m2 = String(d2.getMonth() + 1).padStart(2, '0');
  const d3 = String(d2.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d3}`;
}
