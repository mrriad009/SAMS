import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentSearchBarProps {
  className?: string;
  size?: 'default' | 'large';
  autoFocus?: boolean;
}

export function StudentSearchBar({ className, size = 'default', autoFocus }: StudentSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    navigate(`/lookup/${encodeURIComponent(id)}`);
  };

  return (
    <form onSubmit={submit} className={cn('flex gap-2', className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter student ID"
          className={cn('pl-10', size === 'large' && 'h-12 text-base')}
          autoFocus={autoFocus}
        />
      </div>
      <Button type="submit" size={size === 'large' ? 'lg' : 'default'}>
        Search
      </Button>
    </form>
  );
}
