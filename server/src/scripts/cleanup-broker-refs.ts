import mongoose from 'mongoose';
import Broker from '../graphql/models/Broker';
import SchemaModel from '../graphql/models/Schema';
import User from '../graphql/models/User';

async function cleanupOrphanedBrokerReferences() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    // Get all existing broker IDs
    const existingBrokers = await Broker.find({}, { _id: 1 });
    const validBrokerIds = existingBrokers.map((b) => b._id);

    console.log(`Found ${validBrokerIds.length} valid brokers`);

    // Remove invalid broker references from users
    const userResult = await User.updateMany(
      {},
      { $pull: { brokers: { $nin: validBrokerIds } } }
    );

    // Remove invalid broker references from schemas
    const schemaResult = await SchemaModel.updateMany(
      {},
      { $pull: { brokerIds: { $nin: validBrokerIds } } }
    );

    console.log(`Cleaned up ${userResult.modifiedCount} users`);
    console.log(`Cleaned up ${schemaResult.modifiedCount} schemas`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupOrphanedBrokerReferences();
