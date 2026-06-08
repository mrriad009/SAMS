import { Card, CardContent } from '@/components/ui/card';
import { StudentSearchBar } from '@/components/shared/StudentSearchBar';

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Student lookup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by student ID to view profile and attendance — no sign-in required.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <StudentSearchBar size="large" autoFocus />
        </CardContent>
      </Card>
    </div>
  );
}
