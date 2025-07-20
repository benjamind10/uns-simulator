import { createAsyncThunk } from '@reduxjs/toolkit';

import { loginUser } from '../../api/auth';

import type { User } from './authTypes';

// Helper function to persist auth data
const persistAuthData = (token: string, user: User) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('authUser', JSON.stringify(user));
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await loginUser(email, password);

    if (!response) {
      throw new Error('Login failed');
    }

    persistAuthData(response.token, response.user);

    return {
      user: response.user,
      token: response.token,
    };
  }
);

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  return null;
});
