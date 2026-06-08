import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  CSE_DEPARTMENT,
  SECTIONS,
  SEMESTERS,
  studentIdSuffix,
  formatCourseOption,
} from '@/config/academic';
import { useAppConfig } from '@/hooks/useAppMode';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import { adminCoursesApi, adminSessionsApi } from '@/services/endpoints';
import type { AttendanceStatus, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  buildAttendanceCalendarStrip,
  formatMonthYear,
  formatStripLabel,
  isFutureDate,
  isPastDate,
  isToday,
} from '@/lib/calendar-strip';

export default function GeneralAttendancePage() {
  const queryClient = useQueryClient();
  const { data: appConfig } = useAppConfig();
  const { lockedSemester, lockedSection, attendanceTodayOnly, today } = useStaffPermissions();

  const defaultSemester = String(lockedSemester ?? appConfig?.currentSemester ?? 8);
  const defaultSection = lockedSection ?? 'E';

  const [semester, setSemester] = useState(defaultSemester);
  const [section, setSection] = useState(defaultSection);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const calendarRef = useRef<HTMLDivElement>(null);
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (defaultsApplied.current || !appConfig) return;
    if (lockedSemester != null) setSemester(String(lockedSemester));
    else setSemester(String(appConfig.currentSemester));
    if (lockedSection) setSection(lockedSection);
    defaultsApplied.current = true;
  }, [appConfig, lockedSemester, lockedSection]);

  const dateStrip = useMemo(() => buildAttendanceCalendarStrip(new Date(), 14, 7), []);

  /** CR/teacher: only today is editable; admin can manage any date */
  const canManageAttendance = !attendanceTodayOnly || selectedDate === today;
  const isReadOnlyView = !canManageAttendance;

  useEffect(() => {
    const el = calendarRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedDate]);

  const { data: courses } = useQuery({
    queryKey: ['courses', CSE_DEPARTMENT, semester],
    queryFn: async () =>
      (
        await adminCoursesApi.list({
          department: CSE_DEPARTMENT,
          semester: Number(semester),
        })
      ).data.data as Course[],
    enabled: !!semester,
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', selectedCourse, selectedDate],
    queryFn: async () =>
      (await adminSessionsApi.list({ courseId: selectedCourse, dateFrom: selectedDate, dateTo: selectedDate }))
        .data.data,
    enabled: !!selectedCourse,
  });

  useEffect(() => {
    if (sessions?.length) {
      setSessionId(sessions[0].id);
    } else {
      setSessionId(null);
    }
  }, [sessions]);

  const { data: sheet, refetch: refetchSheet } = useQuery({
    queryKey: ['attendance-sheet', sessionId],
    queryFn: async () => {
      const res = await adminSessionsApi.getAttendance(sessionId!);
      const data = res.data.data;
      const initial: Record<string, AttendanceStatus> = {};
      data.sheet.forEach((s: { studentDbId: string; attendance: { status: AttendanceStatus } | null }) => {
        initial[s.studentDbId] = s.attendance?.status === 'present' ? 'present' : 'absent';
      });
      setRecords(initial);
      return data;
    },
    enabled: !!sessionId,
  });

  const roster = useMemo(() => {
    if (!sheet) return [];
    const list = sheet.sheet.filter((s: { section: string }) => s.section === section);
    return [...list].sort((a: { studentId: string }, b: { studentId: string }) =>
      a.studentId.localeCompare(b.studentId, undefined, { numeric: true })
    );
  }, [sheet, section]);

  const createSessionMutation = useMutation({
    mutationFn: () =>
      adminSessionsApi.create({
        courseId: selectedCourse,
        date: selectedDate,
        startTime: '09:00:00',
        endTime: '10:30:00',
        topic: 'Class',
        roomNumber: '—',
      }),
    onSuccess: (res) => {
      setSessionId(res.data.data.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Class session started');
    },
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!canManageAttendance) {
      toast.error('Attendance can only be marked for today');
      return;
    }
    if (!selectedCourse) {
      toast.error('Select a course first');
      return;
    }
    if (!roster.length) {
      toast.error('No students in this section for the selected course');
      return;
    }
    setSaving(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const res = await createSessionMutation.mutateAsync();
        sid = res.data.data.id;
        setSessionId(sid);
      }
      if (!sid) {
        toast.error('Failed to start class session');
        return;
      }
      await adminSessionsApi.submitAttendance(
        sid,
        roster.map((s: { studentDbId: string }) => ({
          studentId: s.studentDbId,
          status: records[s.studentDbId] || 'absent',
        }))
      );
      toast.success('Attendance saved');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      refetchSheet();
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (id: string) => {
    if (!canManageAttendance) return;
    setRecords((prev) => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    if (!canManageAttendance) return;
    const updated = { ...records };
    roster.forEach((s: { studentDbId: string }) => {
      updated[s.studentDbId] = 'present';
    });
    setRecords(updated);
  };

  const presentCount = roster.filter((s: { studentDbId: string }) => records[s.studentDbId] === 'present').length;

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Take attendance</h1>
        <p className="text-sm text-muted-foreground">
          CSE · Semester {semester} · Section {section}
          {attendanceTodayOnly && ' · Today editable · past/future view only'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Semester</Label>
          <SelectField
            value={semester}
            disabled={lockedSemester != null}
            onChange={(e) => {
              setSemester(e.target.value);
              setSelectedCourse('');
              setSessionId(null);
            }}
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Section</Label>
          <SelectField
            value={section}
            disabled={!!lockedSection}
            onChange={(e) => {
              setSection(e.target.value);
              setSessionId(null);
            }}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <Label className="text-xs">Course</Label>
          <SelectField
            key={semester}
            value={selectedCourse}
            placeholder={courses?.length ? 'Select course' : `No courses for semester ${semester}`}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSessionId(null);
            }}
          >
            {(courses || []).map((c) => (
              <option key={c.id} value={c.id}>
                {formatCourseOption(c)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <span className="text-xs text-muted-foreground">{formatMonthYear(selectedDate)}</span>
        </div>
        <div
          ref={calendarRef}
          className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 pb-1 dark:border-slate-700 dark:bg-slate-900/40"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {dateStrip.map((dateKey) => {
            const { day, date, month } = formatStripLabel(dateKey);
            const selected = dateKey === selectedDate;
            const isTodayDate = isToday(dateKey);
            const isPast = isPastDate(dateKey);
            const isFuture = isFutureDate(dateKey);
            const readOnlyDay = attendanceTodayOnly && !isTodayDate;

            return (
              <button
                key={dateKey}
                type="button"
                data-selected={selected ? 'true' : undefined}
                title={
                  readOnlyDay
                    ? `${day} ${date} ${month} — view only`
                    : `${day} ${date} ${month}${isTodayDate ? ' — today' : ''}`
                }
                onClick={() => {
                  setSelectedDate(dateKey);
                  setSessionId(null);
                }}
                className={cn(
                  'relative flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition-colors',
                  'scroll-snap-align-center',
                  selected && canManageAttendance && 'border-primary bg-primary text-primary-foreground shadow-sm',
                  selected && isReadOnlyView && 'border-amber-500/70 bg-amber-500/15 text-amber-100',
                  !selected &&
                    (readOnlyDay
                      ? 'border-slate-200/60 bg-surface/60 text-muted-foreground dark:border-slate-700/60 dark:bg-dark-surface/60'
                      : 'border-slate-200 bg-surface hover:border-primary/40 dark:border-slate-700 dark:bg-dark-surface'),
                  isTodayDate && !selected && 'ring-2 ring-primary/50',
                  isPast && !selected && 'opacity-75',
                  isFuture && !selected && 'border-dashed opacity-70'
                )}
              >
                {readOnlyDay && (
                  <Lock className="absolute right-0.5 top-0.5 h-2.5 w-2.5 opacity-50" />
                )}
                <span className="text-[10px] font-medium uppercase opacity-80">{day}</span>
                <span className="font-display text-lg font-bold leading-none">{date}</span>
                <span className="text-[10px] opacity-70">{month}</span>
                {isTodayDate && (
                  <span
                    className={cn(
                      'mt-0.5 text-[8px] font-semibold uppercase tracking-wide',
                      selected && canManageAttendance ? 'text-primary-foreground/90' : 'text-primary'
                    )}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {isReadOnlyView && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Lock className="h-3 w-3 shrink-0" />
            {isPastDate(selectedDate)
              ? 'Past date — view only. Select today to mark or update attendance.'
              : 'Future date — view only. Attendance can only be managed on the current date.'}
          </p>
        )}
      </div>

      {selectedCourse && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{presentCount}</span>/{roster.length} present
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllPresent}
                disabled={!roster.length || !canManageAttendance}
              >
                All present
              </Button>
              {!sessionId && selectedCourse && canManageAttendance && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createSessionMutation.mutate()}
                  disabled={createSessionMutation.isPending}
                >
                  Start class
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !roster.length || !canManageAttendance}
              >
                {isReadOnlyView ? 'View only' : 'Save'}
              </Button>
            </div>
          </div>

          {!roster.length && sheet && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700">
              No students enrolled in this course for section {section}.
            </p>
          )}

          {roster.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {roster.map((s: { studentDbId: string; studentId: string; name: string }) => {
                const present = records[s.studentDbId] === 'present';
                const suffix = studentIdSuffix(s.studentId);
                return (
                  <button
                    key={s.studentDbId}
                    type="button"
                    title={`${s.name} · ${s.studentId}`}
                    disabled={!canManageAttendance}
                    onClick={() => toggleStudent(s.studentDbId)}
                    className={cn(
                      'group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition-all',
                      canManageAttendance && 'active:scale-95',
                      !canManageAttendance && 'cursor-default opacity-90',
                      present
                        ? 'border-success/60 bg-success/15 text-success'
                        : 'border-danger/40 bg-danger/10 text-danger'
                    )}
                  >
                    <span className="font-display text-lg font-bold leading-none sm:text-xl">{suffix}</span>
                    <span className="mt-0.5 max-w-full truncate px-1 text-[9px] opacity-70 group-hover:opacity-100">
                      {s.name.split(' ').pop()}
                    </span>
                    <span className="absolute right-1 top-1 opacity-60">
                      {present ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!sessionId && !sheet && selectedCourse && canManageAttendance && (
            <p className="text-center text-xs text-muted-foreground">
              Tap <strong>Start class</strong> or <strong>Save</strong> to begin marking attendance.
            </p>
          )}
          {!sessionId && !sheet && selectedCourse && isReadOnlyView && (
            <p className="text-center text-xs text-muted-foreground">
              No attendance session for this date.
            </p>
          )}
        </>
      )}

      {!selectedCourse && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground dark:border-slate-700">
          Choose semester, section, and course to show the student grid.
        </p>
      )}
    </div>
  );
}
