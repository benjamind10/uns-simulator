export interface GlobalSettings {
  defaultUpdateFrequency: number;
  timeScale: number;
  publishRoot?: string;
  startDelay?: number;
  simulationLength?: number;
}

export interface ISimulationProfile {
  id: string;
  name: string;
  description?: string;
  schemaId: string;
  brokerId?: string;
  globalSettings: GlobalSettings;
  defaultScenario?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
