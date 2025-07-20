import { GraphQLClient } from 'graphql-request';
import {
  // mutations
  CREATE_SCHEMA_NODE,
  UPDATE_SCHEMA_NODE,
  DELETE_SCHEMA_NODE,
  // queries
  FETCH_SCHEMA_NODES,
  FETCH_SCHEMA_NODE,
  FETCH_SCHEMA_NODES_BY_PARENT,
} from './mutations/schemaNode.Mutations';

/* ------------------------------------------------------------------ */
/*  GraphQL client helper                                             */
/* ------------------------------------------------------------------ */

const endpoint = import.meta.env.VITE_API_URL;
if (!endpoint) throw new Error('VITE_API_URL is not defined');

const getClient = () => {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found');

  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface SchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent?: string | null;
  path: string;
  order?: number;
  dataType?: string;
  unit?: string;
  engineering?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

type SchemaNodesResponse = { schemaNodes: SchemaNode[] };
type SchemaNodeResponse = { schemaNode: SchemaNode };
type SchemaNodesByParentResponse = { schemaNodesByParent: SchemaNode[] };
type CreateSchemaNodeResponse = { createSchemaNode: SchemaNode };
type UpdateSchemaNodeResponse = { updateSchemaNode: SchemaNode };
type DeleteSchemaNodeResponse = { deleteSchemaNode: { id: string } };

/* ------------------------------------------------------------------ */
/*  Queries                                                           */
/* ------------------------------------------------------------------ */

export async function fetchSchemaNodes(): Promise<SchemaNode[]> {
  const client = getClient();
  const { schemaNodes }: SchemaNodesResponse = await client.request(
    FETCH_SCHEMA_NODES
  );
  return schemaNodes;
}

export async function fetchSchemaNode(id: string): Promise<SchemaNode | null> {
  const client = getClient();
  const { schemaNode }: SchemaNodeResponse = await client.request(
    FETCH_SCHEMA_NODE,
    { id }
  );
  return schemaNode;
}

export async function fetchSchemaNodesByParent(
  parentId: string
): Promise<SchemaNode[]> {
  const client = getClient();
  const { schemaNodesByParent }: SchemaNodesByParentResponse =
    await client.request(FETCH_SCHEMA_NODES_BY_PARENT, { parentId });
  return schemaNodesByParent;
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                         */
/* ------------------------------------------------------------------ */

export async function createSchemaNode(
  input: Omit<SchemaNode, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SchemaNode> {
  const client = getClient();
  const { createSchemaNode }: CreateSchemaNodeResponse = await client.request(
    CREATE_SCHEMA_NODE,
    { input }
  );
  return createSchemaNode;
}

export async function updateSchemaNode(
  id: string,
  input: Partial<SchemaNode>
): Promise<SchemaNode> {
  const client = getClient();
  const { updateSchemaNode }: UpdateSchemaNodeResponse = await client.request(
    UPDATE_SCHEMA_NODE,
    { id, input }
  );
  return updateSchemaNode;
}

export async function deleteSchemaNode(id: string): Promise<string> {
  const client = getClient();
  const {
    deleteSchemaNode: { id: deletedId },
  }: DeleteSchemaNodeResponse = await client.request(DELETE_SCHEMA_NODE, {
    id,
  });
  return deletedId; // return the ID of the removed node
}
