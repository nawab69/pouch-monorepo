// Consistent color mapping for common tokens in charts and visualizations

export const TOKEN_COLORS: Record<string, string> = {
  // Major cryptocurrencies
  ETH: '#627EEA',
  WETH: '#627EEA',
  BTC: '#F7931A',
  WBTC: '#F7931A',

  // Stablecoins
  USDC: '#2775CA',
  USDT: '#26A17B',
  DAI: '#F5AC37',
  BUSD: '#F0B90B',
  FRAX: '#000000',

  // Layer 2 / Network tokens
  MATIC: '#8247E5',
  ARB: '#28A0F0',
  OP: '#FF0420',

  // DeFi tokens
  LINK: '#2A5ADA',
  UNI: '#FF007A',
  AAVE: '#B6509E',
  CRV: '#40649F',
  MKR: '#1AAB9B',
  COMP: '#00D395',
  SNX: '#00D1FF',
  SUSHI: '#FA52A0',

  // Other popular tokens
  SHIB: '#FFA409',
  APE: '#0054F9',
  LDO: '#00A3FF',
  RPL: '#FF6B35',
};

// Generate a deterministic color from a string (for tokens without predefined colors)
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness for visibility
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash >> 8) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Get color for a token, with fallback to generated color
export function getTokenColor(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return TOKEN_COLORS[upperSymbol] ?? generateColorFromString(upperSymbol);
}

// Predefined colors for "Other" category in pie charts
export const OTHER_COLOR = '#5C5C5C';

// Chart color palette for when you need multiple distinct colors
export const CHART_PALETTE = [
  '#627EEA', // Blue (ETH-like)
  '#FF007A', // Pink (UNI-like)
  '#26A17B', // Teal (USDT-like)
  '#F5AC37', // Orange (DAI-like)
  '#8247E5', // Purple (MATIC-like)
  '#2775CA', // Blue (USDC-like)
  '#FF0420', // Red (OP-like)
  '#00D395', // Green (COMP-like)
];
