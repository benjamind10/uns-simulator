import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser } from '../api/auth';
import type { RootState } from './store';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Add helper function to persist auth data
const persistAuthData = (token: string, user: User) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('authUser', JSON.stringify(user));
};

// Update initial state to load persisted user
const initialState: AuthState = {
  user: JSON.parse(sessionStorage.getItem('authUser') || 'null'),
  token: sessionStorage.getItem('authToken'),
  loading: false,
  error: null,
};

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await loginUser(email, password);

    if (!response) {
      throw new Error('Login failed');
    }

    // Persist both token and user data
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

// Actions
export const { clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;

export default authSlice.reducer;
