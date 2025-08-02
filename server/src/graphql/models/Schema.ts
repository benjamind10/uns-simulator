import mongoose, {
  Document,
  Schema as MongooseSchema,
  Model,
  Types,
} from 'mongoose';

/* ────────────────────────
   Types
──────────────────────────*/
export type SchemaNodeKind = 'group' | 'metric' | 'object';
export type SchemaNodeDataType = 'Int' | 'Float' | 'Bool' | 'String';

export interface ISchemaNode {
  id: string;
  _id?: Types.ObjectId;
  name: string;
  kind: SchemaNodeKind;
  parent: string | null;
  path: string;
  order: number;
  dataType?: SchemaNodeDataType;
  unit?: string;
  engineering?: Record<string, unknown>;
  objectData?: Record<string, unknown>;
}

export interface ISchema extends Document {
  name: string;
  description?: string;
  nodes: ISchemaNode[];
  brokerIds?: string[];
  users: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/* ────────────────────────
   Sub-schema for nodes
──────────────────────────*/
const SchemaNodeSubSchema = new MongooseSchema<ISchemaNode>(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['group', 'metric', 'object'], required: true },
    parent: { type: String, default: null },
    path: { type: String, required: true },
    order: { type: Number, default: 0 },
    dataType: { type: String, enum: ['Int', 'Float', 'Bool', 'String'] },
    unit: String,
    engineering: { type: Object, default: {} },
    objectData: { type: Object, default: {} },
  },
  { _id: true }
);

/* ────────────────────────
   Main Schema model
──────────────────────────*/
const SchemaSchema = new MongooseSchema<ISchema>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: String,
    nodes: { type: [SchemaNodeSubSchema], default: [] },
    brokerIds: [{ type: String, ref: 'Broker' }],
    users: [
      { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
    ],
  },
  { timestamps: true }
);

SchemaSchema.index({ users: 1 });

const SchemaModel: Model<ISchema> = mongoose.model<ISchema>(
  'Schema',
  SchemaSchema
);

export default SchemaModel;
