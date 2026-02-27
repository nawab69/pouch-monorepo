import { ObjectId } from 'mongodb';
import { getDb } from './mongodb.js';

/**
 * Register a device with its push token and wallet addresses
 */
export async function registerDevice({ deviceId, pushToken, platform, addresses }) {
  const db = getDb();
  const normalizedAddresses = addresses.map((a) => a.toLowerCase());

  const result = await db.collection('devices').updateOne(
    { deviceId },
    {
      $set: {
        pushToken,
        platform,
        addresses: normalizedAddresses,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return {
    success: true,
    upserted: result.upsertedCount > 0,
    modified: result.modifiedCount > 0,
  };
}

/**
 * Unregister a device
 */
export async function unregisterDevice(deviceId) {
  const db = getDb();
  const result = await db.collection('devices').deleteOne({ deviceId });
  return { success: result.deletedCount > 0 };
}

/**
 * Add addresses to a device's monitored list
 */
export async function addAddresses(deviceId, addresses) {
  const db = getDb();
  const normalizedAddresses = addresses.map((a) => a.toLowerCase());

  const result = await db.collection('devices').updateOne(
    { deviceId },
    {
      $addToSet: { addresses: { $each: normalizedAddresses } },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: result.modifiedCount > 0 || result.matchedCount > 0 };
}

/**
 * Remove addresses from a device's monitored list
 */
export async function removeAddresses(deviceId, addresses) {
  const db = getDb();
  const normalizedAddresses = addresses.map((a) => a.toLowerCase());

  const result = await db.collection('devices').updateOne(
    { deviceId },
    {
      $pull: { addresses: { $in: normalizedAddresses } },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: result.modifiedCount > 0 || result.matchedCount > 0 };
}

/**
 * Get all devices that have a specific address in their monitored list
 */
export async function getDevicesByAddress(address) {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();

  const devices = await db
    .collection('devices')
    .find({ addresses: normalizedAddress })
    .toArray();

  return devices;
}

/**
 * Get a device by its ID
 */
export async function getDevice(deviceId) {
  const db = getDb();
  return db.collection('devices').findOne({ deviceId });
}

/**
 * Get all unique addresses across all devices
 */
export async function getAllMonitoredAddresses() {
  const db = getDb();
  const result = await db.collection('devices').aggregate([
    { $unwind: '$addresses' },
    { $group: { _id: '$addresses' } },
  ]).toArray();

  return result.map((r) => r._id);
}

/**
 * Remove invalid push token (DeviceNotRegistered)
 */
export async function removeInvalidPushToken(pushToken) {
  const db = getDb();
  const result = await db.collection('devices').deleteMany({ pushToken });
  return { removed: result.deletedCount };
}

/**
 * Store a notification for history/display
 */
export async function storeNotification({ deviceId, address, type, direction, title, body, data }) {
  const db = getDb();
  const result = await db.collection('notifications').insertOne({
    deviceId,
    address: address?.toLowerCase(),
    type,
    direction,
    title,
    body,
    data,
    read: false,
    createdAt: new Date(),
  });
  return { success: true, id: result.insertedId };
}

/**
 * Get notification history for a device (cursor-paginated)
 */
export async function getNotificationHistory(deviceId, { limit = 20, before } = {}) {
  const db = getDb();
  const query = { deviceId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const notifications = await db
    .collection('notifications')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  const nextCursor = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].createdAt.toISOString()
    : null;

  return { notifications, hasMore, nextCursor };
}

/**
 * Mark notifications as read (specific IDs or all for a device)
 */
export async function markNotificationsRead(deviceId, notificationIds) {
  const db = getDb();
  const query = { deviceId };

  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds.map((id) => new ObjectId(id)) };
  }

  const result = await db
    .collection('notifications')
    .updateMany(query, { $set: { read: true } });

  return { success: true, modified: result.modifiedCount };
}

/**
 * Get unread notification count for a device
 */
export async function getUnreadCount(deviceId) {
  const db = getDb();
  const count = await db
    .collection('notifications')
    .countDocuments({ deviceId, read: false });
  return count;
}
