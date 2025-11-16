import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { invalidateTokenCache } from '@/lib/performance-optimizations';
import { queryClient } from '@/lib/queryClient';

export type TokenUpdate = {
  id: number;
  price: number;
  change24h: string;
  volume24h: number;
  timestamp: number;
};

export type WebSocketMessage = {
  type: string;
  token?: TokenUpdate;
  userId?: number;
  isOnline?: boolean;
  message?: any;
  error?: string;
  details?: string;
  [key: string]: any;
};

/**
 * Hook for WebSocket connection for real-time token updates
 * @param tokenIdsToWatch Array of token IDs to watch for updates
 * @param userId Optional user ID for authentication
 * @returns WebSocket connection state and methods
 */
export function useTokenWebSocket(tokenIdsToWatch: number[] = [], userId?: number) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [tokenUpdates, setTokenUpdates] = useState<Record<number, TokenUpdate>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchingTokensRef = useRef<Set<number>>(new Set());
  const connectionErrorShownRef = useRef<boolean>(false); // Track if error has been shown
  
  // Function to initialize the WebSocket connection
  // TEMPORARILY DISABLED FOR TESTING - allows TradeNTalk WebSocket to work alone
  const connectWebSocket = useCallback(() => {
    console.log("[TokenWebSocket] DISABLED for testing");
    return;
    
    /* DISABLED CODE
    if (wsRef.current && (
      wsRef.current.readyState === WebSocket.OPEN || 
      wsRef.current.readyState === WebSocket.CONNECTING
    )) {
      console.log("[WebSocket] Already connected or connecting");
      return;
    }
    
    try {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Determine WebSocket URL based on current protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Setup event handlers
      ws.onopen = () => {
        console.log("[WebSocket] Connection established");
        setIsConnected(true);
        setLastError(null);
        
        // Reset error shown flag when successfully connected
        connectionErrorShownRef.current = false;
        
        // Authenticate with user ID if provided
        if (userId) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId
          }));
        }
        
        // Set up watches for all tokens
        const watching = Array.from(watchingTokensRef.current);
        watching.forEach(tokenId => {
          watchToken(tokenId);
        });
        
        // If we have a successful connection, show a subtle success toast
        if (lastError) {
          toast({
            title: "Connected",
            description: "Real-time token data connection established",
            variant: "default"
          });
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'connection_success':
              console.log("[WebSocket] Connection successful");
              break;
              
            case 'auth_success':
              console.log(`[WebSocket] Authenticated as user ${message.userId}`);
              break;
              
            case 'token_update':
              if (message.token) {
                const tokenUpdate = message.token;
                console.log(`[WebSocket] Received price update for token ${tokenUpdate.id}: ${tokenUpdate.price}`);
                
                // Update the token in state
                setTokenUpdates(prev => ({
                  ...prev,
                  [tokenUpdate.id]: tokenUpdate
                }));
                
                // Invalidate the cache for this token to trigger refetch
                invalidateTokenCache(tokenUpdate.id);
                
                // Also invalidate the React Query cache for this token
                queryClient.invalidateQueries({ queryKey: ['/api/tokens', tokenUpdate.id] });
              }
              break;
              
            case 'error':
              console.error(`[WebSocket] Error: ${message.error}`, message.details);
              setLastError(message.error || 'Unknown error');
              break;
              
            default:
              console.log(`[WebSocket] Received message of type: ${message.type}`);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
          setLastError('Failed to parse WebSocket message');
        }
      };
      
      ws.onerror = (error) => {
        console.error("[WebSocket] Connection error:", error);
        setLastError("WebSocket connection error");
        
        // Only show error toast once
        if (!connectionErrorShownRef.current) {
          connectionErrorShownRef.current = true;
          
          // Use a quieter warning toast instead of the destructive error
          toast({
            title: "Connecting to token data...",
            description: "Real-time updates temporarily unavailable. Reconnecting in background.",
            variant: "default"
          });
        }
      };
      
      ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        // Use a shorter initial delay and be more persistent
        const baseDelay = 3000; // 3 seconds base delay
        const delay = Math.min(15000, baseDelay + Math.floor(Math.random() * 2000));
        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket connection:', error);
      setLastError("Failed to create WebSocket connection");
      setIsConnected(false);
    }
    END DISABLED CODE */
  }, [userId, toast]);
  
  // Function to watch a token for updates
  const watchToken = useCallback((tokenId: number) => {
    if (!tokenId) return;
    
    watchingTokensRef.current.add(tokenId);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket] Watching token ${tokenId}`);
      wsRef.current.send(JSON.stringify({
        type: 'watch_token',
        tokenId
      }));
    } else {
      console.log(`[WebSocket] Token ${tokenId} will be watched when connection is established`);
    }
  }, []);
  
  // Function to stop watching a token
  const unwatchToken = useCallback((tokenId: number) => {
    watchingTokensRef.current.delete(tokenId);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket] Stopped watching token ${tokenId}`);
      wsRef.current.send(JSON.stringify({
        type: 'unwatch_token',
        tokenId
      }));
    }
  }, []);
  
  // Function to send a trade request
  const sendTradeRequest = useCallback((tokenId: number, amount: number, tradeType: 'buy' | 'sell') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket] Sending trade request for token ${tokenId}`);
      wsRef.current.send(JSON.stringify({
        type: 'trade',
        tokenId,
        amount,
        tradeType
      }));
      
      return true;
    } else {
      console.error('[WebSocket] Cannot send trade request: not connected');
      toast({
        title: "Connection Error",
        description: "Not connected to the trading network. Please try again.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);
  
  // Set up WebSocket connection and clean up on unmount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        console.log("[WebSocket] Closing connection due to component unmount");
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectWebSocket]);
  
  // Watch for changes in tokenIdsToWatch
  useEffect(() => {
    // Watch new tokens
    tokenIdsToWatch.forEach(tokenId => {
      if (!watchingTokensRef.current.has(tokenId)) {
        watchToken(tokenId);
      }
    });
    
    // Unwatch tokens that are no longer in the list
    const currentWatching = Array.from(watchingTokensRef.current);
    currentWatching.forEach(tokenId => {
      if (!tokenIdsToWatch.includes(tokenId)) {
        unwatchToken(tokenId);
      }
    });
  }, [tokenIdsToWatch, watchToken, unwatchToken]);
  
  return {
    isConnected,
    lastMessage,
    lastError,
    tokenUpdates,
    watchToken,
    unwatchToken,
    sendTradeRequest,
    reconnect: connectWebSocket
  };
}