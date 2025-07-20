import { gql } from 'graphql-request';

export const CREATE_SCHEMA = gql`
  mutation CreateSchema($input: SchemaInput!) {
    createSchema(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_SCHEMA = gql`
  mutation UpdateSchema($id: ID!, $input: SchemaInput!) {
    updateSchema(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_SCHEMA = gql`
  mutation DeleteSchema($id: ID!) {
    deleteSchema(id: $id)
  }
`;

export const GET_SCHEMAS = gql`
  query GetSchemas {
    schemas {
      id
      name
      description
    }
  }
`;

export const GET_SCHEMA = gql`
  query GetSchema($id: ID!) {
    schema(id: $id) {
      id
      name
      description
    }
  }
`;
