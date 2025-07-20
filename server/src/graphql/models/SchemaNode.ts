import mongoose, { Document, Schema, Model } from 'mongoose';

export type SchemaNodeKind = 'group' | 'metric';
export type SchemaNodeDataType = 'Int' | 'Float' | 'Bool' | 'String';

export interface ISchemaNode extends Document {
  name: string;
  kind: SchemaNodeKind;
  parent: ISchemaNode['_id'] | null;
  path: string;
  order: number;
  dataType?: SchemaNodeDataType;
  unit?: string;
  engineering?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SchemaNodeSchema: Schema<ISchemaNode> = new mongoose.Schema(
  {
    // Common
    name: { type: String, required: true }, // e.g. "Line 24"
    kind: { type: String, enum: ['group', 'metric'], required: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchemaNode',
      default: null,
    },

    // Materialised path helps fast tree queries & unique constraints
    path: { type: String, required: true, index: true }, // "/Fiberon/1NL/PE/Line 24"

    // Ordering among siblings (drag-and-drop)
    order: { type: Number, default: 0 },

    // Metric-specific fields (only used when kind === 'metric')
    dataType: { type: String, enum: ['Int', 'Float', 'Bool', 'String'] },
    unit: { type: String }, // %, °C, etc.
    engineering: { type: Object }, // any custom meta
  },
  { timestamps: true }
);

// Ensure path uniqueness
SchemaNodeSchema.index({ path: 1 }, { unique: true });

const SchemaNode: Model<ISchemaNode> = mongoose.model<ISchemaNode>(
  'SchemaNode',
  SchemaNodeSchema
);

export default SchemaNode;
