import { GraphQLClient } from 'graphql-request';
import type { IBroker } from '../types';
import {
  CREATE_BROKER,
  GET_BROKERS,
  DELETE_BROKER,
  UPDATE_BROKER,
} from './mutations/brokerMutations';

const endpoint = import.meta.env.VITE_API_URL;

if (!endpoint) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

// Initialize a client with token from session storage
const getClient = () => {
  const token = sessionStorage.getItem('authToken');
  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};

// Types for GraphQL responses
type BrokersResponse = {
  brokers: IBroker[];
};

type CreateBrokerInput = {
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
};

type CreateBrokerResponse = {
  createBroker: IBroker;
};

type UpdateBrokerInput = Partial<CreateBrokerInput>;

type UpdateBrokerResponse = {
  updateBroker: IBroker;
};

type DeleteBrokerResponse = {
  deleteBroker: boolean;
};

// Fetch brokers for current user
export async function fetchBrokers(): Promise<IBroker[]> {
  const client = getClient();
  try {
    const data: BrokersResponse = await client.request(GET_BROKERS);
    return data.brokers;
  } catch (err) {
    console.error('Error fetching brokers:', err);
    throw err;
  }
}

// Create a new broker
export async function createBroker(input: CreateBrokerInput): Promise<IBroker> {
  const client = getClient();
  try {
    const variables = { input };
    const data: CreateBrokerResponse = await client.request(
      CREATE_BROKER,
      variables
    );
    return data.createBroker;
  } catch (err) {
    console.error('Error creating broker:', err);
    throw err;
  }
}

// Delete a broker
export async function deleteBroker(id: string): Promise<boolean> {
  const client = getClient();
  try {
    const variables = { id };
    const data: DeleteBrokerResponse = await client.request(
      DELETE_BROKER,
      variables
    );
    return data.deleteBroker;
  } catch (err) {
    console.error('Error deleting broker:', err);
    throw err;
  }
}

// Update a broker
export async function updateBroker(
  id: string,
  input: UpdateBrokerInput
): Promise<IBroker> {
  const client = getClient();
  try {
    const variables = { id, input };
    const data: UpdateBrokerResponse = await client.request(
      UPDATE_BROKER,
      variables
    );
    return data.updateBroker;
  } catch (err) {
    console.error('Error updating broker:', err);
    throw err;
  }
}
