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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div>
        <label className="block mb-1 font-medium">
          Default Update Frequency
        </label>
        <input
          type="number"
          name="defaultUpdateFrequency"
          value={settings.defaultUpdateFrequency}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          min={1}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Time Scale</label>
        <input
          type="number"
          name="timeScale"
          value={settings.timeScale}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          min={0}
          step={0.01}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Publish Root</label>
        <input
          type="text"
          name="publishRoot"
          value={settings.publishRoot || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Start Delay (ms)</label>
        <input
          type="number"
          name="startDelay"
          value={settings.startDelay || 0}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          min={0}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Simulation Length (ms)</label>
        <input
          type="number"
          name="simulationLength"
          value={settings.simulationLength || 0}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          min={0}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
        >
          Save Config
        </button>
      </div>
    </form>
  );
};

export default SimulatorGlobalForm;
