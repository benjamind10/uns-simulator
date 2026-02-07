import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBroker extends Document {
  ssl: any;
  isConnected: boolean;
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  users: Types.ObjectId[];
}

const BrokerSchema: Schema = new Schema<IBroker>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    port: { type: Number, required: true },
    clientId: { type: String, required: true },
    username: { type: String },
    password: { type: String },
    users: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  },
  { timestamps: true }
);

BrokerSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});

BrokerSchema.index({ users: 1 });
BrokerSchema.index({ name: 1 });

export default mongoose.model<IBroker>('Broker', BrokerSchema);
