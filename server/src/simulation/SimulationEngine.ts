import { EventEmitter } from 'events';

import * as mqtt from 'mqtt';

import { ISimulationProfile } from '../graphql/models/SimulationProfile';
import { ISchema } from '../graphql/models/Schema';
import { IBroker } from '../graphql/models/Broker';
import SimulationProfile from '../graphql/models/SimulationProfile';
import { MQTT_CONFIG } from '../config/constants';
import {
  simulationStartsTotal,
  simulationStopsTotal,
  mqttMessagesPublishedTotal,
  mqttPublishErrorsTotal,
} from '../metrics';

export interface SimulationNode {
  id: string;
  path: string;
  frequency: number;
  failRate: number;
  payload: Record<string, any> & {
    _currentValue?: number; // internal state for increment mode
  };
  intervalId?: NodeJS.Timeout;
}

export class SimulationEngine extends EventEmitter {
  private profile: ISimulationProfile;
  private schema: ISchema;
  private broker: IBroker;
  private nodes: Map<string, SimulationNode> = new Map();
  private isRunning = false;
  private isPaused = false;
  private startTime?: Date;
  private lastActivity?: Date;
  private mqttClient?: mqtt.MqttClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = MQTT_CONFIG.MAX_RECONNECT_ATTEMPTS;
  private reconnectTimeout?: NodeJS.Timeout;
  private simulationLengthTimeout?: NodeJS.Timeout;

  constructor(profile: ISimulationProfile, schema: ISchema, broker: IBroker) {
    super();
    this.profile = profile;
    this.schema = schema;
    this.broker = broker;
    this.initializeNodes();
  }

  private initializeNodes() {
    const metricNodes = this.schema.nodes.filter(
      (node) => node.kind === 'metric'
    );

    console.log(
      `🔧 Initializing ${metricNodes.length} nodes for simulation: ${this.profile.name}`
    );

    metricNodes.forEach((schemaNode) => {
      let nodeSettings;
      if (this.profile.nodeSettings instanceof Map) {
        nodeSettings = this.profile.nodeSettings.get(schemaNode.id);
      } else if (Array.isArray(this.profile.nodeSettings)) {
        nodeSettings = this.profile.nodeSettings.find(
          (ns) => String(ns.nodeId) === String(schemaNode.id)
        );
      } else {
        nodeSettings = undefined;
      }

      const globalSettings = this.profile.globalSettings;

      // Use nodeSettings.frequency only if it's a valid number > 0
      let frequency = globalSettings.defaultUpdateFrequency;
      if (
        nodeSettings &&
        typeof nodeSettings.frequency === 'number' &&
        nodeSettings.frequency > 0
      ) {
        frequency = nodeSettings.frequency;
      }

      // Log for debugging
      // console.log(
      //   `[Node ${schemaNode.id}] nodeSettings.frequency:`,
      //   nodeSettings?.frequency,
      //   '| resolved frequency:',
      //   frequency,
      //   '| global default:',
      //   globalSettings.defaultUpdateFrequency
      // );

      // Merge payloads with priority: per-node > global defaults > hardcoded defaults
      const globalDefaults = this.profile.globalSettings?.defaultPayload || {};
      const nodePayloadConfig = nodeSettings?.payload || {};

      const node: SimulationNode = {
        id: schemaNode.id,
        path: schemaNode.path,
        frequency,
        failRate: nodeSettings?.failRate ?? 0,
        payload: {
          ...globalDefaults,    // global defaults first
          ...nodePayloadConfig, // per-node overrides win
        },
      };

      this.nodes.set(schemaNode.id, node);
    });
  }

