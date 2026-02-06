import { createMockContext, createAuthenticatedContext } from '../helpers/mockContext';

const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockSave = jest.fn();

jest.mock('../../graphql/models/Schema', () => {
  const MockSchema = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: (...args: any[]) => mockSave(...args),
  }));
  (MockSchema as any).find = (...args: any[]) => mockFind(...args);
  (MockSchema as any).findById = (...args: any[]) => mockFindById(...args);
  (MockSchema as any).findByIdAndUpdate = (...args: any[]) =>
    mockFindByIdAndUpdate(...args);
  (MockSchema as any).findByIdAndDelete = (...args: any[]) =>
    mockFindByIdAndDelete(...args);
  (MockSchema as any).findOneAndUpdate = (...args: any[]) =>
    mockFindOneAndUpdate(...args);
  return { __esModule: true, default: MockSchema };
});

// Require after mocks are set up
const { schemaResolvers } = require('../../graphql/resolvers/schema.resolver');

describe('schemaResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.schemas', () => {
    it('returns schemas when authenticated', async () => {
      const context = createAuthenticatedContext();
      const mockSchemas = [{ name: 'Schema 1' }, { name: 'Schema 2' }];
      mockFind.mockResolvedValue(mockSchemas);

      const result = await schemaResolvers.Query.schemas({}, {}, context);

      expect(result).toEqual(mockSchemas);
      expect(mockFind).toHaveBeenCalled();
    });

    it('throws when not authenticated', async () => {
      const context = createMockContext();

      await expect(
        schemaResolvers.Query.schemas({}, {}, context)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Query.schema', () => {
    it('returns a schema by id', async () => {
      const context = createAuthenticatedContext();
      const mockSchema = { _id: 'schema-1', name: 'Test Schema' };
      mockFindById.mockResolvedValue(mockSchema);

      const result = await schemaResolvers.Query.schema(
        {},
        { id: 'schema-1' },
        context
      );

      expect(result).toEqual(mockSchema);
    });
  });

  describe('Query.getNodes', () => {
    it('returns nodes from a schema', async () => {
      const context = createAuthenticatedContext();
      const nodes = [{ id: 'n1', name: 'temp', kind: 'metric' }];
      mockFindById.mockResolvedValue({ nodes });

      const result = await schemaResolvers.Query.getNodes(
        {},
        { schemaId: 'schema-1' },
        context
      );

      expect(result).toEqual(nodes);
    });

    it('throws when schema not found', async () => {
      const context = createAuthenticatedContext();
      mockFindById.mockResolvedValue(null);

      await expect(
        schemaResolvers.Query.getNodes({}, { schemaId: 'bad-id' }, context)
      ).rejects.toThrow('Schema not found');
    });
  });

  describe('Mutation.createSchema', () => {
    it('creates a schema with the current user', async () => {
      const context = createAuthenticatedContext();
      const input = { name: 'New Schema', description: 'desc' };
      mockSave.mockResolvedValue({ ...input, users: [context.user!._id] });

      await schemaResolvers.Mutation.createSchema({}, { input }, context);

      expect(mockSave).toHaveBeenCalled();
    });

    it('throws when not authenticated', async () => {
      const context = createMockContext();

      await expect(
        schemaResolvers.Mutation.createSchema(
          {},
          { input: { name: 'New Schema' } },
          context
        )
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Mutation.deleteSchema', () => {
    it('deletes a schema and returns true', async () => {
      const context = createAuthenticatedContext();
      mockFindByIdAndDelete.mockResolvedValue(null);

      const result = await schemaResolvers.Mutation.deleteSchema(
        {},
        { id: 'schema-1' },
        context
      );

      expect(result).toBe(true);
    });
  });

  describe('Mutation.saveNodesToSchema', () => {
    it('maps temp IDs to real ObjectIds and saves', async () => {
      const context = createAuthenticatedContext();
      const nodes = [
        {
          id: 'temp-1',
          name: 'node1',
          kind: 'metric' as const,
          path: 'node1',
          order: 0,
        },
      ];
      mockFindByIdAndUpdate.mockResolvedValue(null);
      mockFindOneAndUpdate.mockResolvedValue({
        _id: 'schema-1',
        nodes: [{ name: 'node1' }],
      });

      const result = await schemaResolvers.Mutation.saveNodesToSchema(
        {},
        { schemaId: 'schema-1', nodes },
        context
      );

      expect(result).toBeTruthy();
      expect(mockFindOneAndUpdate).toHaveBeenCalled();
    });

    it('throws when unauthenticated', async () => {
      const context = createMockContext();

      await expect(
        schemaResolvers.Mutation.saveNodesToSchema(
          {},
          { schemaId: 'schema-1', nodes: [] },
          context
        )
      ).rejects.toThrow('Unauthenticated');
    });
  });
});
