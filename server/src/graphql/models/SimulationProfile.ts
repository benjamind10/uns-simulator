/* models/SimulationProfile.ts */
import { Schema, model, Types, Document } from 'mongoose';

export interface ISimulationNodeSettings {
  frequency?: number; // Hz or ms
  failRate?: number; // 0-1 (probability of failure)
  payload?: {
    // Core fields
    quality?: string;
    timestampMode?: 'auto' | 'fixed';
    fixedTimestamp?: number;
    // Value generation
    value?: string | number | boolean;
    valueMode?: 'static' | 'random' | 'increment';
    minValue?: number;
    maxValue?: number;
    step?: number;
    precision?: number;
    // Custom fields
    customFields?: Array<{
      key: string;
      value: string | number | boolean;
      type: 'string' | 'number' | 'boolean';
    }>;
    // Internal state for increment mode
    _currentValue?: number;
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
      quality?: string;
      timestampMode?: 'auto' | 'fixed';
      fixedTimestamp?: number;
      value?: string | number | boolean;
      valueMode?: 'static' | 'random' | 'increment';
      minValue?: number;
      maxValue?: number;
      step?: number;
      precision?: number;
      customFields?: Array<{
        key: string;
        value: string | number | boolean;
        type: 'string' | 'number' | 'boolean';
      }>;
    };
  };
  nodeSettings?: Record<string, ISimulationNodeSettings>;
  defaultScenario?: string;
  userId: Types.ObjectId;
  // Add simulation status tracking
  status: {
    state:
      | 'idle'
      | 'starting'
      | 'running'
      | 'paused'
      | 'stopping'
      | 'stopped'
      | 'error';
    isRunning: boolean;
    isPaused: boolean;
    startTime?: Date;
    lastActivity?: Date;
    nodeCount?: number;
    mqttConnected?: boolean;
    reconnectAttempts?: number;
    error?: string;
  };
}

const SimulationNodeSettingsSchema = new Schema<ISimulationNodeSettings>(
  {
    frequency: { type: Number, default: 30 }, // Default frequency
    failRate: { type: Number, default: 0 }, // Default fail rate
    payload: {
      quality: { type: String, default: 'good' },
      timestampMode: {
        type: String,
        enum: ['auto', 'fixed'],
        default: 'auto',
      },
      fixedTimestamp: { type: Number },
      value: { type: Schema.Types.Mixed, default: 0 },
      valueMode: {
        type: String,
        enum: ['static', 'random', 'increment'],
        default: 'random',
      },
      minValue: { type: Number },
      maxValue: { type: Number },
      step: { type: Number },
      precision: { type: Number },
      customFields: [
        {
          key: { type: String, required: true },
          value: { type: Schema.Types.Mixed, required: true },
          type: {
            type: String,
            enum: ['string', 'number', 'boolean'],
            required: true,
          },
          _id: false,
        },
      ],
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
      publishRoot: { type: String, default: '' },
      startDelay: { type: Number, default: 0 },
      simulationLength: { type: Number, default: 0 },
      defaultPayload: {
        quality: { type: String, default: 'good' },
        timestampMode: {
          type: String,
          enum: ['auto', 'fixed'],
          default: 'auto',
        },
        fixedTimestamp: { type: Number },
        value: { type: Schema.Types.Mixed, default: 0 },
        valueMode: {
          type: String,
          enum: ['static', 'random', 'increment'],
          default: 'random',
        },
        minValue: { type: Number },
        maxValue: { type: Number },
        step: { type: Number },
        precision: { type: Number },
        customFields: [
          {
            key: { type: String, required: true },
            value: { type: Schema.Types.Mixed, required: true },
            type: {
              type: String,
              enum: ['string', 'number', 'boolean'],
              required: true,
            },
            _id: false,
          },
        ],
      },
    },
    nodeSettings: {
      type: Map,
      of: SimulationNodeSettingsSchema,
      default: {},
    },
    defaultScenario: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Add status tracking
    status: {
      state: {
        type: String,
        enum: [
          'idle',
          'starting',
          'running',
          'paused',
          'stopping',
          'stopped',
          'error',
        ],
        default: 'idle',
      },
      isRunning: { type: Boolean, default: false },
      isPaused: { type: Boolean, default: false },
      startTime: Date,
      lastActivity: { type: Date, default: Date.now },
      nodeCount: Number,
      mqttConnected: { type: Boolean, default: false },
      reconnectAttempts: { type: Number, default: 0 },
      error: String,
    },
  },
  { timestamps: true }
);

SimulationProfileSchema.index({ userId: 1 });
SimulationProfileSchema.index({ userId: 1, 'status.state': 1 });
SimulationProfileSchema.index({ userId: 1, schemaId: 1 });

export default model<ISimulationProfile>(
  'SimulationProfile',
  SimulationProfileSchema
);
