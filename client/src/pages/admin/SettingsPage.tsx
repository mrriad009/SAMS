import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, adminReportsApi } from '@/services/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';

export default function SettingsPage() {
  const readOnly = useReadOnlyStaff();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '' });
  const [settings, setSettings] = useState<Record<string, string>>({});

  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await adminReportsApi.getSettings();
      setSettings(res.data.data);
      return res.data.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (d: Record<string, string>) => adminReportsApi.updateSettings(d),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-config'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (d: { name: string; phone: string }) => adminReportsApi.updateProfile(d),
    onSuccess: () => toast.success('Profile updated'),
  });

  const changePassword = async () => {
    try {
      await authApi.changePassword(passwords.current, passwords.newPass);
      toast.success('Password changed');
      setPasswords({ current: '', newPass: '' });
    } catch {
      toast.error('Failed to change password');
    }
  };

  return (
    <div className="min-w-0 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">{readOnly ? 'View-only system configuration' : 'System configuration and profile'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>System Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Attendance Threshold (%)</Label>
            <Input type="number" readOnly={readOnly} value={settings.attendance_threshold || '75'} onChange={(e) => setSettings({ ...settings, attendance_threshold: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Academic Year</Label>
            <Input readOnly={readOnly} value={settings.academic_year || ''} onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Current Semester</Label>
            <Input type="number" readOnly={readOnly} value={settings.current_semester || ''} onChange={(e) => setSettings({ ...settings, current_semester: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>App mode</Label>
            <select
              className="select-field"
              disabled={readOnly}
              value={settings.app_mode === 'advanced' ? 'advanced' : 'general'}
              onChange={(e) => setSettings({ ...settings, app_mode: e.target.value })}
            >
              <option value="general">General — quick attendance (section, calendar, ID grid)</option>
              <option value="advanced">Advanced — full admin panel</option>
            </select>
            <p className="text-xs text-muted-foreground">
              General mode opens the simplified attendance screen after login. Advanced shows all features.
            </p>
          </div>
          {!readOnly && <Button onClick={() => updateSettingsMutation.mutate(settings)}>Save Settings</Button>}
        </CardContent>
      </Card>

      {!readOnly && (
        <>
          <Card>
            <CardHeader><CardTitle>Admin Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
              <Button onClick={() => updateProfileMutation.mutate(profile)}>Update Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Current Password</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></div>
              <div className="space-y-1"><Label>New Password</Label><Input type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} /></div>
              <Button onClick={changePassword}>Change Password</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
