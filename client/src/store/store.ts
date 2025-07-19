import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import brokersReducer from './brokersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