  private async connectToBroker(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Guard flag to prevent double settlement of promise
      let settled = false;

      try {
        const useSsl =
          typeof this.broker.ssl === 'boolean' ? this.broker.ssl : false;

        // Strip any existing protocol prefix from the URL
        let brokerHost = this.broker.url
          .replace(/^(wss?|mqtts?):\/\//, '')
          .replace(/\/+$/, '');
        let brokerPort = this.broker.port;

        // In Docker, localhost/127.0.0.1 won't reach the MQTT broker.
        // Use MQTT_HOST and MQTT_PORT env vars to override when set.
        const mqttHostOverride = process.env.MQTT_HOST;
        const mqttPortOverride = process.env.MQTT_PORT;

        if (
          mqttHostOverride &&
          (brokerHost === 'localhost' || brokerHost === '127.0.0.1')
        ) {
          brokerHost = mqttHostOverride;
          if (mqttPortOverride) {
            brokerPort = parseInt(mqttPortOverride, 10);
          }
        }

        // Use mqtt:// for TCP connections (server-side)
        const protocol = useSsl ? 'mqtts' : 'mqtt';
        const url = `${protocol}://${brokerHost}:${brokerPort}`;

        const options: mqtt.IClientOptions = {
          clientId: `uns-sim-${this.profile.id
            .toString()
            .slice(-8)}-${Date.now()}`,
          clean: true,
          connectTimeout: MQTT_CONFIG.CONNECT_TIMEOUT,
          reconnectPeriod: MQTT_CONFIG.RECONNECT_PERIOD,
          keepalive: MQTT_CONFIG.KEEPALIVE,
          protocolVersion: MQTT_CONFIG.PROTOCOL_VERSION,
          reschedulePings: true,
        };

        if (this.broker.username?.trim()) {
          options.username = this.broker.username;
        }
        if (this.broker.password?.trim()) {
          options.password = this.broker.password;
        }

        console.log(`🔌 Connecting to ${this.broker.name} (${url})`);

        this.mqttClient = mqtt.connect(url, options);

        // Remove all existing listeners to prevent accumulation and memory leaks
        this.mqttClient.removeAllListeners();

        this.mqttClient.on('connect', () => {
          if (settled) return; // Prevent double settlement
          settled = true;
          clearTimeout(connectionTimeout);
          console.log(`✅ Connected to MQTT broker: ${this.broker.name}`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.mqttClient.on('error', (error) => {
          if (settled) return; // Prevent double settlement
          settled = true;
          clearTimeout(connectionTimeout);
          console.error(`❌ MQTT connection error: ${error.message}`);
          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = undefined;
          }
          reject(new Error(`MQTT connection failed: ${error.message}`));
        });

        this.mqttClient.on('close', () => {
          if (
            this.isRunning &&
            !this.isPaused &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            console.log(`⚠️ MQTT disconnected, attempting reconnection...`);
            this.handleDisconnection();
          }
        });

        const connectionTimeout = setTimeout(() => {
          if (settled) return; // Prevent double settlement
          settled = true;
          console.error(`❌ Connection timeout to ${this.broker.name}`);
          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = undefined;
          }
          reject(new Error('MQTT connection timeout'));
        }, MQTT_CONFIG.CONNECT_TIMEOUT);
      } catch (error) {
        if (settled) return; // Prevent double settlement
        settled = true;
        console.error(`❌ Failed to create MQTT connection:`, error);
        reject(error);
      }
    });
  }

  private async updateProfileStatus(updates: Partial<any>) {
    try {
      await SimulationProfile.findByIdAndUpdate(
        this.profile.id,
        {
          $set: {
            'status.lastActivity': new Date(),
            ...Object.fromEntries(
              Object.entries(updates).map(([key, value]) => [
                `status.${key}`,
                value,
              ])
            ),
          },
        },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to update profile status:', error);
    }
  }

  private handleDisconnection() {
    this.reconnectAttempts++;
    console.log(
      `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    // Update MQTT connection status
    this.updateProfileStatus({
      mqttConnected: false,
      reconnectAttempts: this.reconnectAttempts,
    });

    this.pausePublishing();

    const backoffDelay =
      MQTT_CONFIG.RECONNECT_BACKOFF_BASE * this.reconnectAttempts;
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connectToBroker();
        console.log(`✅ Reconnected to ${this.broker.name}`);

        // Update successful reconnection
        await this.updateProfileStatus({
          mqttConnected: true,
          reconnectAttempts: 0,
        });

        if (this.isRunning && !this.isPaused) {
          this.resumePublishing();
        }
      } catch (error) {
        console.error(`❌ Reconnection failed: ${error}`);

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `❌ Max reconnect attempts reached. Stopping simulation.`
          );
          await this.updateProfileStatus({
            state: 'error',
            error: 'Max reconnection attempts reached',
          });
          // Use await to ensure proper cleanup
          await this.stop();
        }
      }
    }, backoffDelay);
  }

  async start() {
    if (this.isRunning) return;

    try {
      // Update status to starting
      await this.updateProfileStatus({
        state: 'starting',
        error: null,
      });

      await this.connectToBroker();

      this.isRunning = true;
      this.startTime = new Date();
      this.lastActivity = new Date(); // Initialize lastActivity

      // Update status to running
      await this.updateProfileStatus({
        state: 'running',
        isRunning: true,
        isPaused: false,
        startTime: this.startTime,
        lastActivity: this.lastActivity,
        nodeCount: this.nodes.size,
        mqttConnected: this.mqttClient?.connected || false,
        reconnectAttempts: 0,
      });

      if (
        this.profile.globalSettings?.startDelay &&
        this.profile.globalSettings.startDelay > 0
      ) {
        await this.delay(this.profile.globalSettings.startDelay * 1000);
      }

      this.nodes.forEach((node) => {
        this.startNodePublishing(node);
      });

      if (
        this.profile.globalSettings &&
        typeof this.profile.globalSettings.simulationLength === 'number' &&
        this.profile.globalSettings.simulationLength > 0
      ) {
        this.simulationLengthTimeout = setTimeout(() => {
          console.log(`⏰ Simulation time limit reached, stopping...`);
          this.stop();
        }, this.profile.globalSettings.simulationLength * 1000);
      }

      simulationStartsTotal.inc();
      console.log(
        `🚀 Simulation started: ${this.profile.name} (${this.nodes.size} nodes)`
      );
      this.emit('started', { profileId: this.profile.id });
    } catch (error) {
      this.isRunning = false;
      await this.updateProfileStatus({
        state: 'error',
        isRunning: false,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to start simulation: ${errorMessage}`);
      this.emit('startError', {
        profileId: this.profile.id,
        error: `Failed to start simulation: ${errorMessage}`,
      });
      throw new Error(`Failed to start simulation: ${errorMessage}`);
    }
  }

