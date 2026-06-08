/** NUBTK CSE only — keep in sync with server/src/config/constants.ts */
export const CSE_DEPARTMENT = 'Computer Science & Engineering' as const;

export const DEPARTMENTS = [CSE_DEPARTMENT] as const;

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** ISO-style: 1=Mon … 7=Sun. Ordered Sat-first for typical university routines. */
export const WEEK_DAYS = [
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
] as const;

export const DEFAULT_ROUTINE_DAYS = [6, 7, 3, 4] as const;

export const ROUTINE_CLASSES_PER_DAY = { min: 2, max: 4, default: 3 } as const;

/** ISO weekday for today: 1=Mon … 6=Sat, 7=Sun (matches routine `dayOfWeek`) */
export function getTodayIsoDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function sortDayValues(days: number[]): number[] {
  const order = WEEK_DAYS.map((d) => d.value);
  return [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function dayLabel(value: number, short = false): string {
  const day = WEEK_DAYS.find((d) => d.value === value);
  if (!day) return String(value);
  return short ? day.short : day.label;
}

export function studentIdSuffix(studentId: string, len = 4): string {
  const id = studentId.trim();
  return id.length <= len ? id : id.slice(-len);
}

/** Routine uses (C) for lab / continuous sessions — distinct from theory slot */
export function formatCourseOption(course: { courseCode: string; courseName: string }): string {
  const code = course.courseCode.trim();
  if (/\(C\)$/i.test(code)) {
    return `${code} · Lab`;
  }
  return code;
}

export type Department = (typeof DEPARTMENTS)[number];
export type Section = (typeof SECTIONS)[number];
export type Semester = (typeof SEMESTERS)[number];
export type AppMode = 'general' | 'advanced';
