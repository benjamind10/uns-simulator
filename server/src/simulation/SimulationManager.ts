import { IBroker } from '../graphql/models/Broker';
import { ISchema } from '../graphql/models/Schema';
import { ISimulationProfile } from '../graphql/models/SimulationProfile';
import SimulationProfile from '../graphql/models/SimulationProfile';
import mqttBackbone from '../mqtt/MqttBackboneService';

import { SimulationEngine, SimulationLogEntry } from './SimulationEngine';

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

    // Forward engine lifecycle events to MQTT backbone
    engine.on('started', () => {
      mqttBackbone.publishSimulationStatus(profileId, engine.getStatus());
      mqttBackbone.publishSimulationEvent('started', {
        profileId,
        name: profile.name,
      });
      this.publishSimulationIndex();
    });

    engine.on('stopped', () => {
      mqttBackbone.clearSimulationStatus(profileId);
      mqttBackbone.publishSimulationEvent('stopped', {
        profileId,
        name: profile.name,
      });
      this.publishSimulationIndex();
    });

    engine.on('paused', () => {
      mqttBackbone.publishSimulationStatus(profileId, engine.getStatus());
      mqttBackbone.publishSimulationEvent('paused', {
        profileId,
        name: profile.name,
      });
    });

    engine.on('resumed', () => {
      mqttBackbone.publishSimulationStatus(profileId, engine.getStatus());
      mqttBackbone.publishSimulationEvent('resumed', {
        profileId,
        name: profile.name,
      });
    });

    engine.on('statusUpdate', () => {
      mqttBackbone.publishSimulationStatus(profileId, engine.getStatus());
    });

    engine.on('startError', (data: { error: string }) => {
      mqttBackbone.publishSimulationEvent('error', {
        profileId,
        name: profile.name,
        error: data.error,
      });
    });

    // Forward all log entries to MQTT backbone
    engine.on('log', (entry: SimulationLogEntry) => {
      mqttBackbone.publishSimulationLog(profileId, { ...entry });
    });

    this.engines.set(profileId, engine);
    await engine.start();
  }

  async stopSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      this.engines.delete(profileId); // Remove from map BEFORE stop so 'stopped' event sees correct index
      await engine.stop();
    } else {
      // Even if engine doesn't exist in memory, update DB status
      console.log(
        `⚠️ Simulation ${profileId} not found in memory, updating DB status to stopped`
      );
      await SimulationProfile.findByIdAndUpdate(profileId, {
        $set: {
          'status.state': 'stopped',
          'status.isRunning': false,
          'status.isPaused': false,
          'status.mqttConnected': false,
          'status.lastActivity': new Date(),
        },
      });
    }
  }

  async pauseSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      await engine.pause();
    } else {
      // If engine doesn't exist, can't pause - maybe it was never started
      console.log(
        `⚠️ Cannot pause simulation ${profileId} - not found in memory`
      );
      throw new Error(
        'Simulation not running. Please start the simulation first.'
      );
    }
  }

  async resumeSimulation(profileId: string): Promise<void> {
    const engine = this.engines.get(profileId);
    if (engine) {
      await engine.resume();
    } else {
      console.log(
        `⚠️ Cannot resume simulation ${profileId} - not found in memory`
      );
      throw new Error(
        'Simulation not found. Please start the simulation first.'
      );
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

  getSimulationLogs(profileId: string, since?: number): SimulationLogEntry[] {
    const engine = this.engines.get(profileId);
    return engine ? engine.getLogs(since) : [];
  }

  isRunning(profileId: string): boolean {
    const engine = this.engines.get(profileId);
    return engine ? engine.getStatus().isRunning : false;
  }

  private publishSimulationIndex(): void {
    mqttBackbone.publishSimulationIndex(Array.from(this.engines.keys()));
  }

  async stopAllSimulations(): Promise<void> {
    console.log(`🛑 Stopping ${this.engines.size} running simulation(s)...`);
    const stopPromises: Promise<void>[] = [];

    // Stop all simulations in parallel
    this.engines.forEach((engine, profileId) => {
      stopPromises.push(this.stopSimulation(profileId));
    });

    await Promise.all(stopPromises);
    console.log('✅ All simulations stopped');
  }
}

// Export singleton instance
const simulationManager = new SimulationManager();
export default simulationManager;
