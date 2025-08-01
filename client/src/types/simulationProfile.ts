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
}
