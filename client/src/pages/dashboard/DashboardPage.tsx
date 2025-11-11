import { useEffect } from 'react';
import { Server, Book, Activity, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import StatCard from '../../components/dashboard/StatCard';
import SchemaCard from '../../components/schema/SchemaCard';
import BrokerCard from '../../components/brokers/BrokerCard';
import SimulatorCard from '../../components/simulator/SimulatorCard';
import { deleteBrokerAsync, fetchBrokersAsync } from '../../store/brokers';
import {
  deleteSchemaAsync,
  fetchSchemasAsync,
} from '../../store/schema/schemaThunk';
import {
  selectConnectedBrokersCount,
  selectBrokerStatuses,
} from '../../store/mqtt/mqttSlice';
import {
  connectToBrokerAsync,
  disconnectFromBrokerAsync,
} from '../../store/mqtt/mqttThunk';
import {
  deleteSimulationProfileAsync,
  fetchSimulationProfilesAsync,
} from '../../store/simulationProfile/simulationProfieThunk';
import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker, ISchema, ISimulationProfile } from '../../types';
import { selectProfiles } from '../../store/simulationProfile/simulationProfileSlice';

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // Fetch brokers, schemas, and simulation profiles only on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
    dispatch(fetchSchemasAsync());
    dispatch(fetchSimulationProfilesAsync());
    // Only fetch on mount, not on every route change
  }, [dispatch]);

  const { brokers, loading: brokersLoading } = useSelector(
    (state: RootState) => state.brokers
  );
  const { schemas, loading: schemasLoading } = useSelector(
    (state: RootState) => state.schema
  );

  const connectedBrokers = useSelector(selectConnectedBrokersCount);
  const brokerStatuses = useSelector(selectBrokerStatuses);

  const simulators = Object.values(
    useSelector(selectProfiles)
  ) as ISimulationProfile[];

  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const runningSimulations = Object.values(simulationStates).filter(
    (state) => state === 'running'
  ).length;

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
      title: 'Simulator Profiles',
      value: simulators.length,
      icon: <Activity size={20} className="text-amber-500" />,
    },
    {
      title: 'Simulations Running',
      value: runningSimulations,
      icon: <Activity size={20} className="text-green-500" />,
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

  const handleDeleteSimulator = async (id: string) => {
    try {
      await dispatch(deleteSimulationProfileAsync(id)).unwrap();
      toast.success('Simulator deleted successfully', {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch {
      toast.error('Failed to delete simulator');
    }
  };

  // NEW: Connect/Disconnect handlers
  const handleConnectBroker = async (broker: IBroker) => {
    try {
      await dispatch(connectToBrokerAsync(broker)).unwrap();
      toast.success(`Connected to ${broker.name}`, {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Error connecting to broker:', error);
      toast.error(`Failed to connect to ${broker.name}`);
    }
  };

  const handleDisconnectBroker = async (brokerId: string) => {
    try {
      await dispatch(disconnectFromBrokerAsync(brokerId)).unwrap();
      const broker = brokers.find((b) => b.id === brokerId);
      toast.success(`Disconnected from ${broker?.name || 'broker'}`, {
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Error disconnecting from broker:', error);
      toast.error('Failed to disconnect from broker');
    }
  };

  const handleEditBroker = (broker: IBroker) => {
    navigate(`/dashboard/brokers/${broker.id}`);
  };

  const handleEditSchema = (schema: ISchema) => {
    navigate(`/schema-builder/${schema.id}`);
  };

  const handleOpenSimulator = (sim: ISimulationProfile) => {
    navigate(`/simulator/${sim.id}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-10">
        {/* --- stat cards row --- */}
        <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </section>

        {/* --- simulators preview row --- */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
            Simulators Overview
          </h2>
          {simulators.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No simulators created yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {simulators.map((sim) => {
                const isRunning =
                  simulationStates[sim.id] &&
                  simulationStates[sim.id] === 'running';
                return (
                  <div className="relative" key={sim.id}>
                    <SimulatorCard
                      brokers={brokers}
                      schemas={schemas}
                      simulator={sim}
                      onDelete={handleDeleteSimulator}
                      onOpen={() => handleOpenSimulator(sim)}
                    />
                    {/* Move running icon to bottom right, below card content */}
                    {isRunning && (
                      <CheckCircle
                        size={20}
                        className="absolute bottom-4 right-4 text-green-500 z-10"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                    [
                      'disconnected',
                      'connecting',
                      'connected',
                      'error',
                    ].includes(brokerStatuses[b.id])
                      ? (brokerStatuses[b.id] as
                          | 'disconnected'
                          | 'connecting'
                          | 'connected'
                          | 'error')
                      : 'disconnected'
                  }
                  onDelete={handleDeleteBroker}
                  onEdit={() => handleEditBroker(b)}
                  onConnect={() => handleConnectBroker(b)}
                  onDisconnect={() => handleDisconnectBroker(b.id)}
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
    </div>
  );
}
