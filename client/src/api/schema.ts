import { GraphQLClient } from 'graphql-request';
import {
  CREATE_SCHEMA,
  UPDATE_SCHEMA,
  DELETE_SCHEMA,
  GET_SCHEMAS,
  GET_SCHEMA,
} from './mutations/schema.mutations';

const endpoint = import.meta.env.VITE_API_URL;

if (!endpoint) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

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

export type ISchema = {
  id: string;
  name: string;
  description?: string;
};

type SchemasResponse = {
  schemas: ISchema[];
};

type SchemaResponse = {
  schema: ISchema;
};

type CreateSchemaInput = {
  name: string;
  description?: string;
};

type CreateSchemaResponse = {
  createSchema: ISchema;
};

type UpdateSchemaResponse = {
  updateSchema: ISchema;
};

type DeleteSchemaResponse = {
  deleteSchema: boolean;
};

// Fetch all schemas
export async function fetchSchemas(): Promise<ISchema[]> {
  const client = getClient();
  const data: SchemasResponse = await client.request(GET_SCHEMAS);
  return data.schemas;
}

// Fetch a single schema by ID
export async function fetchSchema(id: string): Promise<ISchema> {
  const client = getClient();
  const data: SchemaResponse = await client.request(GET_SCHEMA, { id });
  return data.schema;
}

// Create a new schema
export async function createSchema(input: CreateSchemaInput): Promise<ISchema> {
  const client = getClient();
  const variables = { input };
  const data: CreateSchemaResponse = await client.request(
    CREATE_SCHEMA,
    variables
  );
  return data.createSchema;
}

// Update a schema
export async function updateSchema(
  id: string,
  input: CreateSchemaInput
): Promise<ISchema> {
  const client = getClient();
  const variables = { id, input };
  const data: UpdateSchemaResponse = await client.request(
    UPDATE_SCHEMA,
    variables
  );
  return data.updateSchema;
}

// Delete a schema
export async function deleteSchema(id: string): Promise<boolean> {
  const client = getClient();
  const variables = { id };
  const data: DeleteSchemaResponse = await client.request(
    DELETE_SCHEMA,
    variables
  );
  return data.deleteSchema;
}
