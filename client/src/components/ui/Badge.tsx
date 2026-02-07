import { type ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  pulse?: boolean;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { bg: string; text: string; dot: string }
> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

export function Badge({
  variant = 'neutral',
  children,
  pulse,
  size = 'sm',
  className,
}: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        styles.bg,
        styles.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      <span
        className={clsx(
          'rounded-full',
          styles.dot,
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          pulse && 'animate-pulse'
        )}
      />
      {children}
    </span>
  );
}
