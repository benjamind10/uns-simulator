import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  Radio,
  Server,
  Plus,
  Pencil,
  Trash2,
  Plug,
  Unplug,
} from 'lucide-react';

import {
  createBrokerAsync,
  deleteBrokerAsync,
  fetchBrokersAsync,
  updateBrokerAsync,
} from '../../store/brokers';
import {
  connectToBrokerAsync,
  disconnectFromBrokerAsync,
} from '../../store/mqtt/mqttThunk';
import { selectBrokerStatuses } from '../../store/mqtt/mqttSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/global/ConfirmDialog';
import BrokerModal from '../../components/Brokers/BrokerModal';

type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

const statusConfig: Record<
  string,
  { variant: StatusVariant; label: string; pulse?: boolean }
> = {
  connected: { variant: 'success', label: 'Connected' },
  connecting: { variant: 'warning', label: 'Connecting', pulse: true },
  error: { variant: 'error', label: 'Error' },
  disconnected: { variant: 'neutral', label: 'Disconnected' },
};

export default function BrokersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { brokers, loading, error } = useSelector(
    (state: RootState) => state.brokers
  );
  const brokerStatuses = useSelector(selectBrokerStatuses);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<IBroker | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState<IBroker | null>(null);

  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setEditingBroker(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (broker: IBroker) => {
    setEditingBroker(broker);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBroker(null);
  };

  const handleSubmit = async (data: {
    name: string;
    url: string;
    port: number;
    clientId: string;
    username?: string;
    password?: string;
  }) => {
    try {
      if (editingBroker) {
        await dispatch(
          updateBrokerAsync({ id: editingBroker.id, data })
        ).unwrap();
        toast.success('Broker updated successfully');
      } else {
        await dispatch(createBrokerAsync(data)).unwrap();
        toast.success('Broker added successfully');
      }
      handleCloseModal();
    } catch {
      toast.error(
        editingBroker ? 'Failed to update broker' : 'Failed to add broker'
      );
    }
  };

  const handleDeleteClick = (broker: IBroker) => {
    setBrokerToDelete(broker);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brokerToDelete) return;
    try {
      await dispatch(deleteBrokerAsync(brokerToDelete.id)).unwrap();
      toast.success('Broker deleted successfully');
      setShowDeleteConfirm(false);
      setBrokerToDelete(null);
    } catch {
      toast.error('Failed to delete broker');
    }
  };

  const handleConnect = async (broker: IBroker) => {
    try {
      await dispatch(connectToBrokerAsync(broker)).unwrap();
      toast.success(`Connected to ${broker.name}`);
    } catch {
      toast.error(`Failed to connect to ${broker.name}`);
    }
  };

  const handleDisconnect = async (broker: IBroker) => {
    try {
      await dispatch(disconnectFromBrokerAsync(broker.id)).unwrap();
      toast.success(`Disconnected from ${broker.name}`);
    } catch {
      toast.error(`Failed to disconnect from ${broker.name}`);
    }
  };

  const getStatus = (brokerId: string) => {
    const status = brokerStatuses[brokerId] || 'disconnected';
    return statusConfig[status] || statusConfig.disconnected;
  };

  const isConnected = (brokerId: string) =>
    brokerStatuses[brokerId] === 'connected';

  const isConnecting = (brokerId: string) =>
    brokerStatuses[brokerId] === 'connecting';

  return (
    <div className="h-full overflow-y-auto p-6">
      <PageHeader
        title="MQTT Brokers"
        description="Manage your MQTT broker connections"
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Broker
          </button>
        }
      />

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && brokers.length === 0 ? (
        <div className="mt-12 flex items-center justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading brokers...
          </div>
        </div>
      ) : brokers.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Radio}
            title="No brokers yet"
            description="Add your first MQTT broker to start building simulations."
            action={
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Broker
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokers.map((broker) => {
            const status = getStatus(broker.id);
            const connected = isConnected(broker.id);
            const connecting = isConnecting(broker.id);

            return (
              <Card key={broker.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                        <Server className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {broker.name}
                      </h3>
                    </div>
                    <Badge
                      variant={status.variant}
                      pulse={status.pulse}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <p className="truncate">
                      <span className="text-gray-400 dark:text-gray-500">
                        Host:
                      </span>{' '}
                      {broker.url}:{broker.port}
                    </p>
                    <p className="truncate">
                      <span className="text-gray-400 dark:text-gray-500">
                        Client:
                      </span>{' '}
                      {broker.clientId}
                    </p>
                    {broker.username && (
                      <p className="truncate">
                        <span className="text-gray-400 dark:text-gray-500">
                          User:
                        </span>{' '}
                        {broker.username}
                      </p>
                    )}
                  </div>
                </CardBody>

                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(broker)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Edit broker"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(broker)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete broker"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>

                  {connected ? (
                    <button
                      onClick={() => handleDisconnect(broker)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(broker)}
                      disabled={connecting}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plug className="h-3.5 w-3.5" />
                      {connecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </CardFooter>
              </Card>
            );
          })}

          {/* Add Broker placeholder card */}
          <button
            onClick={handleOpenAdd}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all min-h-[180px] cursor-pointer group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
              <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Add Broker
            </span>
          </button>
        </div>
      )}

      {/* Slide-over modal for add/edit */}
      <BrokerModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingBroker}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBrokerToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Broker?"
        message={`Delete broker "${brokerToDelete?.name}"? Any simulation profiles using this broker will have their broker reference cleared.`}
      />
    </div>
  );
}
