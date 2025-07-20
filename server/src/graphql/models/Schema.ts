import mongoose, {
  Document,
  Schema as MongooseSchema,
  Model,
  Types,
} from 'mongoose';

export type SchemaNodeKind = 'group' | 'metric';
export type SchemaNodeDataType = 'Int' | 'Float' | 'Bool' | 'String';

export interface ISchemaNode {
  id: string;
  name: string;
  kind: SchemaNodeKind;
  parent: string | null;
  path: string;
  order: number;
  dataType?: SchemaNodeDataType;
  unit?: string;
  engineering?: Record<string, unknown>;
}

export interface ISchema extends Document {
  name: string;
  description?: string;
  nodes: ISchemaNode[];
  brokerIds?: string[];
  users: Types.ObjectId[]; // <-- Change from userId to users array
  createdAt: Date;
  updatedAt: Date;
}

const SchemaNodeSubSchema = new MongooseSchema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  kind: { type: String, enum: ['group', 'metric'], required: true },
  parent: { type: String, default: null },
  path: { type: String, required: true },
  order: { type: Number, default: 0 },
  dataType: { type: String, enum: ['Int', 'Float', 'Bool', 'String'] },
  unit: { type: String },
  engineering: { type: Object, default: {} },
});

const SchemaSchema: MongooseSchema<ISchema> = new MongooseSchema(
  {
    name: { type: String, required: true },
    description: { type: String },
    nodes: [SchemaNodeSubSchema],
    brokerIds: [{ type: String, ref: 'Broker' }],
    users: [
      { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
    ], // <-- Change to users array
  },
  { timestamps: true }
);

const Schema: Model<ISchema> = mongoose.model<ISchema>('Schema', SchemaSchema);

export default Schema;
