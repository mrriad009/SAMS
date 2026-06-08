import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { publicApi } from '@/services/endpoints';
import { StudentProfileView } from '@/components/students/StudentProfileView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function PublicStudentProfilePage() {
  const { studentId = '' } = useParams();
  const rollNumber = decodeURIComponent(studentId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-student', rollNumber],
    queryFn: async () => (await publicApi.getStudentProfile(rollNumber)).data.data,
    enabled: !!rollNumber,
    retry: false,
  });

  const notFound =
    isError &&
    axios.isAxiosError(error) &&
    error.response?.status === 404;

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
            No student with ID &quot;{rollNumber}&quot;. Check the ID and try again.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link to="/lookup">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to search
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <StudentProfileView
      data={data}
      backTo="/lookup"
      backLabel="New search"
    />
  );
}
