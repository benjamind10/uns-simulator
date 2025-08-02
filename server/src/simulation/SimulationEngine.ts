import { EventEmitter } from 'events';

import * as mqtt from 'mqtt';

import { ISimulationProfile } from '../graphql/models/SimulationProfile';
import { ISchema } from '../graphql/models/Schema';
import { IBroker } from '../graphql/models/Broker';

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
    // Get metric nodes from schema
    const metricNodes = this.schema.nodes.filter(
      (node) => node.kind === 'metric'
    );

    console.log(
      `🔧 Initializing ${metricNodes.length} metric nodes for simulation`
    );

    metricNodes.forEach((schemaNode) => {
      const nodeSettings = Array.isArray(this.profile.nodeSettings)
        ? this.profile.nodeSettings.find((ns) => ns.nodeId === schemaNode.id)
        : undefined;
      const globalSettings = this.profile.globalSettings;

      // Merge global defaults with node-specific settings
      const node: SimulationNode = {
        id: schemaNode.id,
        path: schemaNode.path,
        frequency:
          nodeSettings?.frequency ?? globalSettings.defaultUpdateFrequency,
        failRate: nodeSettings?.failRate ?? 0,
        payload: {
          ...nodeSettings?.payload,
        },
      };

      this.nodes.set(schemaNode.id, node);
      console.log(`  📋 Node: ${schemaNode.path} (${node.frequency}ms)`);
    });
  }

  private async connectToBroker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Construct MQTT URL - keep your ws/wss logic
        const protocol =
          typeof this.broker.ssl === 'boolean'
            ? this.broker.ssl
              ? 'wss'
              : 'ws'
            : 'ws';

        let brokerUrl = this.broker.url;
        // Remove protocol if it's included in the URL
        brokerUrl = brokerUrl.replace(/^wss?:\/\//, '');

        const url = `${protocol}://${brokerUrl}:${this.broker.port}`;

        // MQTT connection options with better settings
        const options: mqtt.IClientOptions = {
          clientId: `uns-sim-${this.profile.id
            .toString()
            .slice(-8)}-${Date.now()}`,
          clean: true,
          connectTimeout: 15000,
          reconnectPeriod: 0, // Disable auto-reconnect for manual control
          keepalive: 30,
          protocolVersion: 4, // Force MQTT v3.1.1
          reschedulePings: true,
        };

        // Add authentication if provided
        if (this.broker.username && this.broker.username.trim()) {
          options.username = this.broker.username;
          console.log(`🔐 Using username: ${this.broker.username}`);
        }
        if (this.broker.password && this.broker.password.trim()) {
          options.password = this.broker.password;
          console.log(`🔐 Using password authentication`);
        }

        console.log(`🔌 Connecting to MQTT broker: ${url}`);
        console.log(`🔧 Client ID: ${options.clientId}`);

        this.mqttClient = mqtt.connect(url, options);

        // Set up event handlers
        this.mqttClient.on('connect', (connack) => {
          console.log(`✅ Connected to MQTT broker: ${this.broker.name}`);
          console.log(`📋 Connection details:`, connack);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.mqttClient.on('error', (error) => {
          console.error(`❌ MQTT connection error:`, error);
          console.error(`🔍 Error details:`, {
            message: error.message,
            stack: error.stack,
            broker: this.broker.name,
            url: url,
          });

          // Clean up and reject
          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = undefined;
          }
          reject(new Error(`MQTT connection failed: ${error.message}`));
        });

        this.mqttClient.on('close', () => {
          console.log(`🔌 MQTT connection closed`);
          console.log(`📊 Current simulation state:`, {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            profileId: this.profile.id,
            profileName: this.profile.name,
            activeNodes: Array.from(this.nodes.keys()).length,
            publishingNodes: Array.from(this.nodes.values()).filter(
              (n) => n.intervalId
            ).length,
          });

          // Only try to handle disconnections if we're running
          if (
            this.isRunning &&
            !this.isPaused &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            console.log(`⚠️ Unexpected MQTT disconnection during simulation`);
            console.log(`🔄 Will attempt reconnection...`);
            this.handleDisconnection();
          } else {
            console.log(`📝 Not handling disconnection because:`);
            if (!this.isRunning) {
              console.log(
                `   - Simulation is not running (isRunning: ${this.isRunning})`
              );
            }
            if (this.isPaused) {
              console.log(
                `   - Simulation is paused (isPaused: ${this.isPaused})`
              );
            }
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              console.log(
                `   - Max reconnect attempts reached (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
              );
            }
          }
        });

        this.mqttClient.on('offline', () => {
          console.log(`📶 MQTT client is offline`);
          console.log(`📊 Client state when going offline:`, {
            connected: this.mqttClient?.connected,
            reconnecting: this.mqttClient?.reconnecting,
            clientId: this.mqttClient?.options?.clientId,
          });
        });

        this.mqttClient.on('disconnect', (packet) => {
          console.log(`🔌 MQTT client disconnected:`, packet);
          console.log(`📊 Disconnect packet details:`, {
            reasonCode: packet?.reasonCode,
            properties: packet?.properties,
            timestamp: new Date().toISOString(),
          });
        });

        // Add a timeout to prevent hanging
        const connectionTimeout = setTimeout(() => {
          console.error(`❌ Connection timeout after 15 seconds`);
          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = undefined;
          }
          reject(new Error('MQTT connection timeout'));
        }, 15000);

        // Clear timeout on successful connection
        this.mqttClient.once('connect', () => {
          clearTimeout(connectionTimeout);
        });
      } catch (error) {
        console.error(`❌ Failed to create MQTT connection:`, error);
        reject(error);
      }
    });
  }

  private handleDisconnection() {
    this.reconnectAttempts++;

    console.log(
      `🔄 Handling disconnection (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    console.log(`📊 Disconnection context:`, {
      profileId: this.profile.id,
      profileName: this.profile.name,
      brokerName: this.broker.name,
      brokerUrl: this.broker.url,
      brokerPort: this.broker.port,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      startTime: this.startTime,
      activeNodes: Array.from(this.nodes.keys()).length,
      publishingNodes: Array.from(this.nodes.values()).filter(
        (n) => n.intervalId
      ).length,
      reconnectAttempts: this.reconnectAttempts,
      timestamp: new Date().toISOString(),
    });

    // Pause publishing immediately - UNCOMMENT THIS!
    console.log(`⏸️ Pausing all node publishing due to disconnection`);
    this.pausePublishing();

    // Calculate backoff delay
    const backoffDelay = 2000 * this.reconnectAttempts; // Exponential backoff
    console.log(`⏳ Will attempt reconnection in ${backoffDelay}ms`);

    // Try to reconnect after a delay
    this.reconnectTimeout = setTimeout(async () => {
      console.log(
        `🔄 Starting reconnection attempt ${this.reconnectAttempts}...`
      );
      console.log(`⏳ Reconnecting to MQTT broker...`);

      try {
        await this.connectToBroker();
        console.log(`✅ Reconnected to MQTT broker successfully`);
        console.log(`📊 Reconnection successful:`, {
          attempts: this.reconnectAttempts,
          totalDowntime: Date.now() - (this.startTime?.getTime() || Date.now()),
          clientConnected: this.mqttClient?.connected,
          timestamp: new Date().toISOString(),
        });

        // Resume publishing if still running - UNCOMMENT THIS!
        if (this.isRunning && !this.isPaused) {
          console.log(`▶️ Resuming publishing after successful reconnection`);
          this.resumePublishing();
        } else {
          console.log(`⚠️ Not resuming publishing:`, {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
          });
        }
      } catch (error) {
        console.error(
          `❌ Reconnection attempt ${this.reconnectAttempts} failed:`,
          error
        );
        console.error(`🔍 Reconnection error details:`, {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          attempts: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
          timestamp: new Date().toISOString(),
        });

        // If max attempts reached, stop the simulation
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error(
            `❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached. Stopping simulation.`
          );
          console.error(`📊 Final simulation state:`, {
            profileId: this.profile.id,
            profileName: this.profile.name,
            totalAttempts: this.reconnectAttempts,
            startTime: this.startTime,
            failureTime: new Date().toISOString(),
            totalRuntime: this.startTime
              ? Date.now() - this.startTime.getTime()
              : 0,
          });
          this.stop();
        } else {
          console.log(
            `🔄 Will retry reconnection (${this.reconnectAttempts + 1}/${
              this.maxReconnectAttempts
            })`
          );
          // The method will be called again from the close event
        }
      }
    }, backoffDelay);
  }

  async start() {
    if (this.isRunning) return;

    try {
      // Connect to broker first
      await this.connectToBroker();

      this.isRunning = true;
      this.startTime = new Date();

      // Apply start delay if configured
      if (
        this.profile.globalSettings?.startDelay &&
        this.profile.globalSettings.startDelay > 0
      ) {
        await this.delay(this.profile.globalSettings.startDelay * 1000);
      }

      // Start publishing for each node
      this.nodes.forEach((node) => {
        this.startNodePublishing(node);
      });

      // Set simulation length timer if configured
      if (
        this.profile.globalSettings &&
        typeof this.profile.globalSettings.simulationLength === 'number' &&
        this.profile.globalSettings.simulationLength > 0
      ) {
        setTimeout(() => {
          this.stop();
        }, this.profile.globalSettings.simulationLength * 1000);
      }

      this.emit('started', { profileId: this.profile.id });
    } catch (error) {
      this.isRunning = false;
      this.emit('error', {
        profileId: this.profile.id,
        error: `Failed to start simulation: ${error}`,
      });
      throw error;
    }
  }

  private startNodePublishing(node: SimulationNode) {
    // Calculate actual interval based on timeScale
    const actualInterval =
      node.frequency / this.profile.globalSettings.timeScale;

    node.intervalId = setInterval(() => {
      this.publishNodeData(node);
    }, actualInterval);
  }

  private async publishNodeData(node: SimulationNode) {
    // Check if this publication should fail based on failRate
    if (Math.random() < node.failRate) {
      this.emit('nodeFailure', {
        nodeId: node.id,
        timestamp: Date.now(),
        quality: 'good', // Hardcoded quality value
      });
      return;
    }

    // Generate payload with current timestamp
    const payload = {
      ...node.payload,
      timestamp: Date.now(),
      quality: 'good', // Hardcoded quality value
      value: this.generateNodeValue(node),
    };

    // Construct topic path - fix the publishRoot logic
    let topic: string;
    const publishRoot = this.profile.globalSettings?.publishRoot?.trim();

    if (publishRoot && publishRoot.length > 0) {
      // Remove trailing slash from publishRoot and leading slash from node.path
      const cleanRoot = publishRoot.replace(/\/$/, '');
      const cleanPath = node.path.replace(/^\//, '');
      topic = `${cleanRoot}/${cleanPath}`;
    } else {
      // If no publishRoot, use the node path directly
      topic = node.path;
    }

    try {
      // Publish to broker
      await this.publishToBroker(topic, payload);

      this.emit('nodePublished', {
        nodeId: node.id,
        topic,
        payload,
        timestamp: Date.now(),
      });

      console.log(`📤 Published: ${topic} -> ${JSON.stringify(payload)}`);
    } catch (error) {
      this.emit('publishError', {
        nodeId: node.id,
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
        timestamp: Date.now(),
      });

      console.error(`🚨 Publish error for ${node.id}: ${error}`);
    }
  }

  private generateNodeValue(node: SimulationNode): any {
    // Implement your value generation logic here
    // This could be random values, sine waves, step functions, etc.

    if (typeof node.payload?.value === 'number') {
      // Generate a random number around the base value
      const baseValue = node.payload.value || 0;
      return baseValue + (Math.random() - 0.5) * 10;
    }

    // If no value specified, generate a random number
    if (!node.payload?.value) {
      return Math.round(Math.random() * 100);
    }

    return node.payload.value;
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

      // Convert payload to JSON string
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

    this.isRunning = false;

    // Clear all intervals
    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
      }
    });

    // Disconnect MQTT client
    if (this.mqttClient) {
      this.mqttClient.end(true);
      this.mqttClient = undefined;
    }

    this.emit('stopped', { profileId: this.profile.id });
  }

  pause() {
    if (!this.isRunning) return;

    // Clear intervals but don't set isRunning to false
    this.nodes.forEach((node) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
      }
    });

    this.isPaused = true;
    this.emit('paused', { profileId: this.profile.id });
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;

    // Restart intervals for all nodes
    this.nodes.forEach((node) => {
      this.startNodePublishing(node);
    });

    this.isPaused = false;
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
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private pausePublishing() {
    console.log(`⏸️ Pausing publishing for ${this.nodes.size} nodes`);

    let pausedCount = 0;
    this.nodes.forEach((node, nodeId) => {
      if (node.intervalId) {
        clearInterval(node.intervalId);
        node.intervalId = undefined;
        pausedCount++;
        console.log(`   📋 Paused: ${node.path}`);
      }
    });

    console.log(`✅ Paused publishing for ${pausedCount} active nodes`);
  }

  private resumePublishing() {
    console.log(`▶️ Resuming publishing for ${this.nodes.size} nodes`);

    // Clear any pending reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
      console.log(`🔄 Cleared reconnection timeout`);
    }

    // Restart publishing if we're still running and not manually paused
    if (this.isRunning && !this.isPaused) {
      let resumedCount = 0;
      this.nodes.forEach((node) => {
        console.log(
          `   📋 Resuming: ${node.path} (${node.frequency}ms interval)`
        );
        this.startNodePublishing(node);
        resumedCount++;
      });
      console.log(`✅ Resumed publishing for ${resumedCount} nodes`);
    } else {
      console.log(`⚠️ Not resuming publishing:`, {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
      });
    }
  }
}
