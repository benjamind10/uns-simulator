import SimulationProfile from '../graphql/models/SimulationProfile';
import Schema from '../graphql/models/Schema';
import Broker from '../graphql/models/Broker';
import simulationManager from '../simulation/SimulationManager';

import { TOPICS } from './topics';

interface CommandPayload {
  profileId?: string;
  correlationId?: string;
  origin?: string;
  timestamp?: number;
}

type ResponsePublisher = (
  correlationId: string,
  response: Record<string, unknown>
) => void;

/**
 * Handles incoming MQTT commands on `_sys/cmd/#` topics.
 *
 * Commands are authorized at the broker level via Mosquitto ACL —
 * only `uns-client` can write to `cmd/` topics. No additional
 * auth validation is performed here.
 */
export function createCommandHandler(publishResponse: ResponsePublisher) {
  return async (topic: string, message: Buffer): Promise<void> => {
    let payload: CommandPayload;

    try {
      payload = JSON.parse(message.toString());
    } catch {
      console.error('❌ Command: invalid JSON on', topic);
      return;
    }

    const { profileId, correlationId, origin } = payload;

    // Skip UI-originated commands (already executed by the GraphQL resolver)
    if (origin === 'ui') return;

    const sendResponse = (success: boolean, error: string | null) => {
      if (!correlationId) return;
      publishResponse(correlationId, {
        correlationId,
        success,
        error,
        timestamp: Date.now(),
      });
    };

    if (!profileId) {
      console.warn('⚠️ Command missing profileId on', topic);
      sendResponse(false, 'Missing required field: profileId');
      return;
    }

    try {
      if (topic === TOPICS.CMD_SIMULATION_START) {
        await handleStart(profileId);
        sendResponse(true, null);
      } else if (topic === TOPICS.CMD_SIMULATION_STOP) {
        await handleStop(profileId);
        sendResponse(true, null);
      } else if (topic === TOPICS.CMD_SIMULATION_PAUSE) {
        await handlePause(profileId);
        sendResponse(true, null);
      } else if (topic === TOPICS.CMD_SIMULATION_RESUME) {
        await handleResume(profileId);
        sendResponse(true, null);
      } else {
        console.warn('⚠️ Unknown command topic:', topic);
        sendResponse(false, `Unknown command: ${topic}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Command failed on ${topic}:`, errorMsg);
      sendResponse(false, errorMsg);
    }
  };
}

async function handleStart(profileId: string): Promise<void> {
  const profile = await SimulationProfile.findById(profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  const schema = await Schema.findById(profile.schemaId);
  if (!schema) {
    throw new Error(`Schema not found for profile: ${profileId}`);
  }

  const broker = await Broker.findById(profile.brokerId);
  if (!broker) {
    throw new Error(`Broker not found for profile: ${profileId}`);
  }

  await simulationManager.startSimulation(profile, schema, broker);
}

async function handleStop(profileId: string): Promise<void> {
  await simulationManager.stopSimulation(profileId);
}

async function handlePause(profileId: string): Promise<void> {
  await simulationManager.pauseSimulation(profileId);
}

async function handleResume(profileId: string): Promise<void> {
  await simulationManager.resumeSimulation(profileId);
}
