import { createAsyncThunk } from '@reduxjs/toolkit';

import type { IBroker } from '../../types';
import type { RootState } from '../store';
import { MQTT_ACTIONS } from '../constants';

import { connectBroker, disconnectBroker } from './mqttClientManager';
import { setConnectionStatus, removeConnection } from './mqttSlice';

// Connect to a single broker and manage its status in Redux
export const connectToBrokerAsync = createAsyncThunk(
  MQTT_ACTIONS.CONNECT_TO_BROKER,
  async (broker: IBroker, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const existing = state.mqtt.connections[broker.id];
    if (existing?.status === 'connected' || existing?.status === 'connecting')
      return broker.id;

    dispatch(
      setConnectionStatus({ brokerId: broker.id, status: 'connecting' })
    );

    return new Promise<string>((resolve, reject) => {
      let isSettled = false;
      let timeoutId: NodeJS.Timeout | null = null;

      connectBroker(broker, (status, error) => {
        dispatch(setConnectionStatus({ brokerId: broker.id, status, error }));

        if (status === 'connected' && !isSettled) {
          isSettled = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve(broker.id);
        } else if (status === 'error' && !isSettled) {
          isSettled = true;
          if (timeoutId) clearTimeout(timeoutId);
          reject(rejectWithValue(error || 'Failed to connect to broker'));
        }
      });

      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          const currentState = getState() as RootState;
          const connection = currentState.mqtt.connections[broker.id];
          if (connection?.status !== 'connected') {
            reject(rejectWithValue('Connection timeout'));
          }
        }
      }, 15000);
    });
  }
);

// Disconnect from a broker
export const disconnectFromBrokerAsync = createAsyncThunk(
  MQTT_ACTIONS.DISCONNECT_FROM_BROKER,
  async (brokerId: string, { dispatch }) => {
    disconnectBroker(brokerId);
    dispatch(removeConnection(brokerId));
    return brokerId;
  }
);

// Connect to multiple brokers
export const connectToMultipleBrokersAsync = createAsyncThunk(
  MQTT_ACTIONS.CONNECT_TO_MULTIPLE_BROKERS,
  async (brokers: IBroker[], { dispatch }) => {
    const promises = brokers.map((broker) =>
      dispatch(connectToBrokerAsync(broker))
    );
    await Promise.all(promises);
    return brokers.map((b) => b.id);
  }
);
