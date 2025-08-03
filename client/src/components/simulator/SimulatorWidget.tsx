type SimulatorWidgetProps = {
  profile: { name: string } | null;
  status: 'running' | 'paused' | 'stopped' | string;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
};

export default function SimulatorWidget({
  profile,
  status,
  onStart,
  onStop,
  onPause,
  onResume,
}: SimulatorWidgetProps) {
  if (!profile) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80"
      style={{ minWidth: 250 }}
    >
      <div className="font-bold mb-2 text-gray-900 dark:text-gray-100 flex justify-between items-center">
        <span>Simulator: {profile.name}</span>
        <span
          className={`text-xs px-2 py-1 rounded ${
            status === 'running'
              ? 'bg-green-100 text-green-700'
              : status === 'paused'
              ? 'bg-yellow-100 text-yellow-700'
              : status === 'stopped'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {status?.toUpperCase()}
        </span>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-300"
          disabled={status === 'running'}
          onClick={onStart}
        >
          Start
        </button>
        <button
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:bg-gray-300"
          disabled={status === 'stopped'}
          onClick={onStop}
        >
          Stop
        </button>
        <button
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disabled:bg-gray-300"
          disabled={status !== 'running'}
          onClick={onPause}
        >
          Pause
        </button>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300"
          disabled={status !== 'paused'}
          onClick={onResume}
        >
          Resume
        </button>
      </div>
    </div>
  );
}
