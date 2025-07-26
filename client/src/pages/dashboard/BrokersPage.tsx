import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

import BrokerForm from '../../components/brokers/BrokerForm';
import BrokerList from '../../components/brokers/BrokerList';
import {
  createBrokerAsync,
  deleteBrokerAsync,
  fetchBrokersAsync,
  updateBrokerAsync,
} from '../../store/brokers';

import type { AppDispatch, RootState } from '../../store/store';
import type { IBroker } from '../../types';

export default function BrokersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { brokers, loading, error } = useSelector(
    (state: RootState) => state.brokers
  );
  const [editingBroker, setEditingBroker] = useState<IBroker | null>(null);
  const { brokerId } = useParams();

  // Fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  // Handle URL-based editing
  useEffect(() => {
    if (brokerId) {
      const brokerToEdit = brokers.find((b) => b.id === brokerId);
      if (brokerToEdit) {
        setEditingBroker(brokerToEdit);
        document
          .querySelector('.broker-form')
          ?.scrollIntoView({ behavior: 'smooth' });
      } else if (!loading) {
        // If broker not found and not loading, redirect to main brokers page
        navigate('/dashboard/brokers');
        toast.error('Broker not found');
      }
    } else {
      // Reset editing state when not in edit mode
      setEditingBroker(null);
    }
  }, [brokerId, brokers, loading, navigate]);

  const handleAddBroker = async (broker: {
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
          updateBrokerAsync({
            id: editingBroker.id,
            data: broker,
          })
        ).unwrap();
        toast.success('Broker updated successfully');
        navigate('/dashboard/brokers'); // Return to main broker list after update
      } else {
        await dispatch(createBrokerAsync(broker)).unwrap();
        toast.success('Broker added successfully');
      }
    } catch (err) {
      toast.error(
        editingBroker ? 'Failed to update broker' : 'Failed to add broker'
      );
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    navigate('/dashboard/brokers'); // Return to main broker list on cancel
  };

  const handleDeleteBroker = async (id: string) => {
    try {
      await dispatch(deleteBrokerAsync(id)).unwrap();
      toast.success('Broker deleted successfully');
      if (editingBroker?.id === id) {
        navigate('/dashboard/brokers'); // Return to main list if deleting currently edited broker
      }
    } catch (error) {
      toast.error('Failed to delete broker');
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {brokerId ? 'Edit MQTT Broker' : 'Add MQTT Broker'}
      </h1>

      <div className="broker-form bg-white text-gray-900 dark:bg-gray-900 dark:text-white px-4 py-6 rounded-lg shadow-md">
        <BrokerForm
          onSubmit={handleAddBroker}
          initialData={editingBroker}
          onCancel={handleCancelEdit}
        />
      </div>

      <div className="mt-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p>Loading brokers...</p>
        ) : (
          <BrokerList brokers={brokers} onDelete={handleDeleteBroker} />
        )}
      </div>
    </div>
  );
}
