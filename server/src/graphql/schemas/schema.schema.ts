import { gql } from 'apollo-server-express';

export const schemaTypeDefs = gql`
  enum SchemaNodeKind {
    group
    metric
  }

  enum SchemaNodeDataType {
    Int
    Float
    Bool
    String
  }

  scalar JSON

  type SchemaNode {
    id: ID!
    name: String!
    kind: SchemaNodeKind!
    parent: ID
    path: String!
    order: Int!
    dataType: SchemaNodeDataType
    unit: String
    engineering: JSON
  }

  input SchemaNodeInput {
    id: ID
    name: String!
    kind: SchemaNodeKind!
    parent: ID
    path: String!
    order: Int
    dataType: SchemaNodeDataType
    unit: String
    engineering: JSON
  }

  type Schema {
    id: ID!
    name: String!
    description: String
    nodes: [SchemaNode!]!
    brokerIds: [ID!] # <-- Add brokerIds field
    users: [ID!]! # <-- Keep users array
    createdAt: String!
    updatedAt: String!
  }

  input SchemaInput {
    name: String!
    description: String
    nodes: [SchemaNodeInput!]
    brokerIds: [ID!] # <-- Add brokerIds field
    users: [ID!] # <-- Make users optional (remove !)
  }

  type Query {
    schemas: [Schema!]!
    schema(id: ID!): Schema
  }

  type Mutation {
    createSchema(input: SchemaInput!): Schema!
    updateSchema(id: ID!, input: SchemaInput!): Schema!
    deleteSchema(id: ID!): Boolean!
    addNodeToSchema(schemaId: ID!, node: SchemaNodeInput!): Schema!
    updateNodeInSchema(
      schemaId: ID!
      nodeId: ID!
      node: SchemaNodeInput!
    ): Schema!
    deleteNodeFromSchema(schemaId: ID!, nodeId: ID!): Schema!
    saveNodesToSchema(schemaId: ID!, nodes: [SchemaNodeInput!]!): Schema!
  }
`;
