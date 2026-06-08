import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { adminRoutineApi, adminCoursesApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, cn } from '@/lib/utils';
import {
  DEPARTMENTS,
  SECTIONS,
  SEMESTERS,
  WEEK_DAYS,
  DEFAULT_ROUTINE_DAYS,
  ROUTINE_CLASSES_PER_DAY,
  sortDayValues,
  dayLabel,
  getTodayIsoDayOfWeek,
} from '@/config/academic';
import type { Course } from '@/types';

type QuickSlot = {
  courseId: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
};

const DEFAULT_SLOT_TIMES = [
  { startTime: '12:00', endTime: '13:10' },
  { startTime: '14:10', endTime: '15:20' },
  { startTime: '15:20', endTime: '16:30' },
  { startTime: '09:40', endTime: '10:50' },
];

function createQuickSlots(count = ROUTINE_CLASSES_PER_DAY.default): QuickSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    courseId: '',
    startTime: DEFAULT_SLOT_TIMES[i]?.startTime ?? '09:00',
    endTime: DEFAULT_SLOT_TIMES[i]?.endTime ?? '10:30',
    roomNumber: '',
  }));
}

function createDefaultDaySlots(): Record<number, QuickSlot[]> {
  return Object.fromEntries(
    DEFAULT_ROUTINE_DAYS.map((day) => [day, createQuickSlots()])
  );
}

import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';

