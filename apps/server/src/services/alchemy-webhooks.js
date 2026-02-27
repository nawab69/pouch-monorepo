import { getDb } from './mongodb.js';

/**
 * Alchemy webhook configuration
 *
 * Each webhook monitors ONE network (Alchemy limitation).
 * Each Alchemy account can have up to 3 webhooks.
 * Each webhook can monitor up to 100,000 addresses.
 *
 * Recommended setup (1 account, 3 webhooks):
 *   Webhook 1: ETH_MAINNET or ETH_SEPOLIA
 *   Webhook 2: MATIC_MAINNET or MATIC_AMOY
 *   Webhook 3: BASE_MAINNET or BASE_SEPOLIA
 *
 * For more networks, create additional Alchemy accounts.
 *
 * Environment variables per webhook:
 *   ALCHEMY_WEBHOOK_1_ID, ALCHEMY_WEBHOOK_1_SIGNING_KEY, ALCHEMY_WEBHOOK_1_NETWORK
 *   ALCHEMY_WEBHOOK_2_ID, ALCHEMY_WEBHOOK_2_SIGNING_KEY, ALCHEMY_WEBHOOK_2_NETWORK
 *   etc.
 *
 * All webhooks under one account share the same auth token:
 *   ALCHEMY_AUTH_TOKEN
 */

function loadWebhookConfigs() {
  const configs = [];
  const authToken = process.env.ALCHEMY_AUTH_TOKEN;

  // Load up to 10 webhook configurations
  for (let i = 1; i <= 10; i++) {
    const webhookId = process.env[`ALCHEMY_WEBHOOK_${i}_ID`];
    const signingKey = process.env[`ALCHEMY_WEBHOOK_${i}_SIGNING_KEY`];
    const network = process.env[`ALCHEMY_WEBHOOK_${i}_NETWORK`];

    if (webhookId && signingKey) {
      configs.push({
        id: i,
        authToken,
        webhookId,
        signingKey,
        network: network || 'ETH_MAINNET',
      });
    }
  }

  return configs;
}

// Load configs once at startup
const WEBHOOK_CONFIGS = loadWebhookConfigs();

/**
 * Get all configured webhooks (filters out unconfigured ones)
 */
function getConfiguredWebhooks() {
  return WEBHOOK_CONFIGS.filter(
    (config) => config.authToken && config.webhookId
  );
}

/**
 * Get webhook signing key by webhook ID
 */
export function getSigningKey(webhookId) {
  const config = WEBHOOK_CONFIGS.find((c) => c.webhookId === webhookId);
  return config?.signingKey;
}

/**
 * Add addresses to all configured Alchemy webhooks
 * Same address works across all EVM chains, so we add to all webhooks
 */
export async function addAddressesToWebhook(addresses) {
  if (!addresses || addresses.length === 0) return;

  const normalizedAddresses = addresses.map((a) => a.toLowerCase());
  const configuredWebhooks = getConfiguredWebhooks();

  if (configuredWebhooks.length === 0) {
    console.log('No Alchemy webhooks configured, skipping address add');
    return;
  }

  // Track which addresses are new (not already in our database)
  const db = getDb();
  const existingAddresses = await db
    .collection('webhookAddresses')
    .find({ address: { $in: normalizedAddresses } })
    .toArray();

  const existingSet = new Set(existingAddresses.map((a) => a.address));
  const newAddresses = normalizedAddresses.filter((a) => !existingSet.has(a));

  if (newAddresses.length === 0) {
    console.log('All addresses already in webhooks');
    return;
  }

  console.log(`Adding ${newAddresses.length} new addresses to Alchemy webhooks`);

  // Add to all configured webhooks
  const results = await Promise.allSettled(
    configuredWebhooks.map((config) =>
      addAddressesToAlchemyWebhook(config, newAddresses)
    )
  );

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Failed to add addresses to webhook ${configuredWebhooks[index].id}:`,
        result.reason
      );
    }
  });

  // Track addresses in our database (use the first successful webhook group)
  const successfulWebhook = configuredWebhooks.find(
    (_, i) => results[i].status === 'fulfilled'
  );

  if (successfulWebhook) {
    const docs = newAddresses.map((address) => ({
      address,
      webhookGroup: successfulWebhook.id,
      addedAt: new Date(),
    }));

    try {
      await db.collection('webhookAddresses').insertMany(docs, { ordered: false });
    } catch (error) {
      // Ignore duplicate key errors (addresses added concurrently)
      if (error.code !== 11000) {
        console.error('Failed to track webhook addresses:', error.message);
      }
    }
  }
}

/**
 * Add addresses to a specific Alchemy webhook via API
 */
async function addAddressesToAlchemyWebhook(config, addresses) {
  const url = `https://dashboard.alchemy.com/api/update-webhook-addresses`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Alchemy-Token': config.authToken,
    },
    body: JSON.stringify({
      webhook_id: config.webhookId,
      addresses_to_add: addresses,
      addresses_to_remove: [],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Alchemy API error ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * Get all addresses currently tracked in a webhook (for debugging)
 */
export async function getWebhookAddresses(webhookGroup = 1) {
  const db = getDb();
  const addresses = await db
    .collection('webhookAddresses')
    .find({ webhookGroup })
    .toArray();

  return addresses.map((a) => a.address);
}

/**
 * Check if Alchemy webhooks are configured
 */
export function isAlchemyConfigured() {
  return getConfiguredWebhooks().length > 0;
}
