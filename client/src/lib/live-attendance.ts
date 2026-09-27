import type { AttendanceStatus } from '@/types';

type SheetRow = {
  studentDbId: string;
  attendance: { status: AttendanceStatus } | null;
};

/** Apply server rows onto the grid without wiping marks the staff member has not saved yet. */
export function applyLiveSheet(
  previousRecords: Record<string, AttendanceStatus>,
  previousServer: Record<string, AttendanceStatus>,
  sheet: SheetRow[]
) {
  const records = { ...previousRecords };
  const server = { ...previousServer };

  for (const row of sheet) {
    const status = row.attendance?.status || 'absent';
    const seen = previousServer[row.studentDbId];
    if (seen === undefined || status !== seen) {
      records[row.studentDbId] = status;
    }
    server[row.studentDbId] = status;
  }

  return { records, server };
}
