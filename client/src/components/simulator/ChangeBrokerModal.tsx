import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import type { IBroker } from '../../types';
import { updateSimulationProfileAsync } from '../../store/simulationProfile/simulationProfieThunk';
import type { AppDispatch } from '../../store/store';

interface ChangeBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBrokerId?: string | null;
  profileId: string;
  profileName: string;
  isRunning: boolean;
  brokers: IBroker[];
}

export default function ChangeBrokerModal({
  isOpen,
  onClose,
  currentBrokerId,
  profileId,
  profileName,
  isRunning,
  brokers,
}: ChangeBrokerModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(currentBrokerId || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update selectedBrokerId when currentBrokerId changes
  useEffect(() => {
    setSelectedBrokerId(currentBrokerId || '');
  }, [currentBrokerId]);

  const handleSave = async () => {
    if (isRunning) {
      toast.error('Stop simulation before changing broker');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(
        updateSimulationProfileAsync({
          id: profileId,
          input: { brokerId: selectedBrokerId || undefined },
        })
      ).unwrap();
      toast.success('Broker updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update broker');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setSelectedBrokerId(currentBrokerId || '');
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentBroker = brokers.find((b) => b.id === currentBrokerId);
  const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Change Broker
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Update the MQTT broker for <span className="font-medium">{profileName}</span>
        </p>

        {isRunning && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Simulation is currently running. Stop it before changing the broker.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Broker
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              {currentBroker ? (
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {currentBroker.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {currentBroker.url}:{currentBroker.port}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 italic">
                  No broker assigned
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Broker
            </label>
            <select
              value={selectedBrokerId}
              onChange={(e) => setSelectedBrokerId(e.target.value)}
              disabled={isRunning || isSaving}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- No broker --</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} ({broker.url}:{broker.port})
                </option>
              ))}
            </select>
            {selectedBrokerId && selectedBroker && (
              <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <span className="font-medium">{selectedBroker.name}</span>
                  <br />
                  {selectedBroker.url}:{selectedBroker.port}
                  {selectedBroker.clientId && (
                    <>
                      <br />
                      Client ID: {selectedBroker.clientId}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              isRunning ||
              isSaving ||
              selectedBrokerId === currentBrokerId
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
