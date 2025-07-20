import Schema, { ISchema, ISchemaNode } from '../models/Schema';
import { Types } from 'mongoose';

interface Context {
  user?: any; // You can define a proper User type here
}

interface SchemaInput {
  users: string[];
  name: string;
  description?: string;
  nodes?: ISchemaNode[];
  brokerIds?: string[];
}

interface SchemaNodeInput {
  name: string;
  kind: 'group' | 'metric';
  parent?: string;
  path: string;
  order?: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
}

function requireAuth(context: Context): void {
  if (!context.user) {
    throw new Error('Authentication required');
  }
}

export const schemaResolvers = {
  Query: {
    schemas: async (
      _: unknown,
      __: unknown,
      context: Context
    ): Promise<ISchema[]> => {
      requireAuth(context);
      return await Schema.find();
    },

    schema: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);
      return await Schema.findById(id);
    },
  },

  Mutation: {
    createSchema: async (
      _: unknown,
      { input }: { input: SchemaInput },
      context: Context
    ): Promise<ISchema> => {
      requireAuth(context);
      const schema = new Schema({
        name: input.name,
        description: input.description,
        nodes: input.nodes || [],
        brokerIds: input.brokerIds || [],
        users:
          input.users && input.users.length > 0
            ? input.users
            : [context.user._id], // <-- Fix here
      });
      return await schema.save();
    },

    updateSchema: async (
      _: unknown,
      { id, input }: { id: string; input: Partial<SchemaInput> },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);
      return await Schema.findByIdAndUpdate(id, input, { new: true });
    },

    deleteSchema: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<boolean> => {
      requireAuth(context);
      await Schema.findByIdAndDelete(id);
      return true;
    },

    saveNodesToSchema: async (
      _: unknown,
      { schemaId, nodes }: { schemaId: string; nodes: SchemaNodeInput[] },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const nodesWithIds = nodes.map((node: SchemaNodeInput) => ({
        ...node,
        _id: new Types.ObjectId(),
      }));

      const schema = await Schema.findByIdAndUpdate(
        schemaId,
        { $push: { nodes: { $each: nodesWithIds } } },
        { new: true }
      );

      return schema;
    },

    addNodeToSchema: async (
      _: unknown,
      { schemaId, node }: { schemaId: string; node: SchemaNodeInput },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const nodeWithId = {
        ...node,
        _id: new Types.ObjectId(),
      };

      const schema = await Schema.findByIdAndUpdate(
        schemaId,
        { $push: { nodes: nodeWithId } },
        { new: true }
      );

      return schema;
    },

    deleteNodeFromSchema: async (
      _: unknown,
      { schemaId, nodeId }: { schemaId: string; nodeId: string },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const schema = await Schema.findByIdAndUpdate(
        schemaId,
        { $pull: { nodes: { _id: nodeId } } }, // Use _id instead of id
        { new: true }
      );

      return schema;
    },
  },
};
