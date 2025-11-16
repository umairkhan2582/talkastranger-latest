import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types for the price data returned by the API
export interface PriceData {
  tasBnbPrice: number;
  tasNativePrice: number;
  timestamp: number;
}

export interface PriceHistory {
  prices: PriceData[];
  interval: '1h' | '1d' | '7d' | '30d';
}

/**
 * Hook to access current TAS token prices
 */
export function usePriceOracle() {
  // Fetch current prices from the API
  const {
    data: priceData,
    isLoading: isLoadingPrices,
    error: pricesError,
    refetch: refetchPrices
  } = useQuery<{ success: boolean; data: PriceData }>({
    queryKey: ['/api/prices/current'],
    queryFn: async () => {
      const response = await fetch('/api/prices/current');
      if (!response.ok) {
        throw new Error('Failed to fetch current prices');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Helper function to get price history for a specific interval
  const getPriceHistory = async (interval: '1h' | '1d' | '7d' | '30d'): Promise<PriceHistory> => {
    const response = await fetch(`/api/prices/history/${interval}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch price history for interval ${interval}`);
    }
    const data = await response.json();
    return data.data;
  };

  // Helper function to trigger a manual price update (admin only)
  const triggerPriceUpdate = async (): Promise<PriceData> => {
    const response = await fetch('/api/prices/update', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to trigger price update');
    }
    
    const data = await response.json();
    return data.data;
  };

  return {
    currentPrices: priceData?.data,
    isLoadingPrices,
    pricesError,
    refetchPrices,
    getPriceHistory,
    triggerPriceUpdate,
  };
}

/**
 * Hook to access price history for a specific interval
 */
export function usePriceHistory(interval: '1h' | '1d' | '7d' | '30d') {
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery<{ success: boolean; data: PriceHistory }>({
    queryKey: [`/api/prices/history/${interval}`],
    queryFn: async () => {
      const response = await fetch(`/api/prices/history/${interval}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price history for interval ${interval}`);
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return {
    priceHistory: historyData?.data,
    isLoadingHistory,
    historyError
  };
}

/**
 * Hook to subscribe to real-time price updates through WebSocket
 */
export function useRealtimePrices() {
  const [realtimePrices, setRealtimePrices] = useState<PriceData | null>(null);
  const [realtimeHistory, setRealtimeHistory] = useState<PriceData[]>([]);
  const [premiumRatio, setPremiumRatio] = useState<number>(1.25);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Get WebSocket URL based on current protocol and host
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('[Price Oracle] WebSocket connection established');
      setIsConnected(true);
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle different message types
        switch (message.type) {
          case 'price_update':
            // Basic price update
            setRealtimePrices(message.data);
            break;
            
          case 'chart_data_update':
            // More comprehensive update with history
            if (message.data.currentPrice) {
              setRealtimePrices(message.data.currentPrice);
            }
            
            if (message.data.recentHistory && Array.isArray(message.data.recentHistory)) {
              setRealtimeHistory(message.data.recentHistory);
            }
            
            if (message.data.premiumRatio) {
              setPremiumRatio(message.data.premiumRatio);
            }
            
            console.log(`[Price Oracle] Received chart data update with ${message.data.recentHistory?.length || 0} historical points`);
            break;
            
          default:
            // Ignore unknown message types
            break;
        }
      } catch (error) {
        console.error('[Price Oracle] Error processing WebSocket message:', error);
      }
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      console.log('[Price Oracle] WebSocket connection closed');
      setIsConnected(false);
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('[Price Oracle] WebSocket error:', error);
      setIsConnected(false);
    });
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      console.log('[Price Oracle] Closing WebSocket connection due to component unmount');
      socket.close();
    };
  }, []); // Empty dependency array - only run once on mount
  
  return {
    realtimePrices,
    realtimeHistory,
    premiumRatio,
    isConnected
  };
}