/** Keep in sync with server/src/data/nubtk/cr-accounts.ts */

export const DEMO_CR_SEMESTER = 8;
export const DEMO_CR_SECTION = 'E';

export function crAccountEmail(semester: number, section: string): string {
  return `cr${semester}${section.trim().toLowerCase()}@gmail.com`;
}

export function crAccountPassword(semester: number, section: string): string {
  return `cr${semester}${section.trim().toLowerCase()}`;
}
