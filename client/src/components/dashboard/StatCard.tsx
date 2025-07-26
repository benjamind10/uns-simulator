import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  footer?: ReactNode; // e.g. mini-chart or “+5% vs yesterday”
}

export default function StatCard({
  title,
  value,
  icon,
  footer,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-lg bg-white dark:bg-gray-800 shadow px-5 py-4">
      {/* top row */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {icon}
      </div>

      {/* main number */}
      <div className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white">
        {value}
      </div>

      {/* optional footer */}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
