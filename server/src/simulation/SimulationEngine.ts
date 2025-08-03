import { EventEmitter } from 'events';

import * as mqtt from 'mqtt';

import { ISimulationProfile } from '../graphql/models/SimulationProfile';
import { ISchema } from '../graphql/models/Schema';
import { IBroker } from '../graphql/models/Broker';
import SimulationProfile from '../graphql/models/SimulationProfile';

export interface SimulationNode {
  id: string;
  path: string;
  frequency: number;
  failRate: number;
  payload: Record<string, any>;
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
  private mqttClient?: mqtt.MqttClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout?: NodeJS.Timeout;

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
      console.log(
        `[Node ${schemaNode.id}] nodeSettings.frequency:`,
        nodeSettings?.frequency,
        '| resolved frequency:',
        frequency,
        '| global default:',
        globalSettings.defaultUpdateFrequency
      );

      const node: SimulationNode = {
        id: schemaNode.id,
        path: schemaNode.path,
        frequency,
        failRate: nodeSettings?.failRate ?? 0,
        payload: {
          ...nodeSettings?.payload,
        },
      };

      this.nodes.set(schemaNode.id, node);
    });
  }

  private async connectToBroker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol =
          typeof this.broker.ssl === 'boolean'
            ? this.broker.ssl
              ? 'wss'
              : 'ws'
            : 'ws';

        let brokerUrl = this.broker.url;
        brokerUrl = brokerUrl.replace(/^wss?:\/\//, '');
        const url = `${protocol}://${brokerUrl}:${this.broker.port}`;

        const options: mqtt.IClientOptions = {
          clientId: `uns-sim-${this.profile.id
            .toString()
            .slice(-8)}-${Date.now()}`,
          clean: true,
          connectTimeout: 15000,
          reconnectPeriod: 0,
          keepalive: 30,
          protocolVersion: 4,
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

        this.mqttClient.on('connect', () => {
          console.log(`✅ Connected to MQTT broker: ${this.broker.name}`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.mqttClient.on('error', (error) => {
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
          console.error(`❌ Connection timeout to ${this.broker.name}`);
          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = undefined;
          }
          reject(new Error('MQTT connection timeout'));
        }, 15000);

        this.mqttClient.once('connect', () => {
          clearTimeout(connectionTimeout);
        });
      } catch (error) {
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

    const backoffDelay = 2000 * this.reconnectAttempts;
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
          this.stop();
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

      // Update status to running
      await this.updateProfileStatus({
        state: 'running',
        isRunning: true,
        isPaused: false,
        startTime: this.startTime,
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
        setTimeout(() => {
          console.log(`⏰ Simulation time limit reached, stopping...`);
          this.stop();
        }, this.profile.globalSettings.simulationLength * 1000);
      }

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

      console.error(`❌ Failed to start simulation: ${error}`);
      this.emit('error', {
        profileId: this.profile.id,
        error: `Failed to start simulation: ${error}`,
      });
      throw error;
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

    const payload = {
      ...node.payload,
      timestamp: Date.now(),
      quality: 'good',
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

      this.emit('nodePublished', {
        nodeId: node.id,
        topic,
        payload,
        timestamp: Date.now(),
      });

      // Only log occasionally to avoid spam
      if (Math.random() < 0.1) {
        // 10% chance to log
        console.log(
          `📤 Publishing to ${this.nodes.size} topics (sample: ${topic})`
        );
      }
    } catch (error) {
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
    // Try to get the dataType from the schema node definition
    const schemaNode = this.schema.nodes.find((n) => n.id === node.id);
    const dataType = schemaNode?.dataType ?? 'Float';

    let value;
    if (typeof node.payload?.value === 'number') {
      const baseValue = node.payload.value;
      if (dataType === 'Int') {
        // Integer between 1 and 100
        value = Math.max(
          1,
          Math.min(100, Math.round(baseValue + (Math.random() - 0.5) * 10))
        );
      } else if (dataType === 'Float') {
        // Float between 0 and 1.0
        value = Math.max(
          0,
          Math.min(
            1,
            Math.round((baseValue + (Math.random() - 0.5) * 0.2) * 100) / 100
          )
        );
      } else {
        value = baseValue;
      }
    } else if (!node.payload?.value) {
      if (dataType === 'Int') {
        // Integer between 1 and 100
        value = Math.floor(Math.random() * 100) + 1;
      } else if (dataType === 'Float') {
        // Float between 0 and 1.0
        value = Math.round(Math.random() * 100) / 100;
      } else {
        value = 0;
      }
    } else {
      value = node.payload.value;
    }
    return value;
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

  stop() {
    if (!this.isRunning) return;

    this.updateProfileStatus({ state: 'stopping' });

    this.isRunning = false;
    this.isPaused = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
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

    // Update final stopped status
    this.updateProfileStatus({
      state: 'stopped',
      isRunning: false,
      isPaused: false,
      mqttConnected: false,
    });

    console.log(`🛑 Simulation stopped: ${this.profile.name}`);
    this.emit('stopped', { profileId: this.profile.id });
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
      }
    });

    this.isPaused = true;

    this.updateProfileStatus({
      state: 'paused',
      isPaused: true,
    });

    console.log(`⏸️ Simulation paused: ${this.profile.name}`);
    this.emit('paused', { profileId: this.profile.id });
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.nodes.forEach((node) => {
      this.startNodePublishing(node);
    });

    this.isPaused = false;

    this.updateProfileStatus({
      state: 'running',
      isPaused: false,
    });

    console.log(`▶️ Simulation resumed: ${this.profile.name}`);
    this.emit('resumed', { profileId: this.profile.id });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      startTime: this.startTime,
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
