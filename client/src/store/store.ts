import { configureStore } from '@reduxjs/toolkit';

import authReducer from './auth/authSlice';
import mqttReducer from './mqtt';
import systemMqttReducer from './mqtt/systemMqttSlice';
import { brokersReducer } from './brokers';
import { schemaReducer } from './schema/schemaSlice';
import simulationProfileReducer from './simulationProfile/simulationProfileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
    schema: schemaReducer,
    mqtt: mqttReducer,
    systemMqtt: systemMqttReducer,
    simulationProfile: simulationProfileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['mqtt/setConnectionStatus'],
        ignoredPaths: ['mqtt.connections'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
