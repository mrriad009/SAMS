import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const schema = z.object({
  email: z.string().email('Valid email required'),
});

type FormData = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || 'Request failed';
  }
  return 'Request failed';
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('If the email exists, a reset link has been sent');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg dark:bg-dark-surface">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          {sent
            ? 'Check your email for reset instructions'
            : 'Enter the email address on your student account to receive a reset link'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>If an account exists for that email, you will receive a password reset link shortly.</p>
            <Link to="/login" className="block text-primary hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="11220321018@gmail.com" {...register('email')} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">
              Back to login
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
