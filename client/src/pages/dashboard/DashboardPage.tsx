import { useEffect } from 'react';
import { Server, Book, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import StatCard from '../../components/dashboard/StatCard';
import SchemaCard from '../../components/schema/SchemaCard';
import BrokerCard from '../../components/brokers/BrokerCard';
import { fetchBrokersAsync, deleteBrokerAsync } from '../../store/brokers';
import {
  fetchSchemasAsync,
  deleteSchemaAsync,
} from '../../store/schema/schemaThunk';
import { connectToMultipleBrokersAsync } from '../../store/mqtt/mqttThunk';
import {
  selectConnectedBrokersCount,
  selectBrokerStatuses,
} from '../../store/mqtt/mqttSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker, ISchema } from '../../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { brokers, loading: brokersLoading } = useSelector(
    (state: RootState) => state.brokers
  );
  const { schemas, loading: schemasLoading } = useSelector(
    (state: RootState) => state.schema
  );

  const connectedBrokers = useSelector(selectConnectedBrokersCount);

  // Get all broker statuses in one go
  const brokerStatuses = useSelector(selectBrokerStatuses);

  useEffect(() => {
    dispatch(fetchBrokersAsync());
    dispatch(fetchSchemasAsync());
  }, [dispatch]);

  useEffect(() => {
    if (brokers.length > 0) {
      dispatch(connectToMultipleBrokersAsync(brokers));
    }
  }, [brokers, dispatch]);

  /* ---------------  stat cards --------------- */
  const stats = [
    {
      title: 'Brokers Online',
      value: connectedBrokers,
      icon: <Server size={20} className="text-blue-500" />,
    },
    {
      title: 'Total Sim Schemas',
      value: schemas.length,
      icon: <Book size={20} className="text-green-500" />,
    },
    {
      title: 'Sim Runs Today',
      value: 128,
      icon: <Activity size={20} className="text-amber-500" />,
    },
  ];

  const handleDeleteBroker = async (id: string) => {
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

  const handleDeleteSchema = async (id: string) => {
    try {
      await dispatch(deleteSchemaAsync(id)).unwrap();
      toast.success('Schema deleted successfully', {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Error deleting schema:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error('Failed to delete schema');
      }
    }
  };

  const handleEditBroker = (broker: IBroker) => {
    navigate(`/dashboard/brokers/${broker.id}`);
  };

  const handleEditSchema = (schema: ISchema) => {
    navigate(`/schema-builder/${schema.id}`);
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
        {brokersLoading ? (
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
                status={
                  ['disconnected', 'connecting', 'connected', 'error'].includes(
                    brokerStatuses[b.id]
                  )
                    ? (brokerStatuses[b.id] as
                        | 'disconnected'
                        | 'connecting'
                        | 'connected'
                        | 'error')
                    : 'disconnected'
                }
                onDelete={handleDeleteBroker}
                onEdit={() => handleEditBroker(b)}
              />
            ))}
          </div>
        )}
      </section>

      {/* --- schemas preview row --- */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Schemas Overview
        </h2>

        {schemasLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading schemas…</p>
        ) : schemas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No schemas created yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schemas.map((schema) => (
              <SchemaCard
                key={schema.id}
                schema={schema}
                onDelete={handleDeleteSchema}
                onEdit={() => handleEditSchema(schema)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
