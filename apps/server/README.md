# CoinGecko Cache Server

A Redis-backed cache proxy for CoinGecko API that handles rate limiting and caches responses with smart TTLs. Also serves as the backend for push notifications in the Pouch wallet app.

## Features

- **Rate Limiting**: Queues requests to stay within CoinGecko's 5 calls/minute limit
- **Smart Caching**: Different TTLs for different data types (prices vs charts vs coin list)
- **Automatic Retry**: Handles 429 errors with exponential backoff
- **Simple REST API**: Drop-in replacement for direct CoinGecko calls
- **Push Notifications**: Real-time transaction alerts via Alchemy webhooks + Expo Push

## Prerequisites

- Node.js 18+
- Docker (for Redis and MongoDB)

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis and MongoDB
docker compose up -d

# Start the server
npm run dev
```

The server will start at `http://localhost:3001`.

## Environment Variables

### Server & Cache

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| REDIS_URL | redis://localhost:6379 | Redis connection URL |
| MONGODB_URI | mongodb://localhost:27017/pouch | MongoDB connection URL |
| COINGECKO_API_KEY | (none) | Optional CoinGecko Pro API key |
| CACHE_TTL_PRICES | 300 | Price cache TTL (seconds) |
| CACHE_TTL_CHART_1D | 300 | 1-day chart TTL |
| CACHE_TTL_CHART_1W | 900 | 7-day chart TTL |
| CACHE_TTL_CHART_1M | 3600 | 30-day chart TTL |
| CACHE_TTL_CHART_1Y | 86400 | 1-year chart TTL |
| COINGECKO_CALLS_PER_MINUTE | 5 | Rate limit |

### Push Notifications (Alchemy)

| Variable | Description |
|----------|-------------|
| ALCHEMY_AUTH_TOKEN | Auth token from Alchemy dashboard |
| ALCHEMY_WEBHOOK_1_ID | Webhook ID (starts with `wh_`) |
| ALCHEMY_WEBHOOK_1_SIGNING_KEY | Webhook signing key for HMAC validation |
| ALCHEMY_WEBHOOK_1_NETWORK | Network code (e.g., `ETH_SEPOLIA`) |
| ALCHEMY_WEBHOOK_2_ID | (Optional) Second webhook |
| ALCHEMY_WEBHOOK_2_SIGNING_KEY | |
| ALCHEMY_WEBHOOK_2_NETWORK | |
| EXPO_ACCESS_TOKEN | (Optional) Expo access token for higher rate limits |

You can configure up to 10 webhooks (ALCHEMY_WEBHOOK_1 through ALCHEMY_WEBHOOK_10).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status, Redis connection, and queue info.

### Get Prices
```
GET /prices?ids=bitcoin,ethereum
```
Returns current USD prices with 24h change, volume, and market cap.

### Get Chart Data
```
GET /chart/:coinId?days=7
```
Returns historical price data. Days can be: 1, 7, 30, 365, or "max".

### Get Coin Details
```
GET /coin/:coinId
```
Returns detailed coin information including market data.

### Get Coin List
```
GET /coins/list
```
Returns list of all coins with platform contract addresses.

### Search Coins
```
GET /search?q=bitcoin
```
Search for coins by name or symbol.

### Get Token by Contract
```
GET /contract/:platform/:address
```
Get token price by contract address. Platform examples: ethereum, polygon-pos, arbitrum-one.

### Batch Token Lookup
```
POST /contract/:platform
Body: { "addresses": ["0x...", "0x..."] }
```
Get multiple token prices by contract addresses.

---

## Push Notifications API

### Register Device
```
POST /notifications/register
Body: {
  "deviceId": "unique-device-id",
  "pushToken": "ExponentPushToken[xxx]",
  "platform": "ios" | "android",
  "addresses": ["0x123...", "0x456..."]
}
```
Register a device for push notifications. Addresses are automatically added to Alchemy webhooks.

### Unregister Device
```
POST /notifications/unregister
Body: { "deviceId": "unique-device-id" }
```
Remove a device from push notifications.

### Update Addresses
```
PATCH /notifications/addresses
Body: {
  "deviceId": "unique-device-id",
  "add": ["0x789..."],
  "remove": ["0x123..."]
}
```
Add or remove addresses from a device's monitored list.

### Alchemy Webhook Endpoint
```
POST /webhooks/alchemy
```
Receives ADDRESS_ACTIVITY webhooks from Alchemy. Validates HMAC signature and sends push notifications to registered devices.

### Test Notification
```
POST /webhooks/test-notification
Body: {
  "address": "0x123...",
  "type": "receive" | "send",
  "amount": "0.1",
  "asset": "ETH"
}
```
Send a test push notification to devices monitoring a specific address.

## Response Format

