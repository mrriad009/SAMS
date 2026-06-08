import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCoursesApi } from '@/services/endpoints';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEMESTERS, DEPARTMENTS } from '@/config/academic';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';

export default function CoursesPage() {
  const readOnly = useReadOnlyStaff();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ courseCode: '', courseName: '', department: 'Computer Science & Engineering', semester: 6 });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await adminCoursesApi.list()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => adminCoursesApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course created'); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<Course> }) => adminCoursesApi.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course updated'); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCoursesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course deleted'); },
  });

  return (
    <div className="min-w-0 space-y-6">
      <div className="page-header">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Courses</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Manage semester courses</p>
        </div>
        {!readOnly && (
          <Button className="w-full sm:w-auto" onClick={() => { setEditCourse(null); setShowModal(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            Add Course
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(courses || []).map((c: Course) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="font-mono">{c.courseCode}</Badge>
                    <CardTitle className="mt-2 text-base">{c.courseName}</CardTitle>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditCourse(c); setForm({ courseCode: c.courseCode, courseName: c.courseName, department: c.department, semester: c.semester }); setShowModal(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.department} · Sem {c.semester}</p>
                <p className="text-sm">{c.enrolledCount || 0} enrolled</p>
                {c.teacherName && <p className="text-sm mt-1">Teacher: {c.teacherName}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <CardHeader><CardTitle>{editCourse ? 'Edit Course' : 'Add Course'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Course Code</Label>
                <Input value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Course Name</Label>
                <Input value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} />
              </div>
              <div className="field-full">
                <Label>Department</Label>
                <SelectField
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-1">
                <Label>Semester</Label>
                <SelectField
                  value={String(form.semester)}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value, 10) })}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => editCourse ? updateMutation.mutate({ id: editCourse.id, data: form }) : createMutation.mutate(form)}>{editCourse ? 'Update' : 'Create'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
