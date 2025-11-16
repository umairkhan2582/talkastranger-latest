/**
 * Universal Browser and Environment Detector
 * 
 * This utility provides consistent detection and standardization across
 * all browsers and wallet environments to ensure a uniform experience.
 */

// Types of browsers we support
export enum BrowserType {
  Chrome = 'chrome',
  Firefox = 'firefox',
  Safari = 'safari',
  Edge = 'edge',
  Opera = 'opera',
  MetaMask = 'metamask',
  TrustWallet = 'trustwallet',
  CoinbaseWallet = 'coinbasewallet',
  Unknown = 'unknown'
}

// Types of environments
export enum EnvironmentType {
  Desktop = 'desktop',
  Mobile = 'mobile',
  Tablet = 'tablet',
  InApp = 'inapp', // In-app browser
  Unknown = 'unknown'
}

// Structure for browser info
export interface BrowserInfo {
  type: BrowserType;
  environment: EnvironmentType;
  isWalletBrowser: boolean;
  walletType: string | null;
  userAgent: string;
  isMobile: boolean;
  supportsWeb3: boolean;
  version: string | null;
  needsCacheBusting: boolean;
}

/**
 * Detects the current browser and environment
 * Returns standardized information about the user's browsing context
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const vendor = (navigator.vendor || '').toLowerCase();
  
  // Environment detection - enhanced for better detection with masked redirects
  const isMobileDevice = /android|iphone|ipod|mobile|mobi/i.test(userAgent) || 
                         (window.innerWidth <= 768) || 
                         (typeof window.orientation !== 'undefined') ||
                         navigator.maxTouchPoints > 0;
  const isTablet = /ipad|tablet/i.test(userAgent) || 
                  (isMobileDevice && window.innerWidth >= 600);
  
  // Initialize browser info with defaults
  const info: BrowserInfo = {
    type: BrowserType.Unknown,
    environment: EnvironmentType.Unknown,
    isWalletBrowser: false,
    walletType: null,
    userAgent: userAgent,
    isMobile: isMobileDevice,
    supportsWeb3: false,
    version: null,
    needsCacheBusting: false
  };
  
  // Set environment
  if (isTablet) {
    info.environment = EnvironmentType.Tablet;
  } else if (isMobileDevice) {
    info.environment = EnvironmentType.Mobile;
  } else {
    info.environment = EnvironmentType.Desktop;
  }
  
  // Check for in-app browsers and wallet browsers
  if (/metamask/i.test(userAgent)) {
    info.type = BrowserType.MetaMask;
    info.isWalletBrowser = true;
    info.walletType = 'metamask';
    info.supportsWeb3 = true;
    info.environment = EnvironmentType.InApp;
    // MetaMask mobile has known caching issues
    info.needsCacheBusting = true;
  } else if (/trust/i.test(userAgent) || /trust/i.test(vendor)) {
    info.type = BrowserType.TrustWallet;
    info.isWalletBrowser = true;
    info.walletType = 'trustwallet';
    info.supportsWeb3 = true;
    info.environment = EnvironmentType.InApp;
  } else if (/coinbase/i.test(userAgent)) {
    info.type = BrowserType.CoinbaseWallet;
    info.isWalletBrowser = true;
    info.walletType = 'coinbase';
    info.supportsWeb3 = true;
    info.environment = EnvironmentType.InApp;
  } else if (/chrome|crios/i.test(userAgent) && /google/i.test(vendor)) {
    info.type = BrowserType.Chrome;
    // Check if it's a Chrome in-app browser
    if (/android/i.test(userAgent) && /wv/i.test(userAgent)) {
      info.environment = EnvironmentType.InApp;
    }
  } else if (/firefox|fxios/i.test(userAgent)) {
    info.type = BrowserType.Firefox;
  } else if (/safari/i.test(userAgent) && (/apple/i.test(vendor) || /apple/i.test(userAgent))) {
    info.type = BrowserType.Safari;
    if (isMobileDevice) {
      // Mobile Safari has some quirks that need special handling
      info.needsCacheBusting = true;
    }
  } else if (/edge|edg/i.test(userAgent)) {
    info.type = BrowserType.Edge;
  } else if (/opera|opr/i.test(userAgent)) {
    info.type = BrowserType.Opera;
  }
  
  // Extract version information where possible
  const chromeMatch = userAgent.match(/chrome\/(\d+)/i);
  const firefoxMatch = userAgent.match(/firefox\/(\d+)/i);
  const safariMatch = userAgent.match(/version\/(\d+)/i);
  const edgeMatch = userAgent.match(/edge\/(\d+)/i) || userAgent.match(/edg\/(\d+)/i);
  const operaMatch = userAgent.match(/opr\/(\d+)/i);
  
  if (info.type === BrowserType.Chrome && chromeMatch) {
    info.version = chromeMatch[1];
  } else if (info.type === BrowserType.Firefox && firefoxMatch) {
    info.version = firefoxMatch[1];
  } else if (info.type === BrowserType.Safari && safariMatch) {
    info.version = safariMatch[1];
  } else if (info.type === BrowserType.Edge && edgeMatch) {
    info.version = edgeMatch[1];
  } else if (info.type === BrowserType.Opera && operaMatch) {
    info.version = operaMatch[1];
  }
  
  // Web3 support detection based on browser type
  if (info.isWalletBrowser) {
    info.supportsWeb3 = true;
  } else {
    // Check if the browser has ethereum provider
    info.supportsWeb3 = !!window.ethereum || !!(window.web3 && window.web3.currentProvider);
  }
  
  return info;
}

/**
 * Get a consistent caching parameter string to use across all browsers
 */
