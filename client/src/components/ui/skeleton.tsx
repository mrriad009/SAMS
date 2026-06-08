import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-700', className)} />;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-slate-300" />}
      <h3 className="font-display text-lg font-semibold text-slate-600 dark:text-slate-300">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
