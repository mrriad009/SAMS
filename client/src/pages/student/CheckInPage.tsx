import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { studentApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckInPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const scanner = useRef<{ stop: () => Promise<void> } | null>(null);
  const submitted = useRef(false);

  const submit = async (value: string) => {
    const next = value.trim();
    if (!next || busy) return;
    setBusy(true);
    try {
      await studentApi.checkIn(next);
      setMessage('You are marked present for this class.');
      toast.success('Checked in');
      if (scanner.current) await scanner.current.stop();
    } catch (error: unknown) {
      const text =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Check-in failed';
      setMessage(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const fromLink = params.get('token');
    if (fromLink && !submitted.current) {
      submitted.current = true;
      void submit(fromLink);
    }
    // Submit once when the page is opened from a scanned link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    let active = true;
    const regionId = 'qr-reader';

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!active || !scannerRef.current) return;
      const reader = new Html5Qrcode(regionId);
      scanner.current = reader;
      try {
        await reader.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            setToken(decoded);
            void submit(decoded);
          },
          () => undefined
        );
      } catch {
        if (active) setMessage('Camera is unavailable. Paste the class code instead.');
      }
    }

    void start();
    return () => {
      active = false;
      void scanner.current?.stop().catch(() => undefined);
    };
    // Scanner starts once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold">Scan attendance</h1>
        <p className="text-sm text-muted-foreground">Point your camera at the class QR code. It expires after a few minutes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Camera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div id="qr-reader" ref={scannerRef} className="overflow-hidden rounded-lg bg-black/80" />
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Or paste the class code"
          />
          <Button className="w-full" disabled={busy || !token} onClick={() => void submit(token)}>
            {busy ? 'Checking in…' : 'Check in'}
          </Button>
          {message && <p className="text-sm">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
