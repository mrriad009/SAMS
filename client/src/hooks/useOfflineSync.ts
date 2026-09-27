import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminSessionsApi } from '@/services/endpoints';
import { listPendingAttendance, removePendingAttendance } from '@/lib/offline-store';

let flushing = false;

export async function flushOfflineQueue() {
  if (flushing || !navigator.onLine) return 0;
  const rows = await listPendingAttendance();
  if (rows.length === 0) {
    window.dispatchEvent(new Event('sams-offline-changed'));
    return 0;
  }

  flushing = true;
  let synced = 0;
  try {
    for (const item of rows) {
      let sessionId = item.sessionId;
      if (!sessionId) {
        const created = await adminSessionsApi.create({
          courseId: item.courseId,
          date: item.date,
          startTime: '09:00:00',
          endTime: '10:30:00',
          topic: 'Class',
          roomNumber: '—',
        });
        sessionId = created.data.data.id as string;
      }
      await adminSessionsApi.submitAttendance(sessionId, item.records);
      await removePendingAttendance(item.localId);
      synced += 1;
    }
    if (synced > 0) toast.success(`Synced ${synced} attendance save${synced === 1 ? '' : 's'}`);
  } catch {
    toast.error('Some attendance is still waiting to sync');
  } finally {
    flushing = false;
    window.dispatchEvent(new Event('sams-offline-changed'));
  }
  return synced;
}

export function notifyOfflineChange() {
  window.dispatchEvent(new Event('sams-offline-changed'));
}

export function useOfflineSync() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const rows = await listPendingAttendance();
    setPending(rows.length);
  }, []);

  const flush = useCallback(async () => {
    setSyncing(true);
    try {
      await flushOfflineQueue();
    } finally {
      setSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    if (navigator.onLine) void flushOfflineQueue();
  }, []);

  useEffect(() => {
    void refreshCount();
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    const onChange = () => {
      void refreshCount();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('sams-offline-changed', onChange);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('sams-offline-changed', onChange);
    };
  }, [flush, refreshCount]);

  return { online, pending, syncing, flush };
}
