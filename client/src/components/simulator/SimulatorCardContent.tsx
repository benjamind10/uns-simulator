import React, { useState } from 'react';
import SimulatorConfigForm from './SimulatorConfigForm'; // Adjust the import path as necessary

type TabType = 'details' | 'config' | 'behavior' | 'global';

const SimulatorCardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  return (
    <>
      <div className="flex gap-8 border-b border-gray-300 dark:border-gray-700 mb-4">
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'details'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'global'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('global')}
        >
          Global Settings
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'config'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('config')}
        >
          Config
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'behavior'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('behavior')}
        >
          Behavior
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div>
          <div className="mb-6">
            <div className="text-lg font-semibold mb-2 dark:text-white text-gray-900">
              Status
            </div>
            <div className="text-3xl font-bold text-green-500 mb-4">
              Running
            </div>
            <div className="flex gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
                Start
              </button>
              <button className="bg-gray-400 dark:bg-gray-700 text-white px-4 py-2 rounded font-semibold">
                Pause
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold">
                Stop
              </button>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 h-40 flex items-center justify-center shadow-sm">
            <span className="text-gray-500 dark:text-gray-400">
              [Chart Placeholder]
            </span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs shadow-sm">
            <div className="dark:text-gray-300 text-gray-600">
              09:14:08 INFO Topic A ...
            </div>
            <div className="dark:text-gray-300 text-gray-600">
              09:14:06 INFO ...
            </div>
            <div className="dark:text-gray-300 text-gray-600">
              09:14:04 INFO ...
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="py-8">
          <SimulatorConfigForm
            initialSettings={{
              defaultUpdateFrequency: 1000, // TODO: Replace with actual value from profile
              timeScale: 1, // TODO: Replace with actual value from profile
            }} // TODO: Replace with actual globalSettings from profile when available
            onSave={() => {
              // Dispatch updateSimulationProfileAsync({ ...profile, globalSettings: settings })
              // or handle save logic here
            }}
          />
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <span>[Behavior content goes here]</span>
        </div>
      )}

      {activeTab === 'global' && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <span>[Global settings content goes here]</span>
        </div>
      )}
    </>
  );
};

export default SimulatorCardContent;
