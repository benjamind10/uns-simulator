import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBroker extends Document {
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  createdAt: Date;
  users: Types.ObjectId[];
}

const BrokerSchema: Schema = new Schema<IBroker>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  port: { type: Number, required: true },
  clientId: { type: String, required: true },
  username: { type: String },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

BrokerSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model<IBroker>('Broker', BrokerSchema);
