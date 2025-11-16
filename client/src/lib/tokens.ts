export interface TokenData {
  id: number;
  name: string;
  symbol: string;
  icon?: string;
  price: number;
  balance: number;
  network: string;
  contractAddress?: string;
  bg: string;
  textColor: string;
  isCustom?: boolean;
}

// Color schemes for different token types
export const tokenColors = {
  btc: { bg: 'bg-token-500 bg-opacity-10', textColor: 'text-token-500' },
  eth: { bg: 'bg-blue-100', textColor: 'text-blue-500' },
  usdc: { bg: 'bg-green-100', textColor: 'text-green-500' },
  sol: { bg: 'bg-purple-100', textColor: 'text-purple-500' },
  ada: { bg: 'bg-red-100', textColor: 'text-red-500' },
  dot: { bg: 'bg-purple-100', textColor: 'text-purple-500' },
  bnb: { bg: 'bg-yellow-100', textColor: 'text-yellow-500' },
  default: { bg: 'bg-gray-100', textColor: 'text-gray-500' }
};

// Helper function to get color scheme based on token symbol
export const getTokenColors = (symbol: string): { bg: string, textColor: string } => {
  const key = symbol.toLowerCase() as keyof typeof tokenColors;
  return tokenColors[key] || tokenColors.default;
};

// Format functions for token display
export const formatTokenAmount = (amount: number): string => {
  if (amount < 0.000001) {
    return amount.toExponential(2);
  }
  if (amount < 0.001) {
    return amount.toFixed(6);
  }
  if (amount < 1) {
    return amount.toFixed(4);
  }
  if (amount < 1000) {
    return amount.toFixed(2);
  }
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const formatUsdValue = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Only use real data from blockchain
export const defaultTokens: TokenData[] = [];

export const popularTokens: TokenData[] = [];
