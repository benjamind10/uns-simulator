/* models/SimulationProfile.ts */
import { Schema, model, Types, Document } from 'mongoose';

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
  };
  defaultScenario?: string;
  userId: Types.ObjectId;
  // nodeBehaviors removed!
}

const SimulationProfileSchema = new Schema<ISimulationProfile>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    schemaId: { type: Schema.Types.ObjectId, ref: 'Schema', required: true },
    brokerId: { type: Schema.Types.ObjectId, ref: 'Broker' },
    globalSettings: {
      defaultUpdateFrequency: { type: Number, default: 60 },
      timeScale: { type: Number, default: 1.0 },
      publishRoot: String,
      startDelay: { type: Number, default: 0 },
      simulationLength: { type: Number, default: 0 },
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
