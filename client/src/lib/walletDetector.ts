/**
 * Universal Wallet Detector
 * 
 * A robust utility for detecting cryptocurrency wallets across different 
 * environments including mobile browsers, in-app browsers, and desktop.
 * 
 * Version 2.0: Updated to use standardized browser detection for consistent
 * behavior across all environments.
 */

import { ethers } from 'ethers';
import { 
  detectBrowser, 
  BrowserType, 
  EnvironmentType, 
  getCacheBustingParam 
} from './browserDetector';

/**
 * Checks if any Ethereum provider is available in the current browser environment
 * Works across desktop browsers, mobile browsers, and in-app browsers
 */
export const detectEthereumProvider = async (): Promise<any> => {
  // For logging in development
  console.log("[Wallet Detector] Starting wallet detection");
  
  try {
    // Check for standard window.ethereum
    if (window.ethereum) {
      console.log("[Wallet Detector] Found window.ethereum provider");
      return window.ethereum;
    }

    // Check for window.web3 (legacy MetaMask and other wallets)
    if (window.web3 && window.web3.currentProvider) {
      console.log("[Wallet Detector] Found window.web3.currentProvider");
      return window.web3.currentProvider;
    }

    // Check for MetaMask mobile browser
    const isMMBrowser = /MetaMaskMobile/i.test(navigator.userAgent);
    if (isMMBrowser) {
      console.log("[Wallet Detector] Detected MetaMask mobile browser");
      console.log("[Wallet Detector] URL:", window.location.href);
      
      // Check if we have cache-busting parameters in the URL
      const hasVersionQueryParam = window.location.href.includes('v=');
      const hasMetaMaskParam = window.location.href.includes('metamask_reload=');
      
      console.log("[Wallet Detector] Has version param:", hasVersionQueryParam, 
                 "Has MetaMask param:", hasMetaMaskParam);
      
      // In MetaMask mobile browser, provider might be injected after a delay
      // Check a few times with a small delay
      let attempts = hasVersionQueryParam ? 10 : 5; // More attempts if we're using a cache-busted URL
      let delayMs = hasVersionQueryParam ? 300 : 500; // Shorter delay for more attempts
      
      console.log(`[Wallet Detector] Making ${attempts} attempts with ${delayMs}ms delays`);
      
      for (let i = 0; i < attempts; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        console.log(`[Wallet Detector] Attempt ${i+1} - ethereum:`, !!window.ethereum, 
                   "web3:", !!window.web3);
        
        if (window.ethereum) {
          console.log("[Wallet Detector] Found window.ethereum after delay in MetaMask browser");
          return window.ethereum;
        } else if (window.web3 && window.web3.currentProvider) {
          console.log("[Wallet Detector] Found window.web3.currentProvider after delay in MetaMask browser");
          return window.web3.currentProvider;
        }
      }
      
      // If no provider was found after all attempts and we don't have cache busting params,
      // suggest reloading with cache busting
      if (!hasVersionQueryParam && !hasMetaMaskParam) {
        console.log("[Wallet Detector] MetaMask browser without cache-busting - consider reload");
      }
    }

    // Check for other mobile browsers that might have a custom way to expose provider
    const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileBrowser) {
      console.log("[Wallet Detector] Detected mobile browser");

      // Try to access provider from various common locations
      // Some wallets inject in ethereum, some in web3, and some in custom locations
      const possibleProviders = [
        'ethereum',
        'web3.currentProvider',
        'trustwallet',
        'coin98',
        'bitkeep',
        'solana',
        'phantom'
      ];

      for (const providerPath of possibleProviders) {
        try {
          // Use path traversal to safely check nested properties
          const provider = providerPath.split('.').reduce((obj, path) => {
            return obj && obj[path] ? obj[path] : null;
          }, window as any);

          if (provider) {
            console.log(`[Wallet Detector] Found provider at window.${providerPath}`);
            return provider;
          }
        } catch (e) {
          // Ignore errors, just continue checking
        }
      }
    }
    
    console.log("[Wallet Detector] No Ethereum provider detected");
    return null;
  } catch (error) {
    console.error("[Wallet Detector] Error detecting provider:", error);
    return null;
  }
};

