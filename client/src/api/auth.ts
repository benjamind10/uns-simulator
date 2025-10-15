import { GraphQLClient } from 'graphql-request';

import type { User } from '../types/auth';

import {
  LOGIN_MUTATION,
  CREATE_USER_MUTATION,
} from './mutations/auth.mutations';

const endpoint = import.meta.env.VITE_API_URL;

if (!endpoint) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

const client = new GraphQLClient(endpoint, {
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AuthResponse {
  login: {
    token: string;
    user: User;
  };
}

interface RegisterResponse {
  createUser: User;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse['login'] | null> {
  try {
    const variables = {
      input: {
        email,
        password,
      },
    };

    const response: AuthResponse = await client.request(
      LOGIN_MUTATION,
      variables
    );

    // Validate response
    if (!response.login?.token || !response.login?.user) {
      console.error('Invalid login response:', response);
      return null;
    }

    return response.login;
  } catch (error) {
    console.error('Login request failed:', error);
    return null;
  }
}

// Register user using createUser mutation
export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<User | null> {
  try {
    const variables = {
      input: {
        username,
        email,
        password,
      },
    };

    const response: RegisterResponse = await client.request(
      CREATE_USER_MUTATION,
      variables
    );

    if (!response.createUser) {
      console.error('Invalid register response:', response);
      return null;
    }

    return response.createUser;
  } catch (error) {
    console.error('Register request failed:', error);
    return null;
  }
}
