import type { AuthState } from './auth';
import type { ISchema } from './schema';

import type { IBroker, ISimulationProfile } from '.';

export interface RootState {
  auth: AuthState;
  brokers: BrokersState;
  schema: SchemaState;
  simulationProfile: ISimulationProfile;
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
