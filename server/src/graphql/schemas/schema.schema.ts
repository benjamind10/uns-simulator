import { gql } from 'apollo-server-express';

export const schemaTypeDefs = gql`
  enum SchemaNodeKind {
    group
    metric
    object # <-- Add 'object' kind
  }

  enum SchemaNodeDataType {
    Int
    Float
    Bool
    Boolean
    String
  }

  scalar JSON

  type PayloadTemplateCustomField {
    key: String!
    value: JSON!
    type: String!
  }

  type PayloadTemplate {
    quality: String
    timestampMode: String
    fixedTimestamp: Float
    value: JSON
    valueMode: String
    minValue: Float
    maxValue: Float
    step: Float
    precision: Int
    customFields: [PayloadTemplateCustomField!]
  }

  input PayloadTemplateCustomFieldInput {
    key: String!
    value: JSON!
    type: String!
  }

  input PayloadTemplateInput {
    quality: String
    timestampMode: String
    fixedTimestamp: Float
    value: JSON
    valueMode: String
    minValue: Float
    maxValue: Float
    step: Float
    precision: Int
    customFields: [PayloadTemplateCustomFieldInput!]
  }

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
    objectData: JSON
    payloadTemplate: PayloadTemplate
  }

  input SchemaNodeInput {
    id: String!
    name: String!
    kind: SchemaNodeKind!
    parent: ID
    path: String!
    order: Int!
    dataType: SchemaNodeDataType
    unit: String
    engineering: JSON
    objectData: JSON
    payloadTemplate: PayloadTemplateInput
  }

  type Schema {
    id: ID!
    name: String!
    description: String
    nodes: [SchemaNode!]!
    brokerIds: [ID!]
    users: [ID!]
    createdAt: String!
    updatedAt: String!
  }

  input SchemaInput {
    name: String!
    description: String
    nodes: [SchemaNodeInput!]
    brokerIds: [ID!]
    users: [ID!]
  }

  type Query {
    schemas: [Schema!]!
    schema(id: ID!): Schema
    getNodes(schemaId: ID!): [SchemaNode!]!
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
