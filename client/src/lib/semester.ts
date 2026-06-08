/** July (0-indexed) — keep in sync with server/src/config/constants.ts */
const BATCH_START_MONTH = 6;
const MAX_SEMESTER = 12;

/** Semester advances every 6 months from 1 July of the batch year. */
export function calculateSemester(batchYear: number, date = new Date()): number {
  const start = new Date(batchYear, BATCH_START_MONTH, 1);
  if (date < start) return 1;

  const months =
    (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  const semester = Math.floor(months / 6) + 1;
  return Math.min(Math.max(semester, 1), MAX_SEMESTER);
}

export function getBatchYearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => current - i);
}
