import { describe, it, expect } from 'vitest';

import {
  schemaReducer,
  clearSchemaError,
  setSelectedSchemaId,
} from '../../store/schema/schemaSlice';
import type { SchemaState } from '../../store/schema/schemaSlice';
import {
  fetchSchemasAsync,
  createSchemaAsync,
  updateSchemaAsync,
  deleteSchemaAsync,
} from '../../store/schema/schemaThunk';

const emptyState: SchemaState = {
  schemas: [],
  loading: false,
  error: null,
  selectedSchemaId: null,
};

const schema1 = {
  id: 's1',
  name: 'Schema 1',
  nodes: [],
  brokerIds: [],
  users: [],
  createdAt: '',
  updatedAt: '',
};
const schema2 = {
  id: 's2',
  name: 'Schema 2',
  nodes: [],
  brokerIds: [],
  users: [],
  createdAt: '',
  updatedAt: '',
};

describe('schemaSlice', () => {
  describe('reducers', () => {
    it('clearSchemaError clears the error', () => {
      const state = schemaReducer(
        { ...emptyState, error: 'some error' },
        clearSchemaError()
      );
      expect(state.error).toBeNull();
    });

    it('setSelectedSchemaId sets the selected schema', () => {
      const state = schemaReducer(emptyState, setSelectedSchemaId('s1'));
      expect(state.selectedSchemaId).toBe('s1');
    });
  });

  describe('fetchSchemasAsync', () => {
    it('sets loading on pending', () => {
      const state = schemaReducer(emptyState, {
        type: fetchSchemasAsync.pending.type,
      });
      expect(state.loading).toBe(true);
    });

    it('populates schemas on fulfilled', () => {
      const state = schemaReducer(
        { ...emptyState, loading: true },
        {
          type: fetchSchemasAsync.fulfilled.type,
          payload: [schema1, schema2],
        }
      );
      expect(state.loading).toBe(false);
      expect(state.schemas).toHaveLength(2);
    });

    it('sets error on rejected', () => {
      const state = schemaReducer(
        { ...emptyState, loading: true },
        {
          type: fetchSchemasAsync.rejected.type,
          error: { message: 'Fetch failed' },
        }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Fetch failed');
    });
  });

  describe('createSchemaAsync', () => {
    it('adds schema on fulfilled', () => {
      const state = schemaReducer(emptyState, {
        type: createSchemaAsync.fulfilled.type,
        payload: schema1,
      });
      expect(state.schemas).toHaveLength(1);
      expect(state.schemas[0].name).toBe('Schema 1');
    });
  });

  describe('updateSchemaAsync', () => {
    it('updates existing schema on fulfilled', () => {
      const updated = { ...schema1, name: 'Updated Schema' };
      const state = schemaReducer(
        { ...emptyState, schemas: [schema1, schema2] },
        {
          type: updateSchemaAsync.fulfilled.type,
          payload: updated,
        }
      );
      expect(state.schemas[0].name).toBe('Updated Schema');
    });
  });

  describe('deleteSchemaAsync', () => {
    it('removes schema on fulfilled', () => {
      const state = schemaReducer(
        { ...emptyState, schemas: [schema1, schema2] },
        {
          type: deleteSchemaAsync.fulfilled.type,
          payload: 's1',
        }
      );
      expect(state.schemas).toHaveLength(1);
      expect(state.schemas[0].id).toBe('s2');
    });
  });
});
