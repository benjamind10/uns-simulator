import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';
import mqttBackbone from '../../mqtt/MqttBackboneService';
import { TOPICS } from '../../mqtt/topics';
import simulationManager from '../../simulation/SimulationManager';
import Broker from '../models/Broker';
import SchemaModel from '../models/Schema';

interface Context {
  user?: { _id: string };
}

interface NodeSettingsInput {
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    timestampMode?: string;
    fixedTimestamp?: number;
    value?: any;
    valueMode?: string;
    minValue?: number;
    maxValue?: number;
    step?: number;
    precision?: number;
    customFields?: Array<{
      key: string;
      value: any;
      type: string;
    }>;
  };
}

const requireAuth = (ctx: Context) => {
  if (!ctx.user) throw new Error('Unauthenticated');
};

export const simulationProfileResolvers = {
  Query: {
    simulationProfiles: async (_: {}, __: {}, ctx: Context) => {
      requireAuth(ctx);
      return SimulationProfile.find({ userId: ctx.user!._id }).exec();
    },
    simulationProfile: async (_: {}, { id }: { id: string }, ctx: Context) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: id,
        userId: ctx.user!._id,
      }).exec();
      if (!profile) throw new Error('Profile not found');
      return profile;
    },
    simulationStatus: async (
      _: {},
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      
      // Check if simulation is running in memory (most up-to-date status)
      const memoryStatus = simulationManager.getSimulationStatus(profileId);
      console.log('🔍 simulationStatus resolver - memoryStatus:', JSON.stringify(memoryStatus, null, 2));
      if (memoryStatus) {
        console.log('✅ Returning memory status');
        return memoryStatus;
      }
      
      // Fall back to database status
      console.log('📊 Falling back to database status');
      if (!profile.status) {
        // Provide default values if status is missing
        console.log('⚠️ No status in DB, returning default');
        return {
          state: 'idle',
          isRunning: false,
          isPaused: false,
          startTime: null,
          lastActivity: null,
          nodeCount: 0,
          mqttConnected: false,
          reconnectAttempts: 0,
          error: null,
        };
      }
      console.log('📊 Returning DB status:', JSON.stringify(profile.status, null, 2));
      return profile.status;
    },
    simulationLogs: async (
      _: {},
      {
        profileId,
        since,
        limit,
      }: { profileId: string; since?: number; limit?: number },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');

      let logs = simulationManager.getSimulationLogs(
        profileId,
        since ?? undefined
      );
      if (limit && limit > 0) {
        logs = logs.slice(-limit);
      }
      return logs;
    },
  },

  Mutation: {
    createSimulationProfile: async (
      _: {},
      { input }: { input: Omit<ISimulationProfile, 'userId'> },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const doc = await SimulationProfile.create({
        ...input,
        userId: ctx.user!._id,
      });
      return doc;
    },

    updateSimulationProfile: async (
      _: {},
      { id, input }: { id: string; input: Partial<ISimulationProfile> },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const updated = await SimulationProfile.findOneAndUpdate(
        { _id: id, userId: ctx.user!._id },
        { $set: input },
        { new: true }
      ).exec();
      if (!updated) throw new Error('Profile not found');
      return updated;
    },

    deleteSimulationProfile: async (
      _: {},
      { id }: { id: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      await SimulationProfile.deleteOne({ _id: id, userId: ctx.user!._id });
      return true;
    },

    upsertNodeSettings: async (
      _: {},
      {
        profileId,
        nodeId,
        settings,
      }: {
        profileId: string;
        nodeId: string;
        settings: NodeSettingsInput;
      },
      ctx: Context
    ) => {
      requireAuth(ctx);
      console.log('🔧 upsertNodeSettings input:', JSON.stringify(settings, null, 2));
      await SimulationProfile.findOneAndUpdate(
        { _id: profileId, userId: ctx.user!._id }, // <-- add userId here
        { $set: { [`nodeSettings.${nodeId}`]: settings } },
        { new: true }
      );
      const updatedProfile = await SimulationProfile.findById(profileId);
      if (!updatedProfile || !updatedProfile.nodeSettings) {
        throw new Error('Node settings not found');
      }
      // Mongoose Map — use .get() for proper access
      let nodeSetting: any;
      if (updatedProfile.nodeSettings instanceof Map) {
        nodeSetting = updatedProfile.nodeSettings.get(nodeId);
      } else {
        nodeSetting = (updatedProfile.nodeSettings as any)[nodeId];
      }
      if (!nodeSetting) {
        throw new Error('Node settings not found after save');
      }
      console.log('🔧 upsertNodeSettings saved:', JSON.stringify(nodeSetting, null, 2));
      return {
        nodeId,
        frequency: nodeSetting.frequency ?? null,
        failRate: nodeSetting.failRate ?? null,
        payload: nodeSetting.payload ?? null,
      };
    },

    deleteNodeSettings: async (
      _: {},
      { profileId, nodeId }: { profileId: string; nodeId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      if (profile.nodeSettings) {
        if (profile.nodeSettings instanceof Map) {
          profile.nodeSettings.delete(nodeId);
        } else {
          delete (profile.nodeSettings as any)[nodeId];
        }
        await profile.save();
      }
      return true;
    },

    cleanupDefaultNodeSettings: async (
      _: {},
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');

      if (!profile.nodeSettings) return 0;

      // Helper to check if payload has meaningful non-default values
      const hasNonDefaultPayload = (payload: any) => {
        if (!payload) return false;
        if (payload.customFields && payload.customFields.length > 0) return true;
        if (payload.quality && payload.quality !== 'good') return true;
        if (payload.timestampMode && payload.timestampMode !== 'auto') return true;
        if (payload.valueMode && payload.valueMode !== 'random') return true;
        if (payload.value !== undefined && payload.value !== null && payload.value !== 0 && payload.value !== '') return true;
        if (payload.minValue != null || payload.maxValue != null) return true;
        if (payload.step != null) return true;
        if (payload.precision != null) return true;
        if (payload.fixedTimestamp != null) return true;
        return false;
      };

      let removedCount = 0;
      const nodeSettingsObj = profile.nodeSettings instanceof Map
        ? Object.fromEntries(profile.nodeSettings)
        : profile.nodeSettings;

      for (const [nodeId, settings] of Object.entries(nodeSettingsObj)) {
        const typedSettings = settings as NodeSettingsInput;
        const hasFrequency = typedSettings.frequency && typedSettings.frequency !== 0;
        const hasFailRate = typedSettings.failRate && typedSettings.failRate !== 0;
        const hasPayload = hasNonDefaultPayload(typedSettings.payload);

        // Remove node if it has no actual customizations
        if (!hasFrequency && !hasFailRate && !hasPayload) {
          delete profile.nodeSettings[nodeId];
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await profile.save();
      }

      return removedCount;
    },

    startSimulation: async (
      _: any,
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // Fetch profile with ownership check
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      const schema = await SchemaModel.findById(profile.schemaId);
      if (!schema) throw new Error('Schema not found');

      // Debug: Check if schema has payloadTemplate data
      const nodesWithTemplates = schema.nodes.filter(
        (n) => n.payloadTemplate && Object.keys(n.payloadTemplate).length > 0
      );
      console.log(
        `[StartSimulation] Schema "${schema.name}" has ${nodesWithTemplates.length} nodes with payloadTemplate`
      );
      if (nodesWithTemplates.length > 0) {
        nodesWithTemplates.forEach((n) => {
          console.log(
            `  - ${n.path} (${n.kind}): ${JSON.stringify(n.payloadTemplate)}`
          );
        });
      }

      const broker = await Broker.findById(profile.brokerId);
      if (!broker) throw new Error('Broker not found');

      // Start simulation via SimulationManager
      await simulationManager.startSimulation(profile, schema, broker);

      mqttBackbone.publishCommand(
        TOPICS.CMD_SIMULATION_START,
        profileId,
        ctx.user!._id
      );

      return true;
    },

    stopSimulation: async (
      _: any,
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // Verify ownership before stopping
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      await simulationManager.stopSimulation(profileId);

      mqttBackbone.publishCommand(
        TOPICS.CMD_SIMULATION_STOP,
        profileId,
        ctx.user!._id
      );

      return true;
    },

    pauseSimulation: async (
      _: any,
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // Verify ownership before pausing
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      await simulationManager.pauseSimulation(profileId);

      mqttBackbone.publishCommand(
        TOPICS.CMD_SIMULATION_PAUSE,
        profileId,
        ctx.user!._id
      );

      return true;
    },

    resumeSimulation: async (
      _: any,
      { profileId }: { profileId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);
      // Verify ownership before resuming
      const profile = await SimulationProfile.findOne({
        _id: profileId,
        userId: ctx.user!._id,
      });
      if (!profile) throw new Error('Profile not found');
      await simulationManager.resumeSimulation(profileId);

      mqttBackbone.publishCommand(
        TOPICS.CMD_SIMULATION_RESUME,
        profileId,
        ctx.user!._id
      );

      return true;
    },

    testPublishNode: async (
      _: any,
      { profileId, nodeId }: { profileId: string; nodeId: string },
      ctx: Context
    ) => {
      requireAuth(ctx);

      try {
        // Load profile, schema, and broker from DB
        const profile = await SimulationProfile.findOne({
          _id: profileId,
          userId: ctx.user!._id,
        });
        if (!profile) throw new Error('Profile not found');

        const schema = await SchemaModel.findById(profile.schemaId);
        if (!schema) throw new Error('Schema not found');

        const broker = await Broker.findById(profile.brokerId);
        if (!broker) throw new Error('Broker not found');

        // Find the specific node
        const schemaNode = schema.nodes.find((n) => n.id === nodeId);
        if (!schemaNode) throw new Error('Node not found in schema');

        // Get node settings — convert Mongoose subdocument to plain object
        let nodeSettings: any;
        if (profile.nodeSettings instanceof Map) {
          const raw = profile.nodeSettings.get(nodeId);
          nodeSettings = raw?.toObject ? raw.toObject() : raw;
        } else if (profile.nodeSettings) {
          const raw = (profile.nodeSettings as any)[nodeId];
          nodeSettings = raw?.toObject ? raw.toObject() : raw;
        }

        // Helper to convert Mongoose subdocuments to plain objects
        const toPlain = (doc: any): Record<string, any> => {
          if (!doc) return {};
          if (typeof doc.toObject === 'function') return doc.toObject();
          if (typeof doc.toJSON === 'function') return doc.toJSON();
          return JSON.parse(JSON.stringify(doc));
        };

        // Resolve schema-level payload template (ancestor group + node's own)
        let schemaPayload: Record<string, any> = {};
        let currentParentId = schemaNode.parent;
        while (currentParentId) {
          const parent = schema.nodes.find(
            (n) => String(n.id ?? n._id) === String(currentParentId)
          );
          if (!parent) break;
          if (parent.kind === 'group' && parent.payloadTemplate) {
            schemaPayload = toPlain(parent.payloadTemplate);
            break; // Use nearest ancestor only
          }
          currentParentId = parent.parent;
        }
        if (schemaNode.payloadTemplate) {
          const metricPayload = toPlain(schemaNode.payloadTemplate);
          const ancestorCF = schemaPayload.customFields?.length ? schemaPayload.customFields : [];
          const metricCF = metricPayload.customFields?.length ? metricPayload.customFields : [];
          schemaPayload = {
            ...schemaPayload,
            ...metricPayload,
            customFields: [...ancestorCF, ...metricCF],
          };
        }

        // Build payload configuration with 4-tier merge
        const globalDefaults = toPlain(profile.globalSettings?.defaultPayload);
        const nodePayloadConfig = toPlain(nodeSettings?.payload);
        const payloadConfig: Record<string, any> = {
          ...schemaPayload,      // schema-level templates (lowest)
          ...globalDefaults,     // global sim defaults
          ...nodePayloadConfig,  // per-node sim overrides (highest)
          // Concatenate customFields from all tiers
          customFields: [
            ...(schemaPayload.customFields || []),
            ...(globalDefaults.customFields || []),
            ...(nodePayloadConfig.customFields || []),
          ],
        };

        console.log('🔍 testPublishNode debug:');
        console.log('  nodeSettings:', JSON.stringify(nodeSettings, null, 2));
        console.log('  payloadConfig:', JSON.stringify(payloadConfig, null, 2));
        console.log('  customFields:', JSON.stringify(payloadConfig.customFields, null, 2));

        // Generate value based on node's data type and config
        const dataType = schemaNode.dataType ?? 'Float';
        const mode = payloadConfig.valueMode || 'random';
        let value: any;

        if (mode === 'static') {
          value = payloadConfig.value ?? 0;
        } else if (mode === 'increment') {
          const startValue =
            typeof payloadConfig.value === 'number' ? payloadConfig.value : 0;
          value =
            dataType === 'Int'
              ? Math.round(startValue)
              : Number(startValue.toFixed(payloadConfig.precision ?? 2));
        } else {
          // random mode
          if (dataType === 'Bool' || dataType === 'Boolean') {
            value = Math.random() > 0.5;
          } else if (dataType === 'String') {
            value =
              typeof payloadConfig.value === 'string'
                ? payloadConfig.value
                : '';
          } else {
            const min =
              payloadConfig.minValue ?? (dataType === 'Int' ? 1 : 0);
            const max =
              payloadConfig.maxValue ?? (dataType === 'Int' ? 100 : 1.0);
            const raw = Math.random() * (max - min) + min;

            if (dataType === 'Int') {
              value = Math.round(raw);
            } else {
              const precision = payloadConfig.precision ?? 2;
              value = Number(raw.toFixed(precision));
            }
          }
        }

        // Build custom fields
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

        // Build final payload
        const payload = {
          ...customFieldsObj,
          quality: payloadConfig.quality || 'good',
          timestamp:
            payloadConfig.timestampMode === 'fixed'
              ? payloadConfig.fixedTimestamp ?? Date.now()
              : Date.now(),
          value,
        };

        // Compute topic
        let topic: string;
        const publishRoot = profile.globalSettings?.publishRoot?.trim();
        if (publishRoot && publishRoot.length > 0) {
          const cleanRoot = publishRoot.replace(/\/$/, '');
          const cleanPath = schemaNode.path.replace(/^\//, '');
          topic = `${cleanRoot}/${cleanPath}`;
        } else {
          topic = schemaNode.path;
        }

        // Create temporary MQTT connection and publish
        const mqtt = await import('mqtt');

        const useSsl =
          typeof broker.ssl === 'boolean' ? broker.ssl : false;

        let brokerHost = broker.url
          .replace(/^(wss?|mqtts?):\/\//, '')
          .replace(/\/+$/, '');
        let brokerPort = broker.port;

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

        const protocol = useSsl ? 'mqtts' : 'mqtt';
        const url = `${protocol}://${brokerHost}:${brokerPort}`;

        console.log(`🔌 testPublishNode connecting to: ${url} (original: ${broker.url}:${broker.port}, env MQTT_HOST=${mqttHostOverride}, MQTT_PORT=${mqttPortOverride})`);

        const options: any = {
          clientId: `uns-test-${Date.now()}`,
          clean: true,
          connectTimeout: 5000,
        };

        if (broker.username?.trim()) {
          options.username = broker.username;
        }
        if (broker.password?.trim()) {
          options.password = broker.password;
        }

        return await new Promise((resolve) => {
          const client = mqtt.connect(url, options);

          const timeout = setTimeout(() => {
            console.log('❌ testPublishNode: Connection timeout after 5s');
            client.end(true);
            resolve({
              success: false,
              topic: null,
              payload: null,
              error: 'Connection timeout',
            });
          }, 5000);

          client.on('connect', () => {
            console.log('✅ testPublishNode: Connected, publishing to topic:', topic);
            clearTimeout(timeout);
            client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
              client.end(true);
              if (err) {
                console.log('❌ testPublishNode: Publish error:', err.message);
                resolve({
                  success: false,
                  topic,
                  payload,
                  error: err.message,
                });
              } else {
                console.log('✅ testPublishNode: Published successfully');
                resolve({
                  success: true,
                  topic,
                  payload,
                  error: null,
                });
              }
            });
          });

          client.on('error', (err) => {
            console.log('❌ testPublishNode: Connection error:', err.message);
            clearTimeout(timeout);
            client.end(true);
            resolve({
              success: false,
              topic: null,
              payload: null,
              error: err.message,
            });
          });
        });
      } catch (error) {
        return {
          success: false,
          topic: null,
          payload: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },

  SimulationProfile: {
    nodeSettings: (profile: ISimulationProfile) => {
      // Mongoose Map support
      const nodeSettingsMap =
        profile.nodeSettings instanceof Map
          ? profile.nodeSettings
          : new Map(Object.entries(profile.nodeSettings || {}));
      return Array.from(nodeSettingsMap.entries()).map(
        ([nodeId, settings]) => ({
          nodeId,
          frequency: settings.frequency ?? null,
          failRate: settings.failRate ?? null,
          payload: settings.payload ?? null,
        })
      );
    },
  },
};
