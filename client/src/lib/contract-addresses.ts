// Contract addresses on BSC Mainnet
export const CONTRACT_ADDRESSES = {
  TAS_TOKEN: "0xd9541b134b1821736bd323135b8844d3ae408216",
  TOKEN_FACTORY: "0x262351BA892681919a9BaB17D39A8eB1d842Fad0",
  SWAP_MARKET: "0x4FE94E5e7AF4b458E0e6Edc3c6D1D87E7d58c027"
};

// Network settings
export const NETWORK_CONFIG = {
  name: "Binance Smart Chain",
  chainId: 56,
  currency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://bsc-dataseed.binance.org/",
  blockExplorerUrl: "https://tasonscan.com"
};

// Fee percentages
export const FEE_CONFIG = {
  swapMarketFee: 0.2, // 0.2%
  tokenCreationFee: 1000 // 1,000 TAS tokens
};