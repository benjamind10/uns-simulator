import { useState, useEffect } from 'react';
import {
  mqttConnectionManager,
  type BrokerConnection,
} from '../utils/mqttConnectionManager';

export function useMqttConnections() {
  const [connections, setConnections] = useState<Map<string, BrokerConnection>>(
    mqttConnectionManager.getAllConnections()
  );

  useEffect(() => {
    const unsubscribe = mqttConnectionManager.onStatusChange(setConnections);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    connections,
    connectToBroker: mqttConnectionManager.connectToBroker.bind(
      mqttConnectionManager
    ),
    disconnectFromBroker: mqttConnectionManager.disconnectFromBroker.bind(
      mqttConnectionManager
    ),
    connectToMultipleBrokers:
      mqttConnectionManager.connectToMultipleBrokers.bind(
        mqttConnectionManager
      ),
    disconnectAll: mqttConnectionManager.disconnectAll.bind(
      mqttConnectionManager
    ),
    getBrokerStatus: (brokerId: string) =>
      connections.get(brokerId)?.status || 'disconnected',
  };
}
