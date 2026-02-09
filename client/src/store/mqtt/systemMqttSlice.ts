import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../store';

interface SystemMqttState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: string | null;
  reconnectAttempts: number;
}

const initialState: SystemMqttState = {
  connected: false,
  connecting: false,
  error: null,
  lastConnected: null,
  reconnectAttempts: 0,
};

const systemMqttSlice = createSlice({
  name: 'systemMqtt',
  initialState,
  reducers: {
    setConnecting: (state) => {
      state.connecting = true;
      state.error = null;
    },
    setConnected: (state) => {
      state.connected = true;
      state.connecting = false;
      state.error = null;
      state.lastConnected = new Date().toISOString();
      state.reconnectAttempts = 0;
    },
    setDisconnected: (state) => {
      state.connected = false;
      state.connecting = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.connecting = false;
      state.connected = false;
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
  },
});

export const {
  setConnecting,
  setConnected,
  setDisconnected,
  setError,
  incrementReconnectAttempts,
  resetReconnectAttempts,
} = systemMqttSlice.actions;

// Selectors
export const selectSystemMqttConnected = (state: RootState) =>
  state.systemMqtt.connected;
export const selectSystemMqttConnecting = (state: RootState) =>
  state.systemMqtt.connecting;
export const selectSystemMqttError = (state: RootState) =>
  state.systemMqtt.error;
export const selectSystemMqttReconnectAttempts = (state: RootState) =>
  state.systemMqtt.reconnectAttempts;

export default systemMqttSlice.reducer;
