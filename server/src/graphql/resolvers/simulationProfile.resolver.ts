import SimulationProfile, {
  ISimulationProfile,
} from '../../graphql/models/SimulationProfile';
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
      // Optionally require auth
      requireAuth(ctx);
      const profile = await SimulationProfile.findById(profileId);
      if (!profile) throw new Error('Profile not found');
      // Always return a valid status object
      if (!profile.status) {
        // Provide default values if status is missing
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
      return profile.status;
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
      if (profile.nodeSettings && profile.nodeSettings[nodeId]) {
        delete profile.nodeSettings[nodeId];
        await profile.save();
      }
      return true;
    },

    startSimulation: async (_: any, { profileId }: { profileId: string }) => {
      // Fetch profile, schema, and broker from DB
      const profile = await SimulationProfile.findById(profileId);
      if (!profile) throw new Error('Profile not found');
      const schema = await SchemaModel.findById(profile.schemaId);
      if (!schema) throw new Error('Schema not found');
      const broker = await Broker.findById(profile.brokerId);
      if (!broker) throw new Error('Broker not found');

      // Start simulation via SimulationManager
      await simulationManager.startSimulation(profile, schema, broker);

      return true;
    },

    stopSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.stopSimulation(profileId);
      return true;
    },

    pauseSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.pauseSimulation(profileId);
      return true;
    },

    resumeSimulation: async (_: any, { profileId }: { profileId: string }) => {
      await simulationManager.resumeSimulation(profileId);
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

        // Build payload configuration
        const globalDefaults = profile.globalSettings?.defaultPayload || {};
        const nodePayloadConfig = nodeSettings?.payload || {};
        const payloadConfig = {
          ...globalDefaults,
          ...nodePayloadConfig,
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
            customFieldsObj[field.key] = field.value;
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
