import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

import BrokerForm from '../../components/BrokerForm';
import BrokerList from '../../components/BrokerList';
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
  const { brokers, loading, error } = useSelector(
    (state: RootState) => state.brokers
  );
  const [editingBroker, setEditingBroker] = useState<IBroker | null>(null);
  const location = useLocation();
  const editBroker = location.state?.editBroker;

  // Fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  // Set editing broker from navigation state
  useEffect(() => {
    if (editBroker) {
      setEditingBroker(editBroker);
      // Scroll form into view
      document
        .querySelector('.broker-form')
        ?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [editBroker]);

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
        setEditingBroker(null);
      } else {
        await dispatch(createBrokerAsync(broker)).unwrap();
        toast.success('Broker added successfully');
      }
      // No need to dispatch fetchBrokersAsync here as the state is already updated
    } catch (err) {
      toast.error(
        editingBroker ? 'Failed to update broker' : 'Failed to add broker'
      );
      console.error(err);
    }
  };

  const handleEditBroker = (broker: IBroker) => {
    setEditingBroker(broker);
    // Scroll form into view
    document
      .querySelector('.broker-form')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBroker(null);
  };

  const handleDeleteBroker = async (id: string) => {
    try {
      await dispatch(deleteBrokerAsync(id)).unwrap();
      toast.success('Broker deleted successfully');
      if (editingBroker?.id === id) {
        setEditingBroker(null);
      }
    } catch (error) {
      toast.error('Failed to delete broker');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 pt-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {editingBroker ? 'Edit MQTT Broker' : 'Add MQTT Broker'}
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
