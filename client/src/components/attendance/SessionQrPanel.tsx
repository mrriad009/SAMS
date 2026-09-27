import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { adminSessionsApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';

export function SessionQrPanel({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<{ token: string; expiresAt: string; url: string } | null>(null);
  const [remaining, setRemaining] = useState('');

  const generate = async () => {
    try {
      const res = await adminSessionsApi.createQr(sessionId, 15);
      const data = res.data.data;
      if (!data) return;
      const url = `${window.location.origin}/student/check-in?token=${encodeURIComponent(data.token)}`;
      setPayload({ token: data.token, expiresAt: data.expiresAt, url });
      setOpen(true);
    } catch {
      toast.error('Could not create a QR code for this class');
    }
  };

  useEffect(() => {
    if (!payload) return;
    const tick = () => {
      const ms = new Date(payload.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining('Expired');
        return;
      }
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      setRemaining(`${minutes}:${String(seconds).padStart(2, '0')}`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [payload]);

  if (!open || !payload) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => void generate()}>
        Class QR
      </Button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-900 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">Students scan this code</p>
          <p className="text-sm text-slate-500">Expires in {remaining}. Manual marking still works.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void generate()}>
            New code
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Hide
          </Button>
        </div>
      </div>
      <div className="mt-4 flex justify-center rounded-lg bg-white p-3">
        <QRCodeSVG value={payload.url} size={220} includeMargin />
      </div>
    </div>
  );
}
