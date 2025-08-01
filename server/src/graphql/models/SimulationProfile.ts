/* models/SimulationProfile.ts */
import { Schema, model, Types, Document } from 'mongoose';

export interface ISimulationNodeSettings {
  frequency?: number; // Hz or ms
  failRate?: number; // 0-1 (probability of failure)
  payload?: {
    quality?: string;
    value?: string | number;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface ISimulationProfile extends Document {
  name: string;
  description?: string;
  schemaId: Types.ObjectId;
  brokerId?: Types.ObjectId;
  globalSettings: {
    defaultUpdateFrequency: number;
    timeScale: number;
    publishRoot?: string;
    startDelay?: number;
    simulationLength?: number;
    defaultPayload?: {
      quality: string;
      value: string | number;
      timestamp: number;
    };
  };
  nodeSettings?: Record<string, ISimulationNodeSettings>; // key: nodeId
  defaultScenario?: string;
  userId: Types.ObjectId;
}

const SimulationNodeSettingsSchema = new Schema<ISimulationNodeSettings>(
  {
    frequency: { type: Number, default: 30 }, // Default frequency
    failRate: { type: Number, default: 0 }, // Default fail rate
    payload: {
      quality: { type: String, default: 'good' }, // Default quality
      value: { type: Schema.Types.Mixed, default: 0 }, // Default value
      timestamp: { type: Number, default: () => Date.now() }, // Default timestamp
    },
  },
  { _id: false }
);

const SimulationProfileSchema = new Schema<ISimulationProfile>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    schemaId: { type: Schema.Types.ObjectId, ref: 'Schema', required: true },
    brokerId: { type: Schema.Types.ObjectId, ref: 'Broker' },
    globalSettings: {
      defaultUpdateFrequency: { type: Number, default: 60 },
      timeScale: { type: Number, default: 1.0 },
      publishRoot: { type: String, default: '#' },
      startDelay: { type: Number, default: 0 },
      simulationLength: { type: Number, default: 0 },
      defaultPayload: {
        quality: { type: String, default: 'good' },
        value: { type: Schema.Types.Mixed, default: 0 },
        timestamp: { type: Number, default: () => Date.now() },
      },
    },
    nodeSettings: {
      type: Map,
      of: SimulationNodeSettingsSchema,
      default: {},
    },
    defaultScenario: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SimulationProfileSchema.index({ userId: 1 });

export default model<ISimulationProfile>(
  'SimulationProfile',
  SimulationProfileSchema
);
