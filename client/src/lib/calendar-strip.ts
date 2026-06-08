/** Local calendar date YYYY-MM-DD (matches server attendance dates) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDateStrip(center = new Date(), radius = 14): string[] {
  const dates: string[] = [];
  for (let offset = -radius; offset <= radius; offset++) {
    const d = new Date(center);
    d.setDate(d.getDate() + offset);
    dates.push(toDateKey(d));
  }
  return dates;
}

export function formatStripLabel(dateKey: string): { day: string; date: string; month: string } {
  const d = new Date(`${dateKey}T12:00:00`);
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: String(d.getDate()),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

export function isToday(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

export function isPastDate(dateKey: string): boolean {
  return dateKey < toDateKey(new Date());
}

export function isFutureDate(dateKey: string): boolean {
  return dateKey > toDateKey(new Date());
}

export function formatMonthYear(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Horizontal calendar window: past + today + future days */
export function buildAttendanceCalendarStrip(center = new Date(), pastDays = 14, futureDays = 7): string[] {
  const dates: string[] = [];
  for (let offset = -pastDays; offset <= futureDays; offset++) {
    const d = new Date(center);
    d.setDate(d.getDate() + offset);
    dates.push(toDateKey(d));
  }
  return dates;
}
