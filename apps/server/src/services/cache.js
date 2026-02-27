import { createClient } from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({ url: redisUrl });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });

    await this.client.connect();
  }

  async get(key) {
    if (!this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.isConnected) return false;

    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async getTTL(key) {
    if (!this.isConnected) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  generateKey(prefix, ...parts) {
    return `coingecko:${prefix}:${parts.join(':')}`;
  }
}

export const cache = new CacheService();
