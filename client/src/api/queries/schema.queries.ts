import { gql } from 'graphql-request';

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
      }
      brokerIds
      users
      createdAt
      updatedAt
    }
  }
`;
