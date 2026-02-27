import { Router } from 'express';
import * as notifications from '../services/notifications.js';
import { addAddressesToWebhook } from '../services/alchemy-webhooks.js';
import { getNotificationHistory, markNotificationsRead, getUnreadCount } from '../services/notifications.js';

const router = Router();

/**
 * POST /notifications/register
 * Register a device with push token and wallet addresses
 *
 * Body: {
 *   deviceId: string,
 *   pushToken: string,
 *   platform: "ios" | "android",
 *   addresses: string[]
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { deviceId, pushToken, platform, addresses } = req.body;

    // Validate required fields
    if (!deviceId || !pushToken || !platform || !addresses) {
      return res.status(400).json({
        error: 'Missing required fields: deviceId, pushToken, platform, addresses',
      });
    }

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        error: 'addresses must be a non-empty array',
      });
    }

    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        error: 'platform must be "ios" or "android"',
      });
    }

    // Register device in MongoDB
    const result = await notifications.registerDevice({
      deviceId,
      pushToken,
      platform,
      addresses,
    });

    // Add addresses to Alchemy webhooks for monitoring
    // This is done asynchronously - don't block the response
    addAddressesToWebhook(addresses).catch((err) => {
      console.error('Failed to add addresses to Alchemy webhook:', err.message);
    });

    res.json({
      success: true,
      message: result.upserted ? 'Device registered' : 'Device updated',
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /notifications/unregister
 * Unregister a device
 *
 * Body: { deviceId: string }
 */
router.post('/unregister', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' });
    }

    const result = await notifications.unregisterDevice(deviceId);

    res.json({
      success: true,
      removed: result.success,
    });
  } catch (error) {
    console.error('Unregister error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /notifications/addresses
 * Add or remove addresses from a device's monitored list
 *
 * Body: {
 *   deviceId: string,
 *   add?: string[],
 *   remove?: string[]
 * }
 */
router.patch('/addresses', async (req, res) => {
  try {
    const { deviceId, add, remove } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' });
    }

    if (!add && !remove) {
      return res.status(400).json({
        error: 'Must provide "add" or "remove" array',
      });
    }

    const results = { added: false, removed: false };

    if (add && Array.isArray(add) && add.length > 0) {
      const addResult = await notifications.addAddresses(deviceId, add);
      results.added = addResult.success;

      // Add new addresses to Alchemy webhooks
      addAddressesToWebhook(add).catch((err) => {
        console.error('Failed to add addresses to Alchemy webhook:', err.message);
      });
    }

    if (remove && Array.isArray(remove) && remove.length > 0) {
      const removeResult = await notifications.removeAddresses(deviceId, remove);
      results.removed = removeResult.success;
      // Note: We don't remove addresses from Alchemy webhooks
      // They're cheap (50k per webhook) and other devices might use them
    }

    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Address update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/device/:deviceId
 * Get device registration status (for debugging)
 */
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await notifications.getDevice(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      deviceId: device.deviceId,
      platform: device.platform,
      addressCount: device.addresses?.length || 0,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    });
  } catch (error) {
    console.error('Device lookup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/history/:deviceId
 * Get notification history for a device (cursor-paginated)
 *
 * Query: { limit?: number, before?: ISO string }
 */
router.get('/history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit, before } = req.query;

    const result = await getNotificationHistory(deviceId, {
      limit: limit ? parseInt(limit, 10) : 20,
      before: before || undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Notification history error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /notifications/read
 * Mark notifications as read
 *
 * Body: { deviceId: string, notificationIds?: string[] }
 */
router.patch('/read', async (req, res) => {
  try {
    const { deviceId, notificationIds } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' });
    }

    const result = await markNotificationsRead(deviceId, notificationIds);
    res.json(result);
  } catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /notifications/unread-count/:deviceId
 * Get unread notification count for a device
 */
router.get('/unread-count/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const count = await getUnreadCount(deviceId);
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
