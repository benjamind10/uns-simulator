export default function SimulationToolbar() {
  return (
    <div className="border-t border-gray-700 mt-4 pt-4 flex items-center gap-4">
      <span className="text-gray-400">Toolbar</span>
      <button className="bg-green-700 px-3 py-1 rounded text-sm font-semibold hover:bg-green-800">
        Start
      </button>
      <button className="bg-yellow-700 px-3 py-1 rounded text-sm font-semibold hover:bg-yellow-800">
        Pause
      </button>
      <button className="bg-red-700 px-3 py-1 rounded text-sm font-semibold hover:bg-red-800">
        Stop
      </button>
      <span>
        Status: <span className="text-green-400 font-semibold">Running</span>
      </span>
      <span className="ml-auto">
        Next: <span className="font-mono">4 s</span>
      </span>
    </div>
  );
}
