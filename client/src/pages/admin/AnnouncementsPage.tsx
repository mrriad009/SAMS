import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAnnouncementsApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { CSE_DEPARTMENT, DEPARTMENTS, SECTIONS } from '@/config/academic';
import { useReadOnlyStaff } from '@/hooks/useReadOnlyStaff';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

type AnnouncementForm = {
  title: string;
  content: string;
  targetAudience: 'all' | 'department' | 'section';
  department: string;
  section: string;
  isPinned: boolean;
};

function defaultForm(readOnly: boolean, lockedSection: string | null): AnnouncementForm {
  if (readOnly) {
    return {
      title: '',
      content: '',
      targetAudience: 'section',
      department: CSE_DEPARTMENT,
      section: lockedSection ?? 'E',
      isPinned: false,
    };
  }
  return {
    title: '',
    content: '',
    targetAudience: 'all',
    department: CSE_DEPARTMENT,
    section: SECTIONS[0],
    isPinned: false,
  };
}

export default function AnnouncementsPage() {
  const readOnly = useReadOnlyStaff();
  const { lockedSection } = useStaffPermissions();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AnnouncementForm>(() => defaultForm(readOnly, lockedSection));

  const openCreateModal = () => {
    setForm(defaultForm(readOnly, lockedSection));
    setShowModal(true);
  };

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => (await adminAnnouncementsApi.list()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (d: AnnouncementForm) => adminAnnouncementsApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement posted');
      setShowModal(false);
    },
    onError: () => toast.error('Failed to post announcement'),
  });

  const handlePost = () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content.trim()) return toast.error('Content is required');
    createMutation.mutate(form);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAnnouncementsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }); toast.success('Deleted'); },
  });

  return (
    <div className="min-w-0 space-y-6">
      <div className="page-header">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Announcements</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {readOnly
              ? `Post notices for Section ${lockedSection ?? 'your section'} — students in your section will be notified`
              : 'Create and manage notices for students'}
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openCreateModal}>
          <Plus className="mr-1 h-4 w-4" />
          {readOnly ? 'Post Section Notice' : 'New Announcement'}
        </Button>
      </div>

      <div className="space-y-4">
        {!isLoading && (!announcements || announcements.length === 0) && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No announcements yet. Click &quot;{readOnly ? 'Post Section Notice' : 'New Announcement'}&quot; to create one.
            </CardContent>
          </Card>
        )}
        {isLoading ? null : (announcements || []).map((a: { id: string; title: string; content: string; isPinned: boolean; targetAudience: string; createdAt: string; authorName?: string }) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {a.isPinned && <Badge variant="warning"><Pin className="mr-1 h-3 w-3" />Pinned</Badge>}
                  <Badge variant="secondary">{a.targetAudience}</Badge>
                </div>
                <CardTitle className="mt-2 break-words">{a.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(a.createdAt)} · {a.authorName}</p>
              </div>
              {!readOnly && (
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-4 w-4 text-danger" /></Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{readOnly ? 'Post Section Notice' : 'New Announcement'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Content (HTML)</Label><textarea className="w-full min-h-[120px] rounded-lg border p-3 text-sm dark:bg-dark-surface dark:border-slate-700" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              {!readOnly && (
              <div className="space-y-1">
                <Label>Target</Label>
                <select className="h-10 w-full rounded-lg border px-3 text-sm dark:bg-dark-surface dark:border-slate-700" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value as 'all' | 'department' | 'section' })}>
                  <option value="all">All Students</option>
                  <option value="department">Department</option>
                  <option value="section">Section</option>
                </select>
              </div>
              )}
              {!readOnly && form.targetAudience !== 'all' && (
                <div className="field-full">
                  <Label>Department</Label>
                  <SelectField
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </SelectField>
                </div>
              )}
              {!readOnly && form.targetAudience === 'section' && (
                <div className="field-full">
                  <Label>Section</Label>
                  <SelectField
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </SelectField>
                </div>
              )}
              {!readOnly && (
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /> Pin to top</label>
              )}
              {readOnly && lockedSection && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Target: {CSE_DEPARTMENT} · Section {lockedSection}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handlePost} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
