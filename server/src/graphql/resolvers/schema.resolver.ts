import { Types } from 'mongoose';

import Schema, { ISchema, ISchemaNode } from '../models/Schema';

interface Context {
  user?: any;
}

interface SchemaInput {
  users?: string[];
  name: string;
  description?: string;
  nodes?: SchemaNodeInput[];
  brokerIds?: string[];
}

interface SchemaNodeInput {
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
            : [context.user._id],
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
      { schemaId, nodes }: { schemaId: string; nodes: any[] },
      context: Context
    ) => {
      const { user } = context;
      if (!user) throw new Error('Unauthenticated');

      // 1️⃣ Create a tempId -> real Mongo ObjectId map
      const tempToReal = new Map<string, Types.ObjectId>();
      nodes.forEach((n) => tempToReal.set(n.id, new Types.ObjectId()));

      // 2️⃣ Build the array with correct _id + parent
      const docs = nodes.map((n) => ({
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
      await Schema.findByIdAndUpdate(schemaId, { $set: { nodes: [] } });

      // 4️⃣ Push the new nodes
      const updated = await Schema.findOneAndUpdate(
        { _id: schemaId, users: user._id },
        { $push: { nodes: { $each: docs } } },
        { new: true }
      );

      if (!updated) throw new Error('Schema not found or unauthorized');
      return updated;
    },

    addNodeToSchema: async (
      _: unknown,
      { schemaId, node }: { schemaId: string; node: SchemaNodeInput },
      context: Context
    ): Promise<ISchema | null> => {
      requireAuth(context);

      const schema = await Schema.findByIdAndUpdate(
        schemaId,
        { $push: { nodes: node } },
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
        { $pull: { nodes: { _id: nodeId } } },
        { new: true }
      );

      return schema;
    },
  },
};
