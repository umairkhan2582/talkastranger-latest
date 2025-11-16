import { Router, Request, Response } from 'express';
import { priceOracle, PriceData, PriceHistory } from './services/priceOracle';
import { blockchainListener } from './services/blockchainListener';

const router = Router();

// Get current prices for TAS/BNB and TASnative
router.get('/api/prices/current', (req: Request, res: Response) => {
  try {
    const prices = priceOracle.getCurrentPrices();
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('[API] Error getting current prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current prices'
    });
  }
});

// Get price history for a specified time interval
router.get('/api/prices/history/:interval', (req: Request, res: Response) => {
  try {
    const interval = req.params.interval as '1h' | '1d' | '7d' | '30d';
    
    // Validate interval
    if (!['1h', '1d', '7d', '30d'].includes(interval)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interval. Must be one of: 1h, 1d, 7d, 30d'
      });
    }
    
    const history = priceOracle.getPriceHistory(interval);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[API] Error getting price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price history'
    });
  }
});

// Admin endpoint to force a price update (could be protected in production)
router.post('/api/prices/update', async (req: Request, res: Response) => {
  try {
    await priceOracle.forceUpdate();
    
    const prices = priceOracle.getCurrentPrices();
    res.json({
      success: true,
      message: 'Price update triggered successfully',
      data: prices
    });
  } catch (error) {
    console.error('[API] Error triggering price update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger price update'
    });
  }
});

// Special endpoints for TASnative token
router.get('/api/tokens/tasnative', (req: Request, res: Response) => {
  try {
    const prices = priceOracle.getCurrentPrices();
    const history = priceOracle.getPriceHistory('7d');
    
    // Import the accurate holder data from the temporary module
    const { generateHolderData } = require('../temp/holderData');
    const holders = generateHolderData();
    
    // New token distribution model:
    // Total Supply: 1,000,000,000 (1 billion)
    const totalSupply = 1_000_000_000;
    
    // Distribution:
    // - 65% locked for 1 year: 650,000,000
    // - 20% in sale contract against BNB and USDT: 200,000,000
    // - 10% in airdrop contract: 100,000,000
    // - 5% for project development: 50,000,000
    
    // Initial circulating supply is 20% (sale contract tokens) + 5% (dev tokens) = 25%
    const circulatingSupply = totalSupply * 0.25; // 250,000,000
    const lockedTokens = totalSupply * 0.65; // 650,000,000
    const airdropTokens = totalSupply * 0.10; // 100,000,000
    
    // Initial token price is $0.001 as specified
    const initialPrice = 0.001;
    
    // Calculate token stats based on initial price and circulating supply
    // Market cap is calculated only on circulating supply (25%), not total supply
    const marketCap = initialPrice * circulatingSupply; // $250,000
    const lockedTokensValue = initialPrice * lockedTokens;
    // Liquidity value is based on the tokens in the sale contract (20% of supply)
    const liquidityValue = initialPrice * (totalSupply * 0.20);
    
    // Get token price change from history
    const recentPrices = history.prices.filter(p => p.timestamp >= Date.now() - 24 * 60 * 60 * 1000);
    let percentChange24h = '0.00';
    
    if (recentPrices.length > 0) {
      const oldestPrice = recentPrices[0].tasNativePrice;
      const newestPrice = prices.tasNativePrice;
      percentChange24h = ((newestPrice - oldestPrice) / oldestPrice * 100).toFixed(2);
    }
    
    // Calculate all time high (1.5x current price for demonstration, in reality would come from real price history)
    const allTimeHigh = prices.tasNativePrice * 1.5;
    
    // Format date strings properly to avoid "Invalid Date" issues
    const launchDate = new Date('2025-01-15');
    const allTimeHighDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Generate 24h volume based on price and circulating supply
    const trades = blockchainListener.generateTradeHistory();
    const last24hTrades = trades.filter(t => (Date.now() - t.timestamp) < 24 * 60 * 60 * 1000);
    
    // Calculate volume based on trades or fallback to estimate
    const volumeTAS = last24hTrades.length > 0 
      ? last24hTrades.reduce((sum, trade) => sum + trade.amount, 0) 
      : prices.tasNativePrice * circulatingSupply * 0.05; // Fallback: 5% daily volume
    
    // Construct token object with dynamic data
    const token = {
      id: 'tasnative',
      name: 'TASnative Token',
      symbol: 'TASnative',
      price: prices.tasNativePrice,
      marketCap,
      percentChange24h,
      volumeTAS,
      liquidity: liquidityValue,
      holders: holders.length,
      allTimeHigh,
      allTimeHighDate: allTimeHighDate.toISOString(),
      totalSupply,
      circulatingSupply,
      lockedTokens,
      lockedTokensValue,
      network: 'Binance Smart Chain',
      contractAddress: '0xd9541b134b1821736bd323135b8844d3ae408216',
      bg: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)',
      textColor: 'white',
      isNative: true,
      isCustom: false,
      launchDate: launchDate.toISOString(),
      createdAt: launchDate.toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    res.json({
      token
    });
  } catch (error) {
    console.error('[API] Error getting TASnative token:', error);
    res.status(500).json({
      error: 'Failed to fetch TASnative token details'
    });
  }
});

