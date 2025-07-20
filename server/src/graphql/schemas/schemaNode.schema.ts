import { gql } from 'apollo-server-express';

export const schemaNodeTypeDefs = gql`
  type SchemaNode {
    id: ID!
    name: String!
    kind: String!
    parent: ID
    path: String!
    order: Int
    dataType: String
    unit: String
    engineering: JSON
    createdAt: String!
    updatedAt: String!
  }

  scalar JSON

  type Query {
    schemaNodes: [SchemaNode!]!
    schemaNode(id: ID!): SchemaNode
    schemaNodesByParent(parentId: ID!): [SchemaNode!]!
  }

  input SchemaNodeInput {
    name: String!
    kind: String!
    parent: ID
    path: String!
    order: Int
    dataType: String
    unit: String
    engineering: JSON
  }

  type Mutation {
    createSchemaNode(input: SchemaNodeInput!): SchemaNode!
    updateSchemaNode(id: ID!, input: SchemaNodeInput!): SchemaNode!
    deleteSchemaNode(id: ID!): SchemaNode
  }
`;
