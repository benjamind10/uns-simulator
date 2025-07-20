import { Schema } from 'mongoose';
import SchemaModel from '../models/Schema';

export const schemaResolvers = {
  Query: {
    schemas: async () => SchemaModel.find(),
    schema: async (_: any, { id }: { id: string }) => SchemaModel.findById(id),
  },
  Mutation: {
    createSchema: async (_: any, { input }: any) => SchemaModel.create(input),
    updateSchema: async (_: any, { id, input }: any) =>
      SchemaModel.findByIdAndUpdate(id, input, { new: true }),
    deleteSchema: async (_: any, { id }: any) =>
      !!(await SchemaModel.findByIdAndDelete(id)),
  },
};