  private startNodePublishing(node: SimulationNode) {
    const actualInterval =
      node.frequency / this.profile.globalSettings.timeScale;

    node.intervalId = setInterval(() => {
      this.publishNodeData(node);
    }, actualInterval);
  }

  private async publishNodeData(node: SimulationNode) {
    if (Math.random() < node.failRate) {
      this.emit('nodeFailure', {
        nodeId: node.id,
        timestamp: Date.now(),
        quality: 'good',
      });
      return;
    }

    const payloadConfig = node.payload || {};

    // Build custom fields object
    const customFieldsObj: Record<string, any> = {};
    if (payloadConfig.customFields?.length) {
      for (const field of payloadConfig.customFields) {
        // Parse JSON strings to proper objects
        let value = field.value;
        if (typeof value === 'string') {
          try {
            // Try to parse as JSON if it looks like JSON
            if (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false' || value === 'null' || !isNaN(Number(value))) {
              value = JSON.parse(value);
            }
          } catch {
            // If parsing fails, keep as string
            value = field.value;
          }
        }
        customFieldsObj[field.key] = value;
      }
    }

    const payload = {
      ...customFieldsObj,
      quality: payloadConfig.quality || 'good',
      timestamp: payloadConfig.timestampMode === 'fixed'
        ? (payloadConfig.fixedTimestamp ?? Date.now())
        : Date.now(),
      value: this.generateNodeValue(node),
    };

    let topic: string;
    const publishRoot = this.profile.globalSettings?.publishRoot?.trim();

    if (publishRoot && publishRoot.length > 0) {
      const cleanRoot = publishRoot.replace(/\/$/, '');
      const cleanPath = node.path.replace(/^\//, '');
      topic = `${cleanRoot}/${cleanPath}`;
    } else {
      topic = node.path;
    }

    try {
      await this.publishToBroker(topic, payload);

      // Update last activity timestamp
      this.lastActivity = new Date();

      mqttMessagesPublishedTotal.inc();
      this.emit('nodePublished', {
        nodeId: node.id,
        topic,
        payload,
        timestamp: Date.now(),
      });

      // Only log occasionally to avoid spam
      // if (Math.random() < 0.1) {
      //   // 10% chance to log
      //   console.log(
      //     `📤 Publishing to ${this.nodes.size} topics (sample: ${topic})`
      //   );
      // }
    } catch (error) {
      mqttPublishErrorsTotal.inc();
      console.error(`🚨 Publish error for ${node.path}: ${error}`);
      this.emit('publishError', {
        nodeId: node.id,
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
        timestamp: Date.now(),
      });
    }
  }

  private generateNodeValue(node: SimulationNode): any {
    const schemaNode = this.schema.nodes.find((n) => n.id === node.id);
    const dataType = schemaNode?.dataType ?? 'Float';
    const config = node.payload || {};
    const mode = config.valueMode || 'random';

    // --- STATIC MODE ---
    if (mode === 'static') {
      return config.value ?? 0;
    }

    // --- INCREMENT MODE ---
    if (mode === 'increment') {
      const step = config.step ?? 1;
      const current = typeof node.payload?._currentValue === 'number'
        ? node.payload._currentValue
        : (typeof config.value === 'number' ? config.value : 0);
      let next = current + step;
      if (config.maxValue !== undefined && next > config.maxValue) {
        next = typeof config.value === 'number' ? config.value : (config.minValue ?? 0);
      }
      node.payload._currentValue = next; // track state between ticks
      return dataType === 'Int' ? Math.round(next) : this.applyPrecision(next, config.precision);
    }

    // --- RANDOM MODE (default) ---
    if (dataType === 'Bool' || dataType === 'Boolean') {
      return Math.random() > 0.5;
    }
    if (dataType === 'String') {
      return typeof config.value === 'string' ? config.value : '';
    }

    const min = config.minValue ?? (dataType === 'Int' ? 1 : 0);
    const max = config.maxValue ?? (dataType === 'Int' ? 100 : 1.0);
    const raw = Math.random() * (max - min) + min;

    if (dataType === 'Int') {
      return Math.round(raw);
    }
    return this.applyPrecision(raw, config.precision);
  }

  private applyPrecision(value: number, precision?: number): number {
    if (precision === undefined || precision < 0) return Math.round(value * 100) / 100;
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  private async publishToBroker(topic: string, payload: any) {
    if (!this.mqttClient || !this.mqttClient.connected) {
      throw new Error('MQTT client is not connected');
    }
    await this.publishToMQTT(topic, payload);
  }

  private async publishToMQTT(topic: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient || !this.mqttClient.connected) {
        reject(new Error('MQTT client is not connected'));
        return;
      }

      const message = JSON.stringify(payload);

      this.mqttClient.publish(topic, message, { qos: 0 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async stop() {
    if (!this.isRunning) return;

    await this.updateProfileStatus({ state: 'stopping' });

    this.isRunning = false;
    this.isPaused = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.simulationLengthTimeout) {
      clearTimeout(this.simulationLengthTimeout);
      this.simulationLengthTimeout = undefined;
    }

    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
      }
    });

    if (this.mqttClient) {
      this.mqttClient.end(true);
      this.mqttClient = undefined;
    }

    // Await final stopped status
    await this.updateProfileStatus({
      state: 'stopped',
      isRunning: false,
      isPaused: false,
      mqttConnected: false,
    });

    simulationStopsTotal.inc();
    console.log(`🛑 Simulation stopped: ${this.profile.name}`);
    this.emit('stopped', { profileId: this.profile.id });
  }

