import { MongoClient } from 'mongodb';

let client = null;
let db = null;

/**
 * Connect to MongoDB and set up indexes
 */
export async function connectMongo() {
  if (db) return db;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  client = new MongoClient(uri);

  await client.connect();
  db = client.db('pouch');

  // Create indexes for devices collection
  await db.collection('devices').createIndex({ deviceId: 1 }, { unique: true });
  await db.collection('devices').createIndex({ addresses: 1 });

  // Create index for webhookAddresses collection (tracking what's in Alchemy)
  await db.collection('webhookAddresses').createIndex({ address: 1 }, { unique: true });

  // Create indexes for notifications collection
  await db.collection('notifications').createIndex({ deviceId: 1, createdAt: -1 });
  await db.collection('notifications').createIndex({ deviceId: 1, read: 1 });

  console.log('MongoDB connected');
  return db;
}

/**
 * Get the database instance
 */
export function getDb() {
  if (!db) throw new Error('MongoDB not connected. Call connectMongo() first.');
  return db;
}

/**
 * Close the MongoDB connection
 */
export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB disconnected');
  }
}
