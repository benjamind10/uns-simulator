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

// Map MQTT port to WebSocket port for browser connections
// Standard MQTT port 1883 -> WebSocket port 9001
// All other ports are assumed to be already configured for WebSocket
function getWebSocketPort(mqttPort: number): number {
  // Standard MQTT port needs WebSocket translation
  if (mqttPort === 1883) return 9001;
  
  // Custom ports (9001, 8080, etc.) are used as-is
  // User should configure their broker with WebSocket protocol on these ports
  return mqttPort;
}

export function connectBroker(
  broker: IBroker,
  onStatus: (
    status: 'connected' | 'disconnected' | 'error',
    error?: string
  ) => void
) {
  if (clientMap.has(broker.id)) return clientMap.get(broker.id)!;

  // Use broker's configured port with WebSocket mapping
  // Map Docker service names to localhost since browser runs on host
  const browserUrl = getBrowserAccessibleUrl(broker.url);
  const wsPort = getWebSocketPort(broker.port);
  const url = `ws://${browserUrl}:${wsPort}`;
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