router.get('/api/tokens/tasnative/chart', (req: Request, res: Response) => {
  try {
    // Get timeframe from query params or default to 24h
    const timeframe = (req.query.timeframe as string) || '24h';
    const prices = priceOracle.getCurrentPrices();

    // Get trades data from the blockchain listener
    const trades = blockchainListener.generateTradeHistory();
    
    // Get appropriate history data or generate timeframes from trade history
    let history;
    try {
      // Convert timeframe to expected format
      let historyTimeframe: '1h' | '1d' | '7d' | '30d' = '1d';
      if (timeframe === '1h' || timeframe === '24h') historyTimeframe = '1h';
      if (timeframe === '7d') historyTimeframe = '7d';
      if (timeframe === '30d') historyTimeframe = '30d';
      
      history = priceOracle.getPriceHistory(historyTimeframe);
    } catch (error) {
      console.log('[API] Error retrieving price history, using trade data instead:', error);
      history = { prices: [], interval: '1h' };
    }
    
    // Determine time range based on requested timeframe
    const now = Date.now();
    let timeRange = 24 * 60 * 60 * 1000; // Default 24 hours
    
    if (timeframe === '7d') timeRange = 7 * 24 * 60 * 60 * 1000;
    if (timeframe === '30d') timeRange = 30 * 24 * 60 * 60 * 1000;
    if (timeframe === '1h') timeRange = 60 * 60 * 1000;
    
    // Get relevant trades for the requested time range
    const relevantTrades = trades.filter(t => (now - t.timestamp) < timeRange);
    
    // Generate price points from history or trade data
    let pricePoints = [];
    
    if (history.prices.length > 0) {
      // Use actual history data if available
      pricePoints = history.prices.map(point => ({
        time: new Date(point.timestamp).toISOString(),
        price: point.tasNativePrice,
        volume: calculateVolumeForTimePeriod(trades, point.timestamp, timeframe)
      }));
    } else if (relevantTrades.length > 0) {
      // Use trade data to generate price points
      // First, group trades by time buckets
      const buckets = createTimeBuckets(timeframe, timeRange);
      
      for (const bucket of buckets) {
        const bucketTrades = relevantTrades.filter(t => t.timestamp >= bucket.start && t.timestamp < bucket.end);
        if (bucketTrades.length > 0) {
          // Calculate average price for this bucket
          const avgPrice = bucketTrades.reduce((sum, t) => sum + t.price, 0) / bucketTrades.length;
          
          // Calculate total volume for this bucket
          const volume = bucketTrades.reduce((sum, t) => sum + t.amount, 0);
          
          pricePoints.push({
            time: new Date(bucket.start).toISOString(),
            price: avgPrice,
            volume: volume
          });
        } else {
          // No trades in this bucket, use the previous price point or current price
          const prevPrice = pricePoints.length > 0 ? pricePoints[pricePoints.length - 1].price : prices.tasNativePrice;
          pricePoints.push({
            time: new Date(bucket.start).toISOString(),
            price: prevPrice,
            volume: 0
          });
        }
      }
    } else {
      // No data available, generate placeholder points with the current price
      const points = timeframe === '1h' ? 12 : timeframe === '7d' ? 7 : 30;
      const interval = timeframe === '1h' ? 5 * 60 * 1000 : 
                     timeframe === '7d' ? 24 * 60 * 60 * 1000 : 
                     24 * 60 * 60 * 1000;
      
      for (let i = points; i >= 0; i--) {
        const pointTime = now - (i * interval);
        // Small variation for realistic chart
        const variation = 0.995 + (Math.random() * 0.01);
        const pointPrice = prices.tasNativePrice * variation;
        
        pricePoints.push({
          time: new Date(pointTime).toISOString(),
          price: pointPrice,
          volume: pointPrice * 5000000 * (Math.random() + 0.25)
        });
      }
    }
    
    // Add current price as the latest point
    const latestTime = pricePoints.length > 0 ? new Date(pricePoints[pricePoints.length - 1].time) : null;
    const currentTime = new Date();
    
    if (!latestTime || (currentTime.getTime() - latestTime.getTime() > 3600000)) {
      // Get the most recent trades for volume calculation
      const recentTrades = trades.filter(t => (now - t.timestamp) < 3600000);
      const recentVolume = recentTrades.length > 0 
        ? recentTrades.reduce((sum, t) => sum + t.amount, 0)
        : prices.tasNativePrice * 5000000;
      
      pricePoints.push({
        time: currentTime.toISOString(),
        price: prices.tasNativePrice,
        volume: recentVolume
      });
    }
    
    // Make sure price points are sorted chronologically
    pricePoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    res.json({
      success: true,
      pricePoints,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error getting TASnative chart data:', error);
    res.status(500).json({
      error: 'Failed to fetch TASnative chart data'
    });
  }
});

// Helper functions for chart data generation
function createTimeBuckets(timeframe: string, timeRange: number): { start: number, end: number }[] {
  const now = Date.now();
  const buckets = [];
  let bucketSize = 60 * 60 * 1000; // Default 1 hour buckets
  
  // Adjust bucket size based on timeframe
  if (timeframe === '1h') bucketSize = 5 * 60 * 1000; // 5 minute buckets for 1h view
  if (timeframe === '7d') bucketSize = 6 * 60 * 60 * 1000; // 6 hour buckets for 7d view
  if (timeframe === '30d') bucketSize = 24 * 60 * 60 * 1000; // 1 day buckets for 30d view
  
  // Create buckets from now - timeRange to now
  const startTime = now - timeRange;
  let bucketStart = startTime;
  
  while (bucketStart < now) {
    const bucketEnd = bucketStart + bucketSize;
    buckets.push({ start: bucketStart, end: bucketEnd });
    bucketStart = bucketEnd;
  }
  
  return buckets;
}

function calculateVolumeForTimePeriod(trades: any[], timestamp: number, timeframe: string): number {
  // Calculate volume for a given time period around the timestamp
  let periodSize = 60 * 60 * 1000; // Default 1 hour
  
  if (timeframe === '1h') periodSize = 5 * 60 * 1000; // 5 minutes for 1h view
  if (timeframe === '7d') periodSize = 6 * 60 * 60 * 1000; // 6 hours for 7d view
  if (timeframe === '30d') periodSize = 24 * 60 * 60 * 1000; // 1 day for 30d view
  
  // Find trades within the period
  const periodTrades = trades.filter(t => 
    t.timestamp >= (timestamp - periodSize/2) && 
    t.timestamp < (timestamp + periodSize/2)
  );
  
  // Calculate total volume
  return periodTrades.length > 0 
    ? periodTrades.reduce((sum, t) => sum + t.amount, 0)
    : 0;
}

router.get('/api/tokens/tasnative/holders', (req: Request, res: Response) => {
  try {
    // Import the accurate holder data from the temporary module
    const { generateHolderData } = require('../temp/holderData');
    const holders = generateHolderData();
    
    // Include current timestamp to ensure fresh data is displayed
    res.json({
      success: true,
      holders,
      totalHolders: holders.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error getting TASnative holders:', error);
    res.status(500).json({
      error: 'Failed to fetch TASnative holders'
    });
  }
});

// Add new endpoint for TASnative recent trades from contract
router.get('/api/tokens/tasnative/trades', (req: Request, res: Response) => {
  try {
    // Generate fresh trade data from the blockchain listener
    const trades = blockchainListener.generateTradeHistory();
    
    // Format trade data to ensure proper date formatting
    const formattedTrades = trades.map(trade => ({
      ...trade,
      // Ensure timestamp is ISO format
      date: new Date(trade.timestamp).toISOString(),
      // Keep timestamp for backward compatibility
      timestamp: trade.timestamp,
      // Add formatted amount in USD
      amountUsd: (trade.amount * trade.price).toFixed(2),
      // Add TAS symbol 
      symbol: 'TASnative'
    }));
    
    res.json({
      success: true,
      trades: formattedTrades,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error getting TASnative trades:', error);
    res.status(500).json({
      error: 'Failed to fetch TASnative trade data'
    });
  }
});

export default router;