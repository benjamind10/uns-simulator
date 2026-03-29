import { EventEmitter } from 'events';

import * as mqtt from 'mqtt';
import mongoose from 'mongoose';

import { MQTT_BACKBONE_CONFIG } from '../config/constants';

import { createCommandHandler } from './commandHandler';
import { TOPICS } from './topics';

/**
 * MqttBackboneService
 *
 * Singleton service that maintains a persistent MQTT connection to the
 * local broker as the `uns-backend` system user. Publishes application
 * state (server health, simulation status) to well-known system topics
 * under `uns-simulator/_sys/`.
 *
 * Phase 1: Status publishing + system events
 * Phase 2: Command subscription + dispatch
 */
class MqttBackboneService extends EventEmitter {
  private client?: mqtt.MqttClient;
  private connected = false;
  private heartbeatInterval?: NodeJS.Timeout;
  private startTimestamp?: number;
  private handleCommand: ReturnType<typeof createCommandHandler>;
  private verboseLogs = process.env.MQTT_BACKBONE_VERBOSE_LOGS === 'true';

  private verboseLog(message: string): void {
    if (this.verboseLogs) {
      console.log(message);
    }
  }

  constructor() {
    super();
    this.handleCommand = createCommandHandler(
      this.publishCommandResponse.bind(this)
    );
  }

