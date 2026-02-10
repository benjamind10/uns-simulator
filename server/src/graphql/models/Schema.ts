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
export type SchemaNodeDataType = 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String';

export interface IPayloadTemplate {
  quality?: string;
  timestampMode?: 'auto' | 'fixed';
  fixedTimestamp?: number;
  value?: string | number | boolean;
  valueMode?: 'static' | 'random' | 'increment';
  minValue?: number;
  maxValue?: number;
  step?: number;
  precision?: number;
  customFields?: Array<{
    key: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
  }>;
}

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
  payloadTemplate?: IPayloadTemplate;
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
    dataType: { type: String, enum: ['Int', 'Float', 'Bool', 'Boolean', 'String'] },
    unit: String,
    engineering: { type: Object, default: {} },
    objectData: { type: Object, default: {} },
    payloadTemplate: {
      quality: { type: String },
      timestampMode: { type: String, enum: ['auto', 'fixed'] },
      fixedTimestamp: { type: Number },
      value: { type: MongooseSchema.Types.Mixed },
      valueMode: { type: String, enum: ['static', 'random', 'increment'] },
      minValue: { type: Number },
      maxValue: { type: Number },
      step: { type: Number },
      precision: { type: Number },
      customFields: [
        {
          key: { type: String, required: true },
          value: { type: MongooseSchema.Types.Mixed, required: true },
          type: {
            type: String,
            enum: ['string', 'number', 'boolean'],
            required: true,
          },
          _id: false,
        },
      ],
    },
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
