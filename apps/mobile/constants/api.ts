// API Configuration

const DEV_URL = 'http://localhost:3001';
const PROD_URL = 'https://webhook.kibria.me';

// Cache server URL - uses env var if set, otherwise dev/prod based on __DEV__
export const CACHE_SERVER_URL =
  process.env.EXPO_PUBLIC_CACHE_SERVER_URL || (__DEV__ ? DEV_URL : PROD_URL);
