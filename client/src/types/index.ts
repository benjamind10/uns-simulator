export interface IBroker {
  _id: string;
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  createdAt: string;
}
