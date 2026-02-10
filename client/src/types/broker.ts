export interface IBroker {
  id: string;
  name: string;
  url: string;
  port: number;
  wsPath?: string;
  clientId: string;
  username?: string;
  password?: string;
  createdAt?: string;
  users?: string[];
}

export type BrokersResponse = {
  brokers: IBroker[];
};

export type CreateBrokerInput = {
  name: string;
  url: string;
  port: number;
  wsPath?: string;
  clientId: string;
  username?: string;
  password?: string;
};

export type CreateBrokerResponse = {
  createBroker: IBroker;
};

export type UpdateBrokerInput = Partial<CreateBrokerInput>;

export type UpdateBrokerResponse = {
  updateBroker: IBroker;
};

export type DeleteBrokerResponse = {
  deleteBroker: boolean;
};

export interface BrokerConnection {
  brokerId: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError?: string;
  lastConnected?: string;
}
