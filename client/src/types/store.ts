import type { AuthState } from './auth';
import type { ISchema } from './schema';
import type { MqttMessage } from './mqtt';

import type { IBroker, ISimulationProfile, SimulationState } from '.';

export interface RootState {
  auth: AuthState;
  brokers: BrokersState;
  schema: SchemaState;
  simulationProfile: SimulationProfileState;
  mqtt: MqttState;
}

export interface BrokersState {
  brokers: IBroker[];
  loading: boolean;
  error: string | null;
}

export interface SchemaState {
  schemas: ISchema[];
  loading: boolean;
  error: string | null;
}

export interface SimulationProfileState {
  profiles: Record<string, ISimulationProfile>;
  selectedProfileId: string | null;
  loading: boolean;
  error: string | null;
  // Simulation control state
  simulationStates: Record<string, SimulationState>; // profileId -> state
  simulationLoading: Record<string, boolean>; // profileId -> loading
  simulationErrors: Record<string, string | null>; // profileId -> error
}

export interface MqttState {
  connections: Record<string, MqttConnection>; // brokerId -> connection
  messages: MqttMessage[];
  loading: boolean;
  error: string | null;
}

export interface MqttConnection {
  brokerId: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected?: Date;
  subscriptions: string[];
}
