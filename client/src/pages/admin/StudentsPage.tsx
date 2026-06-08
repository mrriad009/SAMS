import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { adminStudentsApi } from '@/services/endpoints';
import type { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CSE_DEPARTMENT, SECTIONS } from '@/config/academic';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';
import { useStaffBasePath } from '@/hooks/useStaffBasePath';
import { calculateSemester, getBatchYearOptions } from '@/lib/semester';

const currentYear = new Date().getFullYear();

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

const defaultForm = {
  name: '',
  email: '',
  studentId: '',
  department: CSE_DEPARTMENT,
  section: 'A',
  batchYear: currentYear,
  phone: '',
};

type StudentForm = typeof defaultForm;

function normalizeForm(form: StudentForm): StudentForm {
  return { ...form, studentId: form.studentId.trim(), email: form.email.trim() };
}

export default function StudentsPage() {
  const readOnly = useReadOnlyStaff();
  const basePath = useStaffBasePath();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: async () => (await adminStudentsApi.list({ search, limit: 50 })).data,
  });

  const createMutation = useMutation({
    mutationFn: (d: StudentForm) => adminStudentsApi.create(normalizeForm(d)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created');
      setShowModal(false);
      setForm(defaultForm);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create student')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: StudentForm }) =>
      adminStudentsApi.update(id, normalizeForm(d)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated');
      setShowModal(false);
      setEditStudent(null);
      setForm(defaultForm);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update student')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminStudentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted');
    },
  });

  const students = useMemo(
    () =>
      [...(data?.data || [])].sort((a, b) =>
        a.studentId.localeCompare(b.studentId, undefined, { numeric: true })
      ),
    [data?.data]
  );

  const openProfile = (studentId: string) => navigate(`${basePath}/students/${encodeURIComponent(studentId)}`);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">
            {data?.meta?.total || 0} total students · click a row to view attendance profile
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => { setEditStudent(null); setShowModal(true); }}>
            <Plus className="mr-1 h-4 w-4" />Add Student
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="p-3 text-left font-medium sm:p-4">Student ID</th>
                  <th className="p-3 text-left font-medium sm:p-4">Name</th>
                  <th className="p-3 text-left font-medium hidden md:table-cell sm:p-4">Email</th>
                  <th className="p-3 text-left font-medium sm:p-4">Dept</th>
                  <th className="p-3 text-left font-medium sm:p-4">Section</th>
                  <th className="p-3 text-right font-medium sm:p-4">{readOnly ? 'Profile' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-8" /></td></tr>
                  ))
                ) : students.map((s: Student) => (
                  <tr
                    key={s.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => openProfile(s.studentId)}
                  >
                    <td className="p-3 font-mono text-xs sm:p-4">{s.studentId}</td>
                    <td className="p-3 font-medium sm:p-4">{s.name}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground sm:p-4">{s.email}</td>
                    <td className="p-3 sm:p-4"><Badge variant="secondary" className="max-w-[120px] truncate">{s.department}</Badge></td>
                    <td className="p-3 sm:p-4">{s.section}</td>
                    <td className="p-3 text-right sm:p-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="View attendance profile" onClick={() => openProfile(s.studentId)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => { setEditStudent(s); setForm({ name: s.name, email: s.email, studentId: s.studentId, department: s.department, section: s.section, batchYear: s.batchYear, phone: s.phone || '' }); setShowModal(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardHeader><CardTitle>{editStudent ? 'Edit Student' : 'Add Student'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(['name', 'email', 'studentId', 'phone'] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label>{field === 'studentId' ? 'Student ID' : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                  <Input
                    value={String(form[field as keyof typeof form] || '')}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input value={CSE_DEPARTMENT} readOnly className="bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label>Section</Label>
                  <SelectField
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Batch Year</Label>
                  <SelectField
                    value={String(form.batchYear)}
                    onChange={(e) => setForm({ ...form, batchYear: parseInt(e.target.value, 10) })}
                  >
                    {getBatchYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="space-y-1">
                  <Label>Semester</Label>
                  <Input value={`Semester ${calculateSemester(form.batchYear)}`} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Auto from batch year</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => editStudent ? updateMutation.mutate({ id: editStudent.id, data: form }) : createMutation.mutate(form)}>
                  {editStudent ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
