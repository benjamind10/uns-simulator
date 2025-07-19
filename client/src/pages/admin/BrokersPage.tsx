import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { fetchBrokersAsync, deleteBrokerAsync } from '../../store/brokersSlice';
import { createBroker } from '../../api/brokers';
import BrokerForm from '../../components/BrokerForm';
import BrokerList from '../../components/BrokerList';
import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker } from '../../types';

export default function BrokersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { brokers, loading, error } = useSelector(
    (state: RootState) => state.brokers
  );

  // Fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  const handleAddBroker = async (broker: {
    name: string;
    url: string;
    port: number;
    clientId: string;
    username?: string;
    password?: string;
  }) => {
    try {
      await createBroker(broker);
      // Refresh the list after adding
      dispatch(fetchBrokersAsync());
      toast.success('Broker added successfully');
    } catch (err) {
      toast.error('Failed to add broker');
      console.error(err);
    }
  };

  const handleEditBroker = (broker: IBroker) => {
    // For now, just show a toast - we'll implement edit later
    toast(`Editing broker: ${broker.name}`);
  };

  const handleDeleteBroker = async (id: string) => {
    try {
      await dispatch(deleteBrokerAsync(id)).unwrap();
      toast.success('Broker deleted successfully');
    } catch (error) {
      toast.error('Failed to delete broker');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 pt-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MQTT Broker Configuration</h1>

        <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white px-4 py-6 rounded-lg shadow-md">
          <BrokerForm onAdd={handleAddBroker} />
        </div>

        <div className="mt-8">
          {loading ? (
            <p>Loading brokers...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <BrokerList
              brokers={brokers}
              onEdit={handleEditBroker}
              onDelete={handleDeleteBroker}
            />
          )}
        </div>
      </div>
    </div>
  );
}
