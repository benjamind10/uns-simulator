import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type SchemaNodeKind = 'group' | 'metric';
export type SchemaNodeDataType = 'Int' | 'Float' | 'Bool' | 'String';

export interface ISchemaNode {
  _id?: Types.ObjectId;
  name: string;
  kind: SchemaNodeKind;
  parent: ISchemaNode['_id'] | null;
  schema: Types.ObjectId;
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
    name: { type: String, required: true },
    kind: { type: String, enum: ['group', 'metric'], required: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchemaNode',
      default: null,
    },
    schema: {
      // <-- Add this block
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schema',
      required: true,
      index: true,
    },
    path: { type: String, required: true, index: true },
    order: { type: Number, default: 0 },
    dataType: { type: String, enum: ['Int', 'Float', 'Bool', 'String'] },
    unit: { type: String },
    engineering: { type: Object },
  },
  { timestamps: true }
);

// Ensure path uniqueness
SchemaNodeSchema.index({ path: 1 }, { unique: true });

const SchemaNode = mongoose.model('SchemaNode', SchemaNodeSchema);

export default SchemaNode;
