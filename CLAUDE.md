# CLAUDE.md — Pouch Monorepo

This is a Turborepo monorepo containing the Pouch crypto wallet ecosystem.

## Workspaces

| App | Package | Port | Stack |
|-----|---------|------|-------|
| `apps/mobile` | `@pouch/mobile` | 8081 | Expo SDK 54, React Native 0.81, NativeWind v4 |
| `apps/server` | `@pouch/server` | 3001 | Express.js, Redis, MongoDB |
| `apps/web` | `@pouch/web` | 3000 | Next.js 16, Tailwind CSS v4 |

## Quick Start

```bash
npm install              # Install all workspace dependencies
npm run setup            # Copy .env.example → .env files
# Edit .env files with your actual values
npm run docker:up        # Start Redis + MongoDB containers
npm run dev              # Start all dev servers via Turbo TUI
```

## Commands

```bash
# Run all workspaces
npm run dev              # Start all dev servers (Turbo TUI)
npm run build            # Build all workspaces
npm run lint             # Lint all workspaces

# Run individual workspaces
npm run dev:mobile       # Expo dev server only
npm run dev:server       # Express server only
npm run dev:web          # Next.js dev server only

# Docker (Redis + MongoDB)
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # Tail container logs

# Turbo filter (run any task for a specific workspace)
npx turbo run build --filter=@pouch/web
npx turbo run lint --filter=@pouch/mobile
```

## Infrastructure

- **Redis** (`localhost:6379`) — Cache layer for CoinGecko API responses
- **MongoDB** (`localhost:27017`) — Persistent data storage
- Managed via `docker-compose.yml` at repo root

## Workspace Details

- **Mobile:** See `apps/mobile/CLAUDE.md` for Expo conventions, code style, and architecture
- **Server:** Express.js cache proxy for CoinGecko with rate limiting and smart TTLs
- **Web:** Next.js site with Firebase Admin SDK integration

## Environment Variables

Each workspace has a `.env.example` template. Run `npm run setup` to create local copies, then fill in values.
