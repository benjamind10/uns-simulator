export default function SimulationLog() {
  return (
    <div className="w-80 border-l border-gray-700 pl-4 text-xs bg-gray-800 rounded-r flex flex-col gap-1">
      <div className="text-gray-400 mb-2 font-semibold">Run Log</div>
      <div>
        10:41:05 <span className="text-green-400">INFO</span> Topic …
      </div>
      <div>
        10:41:04 <span className="text-green-400">INFO</span> …
      </div>
      {/* Add more log lines here */}
    </div>
  );
}
