import { Schema, Document, Model, model, Types } from 'mongoose';
import { SimulationMode, PatternType } from './SimulationEnums';

/* ─────────────────────────────
   Base interface & schema
──────────────────────────────*/
export interface ISimNodeBehaviorBase extends Document {
  profileId: Types.ObjectId; // which SimulationProfile
  nodeId: Types.ObjectId; // which node in schema
  enabled: boolean;
  mode: SimulationMode;
  updateFrequency: number;
  failureProbability: number;
}

const BaseBehaviorSchema = new Schema<ISimNodeBehaviorBase>(
  {
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'SimulationProfile',
      required: true,
      index: true,
    },
    nodeId: { type: Schema.Types.ObjectId, required: true, index: true },
    enabled: { type: Boolean, default: true },
    mode: { type: String, enum: Object.values(SimulationMode), required: true },
    updateFrequency: { type: Number, default: 0 },
    failureProbability: { type: Number, default: 0 },
  },
  { discriminatorKey: 'mode', _id: true, timestamps: true }
);

export const SimNodeBehaviorModel: Model<ISimNodeBehaviorBase> =
  model<ISimNodeBehaviorBase>('SimNodeBehavior', BaseBehaviorSchema);
