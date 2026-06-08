import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Plus, RefreshCw, X } from 'lucide-react';
import { studentApi } from '@/services/endpoints';
import { useAuth } from '@/hooks/useAuth';
import type { Course, StudentProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SelectField } from '@/components/ui/select-field';
import { Label } from '@/components/ui/label';
import { SEMESTERS } from '@/config/academic';

function CourseCard({
  course,
  action,
  retake,
}: {
  course: Course;
  action?: ReactNode;
  retake?: boolean;
}) {
  return (
    <Card className={retake ? 'border-amber-500/30 bg-amber-500/5' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {course.courseCode}
              </Badge>
              <Badge>Sem {course.semester}</Badge>
              {retake && (
                <Badge variant="warning" className="text-[10px] uppercase tracking-wide">
                  Retake
                </Badge>
              )}
            </div>
            <CardTitle className="text-base mt-2">{course.courseName}</CardTitle>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>
        {course.teacherName && <p className="text-sm">Instructor: {course.teacherName}</p>}
      </CardContent>
    </Card>
  );
}

export default function StudentCoursesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const profile = user?.profile as StudentProfile | undefined;
  const currentSemester = profile?.semester ?? 8;

  const pastSemesters = useMemo(
    () => SEMESTERS.filter((s) => s < currentSemester),
    [currentSemester]
  );

  const [retakeSemester, setRetakeSemester] = useState<string>(
    pastSemesters.length ? String(pastSemesters[pastSemesters.length - 1]) : ''
  );

  const { data: courses, isLoading: loadingEnrolled } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => (await studentApi.courses()).data.data,
  });

  const { data: available, isLoading: loadingAvailable } = useQuery({
    queryKey: ['student-courses-available'],
    queryFn: async () => (await studentApi.availableCourses()).data.data,
  });

  const { data: retakeCourses, isLoading: loadingRetake } = useQuery({
    queryKey: ['student-courses-retake', retakeSemester],
    queryFn: async () =>
      (await studentApi.retakeCourses(retakeSemester ? Number(retakeSemester) : undefined)).data.data,
    enabled: pastSemesters.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['student-courses'] });
    queryClient.invalidateQueries({ queryKey: ['student-courses-available'] });
    queryClient.invalidateQueries({ queryKey: ['student-courses-retake'] });
  };

  const enrollMutation = useMutation({
    mutationFn: ({ id, retake }: { id: string; retake?: boolean }) =>
      studentApi.enrollCourse(id, retake ? { retake: true } : undefined),
    onSuccess: (_data, vars) => {
      toast.success(vars.retake ? 'Retake enrollment successful' : 'Enrolled in course');
      invalidate();
    },
    onError: () => toast.error('Could not enroll in course'),
  });

  const dropMutation = useMutation({
    mutationFn: (id: string) => studentApi.dropCourse(id),
    onSuccess: () => {
      toast.success('Dropped from course');
      invalidate();
    },
    onError: () => toast.error('Could not drop course'),
  });

  const enrolledRetakeCount = useMemo(
    () =>
      (courses || []).filter((c: Course) => c.semester < currentSemester).length,
    [courses, currentSemester]
  );

  const semesterLabel = profile?.semester ? `Semester ${profile.semester}` : 'your current semester';
  const deptLabel = profile?.department || 'your department';

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">My Courses</h2>
        <p className="text-muted-foreground">
          Enrolled courses for {deptLabel} · {semesterLabel}
          {enrolledRetakeCount > 0 && ` · ${enrolledRetakeCount} retake`}
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Enrolled
        </h3>
        {loadingEnrolled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(courses || []).map((c: Course) => (
              <CourseCard
                key={c.id}
                course={c}
                retake={c.semester < currentSemester}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger shrink-0"
                    disabled={dropMutation.isPending}
                    onClick={() => dropMutation.mutate(c.id)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Drop
                  </Button>
                }
              />
            ))}
            {(!courses || courses.length === 0) && (
              <p className="text-muted-foreground col-span-2 text-center py-8 rounded-lg border border-dashed dark:border-slate-700">
                No enrolled courses yet. Browse available courses below to enroll.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Current semester
        </h3>
        {loadingAvailable ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(available || []).map((c: Course) => (
              <CourseCard
                key={c.id}
                course={c}
                action={
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={enrollMutation.isPending}
                    onClick={() => enrollMutation.mutate({ id: c.id })}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Enroll
                  </Button>
                }
              />
            ))}
            {(!available || available.length === 0) && (
              <p className="text-muted-foreground col-span-2 text-center py-8 rounded-lg border border-dashed dark:border-slate-700">
                No more courses available for {deptLabel} · {semesterLabel}.
              </p>
            )}
          </div>
        )}
      </section>

      {pastSemesters.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              Retake — past semesters
            </h3>
            <div className="w-full sm:w-48 space-y-1">
              <Label className="text-xs text-muted-foreground">Past semester</Label>
              <SelectField
                value={retakeSemester}
                onChange={(e) => setRetakeSemester(e.target.value)}
              >
                <option value="">All past semesters</option>
                {[...pastSemesters].reverse().map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Section {profile?.section ?? '—'} · enroll in courses from earlier semesters you need to
            retake. Same department ({deptLabel}) only.
          </p>
          {loadingRetake ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(retakeCourses || []).map((c: Course) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  retake
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-400"
                      disabled={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate({ id: c.id, retake: true })}
                    >
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Retake
                    </Button>
                  }
                />
              ))}
              {(!retakeCourses || retakeCourses.length === 0) && (
                <p className="text-muted-foreground col-span-2 text-center py-8 rounded-lg border border-dashed border-amber-500/20">
                  {retakeSemester
                    ? `No retake courses left for Semester ${retakeSemester}.`
                    : 'No past-semester courses available to retake.'}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
