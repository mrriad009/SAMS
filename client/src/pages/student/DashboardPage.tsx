import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ClipboardCheck, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { studentApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceColor, formatDate, formatTime } from '@/lib/utils';
import { getTodayIsoDayOfWeek } from '@/config/academic';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['student-summary'],
    queryFn: async () => (await studentApi.summary()).data.data,
  });

  const { data: routine } = useQuery({
    queryKey: ['student-routine'],
    queryFn: async () => (await studentApi.routine()).data.data,
  });

  const { data: announcements } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: async () => (await studentApi.announcements()).data.data,
  });

  const todayIso = getTodayIsoDayOfWeek();
  const todayClasses = (routine || []).filter((r: { dayOfWeek: number }) => r.dayOfWeek === todayIso);

  const pct = summary?.overall?.percentage ?? 0;
  const chartData = [{ name: 'Present', value: pct }, { name: 'Absent', value: 100 - pct }];
  const COLORS = ['#22C55E', '#E2E8F0'];

  const quickLinks = [
    { to: '/student/routine', label: 'Routine', icon: Calendar },
    { to: '/student/courses', label: 'Courses', icon: BookOpen },
    { to: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold">Hello, {user?.name}!</h2>
        <p className="text-muted-foreground">Here&apos;s your attendance overview</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Overall Attendance</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : (
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270}>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-display text-3xl font-bold ${getAttendanceColor(pct, summary?.threshold)}`}>{pct}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Today&apos;s Classes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todayClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No classes today</p>
            ) : (
              todayClasses.map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="font-medium text-sm font-mono">{c.courseCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(c.startTime)} · Room {c.roomNumber || 'TBA'}
                    {c.teacherAcronym ? ` · ${c.teacherAcronym}` : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {(announcements || []).filter((a: { isPinned: boolean }) => a.isPinned).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pinned Announcements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(announcements || []).filter((a: { isPinned: boolean }) => a.isPinned).slice(0, 2).map((a: { id: string; title: string; createdAt: string }) => (
              <div key={a.id} className="rounded-lg border p-3 dark:border-slate-700">
                <Badge variant="warning" className="mb-1">Pinned</Badge>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
