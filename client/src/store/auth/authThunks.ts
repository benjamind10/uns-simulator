import { createAsyncThunk } from '@reduxjs/toolkit';

import { loginUser } from '../../api/auth';
import type { User } from '../../types/auth';
import { AUTH_ACTIONS } from '../constants';

// Helper function to persist auth data
const persistAuthData = (token: string, user: User) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('authUser', JSON.stringify(user));
};

export const loginAsync = createAsyncThunk(
  AUTH_ACTIONS.LOGIN,
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

export const logoutAsync = createAsyncThunk(AUTH_ACTIONS.LOGOUT, async () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  return null;
});
