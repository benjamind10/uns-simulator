import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ISchema, ISimulationProfile } from '../../types';

interface ProfilesCardContentProps {
  profiles: ISimulationProfile[];
  loading: boolean;
  error: string | null;
  onCreateProfileClick: () => void;
  schemas: ISchema[];
  onDeleteProfile?: (id: string) => void; // <-- add this
}

const ProfilesCardContent: React.FC<ProfilesCardContentProps> = ({
  profiles,
  loading,
  schemas,
  error,
  onCreateProfileClick,
  onDeleteProfile,
}) => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId?: string }>();

  return (
    <div className="mb-4">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2 w-full font-semibold"
        onClick={onCreateProfileClick}
      >
        + Create Profile
      </button>
      {loading && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-4">
          Loading profiles...
        </div>
      )}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      {!loading && !error && profiles.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-4">
          No simulations found.
        </div>
      )}
      {Array.isArray(profiles) &&
        profiles.map((profile) => (
          <div
            key={profile.id}
            className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-2 shadow-sm cursor-pointer transition
              ${
                profileId === profile.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:ring-2 hover:ring-blue-400'
              }`}
            onClick={() => navigate(`/simulator/${profile.id}`)}
          >
            <div className="font-semibold dark:text-white text-gray-900">
              {profile.name}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {profile.description}
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="dark:text-gray-300 text-gray-600">
                {schemas.find((s: ISchema) => s.id === profile.schemaId)
                  ?.name || profile.schemaId}
              </span>
              <span className="dark:text-gray-300 text-gray-600">
                {profile.updatedAt
                  ? new Date(Number(profile.updatedAt)).toLocaleDateString()
                  : ''}
              </span>
            </div>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs mt-2"
              onClick={() => onDeleteProfile?.(profile.id)}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
};

export default ProfilesCardContent;
