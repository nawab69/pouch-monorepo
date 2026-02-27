/**
 * Rate-limited request queue for CoinGecko API
 * Ensures we don't exceed 5 calls per minute
 */
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.callTimestamps = [];
    this.maxCallsPerMinute = parseInt(process.env.COINGECKO_CALLS_PER_MINUTE) || 5;
    this.intervalMs = 60000; // 1 minute
  }

  /**
   * Add a request to the queue
   * @param {Function} requestFn - Async function that makes the API call
   * @returns {Promise} - Resolves with the API response
   */
  enqueue(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        addedAt: Date.now(),
      });

      this.processQueue();
    });
  }

  /**
   * Check if we can make another API call
   */
  canMakeCall() {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.callTimestamps = this.callTimestamps.filter(
      (ts) => now - ts < this.intervalMs
    );

    return this.callTimestamps.length < this.maxCallsPerMinute;
  }

  /**
   * Get time until next available slot
   */
  getWaitTime() {
    if (this.callTimestamps.length < this.maxCallsPerMinute) {
      return 0;
    }

    const oldestCall = Math.min(...this.callTimestamps);
    const waitTime = this.intervalMs - (Date.now() - oldestCall);
    return Math.max(0, waitTime);
  }

  /**
   * Process queued requests respecting rate limits
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      if (!this.canMakeCall()) {
        const waitTime = this.getWaitTime();
        console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
        await this.sleep(waitTime + 100); // Add small buffer
        continue;
      }

      const item = this.queue.shift();

      try {
        this.callTimestamps.push(Date.now());
        const result = await item.requestFn();
        item.resolve(result);
      } catch (error) {
        // If rate limited by API, wait and retry
        if (error.response?.status === 429) {
          console.log('Got 429 from CoinGecko, waiting 60s...');
          this.queue.unshift(item); // Put back at front
          await this.sleep(60000);
        } else {
          item.reject(error);
        }
      }

      // Small delay between requests
      await this.sleep(200);
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      recentCalls: this.callTimestamps.length,
      maxCallsPerMinute: this.maxCallsPerMinute,
      canMakeCall: this.canMakeCall(),
      waitTime: this.getWaitTime(),
    };
  }
}

export const requestQueue = new RequestQueue();
