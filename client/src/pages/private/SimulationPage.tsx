import SimulationLog from '../../components/simulator/SimulationLog';
import SimulationTabs from '../../components/simulator/SimulationTabs';
import SimulationToolbar from '../../components/simulator/SimulationToolbar';

export default function SimulationPage() {
  return (
    <div className="p-8 font-mono bg-gray-900 text-gray-100 min-h-screen flex justify-center items-start">
      <div className="border border-gray-700 rounded-lg shadow-lg bg-gray-950 w-full max-w-5xl">
        <SimulationTabs />
        <div className="flex">
          <div className="flex-1 p-6">
            <span className="text-yellow-400">(tab content)</span>
          </div>
          <SimulationLog />
        </div>
        <SimulationToolbar />
      </div>
    </div>
  );
}
