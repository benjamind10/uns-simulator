import { type ReactNode } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  enabled?: boolean;
}

export function Tooltip({
  content,
  children,
  side = 'right',
  className,
  enabled = true,
}: TooltipProps) {
  if (!enabled) {
    return <>{children}</>;
  }
  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div className={clsx('relative group/tooltip', className)}>
      {children}
      <div
        className={clsx(
          'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md whitespace-nowrap',
          'opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150',
          sideStyles[side]
        )}
      >
        {content}
      </div>
    </div>
  );
}
