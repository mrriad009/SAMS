import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentApi } from '@/services/endpoints';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeaveCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
}

interface LeaveRow {
  id: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  courses: LeaveCourse[];
}

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', reason: '', note: '', courseIds: [] as string[] });

  const { data: courses } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => (await studentApi.courses()).data.data as Course[],
  });

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['student-leaves'],
    queryFn: async () => (await studentApi.leaves()).data.data as LeaveRow[],
  });

  const submit = useMutation({
    mutationFn: () =>
      studentApi.createLeave({
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        courseIds: form.courseIds,
        reason: form.reason,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      toast.success('Leave request submitted');
      setForm({ dateFrom: '', dateTo: '', reason: '', note: '', courseIds: [] });
      queryClient.invalidateQueries({ queryKey: ['student-leaves'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Could not submit leave');
    },
  });

  const toggleCourse = (id: string) => {
    setForm((current) => ({
      ...current,
      courseIds: current.courseIds.includes(id)
        ? current.courseIds.filter((courseId) => courseId !== id)
        : [...current.courseIds, id],
    }));
  };

  const statusVariant = useMemo(
    () =>
      ({
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
      }) as const,
    []
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Leave request</h1>
        <p className="text-sm text-muted-foreground">
          Apply for leave. If staff approve it, those classes are marked excused.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Courses</Label>
            <div className="grid gap-2">
              {(courses || []).map((course) => (
                <label key={course.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.courseIds.includes(course.id)}
                    onChange={() => toggleCourse(course.id)}
                  />
                  <span>
                    {course.courseCode} · {course.courseName}
                  </span>
                </label>
              ))}
              {courses && courses.length === 0 && (
                <p className="text-sm text-muted-foreground">Enroll in a course before requesting leave.</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reason</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Illness, family event…" />
          </div>
          <div className="space-y-1">
            <Label>Supporting note (optional)</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <Button className="w-full sm:w-auto" onClick={() => submit.mutate()} disabled={submit.isPending}>
            Submit request
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your requests</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {(leaves || []).map((leave) => (
          <Card key={leave.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {leave.dateFrom} → {leave.dateTo}
                </p>
                <Badge variant={statusVariant[leave.status]}>{leave.status}</Badge>
              </div>
              <p className="text-sm">{leave.reason}</p>
              <p className="text-xs text-muted-foreground">
                {(leave.courses || []).map((course) => course.courseCode).join(', ') || 'No courses'}
              </p>
              {leave.reviewNote && <p className="text-sm text-muted-foreground">Note: {leave.reviewNote}</p>}
            </CardContent>
          </Card>
        ))}
        {!isLoading && (leaves || []).length === 0 && (
          <p className="text-sm text-muted-foreground">No leave requests yet.</p>
        )}
      </div>
    </div>
  );
}
