import { GraphQLClient } from 'graphql-request';
import type { IBroker } from '../types';
import { CREATE_BROKER, GET_BROKERS } from './mutations/brokerMutations';

const endpoint = 'http://localhost:4000/graphql'; // Replace with your backend GraphQL URL

// Initialize a client with token from session storage
const getClient = () => {
  const token = sessionStorage.getItem('authToken');
  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
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
