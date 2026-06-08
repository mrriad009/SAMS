import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pin } from 'lucide-react';
import { studentApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import DOMPurify from 'dompurify';

export default function StudentAnnouncementsPage() {
  const [selected, setSelected] = useState<{ title: string; content: string; createdAt: string; authorName?: string } | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: async () => (await studentApi.announcements()).data.data,
  });

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Announcements</h2>
        <p className="text-muted-foreground">Classroom notices and updates</p>
      </div>

      <div className="space-y-4">
        {isLoading ? null : (announcements || []).map((a: { id: string; title: string; content: string; isPinned: boolean; createdAt: string; authorName?: string }) => (
          <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(a)}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {a.isPinned && <Badge variant="warning"><Pin className="mr-1 h-3 w-3" />Pinned</Badge>}
              </div>
              <CardTitle className="text-base">{a.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)} · {a.authorName}</p>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{selected.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDate(selected.createdAt)} · {selected.authorName}</p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.content) }} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
