import { GraphQLClient } from 'graphql-request';

import { LOGIN_MUTATION } from './mutations/auth.mutations';
import type { User } from '../types/auth';

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
