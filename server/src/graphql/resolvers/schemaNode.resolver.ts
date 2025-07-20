import SchemaNode, { ISchemaNode } from '../models/SchemaNode';

function requireAuth(context: any) {
  if (!context.user) {
    throw new Error('Authentication required');
  }
}

export const schemaNodeResolvers = {
  Query: {
    schemaNodes: async (_: any, __: any, context: any) => {
      requireAuth(context);
      return await SchemaNode.find();
    },
    schemaNode: async (_: any, { id }: { id: string }, context: any) => {
      requireAuth(context);
      return await SchemaNode.findById(id);
    },
    schemaNodesByParent: async (
      _: any,
      { parentId }: { parentId: string },
      context: any
    ) => {
      requireAuth(context);
      return await SchemaNode.find({ parent: parentId });
    },
  },
  Mutation: {
    createSchemaNode: async (
      _: any,
      { input }: { input: Partial<ISchemaNode> },
      context: any
    ) => {
      requireAuth(context);
      const node = new SchemaNode(input);
      await node.save();
      return node;
    },
    updateSchemaNode: async (
      _: any,
      { id, input }: { id: string; input: Partial<ISchemaNode> },
      context: any
    ) => {
      requireAuth(context);
      return await SchemaNode.findByIdAndUpdate(id, input, { new: true });
    },
    deleteSchemaNode: async (_: any, { id }: { id: string }) => {
      await SchemaNode.findByIdAndDelete(id);
      return true;
    },
  },
};
