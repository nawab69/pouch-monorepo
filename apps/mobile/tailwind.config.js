/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'wallet-bg': '#0D1411',
        'wallet-card': '#1A1F1D',
        'wallet-card-light': '#232A27',

        // Primary accent
        'wallet-accent': '#B8F25B',
        'wallet-accent-dark': '#9ED94A',

        // Text
        'wallet-text': '#FFFFFF',
        'wallet-text-secondary': '#8B9A92',
        'wallet-text-muted': '#5C6660',

        // Status
        'wallet-positive': '#4ADE80',
        'wallet-negative': '#EF4444',

        // Crypto colors
        'btc': '#F7931A',
        'eth': '#627EEA',
        'usdt': '#26A17B',
        'xlm': '#7D8B8A',
      },
    },
  },
  plugins: [],
};
