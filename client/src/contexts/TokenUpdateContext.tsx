import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTokenWebSocket, TokenUpdate } from '@/hooks/use-token-websocket';
import { useWallet } from '@/contexts/WalletContext';

interface TokenUpdateContextProps {
  tokenUpdates: Record<number, TokenUpdate>;
  isWebSocketConnected: boolean;
  watchToken: (tokenId: number) => void;
  unwatchToken: (tokenId: number) => void;
  sendTradeRequest: (tokenId: number, amount: number, tradeType: 'buy' | 'sell') => boolean;
  getLatestTokenPrice: (tokenId: number) => number | null;
}

const TokenUpdateContext = createContext<TokenUpdateContextProps | undefined>(undefined);

export const useTokenUpdates = () => {
  const context = useContext(TokenUpdateContext);
  if (!context) {
    throw new Error('useTokenUpdates must be used within a TokenUpdateProvider');
  }
  return context;
};

interface TokenUpdateProviderProps {
  children: React.ReactNode;
  initialTokenIds?: number[];
}

export const TokenUpdateProvider: React.FC<TokenUpdateProviderProps> = ({ 
  children, 
  initialTokenIds = [] 
}) => {
  const { address, isConnected } = useWallet();
  const [tokensToWatch, setTokensToWatch] = useState<number[]>(initialTokenIds);
  
  // Get user ID from wallet address if connected
  const userId = isConnected ? parseInt(address?.slice(-6) || '0', 16) % 100000 : undefined;
  
  // Initialize WebSocket connection
  const { 
    isConnected: isWebSocketConnected,
    tokenUpdates,
    watchToken: wsWatchToken,
    unwatchToken: wsUnwatchToken,
    sendTradeRequest,
  } = useTokenWebSocket(tokensToWatch, userId);
  
  // Function to watch a token - adds to tracked tokens list
  const watchToken = (tokenId: number) => {
    if (!tokenId || tokensToWatch.includes(tokenId)) return;
    
    console.log(`[TokenContext] Adding token ${tokenId} to watch list`);
    setTokensToWatch(prev => [...prev, tokenId]);
    wsWatchToken(tokenId);
  };
  
  // Function to stop watching a token
  const unwatchToken = (tokenId: number) => {
    console.log(`[TokenContext] Removing token ${tokenId} from watch list`);
    setTokensToWatch(prev => prev.filter(id => id !== tokenId));
    wsUnwatchToken(tokenId);
  };
  
  // Function to get the latest token price with fallback
  const getLatestTokenPrice = (tokenId: number): number | null => {
    if (tokenUpdates[tokenId]) {
      return tokenUpdates[tokenId].price;
    }
    return null;
  };
  
  // Log connection status changes
  useEffect(() => {
    console.log(`[TokenContext] WebSocket connected: ${isWebSocketConnected}`);
  }, [isWebSocketConnected]);
  
  // Log token price updates for debugging
  useEffect(() => {
    const tokenIds = Object.keys(tokenUpdates);
    if (tokenIds.length > 0) {
      console.log(`[TokenContext] Token prices updated:`, 
        tokenIds.map(id => `${id}: ${tokenUpdates[parseInt(id)].price}`).join(', ')
      );
    }
  }, [tokenUpdates]);
  
  // Start watching initial tokens
  useEffect(() => {
    initialTokenIds.forEach(tokenId => {
      watchToken(tokenId);
    });
  }, []);
  
  const contextValue = {
    tokenUpdates,
    isWebSocketConnected,
    watchToken,
    unwatchToken,
    sendTradeRequest,
    getLatestTokenPrice
  };
  
  return (
    <TokenUpdateContext.Provider value={contextValue}>
      {children}
    </TokenUpdateContext.Provider>
  );
};