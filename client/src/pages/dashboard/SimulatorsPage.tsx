import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectProfiles } from '../../store/simulationProfile/simulationProfileSlice';
import { selectSchemas } from '../../store/schema/schemaSlice';
import { selectBrokers } from '../../store/brokers';
import type { ISimulationProfile, ISchema, IBroker } from '../../types';

const SimulatorsPage: React.FC = () => {
  const profiles = Object.values(
    useSelector(selectProfiles)
  ) as ISimulationProfile[];
  const schemas = useSelector(selectSchemas) as ISchema[];
  const brokers = useSelector(selectBrokers) as IBroker[];
  const navigate = useNavigate();

  // Metrics
  const totalSimulators = profiles.length;
  const totalSchemas = new Set(profiles.map((p) => p.schemaId)).size;
  const totalBrokers = new Set(profiles.map((p) => p.brokerId).filter(Boolean))
    .size;

  return (
    <div className="overflow-x-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Simulator Manager</h1>
      <div className="flex gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded shadow px-6 py-4 flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Simulators
          </span>
          <span className="text-3xl font-bold text-blue-600 mt-2">
            {totalSimulators}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow px-6 py-4 flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Schemas
          </span>
          <span className="text-3xl font-bold text-green-600 mt-2">
            {totalSchemas}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow px-6 py-4 flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Brokers
          </span>
          <span className="text-3xl font-bold text-purple-600 mt-2">
            {totalBrokers}
          </span>
        </div>
      </div>
      <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Schema</th>
            <th className="px-4 py-2 text-left">Broker</th>
            <th className="px-4 py-2 text-left">Created</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-400">
                No simulators found.
              </td>
            </tr>
          ) : (
            profiles.map((profile) => {
              const schema = schemas.find((s) => s.id === profile.schemaId);
              const broker = brokers.find((b) => b.id === profile.brokerId);
              return (
                <tr key={profile.id}>
                  <td className="px-4 py-2">{profile.name}</td>
                  <td className="px-4 py-2">{profile.description}</td>
                  <td className="px-4 py-2">{schema ? schema.name : '-'}</td>
                  <td className="px-4 py-2">{broker ? broker.name : '-'}</td>
                  <td className="px-4 py-2">
                    {profile.createdAt
                      ? new Date(
                          typeof profile.createdAt === 'number'
                            ? profile.createdAt
                            : Number(profile.createdAt)
                        ).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => navigate(`/simulator/${profile.id}`)}
                    >
                      Open Simulator
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SimulatorsPage;
