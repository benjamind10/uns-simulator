export default function SimulationTabs() {
  return (
    <div className="border-b border-gray-700 pb-2 mb-4 flex gap-6 text-lg">
      <button className="font-bold text-blue-400 border-b-2 border-blue-400 pb-1">
        Details
      </button>
      <button className="hover:text-blue-300">Scenarios</button>
      <button className="hover:text-blue-300">Behavior</button>
    </div>
  );
}
