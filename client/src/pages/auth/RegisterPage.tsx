import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { authApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CSE_DEPARTMENT, DEPARTMENTS, SECTIONS } from '@/config/academic';

const currentYear = new Date().getFullYear();
const batchYears = Array.from({ length: 8 }, (_, i) => currentYear - i);

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  studentId: z.string().min(1, 'Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  section: z.string().min(1, 'Section is required'),
  batchYear: z.number().int().min(currentYear - 10).max(currentYear + 1),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || 'Registration failed';
  }
  return 'Registration failed';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      department: CSE_DEPARTMENT,
      batchYear: currentYear - 4,
    },
  });

  const department = watch('department');
  const section = watch('section');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.registerStudent({
        name: data.name,
        email: data.email,
        password: data.password,
        studentId: data.studentId.trim(),
        department: data.department,
        section: data.section,
        batchYear: data.batchYear,
        phone: data.phone?.trim() || undefined,
      });
      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg dark:bg-dark-surface">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Student Registration</CardTitle>
        <CardDescription>Create your student account for {CSE_DEPARTMENT}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" placeholder="Your full name" {...register('name')} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="11220321018@gmail.com" {...register('email')} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID *</Label>
            <Input id="studentId" placeholder="e.g. 11220321018" className="font-mono" {...register('studentId')} />
            {errors.studentId && <p className="text-xs text-danger">{errors.studentId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Department *</Label>
              <SelectField value={department} onChange={(e) => setValue('department', e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>
              {errors.department && <p className="text-xs text-danger">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Section *</Label>
              <SelectField
                value={section || ''}
                onChange={(e) => setValue('section', e.target.value, { shouldValidate: true })}
              >
                <option value="" disabled>
                  Select section
                </option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </SelectField>
              {errors.section && <p className="text-xs text-danger">{errors.section.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Batch Year *</Label>
            <SelectField {...register('batchYear', { valueAsNumber: true })}>
              {batchYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectField>
            {errors.batchYear && <p className="text-xs text-danger">{errors.batchYear.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="01xxxxxxxx (optional)" {...register('phone')} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