All responses include:
```json
{
  "data": { ... },
  "fromCache": true,
  "timestamp": 1234567890
}
```

## Cache Keys

```
coingecko:prices:bitcoin,ethereum
coingecko:chart:bitcoin:7
coingecko:coin:bitcoin
coingecko:coinlist
coingecko:search:bitcoin
coingecko:contract:ethereum:0x...
```

---

## Alchemy Webhook Setup

Push notifications require Alchemy webhooks to monitor wallet addresses for transactions.

### Alchemy Limits

- **3 webhooks** per free Alchemy account
- **1 network** per webhook
- **100,000 addresses** per webhook

### Step 1: Get Auth Token

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Click your profile (top right) → **Settings**
3. Scroll to **Auth Token** → Copy it
4. Add to `.env`:
   ```
   ALCHEMY_AUTH_TOKEN=your_auth_token_here
   ```

### Step 2: Create Webhooks

For each network you want to monitor:

1. In Alchemy Dashboard, go to **Webhooks** (left sidebar)
2. Click **Create Webhook**
3. Configure:
   - **Chain**: Select network (e.g., Ethereum)
   - **Network**: Sepolia (for testing) or Mainnet
   - **Webhook Type**: Address Activity
   - **Webhook URL**: Your server URL + `/webhooks/alchemy`
   - Leave addresses empty (added automatically via API)
4. Click **Create Webhook**
5. Click on the webhook to view details:
   - Copy **Webhook ID** (starts with `wh_`)
   - Click "Show" next to **Signing Key** and copy it

6. Add to `.env`:
   ```
   ALCHEMY_WEBHOOK_1_ID=wh_xxxxxxxx
   ALCHEMY_WEBHOOK_1_SIGNING_KEY=xxxxxxxx
   ALCHEMY_WEBHOOK_1_NETWORK=ETH_SEPOLIA
   ```

### Step 3: Expose Local Server (Development)

For local testing, use ngrok to expose your server:

```bash
# Install ngrok
brew install ngrok

# In one terminal, start the server
npm run dev

# In another terminal, expose port 3001
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and use it when creating webhooks:
```
https://abc123.ngrok.io/webhooks/alchemy
```

> **Note**: The ngrok URL changes each time you restart. Update your webhook URL in Alchemy when it changes.

### Network Codes

| Network | Code |
|---------|------|
| Ethereum Mainnet | `ETH_MAINNET` |
| Ethereum Sepolia | `ETH_SEPOLIA` |
| Polygon Mainnet | `MATIC_MAINNET` |
| Polygon Amoy | `MATIC_AMOY` |
| Arbitrum Mainnet | `ARB_MAINNET` |
| Arbitrum Sepolia | `ARB_SEPOLIA` |
| Optimism Mainnet | `OPT_MAINNET` |
| Optimism Sepolia | `OPT_SEPOLIA` |
| Base Mainnet | `BASE_MAINNET` |
| Base Sepolia | `BASE_SEPOLIA` |

### Recommended Setup

**For Development** (1 webhook):
- ETH_SEPOLIA - Get free testnet ETH from [Alchemy Faucet](https://sepoliafaucet.com/)

**For Production** (3 webhooks per account):
- Account 1: ETH_MAINNET, MATIC_MAINNET, BASE_MAINNET
- Account 2: ARB_MAINNET, OPT_MAINNET, + 1 testnet

---

## Testing Push Notifications

1. Start the server with MongoDB and Redis running:
   ```bash
   docker compose up -d
   npm run dev
   ```

2. In the mobile app, enable "Transaction Alerts" in Settings

3. Copy your wallet address from the app

4. Send a test notification:
   ```bash
   curl -X POST http://localhost:3001/webhooks/test-notification \
     -H "Content-Type: application/json" \
     -d '{"address": "0xYourWalletAddress"}'
   ```

5. You should receive a push notification: "Received 0.1 ETH"

### Testing with Real Transactions

1. Set up an Alchemy webhook for ETH_SEPOLIA
2. Get testnet ETH from a faucet
3. Send ETH to your wallet address
4. You'll receive a push notification when the transaction is detected

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Mobile App │────▶│  Cache Server    │◀────│   Alchemy   │
│   (Pouch)   │     │  (this server)   │     │  Webhooks   │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                    │                       │
       │ 1. Register        │                       │
       │    device +        │ 2. Add addresses      │
       │    addresses       │    to webhooks        │
       │                    │──────────────────────▶│
       │                    │                       │
       │                    │ 3. ADDRESS_ACTIVITY   │
       │                    │    webhook            │
       │                    │◀──────────────────────│
       │                    │                       │
       │ 4. Push            │                       │
       │    notification    │                       │
       │◀───────────────────│                       │
       │    (Expo Push)     │                       │
```

## License

ISC
