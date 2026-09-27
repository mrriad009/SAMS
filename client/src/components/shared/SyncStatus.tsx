import { CloudOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';

export function SyncStatus() {
  const { online, pending, syncing, flush } = useOfflineSync();

  if (online && pending === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
      <p className="flex items-center gap-2">
        <CloudOff className="h-4 w-4 shrink-0" />
        {online
          ? `${pending} attendance save${pending === 1 ? '' : 's'} waiting to upload`
          : pending > 0
            ? `Offline. ${pending} save${pending === 1 ? '' : 's'} stored on this phone.`
            : 'You are offline. Marks you save now stay on this phone until you reconnect.'}
      </p>
      {online && pending > 0 && (
        <Button size="sm" variant="outline" onClick={() => void flush()} disabled={syncing}>
          <RefreshCw className="h-3.5 w-3.5" />
          {syncing ? 'Syncing' : 'Sync now'}
        </Button>
      )}
    </div>
  );
}
