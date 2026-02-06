import React, { useState } from 'react';

import type { GlobalSettings } from '../../types';

interface SimulatorConfigFormProps {
  initialSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

const SimulatorGlobalForm: React.FC<SimulatorConfigFormProps> = ({
  initialSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<GlobalSettings>(initialSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Default Update Frequency (ms)
        </label>
        <input
          type="number"
          name="defaultUpdateFrequency"
          value={settings.defaultUpdateFrequency}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          min={1}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Time Scale (multiplier)
        </label>
        <input
          type="number"
          name="timeScale"
          value={settings.timeScale}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          min={0}
          step={0.01}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Publish Root
        </label>
        <input
          type="text"
          name="publishRoot"
          value={settings.publishRoot || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Optional topic prefix"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Start Delay (ms)
        </label>
        <input
          type="number"
          name="startDelay"
          value={settings.startDelay || 0}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          min={0}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Simulation Length (ms)
        </label>
        <input
          type="number"
          name="simulationLength"
          value={settings.simulationLength || 0}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          min={0}
          placeholder="0 = unlimited"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Save Global Settings
      </button>
    </form>
  );
};

export default SimulatorGlobalForm;
