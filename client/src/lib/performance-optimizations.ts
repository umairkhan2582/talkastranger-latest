/**
 * Performance optimization utilities for the application
 * Handles caching, debouncing, throttling, and other performance improvements
 */

// Cache for token data
interface TokenCacheItem {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Token data cache with configurable TTL
const tokenCache = new Map<number, TokenCacheItem>();
const TOKEN_CACHE_TTL = 60000; // 1 minute default TTL

/**
 * Caches token data with TTL (Time To Live)
 * @param tokenId Token ID to cache
 * @param data Token data
 * @param ttl Optional TTL in milliseconds
 */
export function cacheTokenData(tokenId: number, data: any, ttl = TOKEN_CACHE_TTL) {
  console.log(`[Cache] Caching token ${tokenId} data for ${ttl}ms`);
  
  const now = Date.now();
  tokenCache.set(tokenId, {
    data,
    timestamp: now,
    expiresAt: now + ttl
  });
}

/**
 * Gets cached token data if still valid
 * @param tokenId Token ID
 * @returns Token data or null if expired/not found
 */
export function getCachedTokenData(tokenId: number): any | null {
  const cached = tokenCache.get(tokenId);
  
  if (!cached) {
    console.log(`[Cache] Token ${tokenId} not found in cache`);
    return null;
  }
  
  const now = Date.now();
  if (now > cached.expiresAt) {
    console.log(`[Cache] Token ${tokenId} cache expired`);
    tokenCache.delete(tokenId);
    return null;
  }
  
  console.log(`[Cache] Using cached token ${tokenId} data`);
  return cached.data;
}

/**
 * Invalidates cached token data to force a refresh
 * @param tokenId Token ID to invalidate
 */
export function invalidateTokenCache(tokenId: number) {
  console.log(`[Cache] Invalidating token ${tokenId} cache`);
  tokenCache.delete(tokenId);
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func Function to debounce
 * @param wait Time in milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit the rate at which a function can fire
 * @param func Function to throttle
 * @param limit Time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          const currentArgs = lastArgs;
          lastArgs = null;
          func(...currentArgs);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Memoize function to cache results of expensive operations
 * @param fn Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Retry function with exponential backoff for network operations
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Promise that resolves when operation succeeds or rejects after max retries
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 300
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      if (retries > maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
      console.log(`[Retry] Attempt ${retries} failed, retrying in ${delay.toFixed(0)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`[Retry] All ${maxRetries} retries failed`);
  throw lastError || new Error('Operation failed after multiple retries');
}

// Gas price optimization
const gasPrices = {
  fast: { price: 0, timestamp: 0 },
  standard: { price: 0, timestamp: 0 },
  slow: { price: 0, timestamp: 0 }
};

/**
 * Get optimized gas price with caching
 * In production this would fetch from a gas price API
 * @param speed Gas price speed (fast, standard, slow)
 * @returns Optimized gas price in Gwei
 */
export function getOptimizedGasPrice(speed: 'fast' | 'standard' | 'slow' = 'standard'): number {
  const now = Date.now();
  const cachedValue = gasPrices[speed];
  
  // If cache is still valid (less than 2 minutes old)
  if (now - cachedValue.timestamp < 120000 && cachedValue.price > 0) {
    return cachedValue.price;
  }
  
  // Calculate prices based on network conditions (simplified for demo)
  // In production, this would fetch from a gas oracle
  const basePrice = 5; // 5 Gwei
  const prices = {
    fast: basePrice * 1.5,
    standard: basePrice,
    slow: basePrice * 0.8
  };
  
  // Update cache
  gasPrices[speed] = {
    price: prices[speed],
    timestamp: now
  };
  
  return prices[speed];
}

// Preload images to improve perceived performance
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images in parallel
 * @param sources Array of image sources
 * @returns Promise that resolves when all images are loaded
 */
export function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(preloadImage));
}

// Performance metrics tracking
type PerformanceMetric = {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
};

const performanceMetrics = new Map<string, PerformanceMetric>();

/**
 * Start tracking a performance metric
 * @param name Metric name
 */
export function startPerformanceMetric(name: string): void {
  performanceMetrics.set(name, {
    name,
    startTime: performance.now()
  });
}

/**
 * End tracking a performance metric and return duration
 * @param name Metric name
 * @returns Duration in milliseconds
 */
export function endPerformanceMetric(name: string): number | undefined {
  const metric = performanceMetrics.get(name);
  
  if (!metric) {
    console.warn(`[Performance] No metric found with name: ${name}`);
    return undefined;
  }
  
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  
  console.log(`[Performance] ${name}: ${metric.duration.toFixed(2)}ms`);
  return metric.duration;
}

/**
 * Get all recorded performance metrics
 * @returns Performance metrics object
 */
export function getPerformanceMetrics(): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  performanceMetrics.forEach((metric) => {
    if (metric.duration !== undefined) {
      metrics[metric.name] = metric.duration;
    }
  });
  
  return metrics;
}

// Export a generic performance-optimized version of common functions
export const optimized = {
  // Debounced window resize handler (100ms)
  handleResize: debounce((callback: () => void) => callback(), 100),
  
  // Throttled scroll handler (50ms)
  handleScroll: throttle((callback: () => void) => callback(), 50),
  
  // Memoized expensive calculations
  calculateBondingCurve: memoize((supply: number, price: number) => {
    console.log('[Performance] Calculating bonding curve...');
    // Actual calculations would go here
    return { supply, price };
  })
};