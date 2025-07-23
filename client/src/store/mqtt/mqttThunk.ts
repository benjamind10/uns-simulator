import { createAsyncThunk } from '@reduxjs/toolkit';
import { setConnectionStatus, removeConnection } from './mqttSlice';
import { connectBroker, disconnectBroker } from './mqttClientManager';
import type { IBroker } from '../../types';
import type { RootState } from '../store';
import { MQTT_ACTIONS } from '../constants';

// Connect to a single broker and manage its status in Redux
export const connectToBrokerAsync = createAsyncThunk(
  MQTT_ACTIONS.CONNECT_TO_BROKER,
  async (broker: IBroker, { dispatch, getState }) => {
    const state = getState() as RootState;
    const existing = state.mqtt.connections[broker.id];
    if (existing?.status === 'connected' || existing?.status === 'connecting')
      return;

    dispatch(
      setConnectionStatus({ brokerId: broker.id, status: 'connecting' })
    );

    connectBroker(broker, (status, error) => {
      dispatch(setConnectionStatus({ brokerId: broker.id, status, error }));
    });

    return broker.id;
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
