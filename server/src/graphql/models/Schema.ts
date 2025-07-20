import mongoose from 'mongoose';

const SchemaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  schemaNodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchemaNode' }],
});

export default mongoose.model('Schema', SchemaSchema);
