import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { studentApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceColor, formatDate } from '@/lib/utils';

export default function StudentAttendancePage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['student-summary'],
    queryFn: async () => (await studentApi.summary()).data.data,
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => (await studentApi.attendance()).data.data,
  });

  const statusVariant = (status: string) => {
    if (status === 'present') return 'success';
    if (status === 'late') return 'warning';
    if (status === 'excused') return 'secondary';
    return 'danger';
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Attendance</h2>
        <p className="text-muted-foreground">Track your class attendance records</p>
      </div>

      {summary?.overall?.belowThreshold && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <p className="text-sm">Your overall attendance is below the {summary.threshold}% threshold. Please improve attendance.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : (summary?.courses || []).map((c: { courseId: string; courseCode: string; courseName: string; percentage: number; present: number; total: number; belowThreshold: boolean }) => (
            <Card key={c.courseId}>
              <CardContent className="p-4">
                <p className="font-mono text-xs text-muted-foreground">{c.courseCode}</p>
                <p className="font-medium">{c.courseName}</p>
                <p className={`font-display text-2xl font-bold mt-2 ${getAttendanceColor(c.percentage, summary?.threshold)}`}>{c.percentage}%</p>
                <p className="text-xs text-muted-foreground">{c.present}/{c.total} classes</p>
                {c.belowThreshold && <Badge variant="danger" className="mt-2">Below threshold</Badge>}
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Attendance Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Course</th>
                  <th className="p-4 text-left hidden sm:table-cell">Topic</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-6" /></td></tr>
                  ))
                ) : (records || []).map((r) => (
                  <tr key={r.id} className="border-b dark:border-slate-700">
                    <td className="p-3 sm:p-4">{formatDate(r.sessionDate)}</td>
                    <td className="p-3 sm:p-4">
                      <span className="font-mono text-xs">{r.courseCode}</span>
                      <span className="hidden sm:inline"> {r.courseName}</span>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground sm:p-4">{r.sessionTopic || '-'}</td>
                    <td className="p-3 sm:p-4"><Badge variant={statusVariant(r.status) as 'success'}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
