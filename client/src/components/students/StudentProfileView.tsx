import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import type { PublicStudentProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAttendanceColor } from '@/lib/utils';

interface StudentProfileViewProps {
  data: PublicStudentProfile;
  backTo: string;
  backLabel?: string;
}

export function StudentProfileView({ data, backTo, backLabel = 'Back to students' }: StudentProfileViewProps) {
  const { profile, courses, attendance } = data;
  const threshold = attendance.threshold;

  const formatPercentage = (percentage: number, total: number) =>
    total === 0 ? 'N/A' : `${percentage}%`;

  return (
    <div className="min-w-0 space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to={backTo}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <UserAvatar
            src={profile.avatarUrl}
            name={profile.name}
            size="lg"
            className="mx-auto sm:mx-0"
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{profile.studentId}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">{profile.department}</Badge>
              <Badge>Section {profile.section}</Badge>
              <Badge>Semester {profile.semester}</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {profile.email && (
                <p className="flex items-center justify-center gap-2 sm:justify-start">
                  <Mail className="h-4 w-4 shrink-0" />
                  {profile.email}
                </p>
              )}
              {profile.phone && (
                <p className="flex items-center justify-center gap-2 sm:justify-start">
                  <Phone className="h-4 w-4 shrink-0" />
                  {profile.phone}
                </p>
              )}
              {profile.address && (
                <p className="flex items-center justify-center gap-2 sm:justify-start">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {profile.address}
                </p>
              )}
              {profile.guardianName && (
                <p>
                  Guardian: {profile.guardianName}
                  {profile.guardianPhone ? ` · ${profile.guardianPhone}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall attendance</p>
            <p
              className={`font-display text-4xl font-bold ${
                attendance.overall.total === 0
                  ? 'text-muted-foreground'
                  : getAttendanceColor(attendance.overall.percentage, threshold)
              }`}
            >
              {formatPercentage(attendance.overall.percentage, attendance.overall.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              {attendance.overall.present}/{attendance.overall.total} classes
            </p>
            {attendance.overall.belowThreshold && (
              <Badge variant="danger" className="mt-2">
                Below {threshold}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {attendance.overall.belowThreshold && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm">Overall attendance is below the {threshold}% threshold.</p>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold">Enrolled courses</h2>
        {courses.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No courses enrolled yet.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
              const stats = attendance.courses.find((s) => s.courseId === c.id);
              return (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <p className="font-mono text-xs text-muted-foreground">{c.courseCode}</p>
                    <p className="font-medium">{c.courseName}</p>
                    {c.teacherName && (
                      <p className="mt-1 text-xs text-muted-foreground">Instructor: {c.teacherName}</p>
                    )}
                    {stats ? (
                      <>
                        <p
                          className={`font-display text-2xl font-bold mt-2 ${
                            stats.total === 0
                              ? 'text-muted-foreground'
                              : getAttendanceColor(stats.percentage, threshold)
                          }`}
                        >
                          {formatPercentage(stats.percentage, stats.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stats.present}/{stats.total} classes
                        </p>
                        {stats.belowThreshold && (
                          <Badge variant="danger" className="mt-2">
                            Below threshold
                          </Badge>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No attendance recorded yet</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {attendance.courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance by course</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="p-4 text-left">Course</th>
                    <th className="p-4 text-left">Present</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4 text-left">%</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.courses.map((c) => (
                    <tr key={c.courseId} className="border-b dark:border-slate-700">
                      <td className="p-4">
                        <span className="font-mono text-xs">{c.courseCode}</span>
                        <span className="ml-2">{c.courseName}</span>
                      </td>
                      <td className="p-4">{c.present}</td>
                      <td className="p-4">{c.total}</td>
                      <td
                        className={`p-4 font-medium ${
                          c.total === 0
                            ? 'text-muted-foreground'
                            : getAttendanceColor(c.percentage, threshold)
                        }`}
                      >
                        {formatPercentage(c.percentage, c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
