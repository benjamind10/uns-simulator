import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchSimulationProfilesAsync,
  createSimulationProfileAsync,
  deleteSimulationProfileAsync, // <-- import delete thunk
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
import RunLogCardContent from '../../components/simulator/RunLogCardContent';
import SimulatorCardContent from '../../components/simulator/SimulatorCardContent';
import { fetchSchemasAsync } from '../../store/schema/schemaThunk';

export default function SimulationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const profiles = useSelector((state: RootState) => {
    // If profiles is a Record, convert to array
    const rawProfiles = state.simulationProfile.profiles;
    return Array.isArray(rawProfiles)
      ? rawProfiles
      : (Object.values(rawProfiles) as ISimulationProfile[]);
  });
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

  // NEW: Delete handler
  const handleDeleteProfile = async (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this simulation profile?')
    ) {
      await dispatch(deleteSimulationProfileAsync(id));
      if (profileId === id) {
        navigate('/simulator'); // Redirect if deleted profile was selected
      }
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
    // Dispatch the thunk to create the profile
    await dispatch(
      createSimulationProfileAsync({
        ...form,
        globalSettings: {
          defaultUpdateFrequency: 0,
          timeScale: 0,
        }, // Provide default or initial globalSettings as required by your type
      })
    );
    setShowModal(false);
    setForm({ name: '', description: '', schemaId: '', brokerId: '' });
    // Optionally, re-fetch profiles if your thunk doesn't update the list automatically
    // dispatch(fetchSimulationProfilesAsync());
  };

  // Fetch nodes by IDs utility
  const fetchNodesByIds = async (ids: string[]) => {
    // Find all nodes in all schemas that match the given IDs
    const allNodes = schemas.flatMap((schema) => schema.nodes ?? []);
    return allNodes.filter((node) => ids.includes(node.id));
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8">
        {/* Profiles Section */}
        <div className="col-span-1 flex flex-col gap-6">
          <SimulationCard title="Profiles">
            <ProfilesCardContent
              profiles={profiles}
              loading={loading}
              error={error}
              onCreateProfileClick={() => setShowModal(true)}
              schemas={schemas}
              onDeleteProfile={handleDeleteProfile} // <-- pass delete handler
            />
          </SimulationCard>
          <SimulationCard title="Run Log">
            <RunLogCardContent />
          </SimulationCard>
        </div>

        {/* Simulator Section */}
        <div className="col-span-2 flex flex-col gap-6">
          <SimulationCard title="Simulator">
            <SimulatorCardContent fetchNodesByIds={fetchNodesByIds} />
          </SimulationCard>
        </div>
      </div>

      {/* Modal */}
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
    </div>
  );
}
