import axios from 'axios';
import { EventEmitter } from 'events';
import { storage } from '../storage';
import { WebSocketServer } from 'ws';
import { ethers } from 'ethers';

// PancakeSwap Router ABI - only including the functions we need for price calculation
const PANCAKESWAP_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function WETH() view returns (address)"
];

// TAS Token address on BSC
const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216";

// PancakeSwap Router address 
const PANCAKESWAP_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// BNB price in USD - ideally this would come from an oracle
const BNB_PRICE_USD = 350;

// Default price as fallback
const DEFAULT_PRICE = 0.001;

// Price update interval in milliseconds (5 minutes)
// We still use a timer to update historical data for charts
const UPDATE_INTERVAL = 5 * 60 * 1000;

interface PriceData {
  tasNativePrice: number;
  timestamp: number;
}

interface PriceHistory {
  prices: PriceData[];
  interval: '1h' | '1d' | '7d' | '30d';
}

class PriceOracle extends EventEmitter {
  private currentPriceData: PriceData = {
    tasNativePrice: DEFAULT_PRICE, // Start with default price until we get real data
    timestamp: Date.now()
  };

  private priceHistory: {
    '1h': PriceData[];
    '1d': PriceData[];
    '7d': PriceData[];
    '30d': PriceData[];
  } = {
    '1h': [],
    '1d': [],
    '7d': [],
    '30d': []
  };

  private interval: NodeJS.Timeout | null = null;
  private wss: WebSocketServer | null = null;

  constructor() {
    super();
    this.loadInitialPrices();
  }

  // Initialize WebSocket server for broadcasting price updates
  initWebSocket(wss: WebSocketServer) {
    this.wss = wss;
    console.log("[Price Oracle] WebSocket server initialized for price updates");
  }

  // Start the price oracle service
  start() {
    this.updatePrices(); // Initial update
    
    // Set up regular interval for price updates
    this.interval = setInterval(() => this.updatePrices(), UPDATE_INTERVAL);
    console.log(`[Price Oracle] Started with update interval of ${UPDATE_INTERVAL / 1000} seconds`);
    
    return this;
  }

