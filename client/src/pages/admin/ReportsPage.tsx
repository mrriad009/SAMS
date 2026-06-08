import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminReportsApi, adminCoursesApi } from '@/services/endpoints';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';
import { useStaffBasePath } from '@/hooks/useStaffBasePath';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import { useAuth } from '@/hooks/useAuth';
import type { TeacherProfile } from '@/types';

export default function ReportsPage() {
  const readOnly = useReadOnlyStaff();
  const basePath = useStaffBasePath();
  const { user } = useAuth();
  const { lockedSection } = useStaffPermissions();
  const teacherProfile = user?.profile as TeacherProfile | undefined;
  const defaultSection = lockedSection ?? (readOnly && teacherProfile?.section ? teacherProfile.section : '');

  const [filters, setFilters] = useState({ courseId: '', dateFrom: '', dateTo: '', section: defaultSection });

  const { data: courses } = useQuery({
    queryKey: ['courses', readOnly ? teacherProfile?.department : undefined],
    queryFn: async () =>
      (
        await adminCoursesApi.list(
          readOnly && teacherProfile
            ? {
                department: teacherProfile.department,
                semester: teacherProfile.semester ?? undefined,
              }
            : undefined
        )
      ).data.data,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', filters],
    queryFn: async () => (await adminReportsApi.report(filters)).data.data,
  });

  const defaulters = useMemo(
    () =>
      [...(report?.defaulters || [])].sort((a: { studentId: string }, b: { studentId: string }) =>
        a.studentId.localeCompare(b.studentId, undefined, { numeric: true })
      ),
    [report?.defaulters]
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="page-header">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {readOnly
              ? 'Section attendance performance — open Students to view any profile'
              : 'Attendance insights and exports'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="filter-grid">
            <div className="field-full">
              <Label>Course</Label>
              <select
                className="select-field"
                value={filters.courseId}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              >
                <option value="">All courses</option>
                {(courses || []).map((c: { id: string; courseCode: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-full">
              <Label>From</Label>
              <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            </div>
            <div className="field-full">
              <Label>To</Label>
              <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
            </div>
            <div className="field-full">
              <Label>Section</Label>
              <Input
                value={lockedSection ?? filters.section}
                readOnly={!!lockedSection}
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                placeholder={defaultSection || 'A'}
                className={lockedSection ? 'bg-muted' : undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isLoading && report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="font-display text-2xl font-bold sm:text-3xl">{report.summary.totalRecords}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Present/Late</p>
                <p className="font-display text-2xl font-bold text-success sm:text-3xl">{report.summary.presentCount}</p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Defaulters</p>
                <p className="font-display text-2xl font-bold text-danger sm:text-3xl">{defaulters.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Attendance by Course</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.courseStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="courseCode" fontSize={11} tick={{ fill: 'currentColor' }} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: 'currentColor' }} width={32} />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(report.trend || []).map((t: { date: string; total: number; present: number }) => ({
                        date: t.date,
                        pct: t.total > 0 ? Math.round((t.present / t.total) * 100) : 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={11} tick={{ fill: 'currentColor' }} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: 'currentColor' }} width={32} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pct" stroke="#6366F1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Defaulter List (&lt; {report.threshold}%)</CardTitle>
            </CardHeader>
            <CardContent>
              {defaulters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students below the attendance threshold.</p>
              ) : (
                <div className="space-y-2">
                  {defaulters.map((d: { id: string; name: string; studentId: string; percentage: number; section: string }) => (
                    <Link
                      key={d.id}
                      to={`${basePath}/students/${encodeURIComponent(d.studentId)}`}
                      className="row-stack rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{d.studentId} · Sec {d.section}</p>
                      </div>
                      <Badge variant="danger" className="shrink-0 self-start sm:self-center">
                        {d.percentage}%
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
