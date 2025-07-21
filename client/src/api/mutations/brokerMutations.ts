import { gql } from 'graphql-request';

export const GET_BROKERS = gql`
  query GetBrokers {
    brokers {
      id
      name
      url
      port
      clientId
      username
      createdAt
      users
    }
  }
`;

export const CREATE_BROKER = gql`
  mutation CreateBroker($input: CreateBrokerInput!) {
    createBroker(input: $input) {
      id
      name
      url
      port
      clientId
      username
      createdAt
      users
    }
  }
`;

export const GET_BROKER = gql`
  query GetBroker($id: ID!) {
    broker(id: $id) {
      id
      name
      url
      port
      clientId
      username
      createdAt
      users
    }
  }
`;

export const DELETE_BROKER = gql`
  mutation DeleteBroker($id: ID!) {
    deleteBroker(id: $id)
  }
`;

export const UPDATE_BROKER = gql`
  mutation UpdateBroker($id: ID!, $input: UpdateBrokerInput!) {
    updateBroker(id: $id, input: $input) {
      id
      name
      url
      port
      clientId
      username
      createdAt
      users
    }
  }
`;
