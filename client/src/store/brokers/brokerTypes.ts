import type { IBroker } from '../../types';

export interface BrokersState {
  brokers: IBroker[];
  loading: boolean;
  error: string | null;
}

export const initialState: BrokersState = {
  brokers: [],
  loading: false,
  error: null,
};
