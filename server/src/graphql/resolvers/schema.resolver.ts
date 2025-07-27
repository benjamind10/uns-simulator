import { Types } from 'mongoose';

import Schema, { ISchema } from '../models/Schema';

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
  kind: 'group' | 'metric';
  parent?: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
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
        nodes: args.input.nodes || [],
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

      // 1️⃣ Create a tempId -> real Mongo ObjectId map
      const tempToReal = new Map<string, Types.ObjectId>();
      args.nodes.forEach((n) => tempToReal.set(n.id, new Types.ObjectId()));

      // 2️⃣ Build the array with correct _id + parent
      const docs = args.nodes.map((n) => ({
        _id: tempToReal.get(n.id), // generated Mongo id
        name: n.name,
        kind: n.kind,
        parent:
          n.parent && tempToReal.has(n.parent)
            ? tempToReal.get(n.parent) // replace temp id with real id
            : n.parent || null, // keep as-is if not in this batch
        path: n.path,
        order: n.order ?? 0,
        dataType: n.dataType,
        unit: n.unit,
        engineering: n.engineering ?? {},
      }));

      // 3️⃣ Remove all old nodes for this schema (optional, if you want to replace)
      await Schema.findByIdAndUpdate(args.schemaId, { $set: { nodes: [] } });

      // 4️⃣ Push the new nodes
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
        { $push: { nodes: args.node } },
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
        { $set: { 'nodes.$': args.node } },
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
