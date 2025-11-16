import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types for TASnative token data
export interface TASnativeToken {
  id: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  percentChange24h: string;
  volumeTAS: number;
  liquidity: number;
  holders: number;
  allTimeHigh: number;
  allTimeHighDate: string;
  totalSupply: number;
  circulatingSupply: number;
  lockedTokens?: number;
  lockedTokensValue?: number;
  network: string;
  contractAddress: string;
  bg: string;
  textColor: string;
  isNative: boolean;
  isCustom: boolean;
  launchDate?: string;
}

export interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  value?: number;
  isDeveloper: boolean;
  tag?: string;
}

export interface TokenTrade {
  id: string;
  type: 'buy' | 'sell';
  username: string;
  amount: number;
  price: number;
  timestamp: number;
  txHash: string;
}

export interface ChartPoint {
  time: string;
  price: number;
  volume: number;
}

/**
 * Hook to fetch TASnative token data 
 */
export function useTASNativeToken() {
  const {
    data: tokenData,
    isLoading,
    error,
    refetch
  } = useQuery<{ token: TASnativeToken }>({
    queryKey: ['/api/tokens/tasnative'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/tasnative');
      if (!response.ok) {
        throw new Error('Failed to fetch TASnative token data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    tokenData: tokenData?.token,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook to fetch TASnative chart data
 */
export function useTASNativeChart(timeframe: string = '24h') {
  const {
    data: chartData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; pricePoints: ChartPoint[] }>({
    queryKey: [`/api/tokens/tasnative/chart`, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/tasnative/chart?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TASnative chart data');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return {
    chartData: chartData?.pricePoints || [],
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook to fetch TASnative token holders
 */
export function useTASNativeHolders() {
  const {
    data: holdersData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; holders: TokenHolder[] }>({
    queryKey: ['/api/tokens/tasnative/holders'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/tasnative/holders');
      if (!response.ok) {
        throw new Error('Failed to fetch TASnative holders data');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return {
    holders: holdersData?.holders || [],
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook to fetch TASnative recent trades
 */
export function useTASNativeTrades() {
  const {
    data: tradesData,
    isLoading,
    error,
    refetch
  } = useQuery<{ success: boolean; trades: TokenTrade[] }>({
    queryKey: ['/api/tokens/tasnative/trades'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/tasnative/trades');
      if (!response.ok) {
        throw new Error('Failed to fetch TASnative trades data');
      }
      return response.json();
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
  });

  return {
    trades: tradesData?.trades || [],
    isLoading,
    error,
    refetch
  };
}

/**
 * Combined hook for all TASnative data
 */
export function useTASNative(timeframe: string = '24h') {
  const { tokenData, isLoading: isLoadingToken, error: tokenError, refetch: refetchToken } = useTASNativeToken();
  const { chartData, isLoading: isLoadingChart, error: chartError, refetch: refetchChart } = useTASNativeChart(timeframe);
  const { holders, isLoading: isLoadingHolders, error: holdersError, refetch: refetchHolders } = useTASNativeHolders();
  const { trades, isLoading: isLoadingTrades, error: tradesError, refetch: refetchTrades } = useTASNativeTrades();

  // WebSocket connection for real-time updates
  const [wsConnected, setWsConnected] = useState(false);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('[Price Oracle] WebSocket connection established');
      setWsConnected(true);
    };
    
    socket.onclose = () => {
      console.log('[Price Oracle] WebSocket connection closed');
      setWsConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('[Price Oracle] WebSocket error:', error);
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price_update') {
          // Update price data
          refetchToken();
        } 
        else if (message.type === 'chart_data_update') {
          // Update chart data
          refetchChart();
        }
        else if (message.type === 'trade_executed') {
          // Update trades and holders
          refetchTrades();
          refetchHolders();
        }
        else if (message.type === 'blockchain_event') {
          // Handle various blockchain events
          if (message.eventType === 'transfer') {
            // Transfer event from the blockchain
            console.log(`[Blockchain] Transfer detected: ${message.data.from} -> ${message.data.to} (${message.data.amount} TASnative)`);
            
            // Update all data as a transfer affects multiple aspects
            refetchToken();
            refetchHolders();
            refetchTrades();
            
            // If it's a significant transfer, update chart data as it may affect price
            if (message.data.amount > 10000) {
              refetchChart();
            }
          }
          else if (message.eventType === 'contractState') {
            // Contract state update (e.g., total supply changed)
            console.log(`[Blockchain] Contract state updated: Total Supply = ${message.data.totalSupply}`);
            refetchToken();
          }
          else if (message.eventType === 'balanceUpdate') {
            // Balance update for a specific address
            console.log(`[Blockchain] Balance updated for ${message.data.address}: ${message.data.balance} TASnative`);
            refetchHolders();
          }
          else if (message.eventType === 'trade') {
            // Direct trade event notification
            console.log(`[Blockchain] ${message.data.type} trade executed: ${message.data.amount} TASnative`);
            refetchTrades();
            refetchToken(); // Trades affect price
            
            // Show toast notification for significant trades
            if (message.data.amount > 50000) {
              // Note: toast implementation would be needed here
              console.log(`[Blockchain] Significant ${message.data.type} detected!`);
            }
          }
        }
      } catch (error) {
        console.error('[Price Oracle] Error processing WebSocket message:', error);
      }
    };
    
    // Set up reconnection attempts
    const reconnectInterval = setInterval(() => {
      if (socket.readyState === WebSocket.CLOSED) {
        console.log('[Price Oracle] Attempting to reconnect...');
        const newSocket = new WebSocket(wsUrl);
        socket.onopen = newSocket.onopen;
        socket.onclose = newSocket.onclose;
        socket.onerror = newSocket.onerror;
        socket.onmessage = newSocket.onmessage;
      }
    }, 5000);
    
    // Clean up WebSocket connection when component unmounts
    return () => {
      console.log('[Price Oracle] Closing WebSocket connection due to component unmount');
      clearInterval(reconnectInterval);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [refetchToken, refetchChart, refetchTrades, refetchHolders]);

  // Execute a trade for TASnative
  const executeTrade = async (type: 'buy' | 'sell', amount: number, slippage: number = 1): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tokens/tasnative/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          amount: amount.toString(),
          slippage: slippage.toString(),
          antiSniper: true, // Default to protected trades
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute trade');
      }

      const data = await response.json();
      
      // Refetch all data after trade
      refetchToken();
      refetchChart();
      refetchHolders();
      refetchTrades();
      
      return data.success;
    } catch (error) {
      console.error('Error executing TASnative trade:', error);
      return false;
    }
  };

  // Combining all data and loading states
  return {
    token: tokenData,
    chartData,
    holders,
    trades,
    wsConnected,
    isLoading: isLoadingToken || isLoadingChart || isLoadingHolders || isLoadingTrades,
    errors: {
      token: tokenError,
      chart: chartError,
      holders: holdersError,
      trades: tradesError
    },
    refetch: () => {
      refetchToken();
      refetchChart();
      refetchHolders();
      refetchTrades();
    },
    executeTrade
  };
}