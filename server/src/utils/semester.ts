import { BATCH_START_MONTH, MAX_SEMESTER } from '../config/constants.js';

/** Semester advances every 6 months from 1 July of the batch year. */
export function calculateSemester(batchYear: number, date = new Date()): number {
  const start = new Date(batchYear, BATCH_START_MONTH, 1);
  if (date < start) return 1;

  const months =
    (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  const semester = Math.floor(months / 6) + 1;
  return Math.min(Math.max(semester, 1), MAX_SEMESTER);
}

export function isValidBatchYear(year: number): boolean {
  const current = new Date().getFullYear();
  return Number.isInteger(year) && year >= current - 10 && year <= current + 1;
}
