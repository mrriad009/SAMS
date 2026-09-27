import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SelectField } from '@/components/ui/select-field';

interface InboxCourse {
  courseCode: string;
  courseName: string;
}

interface InboxRow {
  id: string;
  studentName: string;
  studentId: string;
  section: string;
  semester: number;
  department: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  note?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  courses: InboxCourse[];
}

export default function LeaveInboxPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['leave-inbox', status, section, semester],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (section) params.section = section;
      if (semester) params.semester = semester;
      return (await leaveApi.inbox(params)).data.data as InboxRow[];
    },
  });

  const review = useMutation({
    mutationFn: (input: { id: string; decision: 'approved' | 'rejected' }) =>
      leaveApi.review(input.id, { decision: input.decision, reviewNote: notes[input.id] }),
    onSuccess: (_res, input) => {
      toast.success(input.decision === 'approved' ? 'Marked excused' : 'Request rejected');
      queryClient.invalidateQueries({ queryKey: ['leave-inbox'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Could not update the request');
    },
  });

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">Leave requests</h2>
        <p className="text-sm text-muted-foreground">Approve a request to mark those classes excused.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Status</Label>
          <SelectField value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </SelectField>
        </div>
        <div className="space-y-1">
          <Label>Section</Label>
          <Input value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} placeholder="E" />
        </div>
        <div className="space-y-1">
          <Label>Semester</Label>
          <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="8" />
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {(data || []).map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.studentId} · Sem {row.semester} · Sec {row.section} · {row.department}
                  </p>
                </div>
                <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'}>
                  {row.status}
                </Badge>
              </div>
              <p className="text-sm">
                {row.dateFrom} → {row.dateTo}
              </p>
              <p className="text-sm">{row.reason}</p>
              {row.note && <p className="text-xs text-muted-foreground">{row.note}</p>}
              <p className="text-xs text-muted-foreground">
                {(row.courses || []).map((course) => course.courseCode).join(', ')}
              </p>
              {row.status === 'pending' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Optional note to the student"
                    value={notes[row.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => review.mutate({ id: row.id, decision: 'approved' })} disabled={review.isPending}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => review.mutate({ id: row.id, decision: 'rejected' })}
                      disabled={review.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data || []).length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700">
            No leave requests match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
