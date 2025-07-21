import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from './auth';
import { brokersReducer } from './brokers';
import { schemaReducer } from './schema/schemaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
    schema: schemaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
