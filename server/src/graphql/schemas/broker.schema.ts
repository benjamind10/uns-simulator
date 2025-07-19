import { gql } from 'apollo-server';

export const brokerTypeDefs = gql`
  type Broker {
    id: ID!
    name: String!
    url: String!
    port: Int!
    clientId: String!
    username: String
    password: String
    createdAt: String!
  }

  type Query {
    brokers: [Broker!]!
    broker(id: ID!): Broker
  }

  input CreateBrokerInput {
    name: String!
    url: String!
    port: Int!
    clientId: String!
    username: String
    password: String
  }

  input UpdateBrokerInput {
    name: String
    url: String
    port: Int
    clientId: String
    username: String
    password: String
  }

  type Mutation {
    createBroker(input: CreateBrokerInput!): Broker!
    deleteBroker(id: ID!): Boolean!
    updateBroker(id: ID!, input: UpdateBrokerInput!): Broker!
  }
`;
