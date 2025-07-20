export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: JSON.parse(sessionStorage.getItem('authUser') || 'null'),
  token: sessionStorage.getItem('authToken'),
  loading: false,
  error: null,
};
