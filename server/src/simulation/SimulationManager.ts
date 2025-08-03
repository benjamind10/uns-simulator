import { IBroker } from '../graphql/models/Broker';
import { ISchema } from '../graphql/models/Schema';
import { ISimulationProfile } from '../graphql/models/SimulationProfile';

import { SimulationEngine } from './SimulationEngine';

export class SimulationManager {
  private engines: Map<string, SimulationEngine> = new Map();

  async startSimulation(
    profile: ISimulationProfile,
    schema: ISchema,
    broker: IBroker
  ): Promise<void> {
    const profileId = profile.id.toString();

    // Stop existing simulation if running
    if (this.engines.has(profileId)) {
      await this.stopSimulation(profileId);
    }

    // Create new engine
    const engine = new SimulationEngine(profile, schema, broker);

    // // Set up event listeners for logging/monitoring
    // engine.on('started', (data) => {
    //   console.log(`Simulation started: ${data.profileId}`);
    // });

    // engine.on('nodePublished', (data) => {
    //   console.log(
    //     `Published: ${data.topic} -> ${JSON.stringify(data.payload)}`
    //   );
    // });

    // engine.on('nodeFailure', (data) => {
    //   console.log(`Node failure: ${data.nodeId} at ${data.timestamp}`);
    // });

    // engine.on('publishError', (data) => {
    //   console.error(`Publish error for ${data.nodeId}: ${data.error}`);
    // });

    // engine.on('stopped', (data) => {
    //   console.log(`Simulation stopped: ${data.profileId}`);
    //   // Clean up engine when stopped
    //   this.engines.delete(profileId);
    // });

    // engine.on('paused', (data) => {
    //   console.log(`Simulation paused: ${data.profileId}`);
    // });

    // engine.on('resumed', (data) => {
    //   console.log(`Simulation resumed: ${data.profileId}`);
    // });

    this.engines.set(profileId, engine);
    await engine.start();
  }

  async stopSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      await engine.stop(); // Wait for stop to complete
      this.engines.delete(profileId); // Remove from map
    }
  }

  async pauseSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      engine.pause();
    }
  }

  async resumeSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      engine.resume();
    }
  }

  getSimulationStatus(profileId: string) {
    const engine = this.engines.get(profileId);
    return engine ? engine.getStatus() : null;
  }

  getAllSimulations() {
    const result: any[] = [];
    this.engines.forEach((engine, profileId) => {
      result.push({
        profileId,
        status: engine.getStatus(),
      });
    });
    return result;
  }

  isRunning(profileId: string): boolean {
    const engine = this.engines.get(profileId);
    return engine ? engine.getStatus().isRunning : false;
  }
}

// Export singleton instance
const simulationManager = new SimulationManager();
export default simulationManager;
