import { useEffect } from 'react';
import { Server, Book, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrokersAsync, deleteBrokerAsync } from '../../store/brokers';
import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker } from '../../types';

import StatCard from '../../components/StatCard';
import BrokerCard from '../../components/BrokersCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { brokers, loading } = useSelector((state: RootState) => state.brokers);

  // Add useEffect to fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  /* ---------------  stat cards --------------- */
  const stats = [
    {
      title: 'Brokers Online',
      value: brokers.length,
      icon: <Server size={20} className="text-blue-500" />,
    },
    {
      title: 'Total Sim Schemas',
      value: 42,
      icon: <Book size={20} className="text-green-500" />,
    },
    {
      title: 'Sim Runs Today',
      value: 128,
      icon: <Activity size={20} className="text-amber-500" />,
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteBrokerAsync(id)).unwrap();
      toast.success('Broker deleted successfully', {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Error deleting broker:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error('Failed to delete broker');
      }
    }
  };

  const handleEdit = (broker: IBroker) => {
    navigate('/brokers', { state: { editBroker: broker } });
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
                onEdit={() => handleEdit(b)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
