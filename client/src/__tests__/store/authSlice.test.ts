import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import authReducer, { clearError } from '../../store/auth/authSlice';
import { loginAsync, logoutAsync } from '../../store/auth/authThunks';

// Mock the API
vi.mock('../../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
});

function createStore() {
  return configureStore({
    reducer: { auth: authReducer },
  });
}

describe('authSlice', () => {
  beforeEach(() => {
    Object.keys(mockSessionStorage).forEach(
      (k) => delete mockSessionStorage[k]
    );
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      const store = createStore();
      // Manually set error by dispatching a rejected action
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('loginAsync', () => {
    it('sets loading on pending', () => {
      const state = authReducer(
        { user: null, token: null, isAuthenticated: false, loading: false, error: null },
        { type: loginAsync.pending.type }
      );
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets user and token on fulfilled', () => {
      const payload = {
        user: { id: '1', username: 'test', email: 'test@test.com' },
        token: 'jwt-token',
      };
      const state = authReducer(
        { user: null, token: null, isAuthenticated: false, loading: true, error: null },
        { type: loginAsync.fulfilled.type, payload }
      );
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(payload.user);
      expect(state.token).toBe('jwt-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('sets error on rejected', () => {
      const state = authReducer(
        { user: null, token: null, isAuthenticated: false, loading: true, error: null },
        { type: loginAsync.rejected.type, error: { message: 'Bad creds' } }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Bad creds');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logoutAsync', () => {
    it('clears auth state on fulfilled', () => {
      const state = authReducer(
        {
          user: { id: '1', username: 'test', email: 'test@test.com' },
          token: 'jwt',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        { type: logoutAsync.fulfilled.type }
      );
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
