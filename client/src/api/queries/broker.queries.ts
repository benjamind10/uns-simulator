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
