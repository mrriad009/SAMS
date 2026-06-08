import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_AVATAR = '/default-avatar.svg';

const sizeMap = {
  sm: 'size-10 text-sm',
  md: 'size-20 text-2xl',
  lg: 'size-24 text-3xl',
} as const;

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

function getInitial(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase();
}

export function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(src) && !imgError;
  const initial = getInitial(name);

  if (showImage) {
    return (
      <img
        src={src!}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeMap[size], className)}
        onError={() => setImgError(true)}
      />
    );
  }

  if (initial) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary',
          sizeMap[size],
          className
        )}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={DEFAULT_AVATAR}
      alt=""
      className={cn('shrink-0 rounded-full object-cover', sizeMap[size], className)}
    />
  );
}