export default function RoutinePage() {
  const readOnly = useReadOnlyStaff();
  const todayIso = getTodayIsoDayOfWeek();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [viewFilters, setViewFilters] = useState({ department: '', section: '', semester: '' });
  const [quickFilters, setQuickFilters] = useState({ department: '', section: '', semester: '' });
  const [selectedDays, setSelectedDays] = useState<number[]>([...DEFAULT_ROUTINE_DAYS]);
  const [daySlots, setDaySlots] = useState<Record<number, QuickSlot[]>>(createDefaultDaySlots);
  const [mobileDay, setMobileDay] = useState<number>(DEFAULT_ROUTINE_DAYS[0]);
  const [form, setForm] = useState({
    department: '',
    section: '',
    semester: '',
    courseId: '',
    dayOfWeek: 6,
    startTime: '09:00',
    endTime: '10:30',
    roomNumber: '301',
  });

  const resetForm = () => ({
    department: '',
    section: '',
    semester: '',
    courseId: '',
    dayOfWeek: 6,
    startTime: '09:00',
    endTime: '10:30',
    roomNumber: '301',
  });

  const resetQuickSetup = () => ({
    filters: { department: '', section: '', semester: '' },
    days: [...DEFAULT_ROUTINE_DAYS],
    slots: createDefaultDaySlots(),
  });

  const canLoadCourses = !!form.department && !!form.section && !!form.semester;
  const canViewRoutine = !!viewFilters.department && !!viewFilters.section && !!viewFilters.semester;
  const canLoadQuickCourses =
    !!quickFilters.department && !!quickFilters.section && !!quickFilters.semester;

  const { data: courses } = useQuery({
    queryKey: ['courses', form.department, form.semester],
    queryFn: async () =>
      (
        await adminCoursesApi.list({
          department: form.department,
          semester: Number(form.semester),
        })
      ).data.data as Course[],
    enabled: canLoadCourses,
  });

  const { data: quickCourses } = useQuery({
    queryKey: ['courses', quickFilters.department, quickFilters.semester],
    queryFn: async () =>
      (
        await adminCoursesApi.list({
          department: quickFilters.department,
          semester: Number(quickFilters.semester),
        })
      ).data.data as Course[],
    enabled: canLoadQuickCourses,
  });

  const availableCourses = courses || [];
  const quickAvailableCourses = quickCourses || [];

  const { data: slots } = useQuery({
    queryKey: ['routine', viewFilters.department, viewFilters.semester, viewFilters.section],
    queryFn: async () =>
      (
        await adminRoutineApi.list({
          department: viewFilters.department,
          semester: Number(viewFilters.semester),
          section: viewFilters.section,
        })
      ).data.data,
    enabled: canViewRoutine,
  });

  const displayDays = useMemo(() => {
    const days = new Set((slots || []).map((s: { dayOfWeek: number }) => s.dayOfWeek));
    return sortDayValues([...days]);
  }, [slots]);

  const createMutation = useMutation({
    mutationFn: (d: typeof form) =>
      adminRoutineApi.create({
        courseId: d.courseId,
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime + ':00',
        endTime: d.endTime + ':00',
        roomNumber: d.roomNumber,
        section: d.section,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
      toast.success('Slot added');
      setShowModal(false);
      setForm(resetForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminRoutineApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
      toast.success('Slot removed');
    },
  });

  const quickSaveMutation = useMutation({
    mutationFn: (payload: Array<{
      courseId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      roomNumber: string;
    }>) => adminRoutineApi.importSlots(payload),
    onSuccess: (res, payload) => {
      queryClient.invalidateQueries({ queryKey: ['routine'] });
      setViewFilters(quickFilters);
      if (payload[0]) setMobileDay(payload[0].dayOfWeek);
      toast.success(`Saved ${res.data.data?.created || payload.length} routine slots`);
      setShowQuickSetup(false);
      const reset = resetQuickSetup();
      setQuickFilters(reset.filters);
      setSelectedDays(reset.days);
      setDaySlots(reset.slots);
    },
    onError: () => toast.error('Failed to save routine'),
  });

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) {
        toast.error('Select at least one teaching day');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
      return;
    }

    if (selectedDays.length >= 4) {
      toast.error('Maximum 4 teaching days');
      return;
    }

    setSelectedDays(sortDayValues([...selectedDays, day]));
    if (!daySlots[day]) {
      setDaySlots({ ...daySlots, [day]: createQuickSlots() });
    }
  };

  const updateDaySlot = (day: number, index: number, patch: Partial<QuickSlot>) => {
    const rows = [...(daySlots[day] || createQuickSlots())];
    rows[index] = { ...rows[index], ...patch };
    setDaySlots({ ...daySlots, [day]: rows });
  };

  const addClassRow = (day: number) => {
    const rows = daySlots[day] || createQuickSlots();
    if (rows.length >= ROUTINE_CLASSES_PER_DAY.max) {
      toast.error(`Maximum ${ROUTINE_CLASSES_PER_DAY.max} classes per day`);
      return;
    }
    const next = DEFAULT_SLOT_TIMES[rows.length];
    setDaySlots({
      ...daySlots,
      [day]: [
        ...rows,
        {
          courseId: '',
          startTime: next?.startTime ?? '09:00',
          endTime: next?.endTime ?? '10:30',
          roomNumber: '',
        },
      ],
    });
  };

  const removeClassRow = (day: number, index: number) => {
    const rows = daySlots[day] || createQuickSlots();
    if (rows.length <= ROUTINE_CLASSES_PER_DAY.min) {
      toast.error(`At least ${ROUTINE_CLASSES_PER_DAY.min} class rows per day`);
      return;
    }
    setDaySlots({
      ...daySlots,
      [day]: rows.filter((_, i) => i !== index),
    });
  };

  const saveQuickSetup = () => {
    if (!canLoadQuickCourses) {
      toast.error('Select department, section, and semester');
      return;
    }

    const payload = sortDayValues(selectedDays).flatMap((day) =>
      (daySlots[day] || [])
        .filter((slot) => slot.courseId && slot.startTime && slot.endTime)
        .map((slot) => ({
          courseId: slot.courseId,
          dayOfWeek: day,
          startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
          endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
          roomNumber: slot.roomNumber || 'TBA',
          section: quickFilters.section,
        }))
    );

    if (payload.length === 0) {
      toast.error('Add at least one class with a course selected');
      return;
    }

    quickSaveMutation.mutate(payload);
  };

  const openQuickSetup = () => {
    const reset = resetQuickSetup();
    setQuickFilters({
      department: viewFilters.department,
      section: viewFilters.section,
      semester: viewFilters.semester,
    });
    setSelectedDays(
      viewFilters.department && viewFilters.section && viewFilters.semester
        ? reset.days
        : reset.days
    );
    setDaySlots(reset.slots);
    setShowQuickSetup(true);
  };

  const getSlotsForDay = (day: number) =>
    (slots || [])
      .filter((s: { dayOfWeek: number }) => s.dayOfWeek === day)
      .sort((a: { startTime: string }, b: { startTime: string }) =>
        a.startTime.localeCompare(b.startTime)
      );

  const SlotCard = ({
    s,
    compact,
  }: {
    s: {
      id: string;
      courseCode: string;
      startTime: string;
      endTime: string;
      roomNumber?: string | null;
      teacherAcronym?: string | null;
      teacherName?: string | null;
    };
    compact?: boolean;
  }) => (
    <div className={cn('rounded-lg bg-primary/10 p-2 text-xs relative group', compact && 'p-3 text-sm')}>
      <p className="font-mono font-medium">{s.courseCode}</p>
      <p className="text-muted-foreground">
        {formatTime(s.startTime)} - {formatTime(s.endTime)}
      </p>
      <p className="text-muted-foreground">
        Rm {s.roomNumber ?? '—'}
        {s.teacherAcronym ? ` · ${s.teacherAcronym}` : s.teacherName ? ` · ${s.teacherName}` : ''}
      </p>
      {!readOnly && (
        <button
          type="button"
          className="absolute top-1 right-1 rounded p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={() => deleteMutation.mutate(s.id)}
        >
          <Trash2 className="h-3 w-3 text-danger" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="page-header">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Class Routine</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Weekly timetable builder</p>
        </div>
        {!readOnly && (
          <div className="page-actions">
            <Button variant="outline" className="w-full sm:w-auto" onClick={openQuickSetup}>
              <CalendarDays className="mr-1 h-4 w-4" />
              Quick Setup
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setForm({
                  ...resetForm(),
                  department: viewFilters.department,
                  section: viewFilters.section,
                  semester: viewFilters.semester,
                });
                setShowModal(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Slot
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">View routine by</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="filter-grid">
            <div className="field-full">
              <Label>Department</Label>
              <SelectField
                value={viewFilters.department}
                placeholder="Select department"
                onChange={(e) => setViewFilters({ department: e.target.value, section: '', semester: '' })}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="field-full">
              <Label>Section</Label>
              <SelectField
                value={viewFilters.section}
                placeholder="Select section"
                disabled={!viewFilters.department}
                onChange={(e) => setViewFilters({ ...viewFilters, section: e.target.value, semester: '' })}
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="field-full">
              <Label>Semester</Label>
              <SelectField
                value={viewFilters.semester}
                placeholder="Select semester"
                disabled={!viewFilters.section}
                onChange={(e) => setViewFilters({ ...viewFilters, semester: e.target.value })}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          {!canViewRoutine && (
            <p className="mt-3 text-sm text-muted-foreground">
              Select department, section, and semester to view the matching routine.
            </p>
          )}
        </CardContent>
      </Card>

      {canViewRoutine && (
        <>
          {displayDays.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No routine yet. Use Quick Setup to add classes for this department and semester.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex gap-1 overflow-x-auto lg:hidden">
                {displayDays.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMobileDay(d)}
                    className={cn(
                      'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      mobileDay === d ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800',
                      todayIso === d && mobileDay !== d && 'ring-2 ring-primary/60 text-primary dark:text-primary'
                    )}
                  >
                    {dayLabel(d, true)}
                  </button>
                ))}
              </div>

              <div className="space-y-2 lg:hidden">
                {getSlotsForDay(mobileDay).map((s) => (
                  <SlotCard key={s.id} s={s} compact />
                ))}
                {getSlotsForDay(mobileDay).length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No slots for this day</p>
                )}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <div
                  className="grid min-w-[560px] gap-2"
                  style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))` }}
                >
                  {displayDays.map((dayNum) => {
                    const isToday = todayIso === dayNum;
                    return (
                      <Card
                        key={dayNum}
                        className={cn(
                          isToday &&
                            'border-primary bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/15 dark:bg-primary/15'
                        )}
                      >
                        <CardHeader className={cn('p-3', isToday && 'border-b border-primary/20 bg-primary/10')}>
                          <CardTitle
                            className={cn('text-sm text-center', isToday && 'font-bold text-primary')}
                          >
                            {dayLabel(dayNum)}
                            {isToday && (
                              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Today
                              </span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-2">
                          {getSlotsForDay(dayNum).map((s) => (
                            <SlotCard key={s.id} s={s} />
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showQuickSetup && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <CardHeader>
              <CardTitle>Quick Routine Setup</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose up to 4 days, then fill 2–4 classes per day.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="filter-grid">
                <div className="field-full">
                  <Label>Department</Label>
                  <SelectField
                    value={quickFilters.department}
                    placeholder="Select department"
                    onChange={(e) =>
                      setQuickFilters({ department: e.target.value, section: '', semester: '' })
                    }
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="field-full">
                  <Label>Section</Label>
                  <SelectField
                    value={quickFilters.section}
                    placeholder="Select section"
                    disabled={!quickFilters.department}
                    onChange={(e) =>
                      setQuickFilters({ ...quickFilters, section: e.target.value, semester: '' })
                    }
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="field-full">
                  <Label>Semester</Label>
                  <SelectField
                    value={quickFilters.semester}
                    placeholder="Select semester"
                    disabled={!quickFilters.section}
                    onChange={(e) => setQuickFilters({ ...quickFilters, semester: e.target.value })}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>

              <div>
                <Label>Teaching days (max 4)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-200 bg-surface dark:border-slate-700'
                        )}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {canLoadQuickCourses && quickAvailableCourses.length === 0 && (
                <p className="text-sm text-danger">No courses for this department and semester. Add courses first.</p>
              )}

              {sortDayValues(selectedDays).map((day) => (
                <div key={day} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-medium">{dayLabel(day)}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={(daySlots[day]?.length || 0) >= ROUTINE_CLASSES_PER_DAY.max}
                      onClick={() => addClassRow(day)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add class
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(daySlots[day] || createQuickSlots()).map((slot, index) => (
                      <div
                        key={`${day}-${index}`}
                        className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
                      >
                        <div>
                          <Label className="text-xs">Course</Label>
                          <SelectField
                            value={slot.courseId}
                            placeholder={canLoadQuickCourses ? 'Select course' : 'Select filters first'}
                            disabled={!canLoadQuickCourses}
                            onChange={(e) => updateDaySlot(day, index, { courseId: e.target.value })}
                          >
                            {quickAvailableCourses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.courseCode}
                              </option>
                            ))}
                          </SelectField>
                        </div>
                        <div>
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateDaySlot(day, index, { startTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateDaySlot(day, index, { endTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Room</Label>
                          <Input
                            placeholder="306"
                            value={slot.roomNumber}
                            onChange={(e) => updateDaySlot(day, index, { roomNumber: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={(daySlots[day]?.length || 0) <= ROUTINE_CLASSES_PER_DAY.min}
                            onClick={() => removeClassRow(day, index)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setShowQuickSetup(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canLoadQuickCourses || quickSaveMutation.isPending}
                  onClick={saveQuickSetup}
                >
                  {quickSaveMutation.isPending ? 'Saving...' : 'Save Routine'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showModal && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Routine Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="field-full">
                  <Label>Department</Label>
                  <SelectField
                    value={form.department}
                    placeholder="Select department"
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value, section: '', semester: '', courseId: '' })
                    }
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="field-full">
                  <Label>Section</Label>
                  <SelectField
                    value={form.section}
                    placeholder="Select section"
                    disabled={!form.department}
                    onChange={(e) => setForm({ ...form, section: e.target.value, semester: '', courseId: '' })}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>
              <div className="field-full">
                <Label>Semester</Label>
                <SelectField
                  value={form.semester}
                  placeholder="Select semester"
                  disabled={!form.section}
                  onChange={(e) => setForm({ ...form, semester: e.target.value, courseId: '' })}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="field-full">
                <Label>Course</Label>
                <SelectField
                  value={form.courseId}
                  placeholder={
                    !canLoadCourses ? 'Select department, section, and semester first' : 'Select course'
                  }
                  disabled={!canLoadCourses}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                >
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode}
                    </option>
                  ))}
                </SelectField>
                {canLoadCourses && availableCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No courses found for this department and semester.
                  </p>
                )}
              </div>
              <div className="field-full">
                <Label>Day</Label>
                <SelectField
                  value={String(form.dayOfWeek)}
                  onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value, 10) })}
                >
                  {WEEK_DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="field-full">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="field-full">
                  <Label>End</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="field-full">
                <Label>Room</Label>
                <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canLoadCourses || !form.courseId}
                  onClick={() => createMutation.mutate({ ...form, section: form.section })}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
