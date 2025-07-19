import { useEffect, useState } from 'react';
import { Server, Users, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

import StatCard from '../../components/StatCard';
import BrokerCard from '../../components/BrokersCard';
import { fetchBrokers, deleteBroker } from '../../api/brokers';
import type { IBroker } from '../../types';

export default function DashboardPage() {
  /* ---------------  stat cards --------------- */
  const stats = [
    {
      title: 'Brokers Online',
      value: 3,
      icon: <Server size={20} className="text-blue-500" />,
    },
    {
      title: 'Total Users',
      value: 42,
      icon: <Users size={20} className="text-green-500" />,
    },
    {
      title: 'Sim Runs Today',
      value: 128,
      icon: <Activity size={20} className="text-amber-500" />,
    },
  ];

  /* ---------------  brokers section --------------- */
  const [brokers, setBrokers] = useState<IBroker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrokers()
      .then(setBrokers)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteBroker(id);
      if (success) {
        setBrokers((prev) => prev.filter((b) => b.id !== id));
        toast.success('Broker deleted successfully');
      } else {
        toast.error('Failed to delete broker');
      }
    } catch (error) {
      console.error('Error deleting broker:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: string }).message === 'string' &&
        (error as { message: string }).message.includes('Authentication')
      ) {
        // Redirect to login or refresh token
        toast.error('Session expired. Please log in again.');
        // Optional: redirect to login
        // navigate('/login');
      } else {
        toast.error('Failed to delete broker');
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* --- stat cards row --- */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </section>

      {/* --- brokers preview row --- */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Brokers Overview
        </h2>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading brokers…</p>
        ) : brokers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No brokers configured yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brokers.map((b) => (
              <BrokerCard
                key={b.id}
                broker={b}
                status="online"
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
