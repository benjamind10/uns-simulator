import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from './auth';
import { brokersReducer } from './brokers';
import { schemaNodeReducer } from './schemaNode/schemaNodeSlice';
import { schemaReducer } from './schema/schemaSlice'; // <-- Correct import

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
    schemaNode: schemaNodeReducer,
    schema: schemaReducer, // <-- Use correct reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