  async connect(): Promise<void> {
    if (this.client) {
      console.warn('⚠️ MQTT Backbone already connected');
      return;
    }

    const host = process.env.MQTT_HOST || 'localhost';
    const port = process.env.MQTT_PORT || '1883';
    const username = process.env.MQTT_BACKBONE_USERNAME || 'uns-backend';
    const password = process.env.MQTT_BACKBONE_PASSWORD;

    const url = `mqtt://${host}:${port}`;

    return new Promise((resolve, reject) => {
      let settled = false;

      const options: mqtt.IClientOptions = {
        clientId: MQTT_BACKBONE_CONFIG.CLIENT_ID,
        clean: true,
        connectTimeout: MQTT_BACKBONE_CONFIG.CONNECT_TIMEOUT,
        reconnectPeriod: MQTT_BACKBONE_CONFIG.RECONNECT_PERIOD,
        keepalive: MQTT_BACKBONE_CONFIG.KEEPALIVE,
        protocolVersion: 4,
      };

      if (username) options.username = username;
      if (password) options.password = password;

      this.verboseLog(`🔗 MQTT Backbone connecting to ${url} as "${username}"...`);

      this.client = mqtt.connect(url, options);

      this.client.on('connect', () => {
        this.connected = true;
        this.startTimestamp = Date.now();
        this.verboseLog('✅ MQTT Backbone connected');
        this.startHeartbeat();
        this.subscribeToCommands();
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      this.client.on('message', (topic, message) => {
        if (topic.startsWith(TOPICS.CMD_WILDCARD.replace('/#', '/'))) {
          this.handleCommand(topic, message);
        }
      });

      this.client.on('reconnect', () => {
        console.warn('🔄 MQTT Backbone reconnecting...');
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.on('error', (err) => {
        console.error('❌ MQTT Backbone error:', err.message);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    if (!this.client) return;

    return new Promise((resolve) => {
      this.client!.end(false, {}, () => {
        this.client = undefined;
        this.connected = false;
        this.verboseLog('🔌 MQTT Backbone disconnected');
        resolve();
      });
    });
  }

  // ── Status Publishing (retained) ──────────────────────────────

  publishServerStatus(): void {
    const dbState = mongoose.connection.readyState;
    const payload = {
      status: dbState === 1 ? 'ok' : 'degraded',
      uptime: this.startTimestamp
        ? Math.floor((Date.now() - this.startTimestamp) / 1000)
        : 0,
      database: dbState === 1 ? 'connected' : 'disconnected',
      timestamp: Date.now(),
    };

    this.publishRetained(TOPICS.STATUS_SERVER, payload);
  }

  publishSimulationStatus(
    profileId: string,
    status: Record<string, unknown>
  ): void {
    this.publishRetained(TOPICS.STATUS_SIMULATION(profileId), {
      profileId,
      ...status,
      timestamp: Date.now(),
    });
  }

  publishSimulationIndex(profileIds: string[]): void {
    this.publishRetained(TOPICS.STATUS_SIMULATIONS_INDEX, {
      activeSimulations: profileIds,
      count: profileIds.length,
      timestamp: Date.now(),
    });
  }

  clearSimulationStatus(profileId: string): void {
    // Publishing an empty retained message clears the retained state
    if (!this.client || !this.connected) return;
    this.client.publish(
      TOPICS.STATUS_SIMULATION(profileId),
      '',
      { retain: true, qos: MQTT_BACKBONE_CONFIG.QOS_STATUS },
      (err) => {
        if (err) {
          console.error(
            `❌ Failed to clear simulation status for ${profileId}:`,
            err.message
          );
        }
      }
    );
  }

  // ── Log Publishing (non-retained) ────────────────────────────

  publishSimulationLog(
    profileId: string,
    log: Record<string, unknown>
  ): void {
    // Only forward warning and error level logs to MQTT to avoid flooding clients
    const level = (log && (log.level as string)) || 'info';
    if (level === 'info') return;

    const topic = TOPICS.LOGS_SIMULATION(profileId);
    this.publishEvent(topic, log);
  }

  // ── Event Publishing (non-retained) ───────────────────────────

  publishSimulationEvent(
    event: string,
    data: Record<string, unknown>
  ): void {
    this.publishEvent(TOPICS.EVENTS_SIMULATION, {
      event,
      ...data,
      timestamp: Date.now(),
    });
  }

  publishSystemEvent(event: string, data?: Record<string, unknown>): void {
    this.publishEvent(TOPICS.EVENTS_SYSTEM, {
      event,
      ...data,
      timestamp: Date.now(),
    });
  }

  // ── Command Publishing (UI-originated) ──────────────────────

  publishCommand(
    topic: string,
    profileId: string,
    userId?: string
  ): void {
    const correlationId = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.publishEvent(topic, {
      profileId,
      correlationId,
      origin: 'ui',
      userId,
      timestamp: Date.now(),
    });
  }

  // ── Command Response Publishing ──────────────────────────────

  publishCommandResponse(
    correlationId: string,
    response: Record<string, unknown>
  ): void {
    this.publishEvent(TOPICS.CMD_RESPONSE(correlationId), response);
  }

  // ── Internal Helpers ──────────────────────────────────────────

  private subscribeToCommands(): void {
    if (!this.client) return;

    this.client.subscribe(
      TOPICS.CMD_WILDCARD,
      { qos: MQTT_BACKBONE_CONFIG.QOS_STATUS },
      (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to commands:', err.message);
        }
      }
    );
  }

  private publishRetained(
    topic: string,
    payload: Record<string, unknown>
  ): void {
    if (!this.client || !this.connected) return;

    this.client.publish(
      topic,
      JSON.stringify(payload),
      { retain: true, qos: MQTT_BACKBONE_CONFIG.QOS_STATUS },
      (err) => {
        if (err) {
          console.error(`❌ Backbone publish error on ${topic}:`, err.message);
        }
      }
    );
  }

  private publishEvent(
    topic: string,
    payload: Record<string, unknown>
  ): void {
    if (!this.client || !this.connected) {
      console.warn(`⚠️ Cannot publish to ${topic}: client=${!!this.client}, connected=${this.connected}`);
      return;
    }

    this.client.publish(
      topic,
      JSON.stringify(payload),
      { retain: false, qos: MQTT_BACKBONE_CONFIG.QOS_EVENTS },
      (err) => {
        if (err) {
          console.error(`❌ Backbone event error on ${topic}:`, err.message);
        }
      }
    );
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Publish immediately, then on interval
    this.publishServerStatus();
    this.heartbeatInterval = setInterval(() => {
      this.publishServerStatus();
    }, MQTT_BACKBONE_CONFIG.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Export singleton
const mqttBackbone = new MqttBackboneService();
export default mqttBackbone;
