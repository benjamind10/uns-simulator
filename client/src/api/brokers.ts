import { GraphQLClient } from 'graphql-request';
import {
  CREATE_BROKER,
  DELETE_BROKER,
  UPDATE_BROKER,
} from './mutations/brokerMutations';

import type { IBroker } from '../types';
import type {
  BrokersResponse,
  CreateBrokerInput,
  CreateBrokerResponse,
  DeleteBrokerResponse,
  UpdateBrokerInput,
  UpdateBrokerResponse,
} from '../types/broker';
import { GET_BROKERS } from './queries/broker.queries';

const endpoint = import.meta.env.VITE_API_URL;

if (!endpoint) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

// Initialize a client with token from session storage
const getClient = () => {
  const token = sessionStorage.getItem('authToken');

  if (!token) {
    throw new Error('No authentication token found');
  }

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
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
    // Log the full error
    if (err && typeof err === 'object') {
      console.error('Delete Error Details:', {
        message:
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message?: string }).message
            : undefined,
        response:
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: unknown }).response
            : undefined,
        request:
          typeof err === 'object' && err !== null && 'request' in err
            ? (err as { request?: unknown }).request
            : undefined,
      });
    } else {
      console.error('Delete Error Details:', err);
    }
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
    // Log the full error
    if (err && typeof err === 'object') {
      console.error('Update Error Details:', {
        message:
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message?: string }).message
            : undefined,
        response:
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: unknown }).response
            : undefined,
        request:
          typeof err === 'object' && err !== null && 'request' in err
            ? (err as { request?: unknown }).request
            : undefined,
      });
    } else {
      console.error('Update Error Details:', err);
    }
    throw err;
  }
}
