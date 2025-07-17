// src/types/user.d.ts
export interface IMQTTConfig {
  name: string;
  ip: string;
  port: number;
  protocol: 'ws' | 'wss' | 'mqtt' | 'mqtts';
  username?: string;
  password?: string;
}

export interface IUser {
  username: string;
  passwordHash: string;
  mqttConfigs: IMQTTConfig[];
  validatePassword: (input: string) => Promise<boolean>;
  setPassword: (input: string) => Promise<void>;
}
