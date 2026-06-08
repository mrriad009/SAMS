import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, studentApi } from '@/services/endpoints';
import { useAuth } from '@/hooks/useAuth';
import type { StudentProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEPARTMENTS, SECTIONS } from '@/config/academic';

interface ProfileForm {
  name: string;
  phone: string;
  department: string;
  section: string;
  address: string;
}

export default function StudentProfilePage() {
  const { user, fetchMe } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    department: '',
    section: '',
    address: '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '' });

  useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const res = await studentApi.profile();
      const data = res.data.data;
      if (data) {
        const p = data.profile as StudentProfile | undefined;
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          department: p?.department || '',
          section: p?.section || '',
          address: p?.address || '',
        });
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: ProfileForm) => studentApi.updateProfile(d),
    onSuccess: () => {
      toast.success('Profile updated');
      fetchMe();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => studentApi.uploadAvatar(file),
    onSuccess: () => {
      toast.success('Avatar uploaded');
      fetchMe();
    },
    onError: () => toast.error('Avatar upload failed'),
  });

  const profile = user?.profile as StudentProfile | undefined;

  const changePassword = async () => {
    try {
      await authApi.changePassword(passwords.current, passwords.newPass);
      toast.success('Password changed');
      setPasswords({ current: '', newPass: '' });
    } catch {
      toast.error('Failed to change password');
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.department.trim()) return toast.error('Department is required');
    if (!form.section.trim()) return toast.error('Section is required');
    updateMutation.mutate(form);
  };

  return (
    <div className="min-w-0 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground">Update your personal and academic information</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                form.name?.charAt(0) || user?.name?.charAt(0)
              )}
            </div>
            <label className="absolute bottom-0 right-0 cursor-pointer">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">
                +
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMutation.mutate(f);
                }}
              />
            </label>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile && (
              <p className="text-sm font-mono mt-1 text-muted-foreground">ID: {profile.studentId}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          {profile && (
            <div className="space-y-1">
              <Label>Student ID</Label>
              <Input value={profile.studentId} disabled className="font-mono bg-slate-50 dark:bg-slate-900" />
              <p className="text-xs text-muted-foreground">Student ID cannot be changed</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Department *</Label>
              <SelectField
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="space-y-1">
              <Label>Section *</Label>
              <SelectField
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
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
            </div>
          </div>

          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01xxxxxxxx (optional)"
            />
          </div>

          <div className="space-y-1">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {profile && (
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm border-t dark:border-slate-700">
              <div>
                <p className="text-muted-foreground">Semester</p>
                <p className="font-medium">{profile.semester}</p>
                <p className="text-xs text-muted-foreground">Updates automatically from your batch year</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="font-medium">{profile.batchYear}</p>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
            />
          </div>
          <Button onClick={changePassword}>Change Password</Button>
          <p className="text-sm text-muted-foreground">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-primary hover:underline">
              Reset via email
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
