import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminReportsApi, adminAnnouncementsApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'text-primary' },
  { key: 'totalCourses', label: 'Total Courses', icon: BookOpen, color: 'text-secondary' },
  { key: 'todaySessions', label: "Today's Sessions", icon: Calendar, color: 'text-warning' },
  { key: 'monthlyAttendancePercentage', label: 'Monthly Attendance', icon: TrendingUp, color: 'text-success', suffix: '%' },
];

export default function AdminDashboardPage() {
  const readOnly = useReadOnlyStaff();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminReportsApi.dashboard()).data.data,
  });

  const { data: trend } = useQuery({
    queryKey: ['admin-trend'],
    queryFn: async () => (await adminReportsApi.trend(7)).data.data,
  });

  const { data: lowAttendance } = useQuery({
    queryKey: ['admin-low-attendance'],
    queryFn: async () => (await adminReportsApi.lowAttendance()).data.data,
  });

  const { data: todaySessions } = useQuery({
    queryKey: ['admin-today-sessions'],
    queryFn: async () => (await adminReportsApi.todaySessions()).data.data,
  });

  const { data: announcements } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => (await adminAnnouncementsApi.list()).data.data,
  });

  const chartData = (trend || []).map((t: { date: string; total: number; present: number }) => ({
    date: formatDate(t.date),
    percentage: t.total > 0 ? Math.round((t.present / t.total) * 100) : 0,
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {readOnly ? 'Section overview — view data and collect attendance' : 'Overview of your attendance system'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`rounded-lg bg-slate-100 p-3 dark:bg-slate-800 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    {statsLoading ? (
                      <Skeleton className="mt-1 h-7 w-16" />
                    ) : (
                      <p className="font-display text-2xl font-bold">
                        {stats?.[card.key] ?? 0}{card.suffix || ''}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Attendance Trend (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} width={32} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Low Attendance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {(lowAttendance || []).slice(0, 5).map((s: { id: string; name: string; studentId: string; percentage: number }) => (
                <div key={s.id} className="row-stack rounded-lg border p-3 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.studentId}</p>
                  </div>
                  <Badge variant="danger" className="shrink-0">{s.percentage}%</Badge>
                </div>
              ))}
              {(!lowAttendance || lowAttendance.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Today&apos;s Schedule</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(todaySessions || []).map((s: { id: string; courseCode: string; courseName: string; startTime: string; roomNumber?: string }) => (
                <div key={s.id} className="row-stack rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.courseCode} - {s.courseName}</p>
                    <p className="text-xs text-muted-foreground">Room {s.roomNumber || 'TBA'}</p>
                  </div>
                  <Badge className="shrink-0">{s.startTime?.slice(0, 5)}</Badge>
                </div>
              ))}
              {(!todaySessions || todaySessions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No sessions today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Announcements</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(announcements || []).slice(0, 3).map((a: { id: string; title: string; isPinned: boolean; createdAt: string }) => (
                <div key={a.id} className="rounded-lg border p-3 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {a.isPinned && <Badge variant="warning">Pinned</Badge>}
                    <p className="font-medium text-sm">{a.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
