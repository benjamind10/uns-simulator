import { gql } from 'apollo-server-express';

export const schemaTypeDefs = gql`
  type Schema {
    id: ID!
    name: String!
    description: String
  }

  input SchemaInput {
    name: String!
    description: String
  }

  type Query {
    schemas: [Schema!]!
    schema(id: ID!): Schema
  }

  type Mutation {
    createSchema(input: SchemaInput!): Schema!
    updateSchema(id: ID!, input: SchemaInput!): Schema!
    deleteSchema(id: ID!): Boolean!
  }
`;