/**
 * Creates an ethers provider from any available Ethereum provider
 * Handles multiple versions of ethers and different provider formats
 */
export const createEthersProvider = async (): Promise<ethers.providers.Web3Provider | null> => {
  try {
    const provider = await detectEthereumProvider();
    
    if (!provider) {
      console.error("[Wallet Detector] Provider creation failed: No provider detected");
      return null;
    }
    
    console.log("[Wallet Detector] Provider detected:", typeof provider, 
                "with ethereum:", typeof window.ethereum,
                "provider === ethereum:", provider === window.ethereum);
    
    // Additional checking for mobile environments
    if (isMobileDevice()) {
      console.log("[Wallet Detector] Mobile environment detected");
      console.log("[Wallet Detector] Provider details:", 
                  "has request:", !!provider.request,
                  "has enable:", !!provider.enable,
                  "has sendAsync:", !!provider.sendAsync);
      
      // Extra check for MetaMask in-app browser
      if (isMetaMaskBrowser()) {
        console.log("[Wallet Detector] MetaMask browser detected, using special handling");
        
        // Add cache-busting query parameter to browser URL if not already present
        const currentUrl = window.location.href;
        if (!currentUrl.includes('v=') && !currentUrl.includes('metamask_reload=')) {
          const newUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 
                        'metamask_reload=true&' + getCachedVersionInfo();
          console.log("[Wallet Detector] Suggesting URL update to:", newUrl);
        }
      }
    }
    
    // Try to create provider based on ethers version with enhanced error handling
    try {
      // For ethers v5
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      console.log("[Wallet Detector] Successfully created ethers provider");
      return ethersProvider;
    } catch (ethersError) {
      console.error("[Wallet Detector] Failed to create standard Web3Provider:", ethersError);
      
      // Try alternative provider creation methods
      if (window.ethereum && typeof window.ethereum.request === 'function') {
        try {
          // Try using window.ethereum directly as a fallback
          console.log("[Wallet Detector] Attempting to create provider directly from window.ethereum");
          const directProvider = new ethers.providers.Web3Provider(window.ethereum);
          console.log("[Wallet Detector] Created provider from window.ethereum");
          return directProvider;
        } catch (directError) {
          console.error("[Wallet Detector] Failed to create provider from window.ethereum:", directError);
        }
      }
      
      // If we have a MetaMask mobile browser, suggest a reload with cache busting
      if (isMetaMaskBrowser()) {
        console.log("[Wallet Detector] MetaMask browser detected, suggesting reload");
        const versionParam = getCachedVersionInfo();
        console.log("[Wallet Detector] Consider reloading with cache busting:", versionParam);
      }
      
      return null;
    }
  } catch (error) {
    console.error("[Wallet Detector] Provider creation failed:", error);
    return null;
  }
};

/**
 * Requests connection to the user's wallet
 * Returns the address if successful
 * Enhanced for mobile wallets with better error handling
 */
