import { createAsyncThunk } from '@reduxjs/toolkit';

import { loginUser, registerUser } from '../../api/auth';
import type { User, RegisterData } from '../../types/auth';
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

export const registerAsync = createAsyncThunk(
  AUTH_ACTIONS.REGISTER,
  async ({ username, email, password }: RegisterData) => {
    const user = await registerUser(username, email, password);

    if (!user) {
      throw new Error('Registration failed');
    }

    // Optionally persist user info if you want auto-login after registration
    // sessionStorage.setItem('authUser', JSON.stringify(user));

    return { user };
  }
);

export const logoutAsync = createAsyncThunk(AUTH_ACTIONS.LOGOUT, async () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  return null;
});
