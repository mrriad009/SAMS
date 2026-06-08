export const ATTENDANCE_THRESHOLD = 75;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** NUBTK CSE department only */
export const CSE_DEPARTMENT = 'Computer Science & Engineering' as const;

export const DEPARTMENTS = [CSE_DEPARTMENT] as const;

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const APP_MODES = ['general', 'advanced'] as const;
export type AppMode = (typeof APP_MODES)[number];

/** July (0-indexed) — start of batch academic year */
export const BATCH_START_MONTH = 6;
export const MAX_SEMESTER = 12;

export type Department = (typeof DEPARTMENTS)[number];
export type Section = (typeof SECTIONS)[number];