  async pause() {
    if (!this.isRunning || this.isPaused) return;

    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
      }
    });

    this.isPaused = true;

    await this.updateProfileStatus({
      state: 'paused',
      isPaused: true,
    });

    console.log(`⏸️ Simulation paused: ${this.profile.name}`);
    this.emit('paused', { profileId: this.profile.id });
  }

  async resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.nodes.forEach((node) => {
      this.startNodePublishing(node);
    });

    this.isPaused = false;

    await this.updateProfileStatus({
      state: 'running',
      isPaused: false,
    });

    console.log(`▶️ Simulation resumed: ${this.profile.name}`);
    this.emit('resumed', { profileId: this.profile.id });
  }

  getStatus() {
    let state: 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error' = 'idle';
    if (this.isRunning && this.isPaused) {
      state = 'paused';
    } else if (this.isRunning) {
      state = 'running';
    } else if (this.startTime) {
      state = 'stopped';
    }

    return {
      state,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      nodeCount: this.nodes.size,
      profile: this.profile.name,
      mqttConnected: this.mqttClient?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private pausePublishing() {
    let pausedCount = 0;
    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
        pausedCount++;
      }
    });
    console.log(`⏸️ Paused ${pausedCount} publishing nodes`);
  }

  private resumePublishing() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.isRunning && !this.isPaused) {
      this.nodes.forEach((node) => {
        this.startNodePublishing(node);
      });
      console.log(`▶️ Resumed ${this.nodes.size} publishing nodes`);
    }
  }
}
