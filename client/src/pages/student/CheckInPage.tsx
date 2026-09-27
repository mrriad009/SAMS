import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ScanLine, XCircle } from 'lucide-react';
import { studentApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Phase = 'scan' | 'working' | 'present' | 'failed';

type CheckInResult = {
  courseCode?: string;
  courseName?: string;
  date?: string;
  alreadyMarked?: boolean;
};

function errorText(error: unknown) {
  const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  return message || 'The code could not be checked. Hold steady and try again.';
}

export default function CheckInPage() {
  const [params] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('scan');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [scanAttempt, setScanAttempt] = useState(0);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scanner = useRef<{ stop: () => Promise<void> } | null>(null);
  const cameraOn = useRef(false);
  const lock = useRef(false);

  const stopScanner = () => {
    const reader = scanner.current;
    scanner.current = null;
    if (!reader || !cameraOn.current) return;
    cameraOn.current = false;
    try {
      void Promise.resolve(reader.stop()).catch(() => undefined);
    } catch {
      // The camera never started, or it was already stopped.
    }
  };

  const submit = async (value: string) => {
    const next = value.trim();
    if (!next || lock.current) return;
    lock.current = true;
    setPhase('working');
    setMessage('');
    stopScanner();
    try {
      const res = await studentApi.checkIn(next);
      setResult((res.data.data as CheckInResult) || null);
      setPhase('present');
    } catch (error) {
      lock.current = false;
      setMessage(errorText(error));
      setPhase('failed');
    }
  };

  const scanAgain = () => {
    lock.current = false;
    setResult(null);
    setMessage('');
    setPasteValue('');
    setPasteOpen(false);
    setPhase('scan');
    setScanAttempt((n) => n + 1);
  };

  useEffect(() => {
    const fromLink = params.get('token');
    if (fromLink) void submit(fromLink);
    // Opened from a scanned link: submit that code once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (phase !== 'scan') return;
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
            if (lock.current) return;
            void submit(decoded);
          },
          () => undefined
        );
        if (active) cameraOn.current = true;
      } catch {
        cameraOn.current = false;
        if (active) setMessage('Camera is blocked. Allow camera access, or paste the class code.');
      }
    }

    void start();
    return () => {
      active = false;
      stopScanner();
    };
    // Restart only when the student asks to scan again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scanAttempt]);

  if (phase === 'present') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-2 text-center">
        <div className="flex w-full flex-col items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-10">
          <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          <p className="mt-4 font-display text-2xl font-bold text-emerald-300">You're present</p>
          <p className="mt-2 text-sm text-emerald-100/80">
            {result?.alreadyMarked
              ? 'This class already has you marked present.'
              : 'Your attendance was saved for this class.'}
          </p>
          {(result?.courseCode || result?.courseName) && (
            <p className="mt-4 text-sm font-medium text-foreground">
              {result.courseCode}
              {result.courseName && result.courseName !== result.courseCode ? ` · ${result.courseName}` : ''}
            </p>
          )}
          {result?.date && <p className="text-xs text-muted-foreground">{result.date}</p>}
        </div>
        <Button className="mt-6 w-full" variant="outline" onClick={scanAgain}>
          Scan another class
        </Button>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-2 text-center">
        <div className="flex w-full flex-col items-center rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-10">
          <XCircle className="h-16 w-16 text-red-400" />
          <p className="mt-4 font-display text-2xl font-bold text-red-300">Not checked in</p>
          <p className="mt-2 text-sm text-red-100/80">{message}</p>
        </div>
        <Button className="mt-6 w-full" onClick={scanAgain}>
          Scan again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold">Scan attendance</h1>
        <p className="text-sm text-muted-foreground">
          Point the camera at the class code. A green screen means you are present.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300">
          {phase === 'working' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking you in…
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              Hold the code inside the frame
            </>
          )}
        </div>
        <div id="qr-reader" ref={scannerRef} className="min-h-64 bg-black" />
      </div>

      {message && phase === 'scan' && <p className="text-sm text-amber-300">{message}</p>}

      <button
        type="button"
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        onClick={() => setPasteOpen((open) => !open)}
      >
        Paste code instead
      </button>
      {pasteOpen && (
        <div className="space-y-2">
          <Input
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="Paste the class code"
            disabled={phase === 'working'}
          />
          <Button className="w-full" disabled={phase === 'working' || !pasteValue.trim()} onClick={() => void submit(pasteValue)}>
            Check in
          </Button>
        </div>
      )}
    </div>
  );
}
