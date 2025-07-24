import React from 'react';

interface SimulationCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SimulationCard: React.FC<SimulationCardProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6 ${className}`}
    >
      <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
};

export default SimulationCard;
