import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { mqttConfigSchema } from './MQTTConfig';
import { IMQTTConfig, IUser } from '../types/user';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  mqttConfigs: { type: [mqttConfigSchema], default: [] },
});

userSchema.methods.validatePassword = async function (plainText: string) {
  return bcrypt.compare(plainText, this.passwordHash);
};

userSchema.methods.setPassword = async function (plainText: string) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainText, salt);
};

export default mongoose.model<IUser & mongoose.Document>('User', userSchema);
