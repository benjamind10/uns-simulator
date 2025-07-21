export interface MqttMessage {
  topic: string;
  payload: string;
  timestamp: string;
}

export interface TopicNode {
  name: string;
  children: Record<string, TopicNode>;
  fullPath: string;
}

export interface MqttConnectionOptions {
  url: string;
  topics: string[];
  options?: Record<string, unknown>; // Replace 'any' with a safer type or import mqtt.IClientOptions if available
  onMessage: (topic: string, payload: string) => void;
  onConnect?: () => void;
  onError?: (err: Error) => void;
}
