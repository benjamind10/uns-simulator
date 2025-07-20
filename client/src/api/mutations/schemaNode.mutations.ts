import { gql } from 'graphql-request';

export const CREATE_SCHEMA_NODE = gql`
  mutation CreateSchemaNode($input: SchemaNodeInput!) {
    createSchemaNode(input: $input) {
      id
      name
      kind
      parent
      path
      order
      dataType
      unit
      engineering
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SCHEMA_NODE = gql`
  mutation UpdateSchemaNode($id: ID!, $input: SchemaNodeInput!) {
    updateSchemaNode(id: $id, input: $input) {
      id
      name
      kind
      parent
      path
      order
      dataType
      unit
      engineering
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SCHEMA_NODE = gql`
  mutation DeleteSchemaNode($id: ID!) {
    deleteSchemaNode(id: $id) {
      id
    }
  }
`;

export const FETCH_SCHEMA_NODES = gql`
  query GetSchemaNodes {
    schemaNodes {
      id
      name
      kind
      parent
      path
      order
      dataType
      unit
      engineering
      createdAt
      updatedAt
    }
  }
`;
export const FETCH_SCHEMA_NODE = gql`
  query GetSchemaNode($id: ID!) {
    schemaNode(id: $id) {
      id
      name
      kind
      parent
      path
      order
      dataType
      unit
      engineering
      createdAt
      updatedAt
    }
  }
`;

export const FETCH_SCHEMA_NODES_BY_PARENT = gql`
  query GetSchemaNodesByParent($parentId: ID!) {
    schemaNodesByParent(parentId: $parentId) {
      id
      name
      kind
      parent
      path
      order
      dataType
      unit
      engineering
      createdAt
      updatedAt
    }
  }
`;
