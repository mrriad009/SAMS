import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { studentApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await studentApi.notifications()).data.data,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => studentApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => studentApi.markAllRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  const typeVariant = (type: string) => {
    if (type === 'low_attendance') return 'danger';
    if (type === 'announcement') return 'secondary';
    if (type === 'session_reminder') return 'warning';
    return 'default';
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on important alerts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>Mark all read</Button>
      </div>

      <div className="space-y-3">
        {isLoading ? null : (notifications || []).length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" icon={Bell} />
        ) : (
          (notifications || []).map((n: { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }) => (
            <Card
              key={n.id}
              className={cn('cursor-pointer transition-colors', !n.isRead && 'border-primary/30 bg-primary/5')}
              onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', n.isRead ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    <Badge variant={typeVariant(n.type) as 'default'}>{n.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
