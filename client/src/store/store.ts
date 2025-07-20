import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth';
import { brokersReducer } from './brokers';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
