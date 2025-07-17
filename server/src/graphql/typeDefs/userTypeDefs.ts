import { gql } from 'apollo-server-express';

const userTypeDefs = gql`
  type MQTTConfig {
    id: ID!
    protocol: String!
    host: String!
    port: Int!
    username: String
    password: String
  }

  type User {
    id: ID!
    username: String!
    mqttConfigs: [MQTTConfig!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    username: String!
    password: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input MQTTConfigInput {
    protocol: String!
    host: String!
    port: Int!
    username: String
    password: String
  }
yarn add -D @types/express @types/jsonwebtoken @types/bcrypt @types/node typescript ts-node nodemon

  type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    addMqttConfig(input: MQTTConfigInput!): User!
  }
`;

export default userTypeDefs;
