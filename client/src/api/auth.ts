import { GraphQLClient } from 'graphql-request';
import { LOGIN_MUTATION } from './mutations/auth.mutations';

const endpoint = 'http://localhost:4000/graphql'; // Replace with your backend URL

const client = new GraphQLClient(endpoint);


type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

type AuthPayload = {
  login: {
    token: string;
    user: User;
  };
};

export async function loginUser(email: string, password: string): Promise<AuthPayload['login'] | null> {
  try {
    const variables = {
      input: {
        email,
        password,
      },
    };

    const response: AuthPayload = await client.request(LOGIN_MUTATION, variables);
    return response.login;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
}
