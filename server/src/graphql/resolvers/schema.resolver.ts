import { Types } from 'mongoose';

import Schema, { ISchema, ISchemaNode } from '../models/Schema';

interface Context {
  user?: { _id: string };
}

interface SchemaInput {
  users?: string[];
  name: string;
  description?: string;
  nodes?: SchemaNodeInput[];
  brokerIds?: string[];
}

interface SchemaNodeInput {
  id: string;
  name: string;
  kind: 'group' | 'metric' | 'object'; // <-- add 'object'
  parent?: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  objectData?: Record<string, unknown>; // <-- add this for custom JSON
}

function requireAuth(context: Context): void {
  if (!context.user) throw new Error('Authentication required');
}

export const schemaResolvers = {
  Query: {
    schemas: async (_: {}, __: {}, context: Context): Promise<ISchema[]> => {
      requireAuth(context);
      return await Schema.find();
    },
    schema: async (
      _: {},
      args: { id: string },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);
      return await Schema.findById(args.id);
    },
    getNodes: async (
      _: {},
      args: { schemaId: string },
      context: Context
    ): Promise<ISchemaNode[]> => {
      requireAuth(context);
      const schema = await Schema.findById(args.schemaId);
      if (!schema) throw new Error('Schema not found');
      return schema.nodes;
    },
  },

  Mutation: {
    createSchema: async (
      _: {},
      args: { input: SchemaInput },
      context: Context
    ): Promise<ISchema> => {
      requireAuth(context);
      const schema = new Schema({
        name: args.input.name,
        description: args.input.description,
        nodes: (args.input.nodes || []).map((n) => ({
          ...n,
          objectData: n.objectData ?? {}, // ensure objectData is present
        })),
        brokerIds: args.input.brokerIds || [],
        users:
          args.input.users && args.input.users.length > 0
            ? args.input.users
            : [context.user?._id ?? ''],
      });
      return await schema.save();
    },

    updateSchema: async (
      _: {},
      args: { id: string; input: Partial<SchemaInput> },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);
      return await Schema.findByIdAndUpdate(args.id, args.input, { new: true });
    },

    deleteSchema: async (
      _: {},
      args: { id: string },
      context: Context
    ): Promise<boolean> => {
      requireAuth(context);
      await Schema.findByIdAndDelete(args.id);
      return true;
    },

    saveNodesToSchema: async (
      _: {},
      args: { schemaId: string; nodes: SchemaNodeInput[] },
      context: Context
    ): Promise<ISchema | null> => {
      const { user } = context;
      if (!user) throw new Error('Unauthenticated');

      const tempToReal = new Map<string, Types.ObjectId>();
      args.nodes.forEach((n) => tempToReal.set(n.id, new Types.ObjectId()));

      const docs = args.nodes.map((n) => ({
        _id: tempToReal.get(n.id),
        name: n.name,
        kind: n.kind,
        parent:
          n.parent && tempToReal.has(n.parent)
            ? tempToReal.get(n.parent)
            : n.parent || null,
        path: n.path,
        order: n.order ?? 0,
        dataType: n.dataType,
        unit: n.unit,
        engineering: n.engineering ?? {},
        objectData: n.objectData ?? {}, // <-- support objectData
      }));

      await Schema.findByIdAndUpdate(args.schemaId, { $set: { nodes: [] } });

      const updated = await Schema.findOneAndUpdate(
        { _id: args.schemaId, users: user._id },
        { $push: { nodes: { $each: docs } } },
        { new: true }
      );

      if (!updated) throw new Error('Schema not found or unauthorized');
      return updated;
    },

    addNodeToSchema: async (
      _: {},
      args: { schemaId: string; node: SchemaNodeInput },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const schema = await Schema.findByIdAndUpdate(
        args.schemaId,
        {
          $push: {
            nodes: { ...args.node, objectData: args.node.objectData ?? {} },
          },
        }, // <-- support objectData
        { new: true }
      );

      return schema;
    },

    updateNodeInSchema: async (
      _: {},
      args: { schemaId: string; nodeId: string; node: SchemaNodeInput },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const schema = await Schema.findOneAndUpdate(
        { _id: args.schemaId, 'nodes._id': args.nodeId },
        {
          $set: {
            'nodes.$': { ...args.node, objectData: args.node.objectData ?? {} },
          },
        }, // <-- support objectData
        { new: true }
      );

      return schema;
    },

    deleteNodeFromSchema: async (
      _: {},
      args: { schemaId: string; nodeId: string },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const schema = await Schema.findByIdAndUpdate(
        args.schemaId,
        { $pull: { nodes: { _id: args.nodeId } } },
        { new: true }
      );

      return schema;
    },
  },
};