  // Stop the price oracle service
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("[Price Oracle] Stopped");
    }
  }

  // Get price from PancakeSwap Router
  private async getPancakeSwapRouterPrice(): Promise<number> {
    try {
      console.log("[Price Oracle] Getting price from PancakeSwap Router...");
      
      // Use a reliable method: direct provider connection
      const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      
      // Create router contract instance
      const routerContract = new ethers.Contract(
        PANCAKESWAP_ROUTER_ADDRESS,
        PANCAKESWAP_ROUTER_ABI,
        provider
      );
      
      // Get WBNB address from router
      const wbnbAddress = await routerContract.WETH();
      
      // Create the path for getting price (TAS → WBNB)
      const path = [TAS_TOKEN_ADDRESS, wbnbAddress];
      
      // Amount of TAS to swap (1 TAS with 18 decimals)
      const amountIn = ethers.utils.parseEther("1");
      
      // Get expected BNB amount out
      const amounts = await routerContract.getAmountsOut(amountIn, path);
      const bnbAmountOut = amounts[1];
      
      // Calculate TAS price in USD (bnbAmount * bnbPrice)
      const bnbAmount = parseFloat(ethers.utils.formatEther(bnbAmountOut));
      const tasPrice = bnbAmount * BNB_PRICE_USD;
      
      console.log(`[Price Oracle] Router swap price: 1 TAS = ${bnbAmount} BNB = $${tasPrice}`);
      
      return tasPrice;
    } catch (error) {
      console.error("[Price Oracle] Error getting price from PancakeSwap Router:", error);
      // Return default price if router call fails
      return DEFAULT_PRICE;
    }
  }

  // Load initial price data from storage or use defaults
  private async loadInitialPrices() {
    try {
      const nativeToken = await storage.getNativeToken();
      
      // Try getting the price from PancakeSwap Router
      try {
        const routerPrice = await this.getPancakeSwapRouterPrice();
        this.currentPriceData.tasNativePrice = routerPrice;
        console.log(`[Price Oracle] Using router price: TASnative=$${routerPrice}`);
      } catch (error) {
        // Fallback to default price
        console.log(`[Price Oracle] Using default price: TASnative=$${DEFAULT_PRICE}`);
      }
    } catch (error) {
      console.error("[Price Oracle] Error loading initial prices:", error);
    }
  }

  // Update prices - gets dynamic price from PancakeSwap router
  private async updatePrices() {
    try {
      console.log("[Price Oracle] Updating price records...");
      
      // Get real-time price from PancakeSwap Router
      let currentPrice;
      try {
        // Try to get the real price from PancakeSwap Router
        currentPrice = await this.getPancakeSwapRouterPrice();
      } catch (routerError) {
        // If router call fails, fall back to default price
        console.error("[Price Oracle] Router price fetch failed, using default price:", routerError);
        currentPrice = DEFAULT_PRICE;
      }
      
      // Create new price data object with the current price and new timestamp
      const newPriceData: PriceData = {
        tasNativePrice: currentPrice,
        timestamp: Date.now()
      };
      
      // Update current price data
      this.currentPriceData = newPriceData;
      
      // Update price history
      this.updatePriceHistory(newPriceData);
      
      // Update token in database with current price
      this.updateTokenPrice(currentPrice);
      
      // Broadcast price update to connected clients
      this.broadcastPriceUpdate(newPriceData);
      
      // Emit price update event
      this.emit('priceUpdate', newPriceData);
      
      console.log(`[Price Oracle] Price record updated: TASnative=$${currentPrice}`);
    } catch (error) {
      console.error("[Price Oracle] Error updating prices:", error);
    }
  }

  // Update token price in database
  private async updateTokenPrice(price: number) {
    try {
      // Get the native token
      const nativeToken = await storage.getNativeToken();
      
      if (nativeToken) {
        // Update token price in database
        // In a real implementation with a database, we would save the price
        console.log(`[Price Oracle] Updating TASnative token (ID: ${nativeToken.id}) price to $${price.toFixed(9)}`);
        
        // For now, we're just emitting an event that our WebSocket server can use
        this.emit('tokenPriceUpdated', { id: nativeToken.id, price });
      }
    } catch (error) {
      console.error("[Price Oracle] Error updating token price in database:", error);
    }
  }

  // Update price history with new price data
  private updatePriceHistory(priceData: PriceData) {
    // Add to hourly history
    this.priceHistory['1h'].push(priceData);
    
    // Keep only the last 60 hourly records (assuming 1 update per 5 minutes = 12 per hour * 5 hours)
    if (this.priceHistory['1h'].length > 60) {
      this.priceHistory['1h'].shift();
    }
    
    // Add to daily history (every 12th update, assuming 5-minute intervals)
    if (this.priceHistory['1h'].length % 12 === 0) {
      this.priceHistory['1d'].push(priceData);
      
      // Keep only the last 288 daily records (1 day has 288 5-minute intervals)
      if (this.priceHistory['1d'].length > 288) {
        this.priceHistory['1d'].shift();
      }
    }
    
    // Add to weekly history (every 84th update, assuming 5-minute intervals)
    if (this.priceHistory['1h'].length % 84 === 0) {
      this.priceHistory['7d'].push(priceData);
      
      // Keep only the last 2016 weekly records (7 days have 2016 5-minute intervals)
      if (this.priceHistory['7d'].length > 2016) {
        this.priceHistory['7d'].shift();
      }
    }
    
    // Add to monthly history (every 360th update, assuming 5-minute intervals)
    if (this.priceHistory['1h'].length % 360 === 0) {
      this.priceHistory['30d'].push(priceData);
      
      // Keep only the last 8640 monthly records (30 days have 8640 5-minute intervals)
      if (this.priceHistory['30d'].length > 8640) {
        this.priceHistory['30d'].shift();
      }
    }
  }

  // Broadcast price update to connected clients via WebSocket
  private broadcastPriceUpdate(priceData: PriceData) {
    if (this.wss) {
      // Standard price update message
      const priceUpdateMessage = JSON.stringify({
        type: 'price_update',
        data: {
          tasNativePrice: priceData.tasNativePrice,
          timestamp: priceData.timestamp
        }
      });
      
      // Prepare chart data update containing both current price and historical context
      const chartDataMessage = JSON.stringify({
        type: 'chart_data_update',
        data: {
          currentPrice: {
            tasNativePrice: priceData.tasNativePrice,
            timestamp: priceData.timestamp
          },
          // Provide 10 most recent price points for continuous charts
          recentHistory: this.priceHistory['1h'].slice(-10),
          updatedAt: new Date().toISOString()
        }
      });
      
      // Send both messages to all connected clients
      let messagesSent = 0;
      this.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(priceUpdateMessage);
          client.send(chartDataMessage);
          messagesSent++;
        }
      });
      
      console.log(`[Price Oracle] Broadcasted price update to ${messagesSent} clients`);
    }
  }

  // Get current price data
  getCurrentPrices(): PriceData {
    return { ...this.currentPriceData };
  }

  // Get price history
  getPriceHistory(interval: '1h' | '1d' | '7d' | '30d'): PriceHistory {
    return {
      prices: [...this.priceHistory[interval]],
      interval
    };
  }

  // Force a price update (for testing or admin use)
  async forceUpdate() {
    await this.updatePrices();
  }
}

// Create singleton instance
export const priceOracle = new PriceOracle();

// Export types for use elsewhere
export type { PriceData, PriceHistory };