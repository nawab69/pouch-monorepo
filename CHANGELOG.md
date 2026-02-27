# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-27

### Added

#### Mobile App (@pouch/mobile)
- Non-custodial wallet with BIP39 mnemonic generation and BIP44 HD derivation
- Multi-chain support: Ethereum, Polygon, Arbitrum, Optimism, Base (mainnet + testnet)
- ERC-20 token detection and balance tracking via Alchemy SDK
- Send and receive native tokens and ERC-20 tokens
- Token swaps via Uniswap V3 with slippage controls and live quotes
- WalletConnect v2 integration for dApp connections
- PIN (6-digit) and biometric (Face ID / Touch ID) authentication
- Auto-lock with configurable timeouts
- Portfolio analytics with allocation charts and diversification scoring
- Real-time price charts (1D, 7D, 30D, 1Y, All-Time)
- Address book / contacts management
- Push notifications for incoming/outgoing transactions
- Onboarding flow with wallet creation and import
- QR code generation for receiving payments
- Transaction history with explorer links
- Multi-account support with account switching
- Dark/light mode with NativeWind (Tailwind CSS)

#### Backend Server (@pouch/server)
- CoinGecko API cache proxy with Redis
- Smart TTL caching (5min prices, 15min weekly charts, 1hr monthly, 24hr yearly)
- Rate limiting queue (5 calls/min for CoinGecko free tier)
- MongoDB for device registration and notification storage
- Alchemy webhook receiver for blockchain address monitoring
- Expo push notification delivery service
- Device registration API with multi-address support
- Notification history with cursor pagination
- HMAC-SHA256 webhook signature validation
- Health check endpoint with service status

#### Website (@pouch/web)
- Next.js 16 marketing landing page
- Hero section with app screenshots
- Feature highlights, security messaging, FAQ
- Early-access email waitlist with Firebase Firestore
- Privacy policy and terms of service pages
- Responsive design with Tailwind CSS v4

#### Monorepo Infrastructure
- Turborepo with npm workspaces
- Docker Compose for Redis and MongoDB
- Environment variable setup script
- Unified dev commands (`npm run dev` starts all apps)
