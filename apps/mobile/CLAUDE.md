# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pouch is a React Native/Expo crypto wallet app. Currently in the initial template phase - ready for feature development.

**Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Tailwind CSS v3 + NativeWind v4

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run web version
npm run lint       # Run ESLint
```

For development, prefer `npm start` and scan QR with Expo Go before creating custom builds.

## Architecture

```
app/                    # Expo Router file-based routes
  _layout.tsx          # Root layout with Stack navigator
  index.tsx            # Home screen

global.css             # Tailwind CSS entry point
components/            # Reusable UI components (add your own)
hooks/                 # Custom hooks (useColorScheme, useThemeColor)
constants/theme.ts     # Colors and Fonts definitions
```

**Routing:** File-based with expo-router. Routes in `app/`, components elsewhere.

**Theming:** Light/dark mode via `useColorScheme()` hook and Tailwind `dark:` variants.

## Code Conventions

From `.agents/skills/` guidelines:

- Use kebab-case for file names
- Use `expo-image` not `<Image>` from react-native
- Use `react-native-safe-area-context` not react-native SafeAreaView
- Use `Pressable` over `TouchableOpacity`
- Wrap root components in ScrollView with `contentInsetAdjustmentBehavior="automatic"`
- Animate only `transform` and `opacity` for performance
- Use FlashList for large lists
- Memoize list items and stabilize callback references

## Tailwind Usage

Use `className` directly on React Native components:

```tsx
import { View, Text, ScrollView } from 'react-native';

<ScrollView className="flex-1 bg-white dark:bg-black">
  <View className="p-4 gap-4">
    <Text className="text-xl font-bold text-black dark:text-white">Hello</Text>
  </View>
</ScrollView>
```

Tailwind config is in `tailwind.config.js`. Global styles in `global.css`.

## Related Services

### CoinGecko Cache Server (`@pouch/server`)

A Redis-backed cache proxy for CoinGecko API located at `../server/` in the monorepo.

**Purpose:** Handle CoinGecko's rate limit (5 calls/min) by caching responses with smart TTLs.

**Stack:** Express.js, Redis, Axios

**Commands (from monorepo root):**
```bash
npm run docker:up      # Start Redis + MongoDB
npm run dev:server     # Start cache server only
npm run dev            # Start all dev servers (including cache server)
```

**Endpoints:**
- `GET /health` - Health check with Redis and queue status
- `GET /prices?ids=bitcoin,ethereum` - Get current prices
- `GET /chart/:coinId?days=7` - Get chart data (1, 7, 30, 365, max)
- `GET /coin/:coinId` - Get coin details
- `GET /coins/list` - Get all coins with contract addresses
- `GET /search?q=bitcoin` - Search coins
- `GET /contract/:platform/:address` - Get token by contract
- `POST /contract/:platform` - Batch token lookup (body: `{addresses: [...]}`)

**Cache TTLs:**
- Prices: 5 min
- Chart 1D: 5 min
- Chart 1W: 15 min
- Chart 1M: 1 hour
- Chart 1Y+: 24 hours

**Rate Limiting:** Queues requests and enforces 5 calls/min to CoinGecko. Handles 429 errors with automatic retry.

**Quick Start (from monorepo root):**
```bash
npm run docker:up      # Start Redis + MongoDB containers
npm run dev            # Start all dev servers via Turbo TUI
```

**Integration:** The app uses `services/coingecko/cache-client.ts` to connect to the cache server. In dev mode, it auto-connects to `http://localhost:3001`. The `useTokens` hook fetches all prices in a single API call after tokens are loaded.
