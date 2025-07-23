export interface GlobalSettings {
  defaultUpdateFrequency: number;
  timeScale: number;
  publishRoot?: string;
  startDelay?: number;
  simulationLength?: number;
  defaultPayload?: {
    quality: string;
    value: string | number;
    timestamp: number;
  };
}

export interface NodeSettings {
  nodeId: string;
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    value?: string | number;
    timestamp?: number;
  };
}

export interface ISimulationProfile {
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
