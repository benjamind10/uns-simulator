import { gql } from 'apollo-server';

export const userTypeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
  }
`;