export const requestWalletConnection = async (): Promise<string | null> => {
  try {
    // First try to get the provider using our utility
    const provider = await createEthersProvider();
    
    // If provider is not available, and we're in MetaMask mobile browser,
    // this is likely a case of cached site with no injected provider
    if (!provider) {
      if (isMetaMaskBrowser()) {
        console.log("[Wallet Detector] MetaMask browser detected but no provider available");
        console.log("[Wallet Detector] This is likely due to a cached version of the site");
        
        // Suggest URL with cache-busting
        const versionParam = getCachedVersionInfo();
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('?')[0]; // Remove any existing query params
        
        console.log("[Wallet Detector] Suggested refresh URL:", `${baseUrl}?${versionParam}`);
      }
      
      throw new Error("No Ethereum provider available");
    }
    
    // Try different methods to request accounts, as some mobile wallets have different APIs
    let accounts: string[] = [];
    
    try {
      // Standard method for most providers
      accounts = await provider.send("eth_requestAccounts", []);
    } catch (sendError) {
      console.warn("[Wallet Detector] Standard eth_requestAccounts failed, trying alternatives:", sendError);
      
      try {
        // Alternative methods used by some wallets
        if (provider.request) {
          console.log("[Wallet Detector] Trying provider.request({ method: 'eth_requestAccounts' })");
          accounts = await provider.request({ method: 'eth_requestAccounts' });
        } else if (provider.enable) {
          console.log("[Wallet Detector] Trying provider.enable()");
          accounts = await provider.enable();
        } else if (window.ethereum && window.ethereum.request) {
          console.log("[Wallet Detector] Trying window.ethereum.request directly");
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else {
          throw new Error("Provider does not support any known connection method");
        }
      } catch (alternativeError) {
        console.error("[Wallet Detector] All connection methods failed:", alternativeError);
        throw alternativeError;
      }
    }
    
    // Check if we have any accounts
    if (accounts && accounts.length > 0) {
      console.log("[Wallet Detector] Successfully connected to address:", accounts[0]);
      return accounts[0];
    }
    
    console.warn("[Wallet Detector] No accounts returned from wallet");
    return null;
  } catch (error) {
    console.error("[Wallet Detector] Connection request failed:", error);
    
    // Enhance error message for mobile users
    if (isMobileDevice()) {
      if (isMetaMaskBrowser()) {
        console.log("[Wallet Detector] MetaMask mobile browser detected, providing specific error guidance");
      } else {
        console.log("[Wallet Detector] Mobile device detected, providing mobile-specific error guidance");
      }
    }
    
    throw error;
  }
};

/**
 * Gets the current wallet provider's details including name, version, etc.
 * Useful for debugging
 */
export const getWalletInfo = async (): Promise<any> => {
  const provider = await detectEthereumProvider();
  
  if (!provider) {
    return { 
      available: false,
      message: "No wallet detected"
    };
  }
  
  try {
    // Get standardized browser info
    const browserInfo = detectBrowser();
    
    const info: any = {
      available: true,
      isMetaMask: provider.isMetaMask || false,
      isTrust: provider.isTrust || false,
      isCoinbaseWallet: provider.isCoinbaseWallet || false,
      chainId: await provider.request({ method: 'eth_chainId' }),
      userAgent: navigator.userAgent,
      isMobile: browserInfo.isMobile,
      browserType: browserInfo.type,
      environment: browserInfo.environment,
      isWalletBrowser: browserInfo.isWalletBrowser,
      walletType: browserInfo.walletType,
      browserVersion: browserInfo.version,
      needsCacheBusting: browserInfo.needsCacheBusting
    };
    
    // Try to get version info if available
    if (provider.version) {
      info.version = provider.version;
    }
    
    return info;
  } catch (error) {
    console.error("[Wallet Detector] Error getting wallet info:", error);
    return { 
      available: true,
      error: "Could not retrieve wallet details"
    };
  }
};

/**
 * Helper functions for environment detection
 * Updated to use standardized browser detection
 */
export const isMetaMaskBrowser = (): boolean => {
  const browserInfo = detectBrowser();
  return browserInfo.type === BrowserType.MetaMask;
};

export const isMobileDevice = (): boolean => {
  const browserInfo = detectBrowser();
  return browserInfo.isMobile;
};

export const isWalletBrowser = (): boolean => {
  const browserInfo = detectBrowser();
  return browserInfo.isWalletBrowser;
};

export const getEnvironmentType = (): EnvironmentType => {
  const browserInfo = detectBrowser();
  return browserInfo.environment;
};

export const getBrowserType = (): BrowserType => {
  const browserInfo = detectBrowser();
  return browserInfo.type;
};

export const getCachedVersionInfo = (): string => {
  return getCacheBustingParam();
};

// Define window interface with Ethereum provider types
declare global {
  interface Window {
    ethereum?: any;
    web3?: {
      currentProvider: any;
    };
    trustwallet?: any;
    coin98?: any;
    bitkeep?: any;
    solana?: any;
    phantom?: any;
  }
}