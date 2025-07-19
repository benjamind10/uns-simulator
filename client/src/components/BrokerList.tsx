import type { IBroker } from '../types';

interface BrokerListProps {
  brokers: IBroker[];
}

export default function BrokerList({ brokers }: BrokerListProps) {
  if (brokers.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No brokers configured yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {brokers.map((broker) => (
        <li
          key={broker.id}
          className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col"
        >
          <span className="font-bold text-gray-800 dark:text-white">
            {broker.name}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-300">
            {broker.url}:{broker.port} — {broker.clientId}
          </span>
        </li>
      ))}
    </ul>
  );
}
