import { gql } from 'graphql-request';

const PAYLOAD_TEMPLATE_FIELDS = `
  payloadTemplate {
    quality
    timestampMode
    fixedTimestamp
    value
    valueMode
    minValue
    maxValue
    step
    precision
    customFields {
      key
      value
      type
    }
  }
`;

export const CREATE_SCHEMA = gql`
  mutation CreateSchema($input: SchemaInput!) {
    createSchema(input: $input) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SCHEMA = gql`
  mutation UpdateSchema($id: ID!, $input: SchemaInput!) {
    updateSchema(id: $id, input: $input) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SCHEMA = gql`
  mutation DeleteSchema($id: ID!) {
    deleteSchema(id: $id)
  }
`;

export const SAVE_NODES_TO_SCHEMA = gql`
  mutation SaveNodesToSchema($schemaId: ID!, $nodes: [SchemaNodeInput!]!) {
    saveNodesToSchema(schemaId: $schemaId, nodes: $nodes) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

export const ADD_NODE_TO_SCHEMA = gql`
  mutation AddNodeToSchema($schemaId: ID!, $node: SchemaNodeInput!) {
    addNodeToSchema(schemaId: $schemaId, node: $node) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_NODE_FROM_SCHEMA = gql`
  mutation DeleteNodeFromSchema($schemaId: ID!, $nodeId: ID!) {
    deleteNodeFromSchema(schemaId: $schemaId, nodeId: $nodeId) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

// Queries
export const GET_SCHEMAS = gql`
  query GetSchemas {
    schemas {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;

export const GET_SCHEMA = gql`
  query GetSchema($id: ID!) {
    schema(id: $id) {
      id
      name
      description
      nodes {
        id
        name
        kind
        parent
        path
        order
        dataType
        unit
        engineering
        objectData
        ${PAYLOAD_TEMPLATE_FIELDS}
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;
