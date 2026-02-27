import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { cache } from './services/cache.js';
import { requestQueue } from './services/queue.js';
import * as coingecko from './services/coingecko.js';
import { connectMongo } from './services/mongodb.js';
import { isAlchemyConfigured } from './services/alchemy-webhooks.js';
import notificationsRouter from './routes/notifications.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Notification routes
app.use('/notifications', notificationsRouter);

// Webhook routes
app.use('/webhooks', webhooksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    redis: cache.isConnected,
    queue: requestQueue.getStatus(),
    alchemyConfigured: isAlchemyConfigured(),
  });
});

// Queue status
app.get('/status', (req, res) => {
  res.json({
    redis: cache.isConnected,
    queue: requestQueue.getStatus(),
  });
});

/**
 * GET /prices
 * Query params: ids (comma-separated coin IDs)
 * Example: /prices?ids=bitcoin,ethereum
 */
app.get('/prices', async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'Missing ids parameter' });
    }

    const coinIds = ids.split(',').map((id) => id.trim());
    const result = await coingecko.getPrices(coinIds);

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Price fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /chart/:coinId
 * Query params: days (1, 7, 30, 365, max)
 * Example: /chart/bitcoin?days=7
 */
app.get('/chart/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = '1' } = req.query;

    const daysNum = days === 'max' ? 'max' : parseInt(days);
    const result = await coingecko.getChartData(coinId, daysNum);

    // Transform to simpler format
    const transformed = {
      prices: result.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
      })),
      fromCache: result.fromCache,
      timestamp: Date.now(),
    };

    res.json(transformed);
  } catch (error) {
    console.error('Chart fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /coin/:coinId
 * Get detailed coin information
 */
app.get('/coin/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const result = await coingecko.getCoinDetails(coinId);

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Coin details fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /coins/list
 * Get list of all coins with platform contracts
 */
app.get('/coins/list', async (req, res) => {
  try {
    const result = await coingecko.getCoinList();

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Coin list fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /search
 * Query params: q (search query)
 * Example: /search?q=bitcoin
 */
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing q parameter' });
    }

    const result = await coingecko.searchCoins(q);

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /contract/:platform/:address
 * Get token price by contract address
 * Example: /contract/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
 */
app.get('/contract/:platform/:address', async (req, res) => {
  try {
    const { platform, address } = req.params;
    const result = await coingecko.getCoinsByContract(platform, address);

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Contract fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /contract/:platform
 * Get multiple token prices by contract addresses
 * Body: { addresses: ["0x...", "0x..."] }
 */
app.post('/contract/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: 'Missing addresses array in body' });
    }

    const result = await coingecko.getCoinsByContract(platform, addresses);

    res.json({
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Contract batch fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function start() {
  try {
    // Connect to Redis
    await cache.connect();
    console.log('Redis connected');

    // Connect to MongoDB
    try {
      await connectMongo();
      console.log('MongoDB connected');
    } catch (mongoError) {
      console.warn('MongoDB connection failed (notifications disabled):', mongoError.message);
    }

    // Start Express
    app.listen(PORT, () => {
      console.log(`CoinGecko Cache Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      if (isAlchemyConfigured()) {
        console.log('Alchemy webhooks: configured');
      } else {
        console.log('Alchemy webhooks: not configured (set ALCHEMY_* env vars)');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
