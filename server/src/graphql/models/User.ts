import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';

import { AUTH_CONFIG } from '../../config/constants';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  brokers: Types.ObjectId[];
  schemas: Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  brokers: [{ type: Schema.Types.ObjectId, ref: 'Broker' }],
  schemas: [{ type: Schema.Types.ObjectId, ref: 'Schema' }],
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
