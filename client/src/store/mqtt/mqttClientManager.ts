import type { MqttClient } from 'mqtt';
import type { IBroker } from '../../types';
import mqtt from 'mqtt';

const clientMap = new Map<string, MqttClient>();

export function connectBroker(
  broker: IBroker,
  onStatus: (
    status: 'connected' | 'disconnected' | 'error',
    error?: string
  ) => void
) {
  if (clientMap.has(broker.id)) return clientMap.get(broker.id)!;

  const url = `ws://${broker.url}:${broker.port}`;
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
