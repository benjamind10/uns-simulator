export interface IBroker {
  id: string;
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  createdAt: string;
}
