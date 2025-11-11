import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchSimulationProfilesAsync,
  createSimulationProfileAsync,
  deleteSimulationProfileAsync,
} from '../../store/simulationProfile/simulationProfieThunk';
import SimulationCard from '../../components/simulator/SimulationCard';
import type {
  AppDispatch,
  IBroker,
  ISchema,
  ISimulationProfile,
  RootState,
} from '../../types';
import { selectSchemas } from '../../store/schema/schemaSlice';
import { fetchBrokersAsync, selectBrokers } from '../../store/brokers';
import ProfilesCardContent from '../../components/simulator/ProfilesCardContent';
import SimulatorCardContent from '../../components/simulator/SimulatorCardContent';
import { fetchSchemasAsync } from '../../store/schema/schemaThunk';
import ConfirmDialog from '../../components/global/ConfirmDialog';
import { connectToBrokerAsync } from '../../store/mqtt/mqttThunk';

export default function SimulationPage() {
  const dispatch = useDispatch<AppDispatch>();

  // Fix: Use a simpler selector approach
  const profilesRecord = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const profiles = Object.values(profilesRecord) as ISimulationProfile[];

  const loading = useSelector(
    (state: RootState) => state.simulationProfile.loading
  );
  const error = useSelector(
    (state: RootState) => state.simulationProfile.error as string | null
  );

  // Get schemas and brokers from redux
  const schemas = useSelector(selectSchemas);
  const brokers = useSelector(selectBrokers);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    schemaId: '',
    brokerId: '',
  });

  const { profileId } = useParams<{ profileId?: string }>();
  const navigate = useNavigate();

  // State for confirm dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // Delete handler
  const handleDeleteProfile = (id: string) => {
    setProfileToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProfile = async () => {
    if (profileToDelete) {
      await dispatch(deleteSimulationProfileAsync(profileToDelete));
      if (profileId === profileToDelete) {
        navigate('/simulator');
      }
      setProfileToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    dispatch(fetchSimulationProfilesAsync());
    dispatch(fetchSchemasAsync());
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  // Redirect if profileId is not found in profiles
  useEffect(() => {
    if (profileId && !profiles.some((p) => p.id === profileId)) {
      navigate('/simulator');
    }
  }, [profileId, profiles, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(
        createSimulationProfileAsync({
          ...form,
          globalSettings: {
            defaultUpdateFrequency: 1000,
            timeScale: 1,
          },
        })
      ).unwrap();

      setShowModal(false);
      setForm({ name: '', description: '', schemaId: '', brokerId: '' });

      // Navigate to the newly created profile's detail page
      navigate(`/simulator/${result.id}`);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  // Fetch nodes by IDs utility
  const fetchNodesByIds = async (ids: string[]) => {
    // Find all nodes in all schemas that match the given IDs
    const allNodes = schemas.flatMap((schema) => schema.nodes ?? []);
    return allNodes.filter((node) => ids.includes(node.id));
  };

  const brokerStatuses = useSelector(
    (state: RootState) => state.mqtt.connections
  );

  const handleConnectBroker = (brokerId: string) => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (broker) {
      dispatch(connectToBrokerAsync(broker));
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-8 h-full min-h-0">
        {/* Profiles Section */}
        <div className="col-span-1 flex flex-col gap-6 min-h-0">
          <SimulationCard title="Profiles">
            <ProfilesCardContent
              profiles={profiles}
              loading={loading}
              error={error}
              onCreateProfileClick={() => setShowModal(true)}
              schemas={schemas}
              onDeleteProfile={handleDeleteProfile} // <-- now opens dialog
            />
          </SimulationCard>
        </div>

        {/* Simulator Section */}
        <div className="col-span-2 flex flex-col gap-6">
          <SimulationCard title="Simulator">
            <SimulatorCardContent fetchNodesByIds={fetchNodesByIds} />
          </SimulationCard>
        </div>
      </div>

      {/* Modal for creating profile */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
              Create Simulation Profile
            </h3>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="schemaId">
                  Schema
                </label>
                <select
                  id="schemaId"
                  name="schemaId"
                  value={form.schemaId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Select a schema...</option>
                  {schemas.map((schema: ISchema) => (
                    <option key={schema.id} value={schema.id}>
                      {schema.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="brokerId">
                  Broker
                </label>
                <select
                  id="brokerId"
                  name="brokerId"
                  value={form.brokerId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a broker...</option>
                  {brokers.map((broker: IBroker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm delete dialog ── */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteProfile}
        title="Delete Simulation Profile"
        message="This will permanently delete the selected simulation profile. Are you sure?"
      />

      {/* Brokers Section - Table Format */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 text-lg">
          Brokers
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {brokers.map((broker: IBroker) => {
                const status =
                  brokerStatuses[broker.id]?.status || 'disconnected';
                return (
                  <tr
                    key={broker.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {broker.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          status === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleConnectBroker(broker.id)}
                        disabled={status === 'connected'}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:bg-gray-400"
                      >
                        Connect
                      </button>
                    </td>
                  </tr>
                );
              })}
              {brokers.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                  >
                    No brokers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
