import type { IBroker } from '../types';

interface BrokerListProps {
  brokers: IBroker[];
}

export default function BrokerList({ brokers }: BrokerListProps) {
  if (brokers.length === 0) return <p>No brokers configured yet.</p>;

  return (
    <ul className="space-y-2">
      {brokers.map((b) => (
        <li
          key={b._id}
          className="p-4 border border-gray-300 rounded dark:border-gray-700 dark:text-white"
        >
          <div className="font-bold">{b.name}</div>
          <div>
            {b.url}:{b.port}
          </div>
          <div>Client ID: {b.clientId}</div>
          {b.username && <div>Username: {b.username}</div>}
        </li>
      ))}
    </ul>
  );
}
