import { createAsyncThunk } from '@reduxjs/toolkit';
import mqtt, { type MqttClient } from 'mqtt';

import type { AppDispatch, RootState } from '../store';
import {
  updateSimulationStatus,
  addSimulationLog,
} from '../simulationProfile/simulationProfileSlice';

import {
  setConnecting,
  setConnected,
  setDisconnected,
  setError,
  incrementReconnectAttempts,
} from './systemMqttSlice';

// Singleton client instance
let systemClient: MqttClient | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

// Fetch MQTT configuration from backend
async function fetchMqttConfig(token: string) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql';
  const baseUrl = apiUrl.replace('/graphql', '');

  const response = await fetch(`${baseUrl}/api/mqtt-config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MQTT config: ${response.statusText}`);
  }

  return await response.json();
}

// Calculate exponential backoff delay
function getReconnectDelay(attempts: number): number {
  const baseDelay = 5000; // 5 seconds
  const maxDelay = 60000; // 60 seconds
  return Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
}

// Connect to system MQTT broker
export const connectSystemMqtt = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>('systemMqtt/connect', async (_, { dispatch, getState }) => {
  const state = getState();
  const token = state.auth.token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  // Prevent duplicate connections
  if (systemClient?.connected) {
    console.log('ℹ️ System MQTT already connected');
    return;
  }

  dispatch(setConnecting());

  try {
    // Fetch MQTT configuration from backend
    const config = await fetchMqttConfig(token);
    console.log(
      `🔗 Connecting to system MQTT: ws://${config.host}:${config.wsPort}`
    );

    // Create WebSocket connection
    const url = `ws://${config.host}:${config.wsPort}`;
    systemClient = mqtt.connect(url, {
      clientId: `uns-client-${Date.now()}`,
      username: config.username,
      password: config.password,
      clean: true,
      reconnectPeriod: 0, // Manual reconnection with backoff
      connectTimeout: 10000,
      keepalive: 30,
    });

    // Connection success
    systemClient.on('connect', () => {
      console.log('✅ System MQTT connected');
      dispatch(setConnected());

      // Subscribe to simulation status wildcard topic
      systemClient!.subscribe(
        'uns-simulator/_sys/status/simulations/+',
        { qos: 1 },
        (err) => {
          if (err) {
            console.error(
              '❌ Failed to subscribe to status topics:',
              err.message
            );
            dispatch(setError(`Subscription failed: ${err.message}`));
          } else {
            console.log('📡 Subscribed to simulation status topics');
          }
        }
      );

      // Subscribe to simulation log topics
      systemClient!.subscribe(
        'uns-simulator/_sys/logs/simulations/+',
        { qos: 0 },
        (err) => {
          if (err) {
            console.error(
              '❌ Failed to subscribe to log topics:',
              err.message
            );
          } else {
            console.log('📡 Subscribed to simulation log topics');
          }
        }
      );
    });

    // Handle incoming messages
    systemClient.on('message', (topic: string, payload: Buffer) => {
      try {
        const raw = payload.toString();
        if (!raw) return;

        const parts = topic.split('/');
        const profileId = parts[parts.length - 1];
        if (!profileId || profileId.startsWith('_')) return;

        // Route based on topic type
        if (topic.includes('/_sys/logs/simulations/')) {
          const log = JSON.parse(raw);
          if (log.timestamp && log.level && log.message) {
            dispatch(addSimulationLog({ profileId, log }));
          }
        } else if (topic.includes('/_sys/status/simulations/')) {
          const status = JSON.parse(raw);
          if (!status.state) return;
          console.log(
            `📩 MQTT status update: ${profileId} → ${status.state}`
          );
          dispatch(updateSimulationStatus({ profileId, status }));
        }
      } catch (err) {
        console.error('❌ Error processing MQTT message:', err);
      }
    });

    // Handle disconnection
    systemClient.on('close', () => {
      console.log('🔌 System MQTT disconnected');
      dispatch(setDisconnected());

      // Attempt reconnection if connection was previously established
      const currentState = getState();
      if (currentState.auth.token) {
        scheduleReconnect(dispatch, getState);
      }
    });

    // Handle errors
    systemClient.on('error', (err) => {
      console.error('❌ System MQTT error:', err.message);
      dispatch(setError(err.message));
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Failed to connect to system MQTT:', message);
    dispatch(setError(message));
    throw err;
  }
});

// Schedule reconnection with exponential backoff
function scheduleReconnect(dispatch: AppDispatch, getState: () => RootState) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  const state = getState();
  const attempts = state.systemMqtt.reconnectAttempts;
  const delay = getReconnectDelay(attempts);

  console.log(`🔄 Reconnecting in ${delay}ms (attempt ${attempts + 1})`);
  dispatch(incrementReconnectAttempts());

  reconnectTimer = setTimeout(() => {
    dispatch(connectSystemMqtt());
  }, delay);
}

// Disconnect from system MQTT broker
export const disconnectSystemMqtt = createAsyncThunk(
  'systemMqtt/disconnect',
  async (_, { dispatch }) => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (systemClient) {
      return new Promise<void>((resolve) => {
        systemClient!.end(false, {}, () => {
          systemClient = null;
          dispatch(setDisconnected());
          console.log('🔌 System MQTT disconnected (manual)');
          resolve();
        });
      });
    }
  }
);
