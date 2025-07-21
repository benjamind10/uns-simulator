import mqtt, { type IClientOptions } from 'mqtt';

export interface MqttConnectionOptions {
  url: string;
  topics: string[];
  options?: IClientOptions;
  onMessage: (topic: string, payload: string) => void;
  onConnect?: () => void;
  onError?: (err: Error) => void;
}

export function connectMqtt({
  url,
  topics,
  options,
  onMessage,
  onConnect,
  onError,
}: MqttConnectionOptions): ReturnType<typeof mqtt.connect> {
  const client = mqtt.connect(url, options);

  client.on('connect', () => {
    topics.forEach((topic) => client.subscribe(topic));
    if (onConnect) {
      onConnect();
    }
  });

  client.on('message', (topic, payload) => {
    onMessage(topic, payload.toString());
  });

  client.on('error', (err) => {
    console.error('[MQTT] Connection error:', err);
    if (onError) onError(err);
  });

  client.on('close', () => {
    console.error('[MQTT] Connection closed');
  });

  client.stream.on('error', (err: Error) => {
    // This can catch lower-level WebSocket errors
    console.error('[MQTT] Stream error:', err);
  });

  return client;
}
