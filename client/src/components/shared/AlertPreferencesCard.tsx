import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { alertsApi, type AlertPreferences } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const DEFAULTS: AlertPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  lowAttendance: true,
  announcements: true,
  reminders: true,
  leaveUpdates: true,
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function AlertPreferencesCard({ audience = 'staff' }: { audience?: 'staff' | 'student' }) {
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULTS);

  useQuery({
    queryKey: ['alert-preferences'],
    queryFn: async () => {
      const res = await alertsApi.preferences();
      if (res.data.data) setPrefs(res.data.data);
      return res.data.data;
    },
  });

  const save = useMutation({
    mutationFn: () => alertsApi.savePreferences(prefs),
    onSuccess: () => toast.success('Alert preferences saved'),
    onError: () => toast.error('Could not save alert preferences'),
  });

  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('This browser cannot receive push alerts');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Notification permission was not granted');
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const { data } = await alertsApi.vapidPublicKey();
    const key = data.data?.publicKey;
    if (!key) {
      toast.error('Push is not configured on the server');
      return;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await alertsApi.subscribePush(subscription.toJSON());
    setPrefs((current) => ({ ...current, pushEnabled: true }));
    toast.success('Push alerts enabled on this phone');
  };

  const toggle = (key: keyof AlertPreferences) => {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  };

  const rows: Array<{ key: keyof AlertPreferences; label: string; hint: string }> = [
    { key: 'emailEnabled', label: 'Email', hint: 'Weekly summaries and leave decisions. Needs a Resend API key to actually send.' },
    { key: 'pushEnabled', label: 'Push', hint: 'Instant alerts on this phone after you allow notifications.' },
    { key: 'smsEnabled', label: 'SMS', hint: 'Critical texts. Logged in development unless a Twilio account is configured.' },
    { key: 'lowAttendance', label: 'Low attendance', hint: 'Warnings when attendance drops below the threshold.' },
    { key: 'announcements', label: 'Announcements', hint: 'New notices from the department.' },
    { key: 'reminders', label: 'Class reminders', hint: 'Reminders about upcoming sessions.' },
    { key: 'leaveUpdates', label: 'Leave updates', hint: 'When a leave request is approved or rejected.' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{audience === 'student' ? 'Your alerts' : 'Your staff alerts'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {audience === 'student'
            ? 'Turn on push to get a phone alert when you are marked present, absent, late, or excused, and when leave is decided.'
            : 'These switches are for this staff account. Students get their own alerts, including when you save their attendance.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <label key={row.key} className="flex items-start gap-3 rounded-lg border p-3 dark:border-slate-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
            />
            <span>
              <Label className="font-medium">{row.label}</Label>
              <span className="mt-0.5 block text-xs text-muted-foreground">{row.hint}</span>
            </span>
          </label>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save preferences
          </Button>
          <Button type="button" variant="outline" onClick={() => void enablePush()}>
            Enable push on this device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
