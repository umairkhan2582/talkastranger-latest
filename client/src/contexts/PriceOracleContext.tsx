import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePriceOracle, usePriceHistory, type PriceData } from '@/hooks/use-price-oracle';

// Token trade data structure
export interface TokenTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  totalValue: number;
  timestamp: number;
  address: string;
  username?: string;
}

// Token holders data structure
export interface TokenHolder {
  address: string;
  quantity: string;
  percentage: number;
  value: number;
}

interface PriceOracleContextType {
  currentPrices: PriceData | undefined;
  priceHistory: { prices: PriceData[]; interval: string } | undefined;
  isLoadingPrices: boolean;
  isLoadingHistory: boolean;
  pricesError: Error | null;
  historyError: Error | null;
  refetchPrices: () => void;
  selectedInterval: '1h' | '1d' | '7d' | '30d';
  setSelectedInterval: (interval: '1h' | '1d' | '7d' | '30d') => void;
  isWebSocketConnected: boolean;
  recentTrades: TokenTrade[];
  tokenHolders: TokenHolder[];
  premiumRatio: number;
  executeTrade: (type: 'buy' | 'sell', amount: number) => Promise<boolean>;
}

const PriceOracleContext = createContext<PriceOracleContextType | undefined>(undefined);

export function PriceOracleProvider({ children }: { children: React.ReactNode }) {
  const [selectedInterval, setSelectedInterval] = useState<'1h' | '1d' | '7d' | '30d'>('1d');
  const [realtimeHistory, setRealtimeHistory] = useState<PriceData[]>([]);
  const [recentTrades, setRecentTrades] = useState<TokenTrade[]>([]);
  const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);
  const [premiumRatio, setPremiumRatio] = useState<number>(1.25);
  const [realtimePrices, setRealtimePrices] = useState<PriceData | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Get current prices
  const { 
    currentPrices, 
    isLoadingPrices, 
    pricesError, 
    refetchPrices 
  } = usePriceOracle();
  
  // Get price history
  const { 
    priceHistory, 
    isLoadingHistory, 
    historyError 
  } = usePriceHistory(selectedInterval);
  
  // Setup WebSocket connection (ONCE for the lifetime of the provider)
  // TEMPORARILY DISABLED FOR TESTING - allows TradeNTalk WebSocket to work alone
  useEffect(() => {
    console.log('[Price Oracle] WebSocket DISABLED for testing');
    return () => {};
  }, []);

  // Update realtime history when new price data arrives
  useEffect(() => {
    if (realtimePrices) {
      setRealtimeHistory(prevHistory => {
        // Add new price point
        const newHistory = [...prevHistory, realtimePrices];
        
        // Keep history limited to prevent memory issues
        // The number here can be adjusted based on the chart needs
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        
        return newHistory;
      });
    }
  }, [realtimePrices]);

  // Initialize token holders with sample data - this would be populated via WebSocket
  useEffect(() => {
    if (realtimePrices?.tasNativePrice) {
      // Generate realistic token holder data
      const generatedHolders = generateTokenHolders(realtimePrices.tasNativePrice);
      setTokenHolders(generatedHolders);
    }
  }, [realtimePrices?.tasNativePrice]);

  // Simulate receiving trade updates (this would come from WebSocket in production)
  useEffect(() => {
    const tradeUpdateInterval = setInterval(() => {
      if (realtimePrices?.tasNativePrice && isWebSocketConnected) {
        // Simulate a new trade
        const newTrade = generateRandomTrade(realtimePrices.tasNativePrice);
        
        setRecentTrades(prevTrades => {
          const updatedTrades = [newTrade, ...prevTrades];
          // Keep only the most recent 20 trades
          return updatedTrades.slice(0, 20);
        });
        
        // In production, these would come from actual WebSocket events
        console.log('[Trade] New trade recorded:', newTrade.type, newTrade.amount, 'TAS at', newTrade.price);
      }
    }, 45000); // New trade every 45 seconds
    
    return () => clearInterval(tradeUpdateInterval);
  }, [realtimePrices?.tasNativePrice, isWebSocketConnected]);

  // Combine API history with realtime updates for the most current view
  const combinedHistory = React.useMemo(() => {
    if (!priceHistory) return undefined;
    
    // If we have no API history data but have realtime data, use that
    if (priceHistory.prices.length === 0 && realtimeHistory.length > 0) {
      return {
        prices: realtimeHistory,
        interval: selectedInterval
      };
    }
    
    // If we have both, combine them without duplicates
    if (priceHistory.prices.length > 0 && realtimeHistory.length > 0) {
      // We'll assume the realtime history is more recent than the API history
      const lastApiTimestamp = priceHistory.prices[priceHistory.prices.length - 1]?.timestamp || 0;
      
      // Filter realtime updates that are newer than the latest API data
      const newUpdates = realtimeHistory.filter(item => item.timestamp > lastApiTimestamp);
      
      return {
        prices: [...priceHistory.prices, ...newUpdates],
        interval: selectedInterval
      };
    }
    
    // If we only have API data, return that
    return priceHistory;
  }, [priceHistory, realtimeHistory, selectedInterval]);

  // Execute a trade (buy or sell) using wallet or TASChain
  const executeTrade = async (type: 'buy' | 'sell', amount: number): Promise<boolean> => {
    if (!realtimePrices) return false;
    
    try {
      // For blockchain integration - would connect to BSC wallet or TASChain
      console.log(`[Trade] Executing ${type} for ${amount} TASnative via blockchain...`);
      
      // In production, we would check if user has a connected wallet
      const hasConnectedWallet = window.ethereum !== undefined;
      
      // User's wallet address (would get from connected wallet or user profile)
      const userWalletAddress = '0x5A701c022D8f9a1E2276Fbae8Daaa2B8D3042Ab5';
      
      // In production, this would make a blockchain transaction
      if (hasConnectedWallet) {
        console.log('[Trade] Using connected BSC wallet for transaction');
        // This would use ethers.js to interact with the TASnative contract
        // For example: 
        // const signer = provider.getSigner();
        // const contract = new ethers.Contract(TAS_TOKEN_ADDRESS, TAS_TOKEN_ABI, signer);
        
        // if (type === 'buy') {
        //   const tx = await contract.buy({ value: ethers.utils.parseEther(amount.toString()) });
        //   await tx.wait();
        // } else {
        //   const tx = await contract.sell(ethers.utils.parseEther(amount.toString()));
        //   await tx.wait();
        // }
      } else {
        console.log('[Trade] Using TASChain for transaction (no wallet connected)');
        // This would call the TASChain API to perform the trade
        // Example API call:
        // const response = await fetch('/api/taschain/trade', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ 
        //     type, 
        //     amount, 
        //     token: 'TASnative',
        //     walletAddress: userWalletAddress
        //   })
        // });
        // if (!response.ok) throw new Error('Trade failed');
      }
      
      // Create a new trade record
      const newTrade: TokenTrade = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        amount,
        price: realtimePrices.tasNativePrice,
        totalValue: amount * realtimePrices.tasNativePrice,
        timestamp: Date.now(),
        address: userWalletAddress,
        username: 'You'
      };
      
      // Add to recent trades
      setRecentTrades(prev => [newTrade, ...prev].slice(0, 20));
      
      console.log(`[Trade] ${type === 'buy' ? 'Bought' : 'Sold'} ${amount} TASnative at $${realtimePrices.tasNativePrice.toFixed(6)}`);
      
      // Update token holders data to reflect the trade
      // This would actually happen via blockchain events in production
      setTokenHolders(prevHolders => {
        // Find if this user already has this token
        const userHolderIndex = prevHolders.findIndex(h => h.address === userWalletAddress);
        
        // Clone the holders array
        const updatedHolders = [...prevHolders];
        
        // Calculate total supply and existing quantity
        const totalSupply = 1_000_000_000; // 1 billion tokens
        
        if (userHolderIndex >= 0) {
          // User already has tokens, update their balance
          const currentQuantity = parseInt(updatedHolders[userHolderIndex].quantity.replace(/,/g, ''));
          const newQuantity = type === 'buy' 
            ? currentQuantity + amount 
            : Math.max(0, currentQuantity - amount);
          
          if (newQuantity <= 0) {
            // Remove user from holders if they sold everything
            updatedHolders.splice(userHolderIndex, 1);
          } else {
            // Update the user's holdings
            updatedHolders[userHolderIndex] = {
              ...updatedHolders[userHolderIndex],
              quantity: newQuantity.toLocaleString(),
              percentage: (newQuantity / totalSupply) * 100,
              value: newQuantity * realtimePrices.tasNativePrice
            };
          }
        } else if (type === 'buy') {
          // User doesn't have tokens yet but is buying
          // Add new holder entry
          updatedHolders.push({
            address: userWalletAddress,
            quantity: amount.toLocaleString(),
            percentage: (amount / totalSupply) * 100,
            value: amount * realtimePrices.tasNativePrice
          });
        }
        
        // Update liquidity pool (assuming it's always the first or second holder)
        const liquidityPoolIndex = updatedHolders.findIndex(
          h => h.address.includes('Liquidity') || h.address.includes('TASLiquidityPool')
        );
        
        if (liquidityPoolIndex >= 0) {
          const poolQuantity = parseInt(updatedHolders[liquidityPoolIndex].quantity.replace(/,/g, ''));
          const newPoolQuantity = type === 'buy'
            ? Math.max(0, poolQuantity - amount)  // Pool gives tokens when user buys
            : poolQuantity + amount;              // Pool receives tokens when user sells
            
          updatedHolders[liquidityPoolIndex] = {
            ...updatedHolders[liquidityPoolIndex],
            quantity: newPoolQuantity.toLocaleString(),
            percentage: (newPoolQuantity / totalSupply) * 100,
            value: newPoolQuantity * realtimePrices.tasNativePrice
          };
        }
        
        // Sort by percentage
        return updatedHolders.sort((a, b) => b.percentage - a.percentage);
      });
      
      return true;
    } catch (error) {
      console.error('[Trade] Error executing trade:', error);
      return false;
    }
  };

  // Helper function to generate random token holders
  const generateTokenHolders = (tokenPrice: number): TokenHolder[] => {
    const totalSupply = 1_000_000_000; // 1 billion tokens
    const holders: TokenHolder[] = [
      {
        address: '0x5A701c022D8f9a1E2276Fbae8Daaa2B8D3042Ab5',
        quantity: '150,000,000',
        percentage: 15,
        value: 150_000_000 * tokenPrice
      },
      {
        address: '0xTASLiquidityPool00000000000000000000',
        quantity: '800,000,000',
        percentage: 80,
        value: 800_000_000 * tokenPrice
      }
    ];
    
    // Add some additional random holders
    for (let i = 0; i < 8; i++) {
      const randomAmount = Math.floor(Math.random() * 10_000_000) + 1_000_000;
      const percentage = (randomAmount / totalSupply) * 100;
      
      holders.push({
        address: `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
        quantity: randomAmount.toLocaleString(),
        percentage,
        value: randomAmount * tokenPrice
      });
    }
    
    return holders.sort((a, b) => b.percentage - a.percentage);
  };

  // Helper function to generate a random trade
  const generateRandomTrade = (currentPrice: number): TokenTrade => {
    const tradeType: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    const amount = Math.floor(Math.random() * 10000) + 100;
    const priceVariance = (Math.random() * 0.01) - 0.005; // ±0.5%
    const price = currentPrice * (1 + priceVariance);
    
    // Random wallet addresses for trades
    const wallets = [
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      '0x3883f5e181fccaF8410FA61e12b59BAd963fb645',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    ];
    
    const randomWallet = wallets[Math.floor(Math.random() * wallets.length)];
    
    return {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: tradeType,
      amount,
      price,
      totalValue: amount * price,
      timestamp: Date.now(),
      address: randomWallet,
      username: `User${Math.floor(Math.random() * 900) + 100}`
    };
  };

  const value: PriceOracleContextType = {
    currentPrices: realtimePrices || currentPrices,
    priceHistory: combinedHistory,
    isLoadingPrices,
    isLoadingHistory,
    pricesError,
    historyError,
    refetchPrices,
    selectedInterval,
    setSelectedInterval,
    isWebSocketConnected,
    recentTrades,
    tokenHolders,
    premiumRatio,
    executeTrade
  };

  return (
    <PriceOracleContext.Provider value={value}>
      {children}
    </PriceOracleContext.Provider>
  );
}

export function usePriceOracleContext() {
  const context = useContext(PriceOracleContext);
  if (context === undefined) {
    throw new Error('usePriceOracleContext must be used within a PriceOracleProvider');
  }
  return context;
}