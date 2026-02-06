import { describe, it, expect } from 'vitest';

import brokersReducer from '../../store/brokers/brokerSlice';
import {
  fetchBrokersAsync,
  deleteBrokerAsync,
  updateBrokerAsync,
  createBrokerAsync,
} from '../../store/brokers/brokerThunks';
import type { BrokersState } from '../../store/brokers/brokerTypes';

const emptyState: BrokersState = {
  brokers: [],
  loading: false,
  error: null,
};

const broker1 = { id: 'b1', name: 'Broker 1', url: 'localhost', port: 1883 };
const broker2 = { id: 'b2', name: 'Broker 2', url: 'localhost', port: 1884 };

describe('brokersSlice', () => {
  describe('fetchBrokersAsync', () => {
    it('sets loading on pending', () => {
      const state = brokersReducer(emptyState, {
        type: fetchBrokersAsync.pending.type,
      });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('populates brokers on fulfilled', () => {
      const state = brokersReducer(
        { ...emptyState, loading: true },
        {
          type: fetchBrokersAsync.fulfilled.type,
          payload: [broker1, broker2],
        }
      );
      expect(state.loading).toBe(false);
      expect(state.brokers).toHaveLength(2);
    });

    it('sets error on rejected', () => {
      const state = brokersReducer(
        { ...emptyState, loading: true },
        {
          type: fetchBrokersAsync.rejected.type,
          error: { message: 'Network error' },
        }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('deleteBrokerAsync', () => {
    it('removes broker from state on fulfilled', () => {
      const state = brokersReducer(
        { ...emptyState, brokers: [broker1, broker2] as any },
        {
          type: deleteBrokerAsync.fulfilled.type,
          payload: 'b1',
        }
      );
      expect(state.brokers).toHaveLength(1);
      expect(state.brokers[0].id).toBe('b2');
    });
  });

  describe('updateBrokerAsync', () => {
    it('updates broker in state on fulfilled', () => {
      const updated = { ...broker1, name: 'Updated' };
      const state = brokersReducer(
        { ...emptyState, brokers: [broker1, broker2] as any },
        {
          type: updateBrokerAsync.fulfilled.type,
          payload: updated,
        }
      );
      expect(state.brokers[0].name).toBe('Updated');
    });
  });

  describe('createBrokerAsync', () => {
    it('adds broker to state on fulfilled', () => {
      const state = brokersReducer(
        { ...emptyState, brokers: [broker1] as any },
        {
          type: createBrokerAsync.fulfilled.type,
          payload: broker2,
        }
      );
      expect(state.brokers).toHaveLength(2);
    });
  });
});
