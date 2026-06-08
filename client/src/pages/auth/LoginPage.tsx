import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { publicApi } from '@/services/endpoints';
import { getStaffHomePath } from '@/lib/staff-routes';
import { crAccountPassword, DEMO_CR_SEMESTER, DEMO_CR_SECTION } from '@/config/cr-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  email: z.string().min(1, 'Email or username required'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || 'Login failed';
  }
  return 'Login failed';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const submitLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (!role) return;
      const configRes = await publicApi.getConfig();
      const appMode = configRes.data.data?.appMode === 'advanced' ? 'advanced' : 'general';
      navigate(getStaffHomePath(role, appMode));
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormData) => submitLogin(data.email, data.password);

  const fillQuickLogin = (role: 'teacher' | 'student') => {
    if (role === 'teacher') {
      setValue('email', 'cr8e');
      setValue('password', crAccountPassword(DEMO_CR_SEMESTER, DEMO_CR_SECTION));
    } else {
      setValue('email', 'student');
      setValue('password', '11220321018');
    }
  };

  return (
    <Card className="border-0 shadow-lg dark:bg-dark-surface">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email or username</Label>
            <Input id="email" placeholder="Username or email" {...register('email')} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="Your password" {...register('password')} />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New student?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="flex-1 min-w-[100px]" size="sm" onClick={() => fillQuickLogin('teacher')}>
            CR
          </Button>
          <Button type="button" variant="outline" className="flex-1 min-w-[100px]" size="sm" onClick={() => fillQuickLogin('student')}>
            Student
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
