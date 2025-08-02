export interface GlobalSettings {
  defaultUpdateFrequency: number;
  timeScale: number;
  publishRoot?: string;
  startDelay?: number;
  simulationLength?: number;
}

export interface NodeSettings {
  nodeId: string;
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    value?: string | number;
    timestamp?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ISimulationProfile {
  selectedProfileId: string;
  profiles: Record<string, unknown>;
  loading: boolean;
  error: unknown;
  id: string;
  name: string;
  description?: string;
  schemaId: string;
  brokerId?: string;
  globalSettings: GlobalSettings;
  nodeSettings?: NodeSettings[]; // Array of per-node settings
  defaultScenario?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status?: {
    state:
      | 'idle'
      | 'starting'
      | 'running'
      | 'paused'
      | 'stopping'
      | 'stopped'
      | 'error';
    isRunning: boolean;
    isPaused: boolean;
    startTime?: Date;
    lastActivity?: Date;
    nodeCount?: number;
    mqttConnected?: boolean;
    reconnectAttempts?: number;
    error?: string;
  };
}

// Simulation Control Types
export interface SimulationStatus {
  isRunning: boolean;
  startTime?: Date;
  nodeCount: number;
  profile: string;
}

export interface SimulationControlResponse {
  success: boolean;
  message?: string;
}

export interface StartSimulationPayload {
  profileId: string;
}

export interface StopSimulationPayload {
  profileId: string;
}

export interface PauseSimulationPayload {
  profileId: string;
}

export interface ResumeSimulationPayload {
  profileId: string;
}

// Simulation Event Types
export interface SimulationEvent {
  type:
    | 'started'
    | 'stopped'
    | 'paused'
    | 'resumed'
    | 'nodePublished'
    | 'nodeFailure'
    | 'publishError';
  profileId: string;
  timestamp: number;
  data?: any;
}

export interface NodePublishedEvent extends SimulationEvent {
  type: 'nodePublished';
  data: {
    nodeId: string;
    topic: string;
    payload: any;
  };
}

export interface NodeFailureEvent extends SimulationEvent {
  type: 'nodeFailure';
  data: {
    nodeId: string;
  };
}

export interface PublishErrorEvent extends SimulationEvent {
  type: 'publishError';
  data: {
    nodeId: string;
    error: string;
  };
}

// Simulation State Types
export type SimulationState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'pausing'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export interface SimulationInstance {
  profileId: string;
  state: SimulationState;
  status: SimulationStatus;
  events: SimulationEvent[];
  lastUpdated: Date;
}
