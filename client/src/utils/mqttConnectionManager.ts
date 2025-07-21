import mqtt, { type MqttClient } from 'mqtt';
import type { IBroker } from '../types';

export interface BrokerConnection {
  brokerId: string;
  client: MqttClient | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError?: string;
}

class MqttConnectionManager {
  private connections = new Map<string, BrokerConnection>();
  private statusCallbacks = new Set<
    (connections: Map<string, BrokerConnection>) => void
  >();

  // Subscribe to status changes
  onStatusChange(
    callback: (connections: Map<string, BrokerConnection>) => void
  ) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  // Notify all subscribers of status change
  private notifyStatusChange() {
    this.statusCallbacks.forEach((callback) => callback(this.connections));
  }

  // Connect to a broker
  connectToBroker(broker: IBroker): void {
    const existingConnection = this.connections.get(broker.id);

    // If already connected, don't reconnect
    if (existingConnection?.status === 'connected') {
      return;
    }

    // Set connecting status
    this.connections.set(broker.id, {
      brokerId: broker.id,
      client: null,
      status: 'connecting',
    });
    this.notifyStatusChange();

    const url = `ws://${broker.url}:${broker.port}`;
    const client = mqtt.connect(url, {
      clientId: broker.clientId,
      username: broker.username,
      password: broker.password,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      this.connections.set(broker.id, {
        brokerId: broker.id,
        client,
        status: 'connected',
      });
      this.notifyStatusChange();
    });

    client.on('error', (error) => {
      this.connections.set(broker.id, {
        brokerId: broker.id,
        client,
        status: 'error',
        lastError: error.message,
      });
      this.notifyStatusChange();
    });

    client.on('close', () => {
      this.connections.set(broker.id, {
        brokerId: broker.id,
        client: null,
        status: 'disconnected',
      });
      this.notifyStatusChange();
    });
  }

  // Disconnect from a broker
  disconnectFromBroker(brokerId: string): void {
    const connection = this.connections.get(brokerId);
    if (connection?.client) {
      connection.client.end();
    }
    this.connections.set(brokerId, {
      brokerId,
      client: null,
      status: 'disconnected',
    });
    this.notifyStatusChange();
  }

  // Get status of a specific broker
  getBrokerStatus(brokerId: string): BrokerConnection['status'] {
    return this.connections.get(brokerId)?.status || 'disconnected';
  }

  // Get all connections
  getAllConnections(): Map<string, BrokerConnection> {
    return new Map(this.connections);
  }

  // Connect to multiple brokers
  connectToMultipleBrokers(brokers: IBroker[]): void {
    brokers.forEach((broker) => this.connectToBroker(broker));
  }

  // Disconnect all brokers
  disconnectAll(): void {
    this.connections.forEach((connection) => {
      if (connection.client) {
        connection.client.end();
      }
    });
    this.connections.clear();
    this.notifyStatusChange();
  }
}

// Export singleton instance
export const mqttConnectionManager = new MqttConnectionManager();