export function getCacheBustingParam(): string {
  // Include version in query parameter to avoid cache issues
  const timestamp = new Date().getTime();
  const randomSuffix = Math.floor(Math.random() * 1000000);
  return `v=${timestamp}-${randomSuffix}`;
}

/**
 * Apply browser-specific fixes and standardization
 * This ensures the application works consistently across all browsers
 */
export function applyBrowserFixes(browserInfo: BrowserInfo = detectBrowser()): void {
  console.log(`[Browser Detector] Applying fixes for ${browserInfo.type} on ${browserInfo.environment}`);
  
  // Apply mobile detection class for CSS targeting
  if (browserInfo.isMobile) {
    document.documentElement.classList.add('mobile-device');
  }
  
  // Ensure proper viewport meta tag for responsive design, especially important for TASonscan
  // Use a more mobile-friendly viewport setting that works with masked URL forwarding
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const mobileViewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
  
  if (viewportMeta) {
    // Update the viewport meta content for consistent mobile rendering
    viewportMeta.setAttribute('content', mobileViewportContent);
    console.log('[Browser Detector] Updated viewport meta for responsive design');
  } else {
    // Create viewport meta if it doesn't exist
    const newViewportMeta = document.createElement('meta');
    newViewportMeta.name = 'viewport';
    newViewportMeta.content = mobileViewportContent;
    document.head.appendChild(newViewportMeta);
    console.log('[Browser Detector] Created viewport meta for responsive design');
  }
  
  // Log current device details to help with debugging
  console.log(`[Browser Detector] Device details - width: ${window.innerWidth}, height: ${window.innerHeight}, pixel ratio: ${window.devicePixelRatio}`);
  console.log(`[Browser Detector] Is mobile: ${browserInfo.isMobile}, Environment: ${browserInfo.environment}, Browser: ${browserInfo.type}`);
  
  // Cache-busting disabled - causes URL encoding issues with %3F
  // The app handles stale cache through normal browser mechanisms
  
  // Apply Safari-specific fixes
  if (browserInfo.type === BrowserType.Safari) {
    console.log('[Browser Detector] Applying Safari-specific fixes');
    // Safari has issues with some animations and transitions
    document.documentElement.classList.add('safari-browser');
  }
  
  // Apply mobile-specific fixes
  if (browserInfo.isMobile) {
    console.log('[Browser Detector] Applying mobile-specific fixes');
    document.documentElement.classList.add('mobile-device');
    
    // Add specific classes for mobile browser types
    if (browserInfo.isWalletBrowser) {
      document.documentElement.classList.add('wallet-browser');
      document.documentElement.classList.add(`${browserInfo.walletType}-browser`);
    }
  }
  
  // Apply in-app browser fixes
  if (browserInfo.environment === EnvironmentType.InApp) {
    console.log('[Browser Detector] Applying in-app browser fixes');
    document.documentElement.classList.add('in-app-browser');
  }
}

/**
 * Apply URL cache-busting by actually redirecting (use sparingly)
 */
export function forceCacheBustingReload(): void {
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.split('?')[0]; // Remove existing query params
  const cacheBuster = getCacheBustingParam();
  
  console.log(`[Browser Detector] Forcing cache-busting reload with ${cacheBuster}`);
  window.location.href = `${baseUrl}?${cacheBuster}`;
}

/**
 * Check if the current browser requires special standardization
 */
export function needsStandardization(): boolean {
  const info = detectBrowser();
  return info.needsCacheBusting || info.isWalletBrowser || info.environment === EnvironmentType.InApp;
}

/**
 * Provide consistent wallet connection based on browser type
 */
export function getStandardWalletConnectionMethod(): string {
  const info = detectBrowser();
  
  if (info.isWalletBrowser) {
    return 'in-app';
  } else if (info.supportsWeb3) {
    return 'injected';
  } else if (info.isMobile) {
    return 'wallet-connect';
  } else {
    return 'extensions';
  }
}