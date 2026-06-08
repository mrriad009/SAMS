import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { adminStudentsApi } from '@/services/endpoints';
import { StudentProfileView } from '@/components/students/StudentProfileView';
import { useStaffBasePath } from '@/hooks/useStaffBasePath';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StaffStudentProfilePage() {
  const { studentId = '' } = useParams();
  const basePath = useStaffBasePath();
  const rollOrId = decodeURIComponent(studentId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['staff-student-profile', rollOrId],
    queryFn: async () => (await adminStudentsApi.getProfile(rollOrId)).data.data,
    enabled: !!rollOrId,
    retry: false,
  });

  const notFound =
    isError && axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 403);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">Student not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This student is not in your section or does not exist.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link to={`${basePath}/students`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to students
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <StudentProfileView
      data={data}
      backTo={`${basePath}/students`}
      backLabel="Back to students"
    />
  );
}
