import {
  createSlice,
  type PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';

import type { BrokerConnection } from '../../types';
import type { RootState } from '../store';

interface MqttState {
  connections: Record<string, BrokerConnection>;
}

const initialState: MqttState = {
  connections: {},
};

const mqttSlice = createSlice({
  name: 'mqtt',
  initialState,
  reducers: {
    setConnectionStatus: (
      state,
      action: PayloadAction<{
        brokerId: string;
        status: BrokerConnection['status'];
        error?: string;
      }>
    ) => {
      const { brokerId, status, error } = action.payload;

      if (!state.connections[brokerId]) {
        state.connections[brokerId] = {
          brokerId,
          status: 'disconnected',
        };
      }

      state.connections[brokerId].status = status;

      if (error) {
        state.connections[brokerId].lastError = error;
      }

      if (status === 'connected') {
        state.connections[brokerId].lastConnected = new Date().toISOString();
        state.connections[brokerId].lastError = undefined;
      }
    },

    removeConnection: (state, action: PayloadAction<string>) => {
      const brokerId = action.payload;
      delete state.connections[brokerId];
    },

    clearAllConnections: (state) => {
      state.connections = {};
    },
  },
});

export const { setConnectionStatus, removeConnection, clearAllConnections } =
  mqttSlice.actions;

// Selectors
export const selectConnections = (state: { mqtt: MqttState }) =>
  state.mqtt.connections;
export const selectBrokerStatus = (
  state: { mqtt: MqttState },
  brokerId: string
) => state.mqtt.connections[brokerId]?.status || 'disconnected';
export const selectConnectedBrokersCount = (state: { mqtt: MqttState }) =>
  Object.values(state.mqtt.connections).filter(
    (conn) => conn.status === 'connected'
  ).length;

export const selectBrokerStatuses = createSelector(
  [
    (state: RootState) => state.brokers.brokers,
    (state: RootState) => state.mqtt.connections,
  ],
  (brokers, connections) => {
    const statuses: Record<string, string> = {};
    for (const b of brokers) {
      statuses[b.id] = connections[b.id]?.status || 'disconnected';
    }
    return statuses;
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        if (Object.keys(a).length !== Object.keys(b).length) return false;
        for (const key in a) {
          if (a[key] !== b[key]) return false;
        }
        return true;
      },
    },
  }
);

export default mqttSlice.reducer;
