import clsx from 'clsx';

interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const sizeStyles = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name ? getInitials(name) : '?';
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-medium shrink-0',
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
