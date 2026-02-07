# MongoDB Transactions

## Current Status

The application currently runs **without transactions** to support standalone MongoDB instances (typical in development environments).

## What Changed

Previously, the `deleteBroker` mutation in `server/src/graphql/resolvers/broker.resolver.ts` used MongoDB transactions to ensure atomicity when:
- Deleting a broker
- Removing broker references from users
- Removing broker references from schemas
- Clearing broker references from simulation profiles

Transactions were removed because they require MongoDB to be configured as a **replica set**, which caused this error in standalone mode:

```
Transaction numbers are only allowed on a replica set member or mongos
```

## Current Behavior (Without Transactions)

Operations execute sequentially:
1. Count affected simulation profiles
2. Delete the broker document
3. Remove broker ID from all users' broker arrays
4. Remove broker ID from all schemas' brokerIds arrays
5. Clear brokerId field from affected simulation profiles

**Risk:** If an operation fails mid-way, previous operations won't be rolled back. However, this is acceptable for most use cases.

## Enabling Transactions (Production)

If you need atomic transactions in production, you must configure MongoDB as a replica set.

### Option 1: Docker Compose Replica Set

Update `docker-compose.yml`:

```yaml
services:
  mongo:
    image: mongo:7
    command: ["--replSet", "rs0"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 40s

  mongo-init:
    image: mongo:7
    depends_on:
      mongo:
        condition: service_healthy
    entrypoint: >
      bash -c '
        sleep 5 &&
        mongosh --host mongo -u admin -p password --authenticationDatabase admin <<EOF
          rs.initiate({
            _id: "rs0",
            members: [{ _id: 0, host: "mongo:27017" }]
          })
        EOF
      '
```

### Option 2: MongoDB Atlas

MongoDB Atlas (cloud) automatically provides replica set configuration. No code changes needed - just update your connection string.

### Option 3: Local Replica Set

```bash
# Start MongoDB with replica set
mongod --replSet rs0 --port 27017 --dbpath /data/db

# In another terminal, initialize replica set
mongosh
> rs.initiate()
```

## Re-enabling Transaction Code

Once MongoDB is configured as a replica set, restore the transaction code in `broker.resolver.ts`:

```typescript
deleteBroker: async (_parent: {}, args: { id: string }, context: Context): Promise<boolean> => {
  requireAuth(context);

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // Get count of affected simulation profiles
    const SimulationProfile = (await import('../models/SimulationProfile')).default;
    const affectedProfiles = await SimulationProfile.countDocuments({
      brokerId: args.id,
    }).session(session);

    // Delete the broker
    await Broker.findByIdAndDelete(args.id).session(session);

    // Remove broker reference from all users
    await User.updateMany(
      { brokers: args.id },
      { $pull: { brokers: args.id } }
    ).session(session);

    // Remove broker reference from all schemas
    await SchemaModel.updateMany(
      { brokerIds: args.id },
      { $pull: { brokerIds: args.id } }
    ).session(session);

    // Clear brokerId from all simulation profiles
    if (affectedProfiles > 0) {
      await SimulationProfile.updateMany(
        { brokerId: args.id },
        { $unset: { brokerId: '' } }
      ).session(session);
    }

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
```

## Other Mutations That Could Benefit

Consider adding transactions to:

- `deleteSchema` - Currently uses try/catch but not transactions
- `deleteSimulationProfile` - If it needs cascade operations
- `updateSimulationProfile` - If updating multiple related documents

## Testing Transactions

```javascript
// Test transaction rollback
const session = await mongoose.startSession();
try {
  await session.startTransaction();
  
  // This should succeed
  await Model1.create([{ data: 'test' }], { session });
  
  // This should fail and rollback Model1 creation
  throw new Error('Simulated failure');
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  console.log('Transaction rolled back');
} finally {
  await session.endSession();
}
```

## References

- [MongoDB Transactions Documentation](https://www.mongodb.com/docs/manual/core/transactions/)
- [Mongoose Transactions](https://mongoosejs.com/docs/transactions.html)
- [Deploy Replica Set](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/)
