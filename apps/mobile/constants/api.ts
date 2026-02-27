// API Configuration
// Change PROD_URL to your deployed server's URL (see docs: Deploy Server)

const DEV_URL = 'http://localhost:3001';
const PROD_URL = 'https://your-server-domain.com';

// Cache server URL - uses env var if set, otherwise dev/prod based on __DEV__
export const CACHE_SERVER_URL =
  process.env.EXPO_PUBLIC_CACHE_SERVER_URL || (__DEV__ ? DEV_URL : PROD_URL);
