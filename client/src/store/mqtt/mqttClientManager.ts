import type { MqttClient } from 'mqtt';
import mqtt from 'mqtt';

import type { IBroker } from '../../types';

const clientMap = new Map<string, MqttClient>();

// Map Docker service names to localhost for browser connections
// Browser runs on host machine, not inside Docker network
function getBrowserAccessibleUrl(brokerUrl: string): string {
  // Map common Docker service names to localhost
  const dockerServiceMappings: Record<string, string> = {
    'uns-mqtt': 'localhost',
    'mqtt': 'localhost',
    'mosquitto': 'localhost',
  };

  return dockerServiceMappings[brokerUrl] || brokerUrl;
}

export function connectBroker(
  broker: IBroker,
  onStatus: (
    status: 'connected' | 'disconnected' | 'error',
    error?: string
  ) => void
) {
  if (clientMap.has(broker.id)) return clientMap.get(broker.id)!;

  // Use WebSocket port 9001 for browser connections
  // Map Docker service names to localhost since browser runs on host
  const browserUrl = getBrowserAccessibleUrl(broker.url);
  const url = `ws://${browserUrl}:9001`;
  const client = mqtt.connect(url, {
    clientId: broker.clientId,
    username: broker.username,
    password: broker.password,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => onStatus('connected'));
  client.on('close', () => onStatus('disconnected'));
  client.on('error', (err) => onStatus('error', err.message));

  clientMap.set(broker.id, client);
  return client;
}

export function disconnectBroker(brokerId: string) {
  const client = clientMap.get(brokerId);
  if (client) {
    client.end(true);
    clientMap.delete(brokerId);
  }
}

export function disconnectAllBrokers() {
  for (const [id, client] of clientMap.entries()) {
    client.end(true);
    clientMap.delete(id);
  }
}

export function getClient(brokerId: string) {
  return clientMap.get(brokerId);
}

// Clean up all connections when the page is about to unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    disconnectAllBrokers();
  });
}
