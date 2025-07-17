import { gql } from 'apollo-server-express';

export const mqttTypeDefs = gql`
  type MQTTConfig {
    _id: ID!
    name: String!
    host: String!
    port: Int!
    protocol: String!
    username: String
    password: String
  }

  input MQTTConfigInput {
    name: String!
    host: String!
    port: Int!
    protocol: String!
    username: String
    password: String
  }

  type Query {
    getMQTTConfigs: [MQTTConfig!]!
  }

  type Mutation {
    addMQTTConfig(input: MQTTConfigInput!): MQTTConfig!
    removeMQTTConfig(id: ID!): Boolean!
  }
`;
