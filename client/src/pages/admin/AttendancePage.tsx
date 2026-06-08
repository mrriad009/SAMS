import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { adminCoursesApi, adminSessionsApi } from '@/services/endpoints';
import type { AttendanceStatus, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CSE_DEPARTMENT, SECTIONS, SEMESTERS } from '@/config/academic';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

const statusConfig: Record<AttendanceStatus, { icon: typeof Check; color: string; label: string }> = {
  present: { icon: Check, color: 'bg-success text-white', label: 'Present' },
  absent: { icon: X, color: 'bg-danger text-white', label: 'Absent' },
  late: { icon: Clock, color: 'bg-warning text-white', label: 'Late' },
  excused: { icon: ShieldCheck, color: 'bg-secondary text-white', label: 'Excused' },
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { lockedSemester, lockedSection, attendanceTodayOnly, today } = useStaffPermissions();
  const [filters, setFilters] = useState({
    semester: lockedSemester != null ? String(lockedSemester) : '',
    section: lockedSection ?? '',
  });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (lockedSemester != null || lockedSection) {
      setFilters((f) => ({
        semester: lockedSemester != null ? String(lockedSemester) : f.semester,
        section: lockedSection ?? f.section,
      }));
    }
    if (attendanceTodayOnly) setSelectedDate(today);
  }, [lockedSemester, lockedSection, attendanceTodayOnly, today]);

  const canLoadCourses = !!filters.semester && !!filters.section;

  const { data: courses } = useQuery({
    queryKey: ['courses', CSE_DEPARTMENT, filters.semester],
    queryFn: async () =>
      (
        await adminCoursesApi.list({
          department: CSE_DEPARTMENT,
          semester: Number(filters.semester),
        })
      ).data.data as Course[],
    enabled: canLoadCourses,
  });

  const availableCourses = courses || [];

  const { data: sessions } = useQuery({
    queryKey: ['sessions', selectedCourse],
    queryFn: async () => (await adminSessionsApi.list({ courseId: selectedCourse })).data.data,
    enabled: !!selectedCourse,
  });

  const { data: sheet, refetch: refetchSheet } = useQuery({
    queryKey: ['attendance-sheet', sessionId],
    queryFn: async () => {
      const res = await adminSessionsApi.getAttendance(sessionId!);
      const data = res.data.data;
      const initial: Record<string, AttendanceStatus> = {};
      data.sheet.forEach((s: { studentDbId: string; attendance: { status: AttendanceStatus } | null }) => {
        initial[s.studentDbId] = s.attendance?.status || 'absent';
      });
      setRecords(initial);
      return data;
    },
    enabled: !!sessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: () =>
      adminSessionsApi.create({
        courseId: selectedCourse,
        date: selectedDate,
        startTime: '09:00:00',
        endTime: '10:30:00',
        topic: 'Class Session',
        roomNumber: '301',
      }),
    onSuccess: (res) => {
      setSessionId(res.data.data.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session created');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      adminSessionsApi.submitAttendance(
        sessionId!,
        roster.map((s: { studentDbId: string }) => ({
          studentId: s.studentDbId,
          status: records[s.studentDbId] || 'absent',
        }))
      ),
    onSuccess: () => {
      toast.success('Attendance submitted');
      refetchSheet();
    },
  });

  const roster = useMemo(() => {
    if (!sheet) return [];
    const list = filters.section
      ? sheet.sheet.filter((s: { section: string }) => s.section === filters.section)
      : sheet.sheet;
    return [...list].sort((a: { studentId: string }, b: { studentId: string }) =>
      a.studentId.localeCompare(b.studentId, undefined, { numeric: true })
    );
  }, [sheet, filters.section]);

  const markAllPresent = () => {
    if (!roster.length) return;
    const updated = { ...records };
    roster.forEach((s: { studentDbId: string }) => { updated[s.studentDbId] = 'present'; });
    setRecords(updated);
  };

  const resetSelection = () => {
    setSelectedCourse('');
    setSessionId(null);
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">Attendance Manager</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {CSE_DEPARTMENT} · mark daily class attendance
          {attendanceTodayOnly && ' · Today only'}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="filter-grid">
            <div className="field-full">
              <Label>Semester</Label>
              <SelectField
                value={filters.semester}
                placeholder="Select semester"
                disabled={lockedSemester != null}
                onChange={(e) => {
                  setFilters({ semester: e.target.value, section: '' });
                  resetSelection();
                }}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="field-full">
              <Label>Section</Label>
              <SelectField
                value={filters.section}
                placeholder="Select section"
                disabled={!filters.semester || !!lockedSection}
                onChange={(e) => {
                  setFilters({ ...filters, section: e.target.value });
                  resetSelection();
                }}
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="field-full">
              <Label>Course</Label>
              <SelectField
                value={selectedCourse}
                placeholder={canLoadCourses ? 'Select course' : 'Select department, semester, and section first'}
                disabled={!canLoadCourses}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSessionId(null);
                }}
              >
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </SelectField>
              {canLoadCourses && availableCourses.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No courses found for this department and semester.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="field-full">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                readOnly={attendanceTodayOnly}
                min={attendanceTodayOnly ? today : undefined}
                max={attendanceTodayOnly ? today : undefined}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={attendanceTodayOnly ? 'bg-muted' : undefined}
              />
            </div>
            <div className="field-full flex flex-col gap-2 sm:flex-row sm:items-end">
              <Button className="w-full sm:w-auto" onClick={() => createSessionMutation.mutate()} disabled={!selectedCourse}>
                Start New Session
              </Button>
              {sessions && sessions.length > 0 && (
                <SelectField
                  value={sessionId || ''}
                  placeholder="Load past session"
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} - {s.topic || 'Session'}
                    </option>
                  ))}
                </SelectField>
              )}
            </div>
          </div>

          {!canLoadCourses && (
            <p className="text-sm text-muted-foreground">Select semester and section to load courses.</p>
          )}
        </CardContent>
      </Card>

      {sheet && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={markAllPresent}>
              Mark All Present
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              Save & Submit
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Student Roster ({roster.length}
                {filters.section && sheet.sheet.length !== roster.length ? ` of ${sheet.sheet.length}` : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y dark:divide-slate-700">
                {roster.map((s: { studentDbId: string; studentId: string; name: string; section: string }) => (
                  <div key={s.studentDbId} className="row-stack p-3 sm:p-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.studentId} · Sec {s.section}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 self-start sm:self-center">
                      {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                        const cfg = statusConfig[status];
                        const Icon = cfg.icon;
                        const active = records[s.studentDbId] === status;
                        return (
                          <motion.button
                            key={status}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setRecords({ ...records, [s.studentDbId]: status })}
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                              active ? cfg.color : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                            title={cfg.label}
                          >
                            <Icon className="h-4 w-4" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
