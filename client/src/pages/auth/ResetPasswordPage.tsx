import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { authApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || 'Password reset failed';
  }
  return 'Password reset failed';
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or missing reset link');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, data.newPassword);
      toast.success('Password reset successful. Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-0 shadow-lg dark:bg-dark-surface">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Invalid Reset Link</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to="/forgot-password" className="block text-center text-sm text-primary hover:underline">
            Request a new reset link
          </Link>
          <Link to="/login" className="block text-center text-sm text-muted-foreground hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg dark:bg-dark-surface">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-danger">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-danger">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm text-primary hover:underline">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
