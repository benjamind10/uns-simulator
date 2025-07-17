import mongoose from 'mongoose';

export const mqttConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ip: { type: String, required: true },
  port: { type: Number, required: true },
  protocol: {
    type: String,
    enum: ['ws', 'wss', 'mqtt', 'mqtts'],
    default: 'ws',
  },
  username: { type: String },
  password: { type: String },
}, { _id: false });
