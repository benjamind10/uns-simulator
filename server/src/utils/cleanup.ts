import Broker from '../graphql/models/Broker';
import Schema from '../graphql/models/Schema';
import User from '../graphql/models/User';

export async function cleanupOrphanedBrokerReferences() {
  // Get all existing broker IDs
  const existingBrokers = await Broker.find({}, { _id: 1 });
  const existingBrokerIds = existingBrokers.map((b) => b._id.toString());

  // Clean up users
  await User.updateMany(
    {},
    { $pull: { brokers: { $nin: existingBrokerIds } } }
  );

  // Clean up schemas
  await Schema.updateMany(
    {},
    { $pull: { brokerIds: { $nin: existingBrokerIds } } }
  );
}
