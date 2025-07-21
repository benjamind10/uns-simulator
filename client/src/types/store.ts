import type { IBroker } from '.';
import type { AuthState } from './auth';
import type { ISchema } from './schema';

export interface RootState {
  auth: AuthState;
  brokers: BrokersState;
  schema: SchemaState;
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
