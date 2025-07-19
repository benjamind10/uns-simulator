/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { fetchBrokers, deleteBroker as deleteBrokerApi } from '../api/brokers';
import type { IBroker } from '../types';

interface BrokersContextType {
  brokers: IBroker[];
  loading: boolean;
  error: string | null;
  deleteBroker: (id: string) => Promise<boolean>;
  refreshBrokers: () => Promise<void>;
}

const BrokersContext = createContext<BrokersContextType | null>(null);

export function BrokersProvider({ children }: { children: ReactNode }) {
  const [brokers, setBrokers] = useState<IBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the fetch function to prevent recreating on every render
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBrokers();
      setBrokers(data);
    } catch (err) {
      setError('Failed to fetch brokers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize refreshBrokers to prevent infinite loops
  const refreshBrokers = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const success = await deleteBrokerApi(id);
      if (success) {
        setBrokers((prev) => prev.filter((b) => b.id !== id));
        toast.success('Broker deleted successfully');
        return true;
      }
      toast.error('Failed to delete broker');
      return false;
    } catch (err) {
      toast.error('Failed to delete broker');
      console.error(err);
      return false;
    }
  }, []);

  const value = {
    brokers,
    loading,
    error,
    deleteBroker: handleDelete,
    refreshBrokers,
  };

  return (
    <BrokersContext.Provider value={value}>{children}</BrokersContext.Provider>
  );
}

export function useBrokers() {
  const context = useContext(BrokersContext);
  if (!context) {
    throw new Error('useBrokers must be used within a BrokersProvider');
  }
  return context;
}
