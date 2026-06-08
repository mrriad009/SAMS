import { NUBTK_DEPARTMENT } from './types.js';

/** Sections that get a dedicated CR login (semester + section scoped) */
export const CR_ACCOUNT_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Semesters that get CR accounts — one login per (semester, section) */
export const CR_ACCOUNT_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type CrAccountSection = (typeof CR_ACCOUNT_SECTIONS)[number];

export interface CrAccountSeed {
  semester: number;
  section: string;
  email: string;
  password: string;
  name: string;
  teacherId: string;
  designation: string;
  department: string;
  staffType: 'cr';
}

/** e.g. semester 8 section E → cr8e@gmail.com */
export function crAccountEmail(semester: number, section: string): string {
  return `cr${semester}${section.trim().toLowerCase()}@gmail.com`;
}

/** Password matches the email local part: cr8e, cr7b, … */
export function crAccountPassword(semester: number, section: string): string {
  return `cr${semester}${section.trim().toLowerCase()}`;
}

/** Login shortcut: cr8e → cr8e@gmail.com */
export function parseCrLoginShortcut(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^cr([1-8])([a-f])$/);
  if (!match) return null;
  return crAccountEmail(Number(match[1]), match[2].toUpperCase());
}

export const DEMO_CR_SEMESTER = 8;
export const DEMO_CR_SECTION = 'E';

export function buildCrAccounts(department = NUBTK_DEPARTMENT): CrAccountSeed[] {
  return CR_ACCOUNT_SEMESTERS.flatMap((semester) =>
    CR_ACCOUNT_SECTIONS.map((section) => ({
      semester,
      section,
      email: crAccountEmail(semester, section),
      password: crAccountPassword(semester, section),
      name: `CSE ${semester}${section} CR`,
      teacherId: `CR-${semester}${section}`,
      designation: 'Class Representative',
      department,
      staffType: 'cr' as const,
    }))
  );
}
